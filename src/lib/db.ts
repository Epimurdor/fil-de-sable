import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

type PoolConfig = ConstructorParameters<typeof PrismaPg>[0];

// Wasmer Edge n'injecte pas DATABASE_URL mais DB_HOST, DB_PORT, DB_NAME, DB_USERNAME, DB_PASSWORD.
// Ailleurs (dev local, migrations depuis un poste) : DATABASE_URL classique.
function poolConfig(): PoolConfig {
  const { DB_HOST, DB_PORT, DB_NAME, DB_USERNAME, DB_PASSWORD } = process.env;
  if (DB_HOST && DB_NAME && DB_USERNAME) {
    return {
      host: DB_HOST,
      port: Number(DB_PORT) || 5432,
      database: DB_NAME,
      user: DB_USERNAME,
      password: DB_PASSWORD,
      // TLS obligatoire chez Wasmer, certificat émis par une autorité privée : chaîne non vérifiable.
      ssl: { rejectUnauthorized: false },
      max: 5,
    };
  }

  const raw = process.env.DATABASE_URL;
  if (!raw) throw new Error("DATABASE_URL (ou DB_HOST/DB_NAME/DB_USERNAME/DB_PASSWORD) manquant.");
  const url = new URL(raw);
  // sslmode=require au sens libpq (et de la CLI Prisma) : chiffré, sans vérification de la chaîne.
  // Le pilote pg l'interpréterait comme verify-full, ce qui échoue avec la base Wasmer.
  if (url.searchParams.get("sslmode") === "require") {
    url.searchParams.delete("sslmode");
    return { connectionString: url.toString(), ssl: { rejectUnauthorized: false }, max: 5 };
  }
  return { connectionString: raw, max: 5 };
}

function createClient(): PrismaClient {
  return new PrismaClient({
    adapter: new PrismaPg(poolConfig()),
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });
}

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

function getClient(): PrismaClient {
  globalForPrisma.prisma ??= createClient();
  return globalForPrisma.prisma;
}

// Instanciation paresseuse : le build (next build) importe ce module sans forcément disposer
// des variables de connexion ; l'erreur n'apparaît qu'à la première vraie requête.
export const prisma = new Proxy({} as PrismaClient, {
  get(_target, prop) {
    const client = getClient();
    const value = Reflect.get(client, prop, client);
    return typeof value === "function" ? value.bind(client) : value;
  },
});
