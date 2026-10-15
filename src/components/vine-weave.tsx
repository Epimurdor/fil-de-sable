"use client";

import { useEffect } from "react";

// Quand le curseur s'attarde sur un élément `.vine`, un bracelet de micro-macramé se noue
// autour de lui, comme ceux de l'atelier : deux doubles cordons torsadés qui se croisent
// en « yeux », un nœud serré à chaque croisement, des perles au creux des yeux, et le nœud
// coulissant avec ses deux brins libres là où le nouage commence. Une couleur tirée au
// hasard à chaque survol, la même pour tout le bracelet. Rien sur écran tactile ; si
// l'utilisateur a demandé moins d'animations, le bracelet apparaît en fondu sans se nouer.

const SVG_NS = "http://www.w3.org/2000/svg";
const HOVER_DELAY = 140; // ms : il faut « rester » sur le bouton, pas juste le traverser
const PAD = 3; // écart minimal entre le bord de l'élément et le premier brin
const GROW = 900; // ms pour que chaque moitié du bracelet se noue

type Point = [number, number];

let maskSeq = 0;

const rand = (a: number, b: number) => a + Math.random() * (b - a);

// Une couleur de fil : teinte libre, saturation et luminosité tenues pour rester lisible
// sur le papier sable.
function threadColor(): string {
  return `hsl(${Math.round(rand(0, 360))} ${Math.round(rand(38, 62))}% ${Math.round(rand(36, 48))}%)`;
}

// Contour arrondi paramétré par t ∈ [0, 1) (proportionnel à la longueur) : position et normale sortante.
function perimeter(w: number, h: number, r: number) {
  r = Math.max(0, Math.min(r, w / 2, h / 2));
  const sw = w - 2 * r;
  const sh = h - 2 * r;
  const arc = (Math.PI / 2) * r;
  const segs = [sw, arc, sh, arc, sw, arc, sh, arc];
  const total = segs.reduce((s, x) => s + x, 0);

  const at = (t: number): { p: Point; n: Point } => {
    let d = (((t % 1) + 1) % 1) * total;
    let i = 0;
    while (i < 7 && d > segs[i]) d -= segs[i++];
    const corner = (cx: number, cy: number, a0: number) => {
      const a = a0 + (r ? d / r : 0);
      const n: Point = [Math.cos(a), Math.sin(a)];
      return { p: [cx + r * n[0], cy + r * n[1]] as Point, n };
    };
    switch (i) {
      case 0: return { p: [r + d, 0], n: [0, -1] };
      case 1: return corner(w - r, r, -Math.PI / 2);
      case 2: return { p: [w, r + d], n: [1, 0] };
      case 3: return corner(w - r, h - r, 0);
      case 4: return { p: [w - r - d, h], n: [0, 1] };
      case 5: return corner(r, h - r, Math.PI / 2);
      case 6: return { p: [0, h - r - d], n: [-1, 0] };
      default: return corner(r, r, Math.PI);
    }
  };
  return { total, at };
}

const f1 = (v: number) => v.toFixed(1);
const toPath = (pts: Point[]) => pts.map(([x, y], i) => `${i ? "L" : "M"}${f1(x)} ${f1(y)}`).join("");

// Un nœud serré : une amande pleine couchée dans le sens du bracelet.
function knotPath([x, y]: Point, [nx, ny]: Point, along: number, across: number): string {
  const pts: Point[] = [];
  for (let i = 0; i < 18; i++) {
    const a = (i / 18) * 2 * Math.PI;
    const u = Math.cos(a) * along;
    const v = Math.sin(a) * across;
    pts.push([x - ny * u + nx * v, y + nx * u + ny * v]);
  }
  return toPath(pts) + "Z";
}

type Dot = { d?: string; c?: Point; r?: number; at: number };

// Le bracelet pour un élément w × h. Coordonnées locales : origine décalée de `off`
// en haut à gauche de l'élément.
function macrame(w: number, h: number, radius: number) {
  const s = Math.min(1.15, Math.max(0.75, h / 44)); // échelle : petits liens, gros boutons
  const amp = rand(5.2, 6.4) * s; // demi-hauteur d'un œil
  const gap = 1.5 * s; // écart entre les deux brins d'un double cordon
  const half = 1.05 * s; // demi-épaisseur d'un brin torsadé
  const reach = amp + gap + half;
  const off = PAD + reach; // l'axe du bracelet
  const W = w + 2 * off;
  const H = h + 2 * off;
  const { total, at } = perimeter(W, H, radius + off);
  const waves = Math.max(3, Math.round(total / (2 * rand(20, 27) * s)));
  const eyes = 2 * waves;
  const t0 = rand(0, 1); // le nœud coulissant
  const phase = (t: number) => 2 * Math.PI * waves * (t - t0);
  // Avancement du nouage en t (0 → 1) : il part du nœud coulissant, dans les deux sens.
  const progress = (t: number) => {
    const f = (((t - t0) % 1) + 1) % 1;
    return 2 * Math.min(f, 1 - f);
  };
  const place = (t: number, o: number): Point => {
    const { p, n } = at(t);
    return [p[0] + n[0] * o, p[1] + n[1] * o];
  };

  // Les quatre brins : deux doubles cordons en opposition de phase, qui se croisent à chaque
  // demi-onde. Chaque brin est tracé en chapelet de petites bosses qui se chevauchent
  // (pointillé rond plus serré que son épaisseur) : le grain des nœuds du macramé.
  let rope = "";
  const steps = Math.ceil(total / 1.2);
  for (const sign of [1, -1]) {
    for (const side of [-1, 1]) {
      const pts: Point[] = [];
      for (let i = 0; i <= steps; i++) {
        const t = t0 + i / steps;
        pts.push(place(t, sign * amp * Math.sin(phase(t)) + side * gap));
      }
      rope += toPath(pts);
    }
  }

  // Un nœud à chaque croisement, plus gros pour le nœud coulissant.
  const knots: Dot[] = [];
  for (let k = 0; k < eyes; k++) {
    const t = t0 + k / eyes;
    const { p, n } = at(t);
    const big = k === 0 ? 1.35 : 1;
    knots.push({ d: knotPath(p, n, 3.6 * s * big, (gap + half + 1.2 * s) * big), at: progress(t) });
  }

  // Des perles au creux des yeux, la plus grosse à l'opposé du nœud coulissant.
  const beads: Dot[] = [];
  const every = 1 + Math.floor(rand(0, 3)); // une perle par œil, un sur deux ou un sur trois
  for (let k = 0; k < eyes; k++) {
    const big = k === waves;
    if (!big && k % every) continue;
    const t = t0 + (k + 0.5) / eyes;
    beads.push({ c: at(t).p, r: (big ? 3.4 : 2.6) * s, at: progress(t) });
  }

  // Les deux brins libres du nœud coulissant, qui pendent vers l'extérieur.
  const tails: string[] = [];
  const ends: Dot[] = [];
  const { p: p0, n: n0 } = at(t0);
  for (const side of [-1, 1]) {
    const len = rand(10, 16) * s;
    const pts: Point[] = [];
    for (let i = 0; i <= 14; i++) {
      const u = i / 14;
      const lat = side * (1.2 * s + 3.5 * s * u + 1.2 * s * Math.sin(u * 2 * Math.PI));
      const o = reach + len * u;
      pts.push([p0[0] + n0[0] * o - n0[1] * lat, p0[1] + n0[1] * o + n0[0] * lat]);
    }
    tails.push(toPath(pts));
    ends.push({ c: pts[pts.length - 1], r: 1.4 * s, at: 0 });
  }

  // Le masque qui révèle les brins au fil du nouage : l'axe, du nœud coulissant vers l'opposé.
  const reveal = [1, -1].map((dir) => {
    const pts: Point[] = [];
    for (let i = 0; i <= 120; i++) pts.push(place(t0 + (dir * 0.51 * i) / 120, 0));
    return toPath(pts);
  });

  return { off, W, H, s, half, stroke: 0.85 * s, rope, knots, beads, tails, ends, reveal, revealWidth: 2 * reach + 4 };
}

function svg<K extends keyof SVGElementTagNameMap>(tag: K, attrs: Record<string, string | number>) {
  const node = document.createElementNS(SVG_NS, tag);
  for (const [k, v] of Object.entries(attrs)) node.setAttribute(k, String(v));
  return node;
}

function grow(target: HTMLElement, layer: SVGSVGElement) {
  const rect = target.getBoundingClientRect();
  const radius = parseFloat(getComputedStyle(target).borderTopLeftRadius) || 6;
  const m = macrame(rect.width, rect.height, radius);
  const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const easing = "cubic-bezier(.4,.1,.3,1)";

  const g = svg("g", { "aria-hidden": "true" });
  g.style.color = threadColor();
  layer.appendChild(g);

  const line = { fill: "none", stroke: "currentColor", "stroke-linecap": "round", "stroke-linejoin": "round" };
  const ropeGroup = svg("g", {});
  ropeGroup.appendChild(
    svg("path", { ...line, d: m.rope, "stroke-width": f1(2.3 * m.half), "stroke-dasharray": `0.01 ${f1(2 * m.s)}` }),
  );
  const tails = m.tails.map((d) => svg("path", { ...line, d, "stroke-width": m.stroke * 1.5 }));
  const knots = m.knots.map((k) => svg("path", { d: k.d!, fill: "currentColor" }));
  const beads = m.beads.map((b) =>
    svg("circle", {
      cx: f1(b.c![0]), cy: f1(b.c![1]), r: f1(b.r!),
      fill: "currentColor", "fill-opacity": 0.3, stroke: "currentColor", "stroke-width": m.stroke,
    }),
  );
  const ends = m.ends.map((e) => svg("circle", { cx: f1(e.c![0]), cy: f1(e.c![1]), r: f1(e.r!), fill: "currentColor" }));

  if (!still) {
    const id = `vine-mask-${++maskSeq}`;
    const mask = svg("mask", { id, maskUnits: "userSpaceOnUse", x: -40, y: -40, width: m.W + 80, height: m.H + 80 });
    g.appendChild(mask);
    for (const d of m.reveal) {
      const path = svg("path", { d, fill: "none", stroke: "#fff", "stroke-width": m.revealWidth, "stroke-linecap": "round" });
      mask.appendChild(path);
      const len = path.getTotalLength();
      path.style.strokeDasharray = `${len} ${len}`;
      path.animate([{ strokeDashoffset: len }, { strokeDashoffset: 0 }], { duration: GROW, easing, fill: "forwards" });
    }
    ropeGroup.setAttribute("mask", `url(#${id})`);
  }
  g.append(ropeGroup, ...tails, ...knots, ...beads, ...ends);

  if (still) {
    g.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 200, easing: "ease-out" });
  } else {
    for (const path of tails) {
      const len = path.getTotalLength();
      path.style.strokeDasharray = `${len} ${len}`;
      path.animate([{ strokeDashoffset: len }, { strokeDashoffset: 0 }], { duration: 380, easing: "ease-out", fill: "both" });
    }
    // Nœuds et perles apparaissent quand le nouage les atteint.
    const pop = (node: SVGElement, delay: number, keyframes: Keyframe[], duration: number) => {
      node.style.transformBox = "fill-box";
      node.style.transformOrigin = "center";
      node.animate(keyframes, { duration, delay, easing: "ease-out", fill: "both" });
    };
    const scaleIn = [{ transform: "scale(0)" }, { transform: "scale(1)" }];
    const beadIn = [{ transform: "scale(0)" }, { transform: "scale(1.2)", offset: 0.7 }, { transform: "scale(1)" }];
    knots.forEach((node, i) => pop(node, m.knots[i].at * GROW * 0.92, scaleIn, 200));
    beads.forEach((node, i) => pop(node, m.beads[i].at * GROW * 0.92 + 90, beadIn, 320));
    ends.forEach((node) => pop(node, 340, scaleIn, 160));
  }

  // Le calque est fixe : on recale le bracelet sur l'élément à chaque image (défilement, header collant…).
  // Seulement quand il a bougé : redessiner le bracelet à chaque image coûterait cher.
  let frame = 0;
  let placed = "";
  const follow = () => {
    const r = target.getBoundingClientRect();
    const at = `translate(${f1(r.left - m.off)} ${f1(r.top - m.off)})`;
    if (at !== placed) g.setAttribute("transform", (placed = at));
    frame = requestAnimationFrame(follow);
  };
  follow();

  return () => {
    const fade = g.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 260, easing: "ease-out", fill: "forwards" });
    fade.onfinish = () => {
      cancelAnimationFrame(frame);
      g.remove();
    };
  };
}

export function VineWeave() {
  useEffect(() => {
    const layer = svg("svg", { "aria-hidden": "true", class: "vine-layer" });
    document.body.appendChild(layer);

    let current: HTMLElement | null = null;
    let timer = 0;
    let undo: (() => void) | null = null;

    const leave = () => {
      clearTimeout(timer);
      undo?.();
      undo = null;
      current = null;
    };

    const onOver = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") return;
      const target = (e.target as Element | null)?.closest<HTMLElement>(".vine");
      if (!target || target === current) return;
      leave();
      if (target.matches(":disabled, [aria-disabled='true']")) return;
      current = target;
      timer = window.setTimeout(() => {
        if (current === target && target.isConnected) undo = grow(target, layer);
      }, HOVER_DELAY);
    };

    const onOut = (e: PointerEvent) => {
      if (!current) return;
      const to = e.relatedTarget as Node | null;
      if (to && current.contains(to)) return;
      leave();
    };

    document.addEventListener("pointerover", onOver);
    document.addEventListener("pointerout", onOut);
    window.addEventListener("blur", leave);
    return () => {
      leave();
      document.removeEventListener("pointerover", onOver);
      document.removeEventListener("pointerout", onOut);
      window.removeEventListener("blur", leave);
      layer.remove();
    };
  }, []);

  return null;
}
