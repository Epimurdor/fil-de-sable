"use client";

// Aperçu 3D du bracelet. Le GLB ne contient que le fil (voir scripts/build-bracelet-model.mjs) ;
// les perles sont redessinées ici en sphères métal (or ou argent) : la couleur du fil ne les touche jamais.
// Chargé via next/dynamic (ssr: false) : three.js ne part que sur la page du configurateur.
import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { GLTFLoader, type GLTF } from "three/examples/jsm/loaders/GLTFLoader.js";
import { MeshoptDecoder } from "three/examples/jsm/libs/meshopt_decoder.module.js";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import { cn } from "@/lib/cn";
import type { BeadMetal } from "@/lib/configurator";

type ModelBead = { kind: string; center: [number, number, number]; radius: number };

type Props = {
  modelUrl: string;
  threadHex: string;
  metal: BeadMetal;
  className?: string;
  label: string;
};

const METAL_COLORS: Record<BeadMetal, string> = { or: "#E2B65A", argent: "#D9DCE1" };

// Seuils de luminance (linéaire) de la texture couleur des modèles texturés, mesurés sur la texture Meshy.
const BEAD_LUM_LO = 0.12;
const BEAD_LUM_HI = 0.35;
const THREAD_LUM_REF = 0.02;

function threadSheen(hex: string) {
  return new THREE.Color(hex).lerp(new THREE.Color("#ffffff"), 0.25);
}

export function Bracelet3D({ modelUrl, threadHex, metal, className, label }: Props) {
  const mountRef = useRef<HTMLDivElement>(null);
  // Appliquent couleur du fil / finition des perles sur la scène chargée (no-op avant chargement).
  const setThread = useRef<(hex: string) => void>(() => {});
  const setMetal = useRef<(metal: BeadMetal) => void>(() => {});
  // État lié au modèle demandé : changer de modèle repasse en « loading », puis « ready » relance les effets
  // de couleur ci-dessous, qui appliquent les choix courants à la nouvelle scène.
  const [loaded, setLoaded] = useState<{ url: string; ok: boolean } | null>(null);
  const status = loaded?.url !== modelUrl ? "loading" : loaded.ok ? "ready" : "error";
  // Couleurs du premier rendu de la scène (les effets appliquent ensuite les valeurs courantes).
  const initial = useRef({ threadHex, metal });

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;
    let disposed = false;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    // Tone mapping « Neutral » (Khronos) : garde la teinte des fils fidèle aux pastilles de couleur.
    renderer.toneMapping = THREE.NeutralToneMapping;
    renderer.toneMappingExposure = 0.9;
    renderer.domElement.style.touchAction = "none";
    renderer.domElement.style.display = "block";
    mount.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const pmrem = new THREE.PMREMGenerator(renderer);
    scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    scene.environmentIntensity = 0.6;
    const key = new THREE.DirectionalLight(0xffffff, 1.8);
    key.position.set(1, 2, 1.5);
    const fill = new THREE.DirectionalLight(0xffffff, 0.5);
    fill.position.set(-1.5, 0.5, -1);
    scene.add(key, fill);

    const camera = new THREE.PerspectiveCamera(30, 1, 0.01, 20);
    // Bracelet normalisé (plus grande dimension = 1) : à ~1,9 il tient dans le cadre pendant la rotation.
    camera.position.set(0, 0.6, 1.8);
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.target.set(0, -0.02, 0);
    controls.enableDamping = true;
    controls.enablePan = false;
    controls.minDistance = 0.8;
    controls.maxDistance = 3;
    controls.autoRotate = !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    controls.autoRotateSpeed = 0.8;
    controls.addEventListener("start", () => (controls.autoRotate = false));

    const root = new THREE.Group();
    scene.add(root);

    let frame = 0;
    const loop = () => {
      frame = requestAnimationFrame(loop);
      controls.update();
      renderer.render(scene, camera);
    };

    const resize = () => {
      const w = mount.clientWidth, h = mount.clientHeight;
      if (!w || !h) return;
      renderer.setSize(w, h);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    };
    const ro = new ResizeObserver(resize);
    ro.observe(mount);
    resize();

    const debug = new URLSearchParams(window.location.search).has("debug3d");

    // Modèle « fil seul » (scripts/build-bracelet-model.mjs) : matière unie pour le fil,
    // perles redessinées en sphères métal à partir des extras.
    function setupThreadOnly(gltf: GLTF) {
      const thread = new THREE.MeshPhysicalMaterial({
        color: new THREE.Color(initial.current.threadHex),
        roughness: 0.78,
        sheen: 0.35,
        sheenRoughness: 0.7,
        sheenColor: threadSheen(initial.current.threadHex),
      });
      gltf.scene.traverse((o) => {
        if (o instanceof THREE.Mesh) {
          o.geometry.computeVertexNormals();
          o.material = thread;
        }
      });
      const beads = (gltf.parser.json.extras?.beads as ModelBead[] | undefined) ?? [];
      const sphere = new THREE.SphereGeometry(1, 48, 32);
      const metalMaterial = new THREE.MeshStandardMaterial({
        color: new THREE.Color(METAL_COLORS[initial.current.metal]),
        metalness: 1,
        roughness: 0.18,
        envMapIntensity: 2.4, // le métal ne vit que de ses reflets : sinon l'argent paraît gris foncé
      });
      for (const b of beads) {
        const mesh = new THREE.Mesh(sphere, metalMaterial);
        mesh.position.fromArray(b.center);
        mesh.scale.setScalar(b.radius);
        root.add(mesh);
      }
      setThread.current = (hex) => {
        thread.color.set(hex);
        thread.sheenColor.copy(threadSheen(hex));
      };
      setMetal.current = (m) => {
        metalMaterial.color.set(METAL_COLORS[m]);
      };
    }

    // Modèle texturé (scripts/build-textured-model.mjs) : la texture garde le relief et les ombres des nœuds.
    // Dans le shader, les texels sombres (fil) prennent la couleur choisie en gardant leurs nuances,
    // les texels clairs (perles) deviennent du métal or ou argent.
    function setupTextured(sceneRoot: THREE.Object3D) {
      const uniforms = {
        uThread: { value: new THREE.Color(initial.current.threadHex) },
        uMetal: { value: new THREE.Color(METAL_COLORS[initial.current.metal]) },
      };
      sceneRoot.traverse((o) => {
        if (!(o instanceof THREE.Mesh) || !(o.material instanceof THREE.MeshStandardMaterial)) return;
        const mat = o.material;
        mat.envMapIntensity = 1.4;
        mat.onBeforeCompile = (shader) => {
          Object.assign(shader.uniforms, uniforms);
          shader.fragmentShader = shader.fragmentShader
            .replace("void main() {", "uniform vec3 uThread;\nuniform vec3 uMetal;\nvoid main() {")
            .replace(
              "#include <map_fragment>",
              `#include <map_fragment>
              float texLum = dot(diffuseColor.rgb, vec3(0.2126, 0.7152, 0.0722));
              // Fil : luminance linéaire ~0.001–0.09 (moyenne ~0.02) ; perles : ~0.95.
              float beadMask = smoothstep(${BEAD_LUM_LO.toFixed(3)}, ${BEAD_LUM_HI.toFixed(3)}, texLum);
              // Courbe adoucie (exposant < 1) : creux des nœuds sombres, reflets sans marbrures.
              vec3 dyed = uThread * pow(clamp(texLum / ${THREAD_LUM_REF.toFixed(3)}, 0.0, 3.0), 0.65);
              diffuseColor.rgb = mix(dyed, uMetal, beadMask);`,
            )
            .replace(
              "#include <roughnessmap_fragment>",
              "#include <roughnessmap_fragment>\nroughnessFactor = mix(max(roughnessFactor, 0.6), 0.16, beadMask);",
            )
            .replace(
              "#include <metalnessmap_fragment>",
              "#include <metalnessmap_fragment>\nmetalnessFactor = mix(0.0, 1.0, beadMask);",
            );
        };
        mat.needsUpdate = true;
      });
      setThread.current = (hex) => {
        uniforms.uThread.value.set(hex);
      };
      setMetal.current = (m) => {
        uniforms.uMetal.value.set(METAL_COLORS[m]);
      };
    }

    const loader = new GLTFLoader().setMeshoptDecoder(MeshoptDecoder);
    loader.load(
      modelUrl,
      (gltf) => {
        if (disposed) return;
        const textured = gltf.parser.json.extras?.recolor === "texture-luminance";
        if (textured) {
          setupTextured(gltf.scene);
          // Taille normalisée (plus grande dimension = 1), centrée, comme les modèles « fil seul ».
          const box = new THREE.Box3().setFromObject(gltf.scene);
          const size = box.getSize(new THREE.Vector3());
          const center = box.getCenter(new THREE.Vector3());
          const s = 1 / Math.max(size.x, size.y, size.z);
          gltf.scene.scale.setScalar(s);
          gltf.scene.position.copy(center.multiplyScalar(-s));
        } else {
          setupThreadOnly(gltf);
        }
        root.add(gltf.scene);
        if (debug) {
          controls.autoRotate = false;
          Object.assign(window, { __bracelet: { camera, controls, root } });
        }
        setLoaded({ url: modelUrl, ok: true });
        loop();
      },
      undefined,
      () => !disposed && setLoaded({ url: modelUrl, ok: false }),
    );

    return () => {
      disposed = true;
      cancelAnimationFrame(frame);
      ro.disconnect();
      controls.dispose();
      root.traverse((o) => {
        if (o instanceof THREE.Mesh) {
          o.geometry.dispose();
          (Array.isArray(o.material) ? o.material : [o.material]).forEach((m) => m.dispose());
        }
      });
      scene.environment?.dispose();
      pmrem.dispose();
      renderer.dispose();
      renderer.domElement.remove();
      setThread.current = () => {};
      setMetal.current = () => {};
    };
  }, [modelUrl]);

  // Couleur du fil : seule la matière du fil change.
  useEffect(() => {
    setThread.current(threadHex);
  }, [threadHex, status]);

  // Finition des perles : or ou argent, indépendante du fil.
  useEffect(() => {
    setMetal.current(metal);
  }, [metal, status]);

  return (
    <div
      ref={mountRef}
      role="img"
      aria-label={label}
      className={cn("relative cursor-grab overflow-hidden bg-paper-2 active:cursor-grabbing", className)}
    >
      {status !== "ready" && (
        <p className="absolute inset-0 grid place-items-center text-sm text-ink-3">
          {status === "loading" ? "Chargement du bracelet en 3D…" : "L'aperçu 3D n'a pas pu se charger."}
        </p>
      )}
    </div>
  );
}

export default Bracelet3D;
