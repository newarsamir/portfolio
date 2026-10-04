"use client";

import { Canvas, useFrame, useThree, type ThreeEvent } from "@react-three/fiber";
import { useTexture } from "@react-three/drei";
import { Suspense, useEffect, useMemo, useRef, type RefObject } from "react";
import * as THREE from "three";
import type { ShowcaseItem } from "@/content/site";
import { setCursor } from "./Cursor";

const CARD_W = 2;
const CARD_H = 3.3;
const RADIUS = 6.4;
const CAMERA_Z = 10.4;
export const STEP = 0.36; // radians between neighbours on the arc

/** Rounded rectangle with 0..1 UVs so a texture maps cleanly onto it. */
function useCardGeometry() {
  return useMemo(() => {
    const w = CARD_W,
      h = CARD_H,
      r = 0.1;
    const s = new THREE.Shape();
    s.moveTo(-w / 2 + r, -h / 2);
    s.lineTo(w / 2 - r, -h / 2);
    s.absarc(w / 2 - r, -h / 2 + r, r, -Math.PI / 2, 0, false);
    s.lineTo(w / 2, h / 2 - r);
    s.absarc(w / 2 - r, h / 2 - r, r, 0, Math.PI / 2, false);
    s.lineTo(-w / 2 + r, h / 2);
    s.absarc(-w / 2 + r, h / 2 - r, r, Math.PI / 2, Math.PI, false);
    s.lineTo(-w / 2, -h / 2 + r);
    s.absarc(-w / 2 + r, -h / 2 + r, r, Math.PI, Math.PI * 1.5, false);
    const g = new THREE.ShapeGeometry(s, 10);
    const pos = g.attributes.position;
    const uv = g.attributes.uv;
    for (let i = 0; i < pos.count; i++) {
      uv.setXY(i, (pos.getX(i) + w / 2) / w, (pos.getY(i) + h / 2) / h);
    }
    uv.needsUpdate = true;
    return g;
  }, []);
}

function Card({
  item,
  index,
  geometry,
  arc,
  onOpen,
}: {
  item: ShowcaseItem;
  index: number;
  geometry: THREE.ShapeGeometry;
  arc: RefObject<THREE.Group | null>;
  onOpen: (i: number) => void;
}) {
  const source = useTexture(item.src);
  const inner = useRef<THREE.Group>(null);
  const material = useRef<THREE.MeshBasicMaterial>(null);
  const hover = useRef({ on: false, x: 0, y: 0 });
  // Mipmap bias: cards away from the center are sampled from smaller
  // mip levels, which reads as a soft depth-of-field blur.
  const blur = useMemo(() => ({ value: 0 }), []);
  const patch = useMemo(
    () => (shader: THREE.WebGLProgramParametersWithUniforms) => {
      shader.uniforms.uBlur = blur;
      shader.fragmentShader = `uniform float uBlur;\n${shader.fragmentShader.replace(
        "#include <map_fragment>",
        `#ifdef USE_MAP
  vec4 sampledDiffuseColor = texture2D( map, vMapUv, uBlur );
  diffuseColor *= sampledDiffuseColor;
#endif`,
      )}`;
    },
    [blur],
  );
  const angle = index * STEP;

  // Each card shows the top slice of its (tall) email.
  const { texture, topOffset } = useMemo(() => {
    const t = source.clone();
    const img = source.image as { width: number; height: number };
    const repeatY = Math.min(1, img.width / img.height / (CARD_W / CARD_H));
    t.colorSpace = THREE.SRGBColorSpace;
    t.anisotropy = 8;
    t.generateMipmaps = true;
    t.minFilter = THREE.LinearMipmapLinearFilter;
    t.repeat.set(1, repeatY);
    t.offset.set(0, 1 - repeatY);
    t.needsUpdate = true;
    return { texture: t, topOffset: 1 - repeatY };
  }, [source]);

  useEffect(() => () => texture.dispose(), [texture]);

  useFrame((_, dt) => {
    const g = inner.current;
    const m = material.current;
    if (!g || !m) return;
    const k = 1 - Math.exp(-dt * 9);
    const h = hover.current;

    // Tilt toward the cursor and lift a little.
    g.rotation.y += ((h.on ? h.x * 0.38 : 0) - g.rotation.y) * k;
    g.rotation.x += ((h.on ? -h.y * 0.26 : 0) - g.rotation.x) * k;
    g.position.z += ((h.on ? 0.5 : 0) - g.position.z) * k;
    const s = g.scale.x + ((h.on ? 1.05 : 1) - g.scale.x) * k;
    g.scale.setScalar(s);

    // While hovered the email scrolls slowly inside its card.
    const target = h.on ? Math.max(0, texture.offset.y - dt * 0.035) : topOffset;
    texture.offset.y += (target - texture.offset.y) * (h.on ? 1 : k * 0.6);

    // As the arc turns, each email blurs and fades in from the right, is
    // sharp and solid in the center, then blurs and fades out to the left.
    const dist = Math.abs(angle + (arc.current?.rotation.y ?? 0)) / STEP;
    const fade = THREE.MathUtils.clamp(1.35 - dist * 0.42, 0, 1);
    m.opacity += (fade - m.opacity) * k;
    m.visible = m.opacity > 0.01;
    const soft = h.on ? 0 : THREE.MathUtils.clamp((dist - 0.45) * 1.7, 0, 5);
    blur.value += (soft - blur.value) * k;
  });

  const over = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    hover.current.on = true;
    setCursor("view");
    document.body.style.cursor = "pointer";
  };
  const out = () => {
    hover.current.on = false;
    setCursor(null);
    document.body.style.cursor = "";
  };
  const move = (e: ThreeEvent<PointerEvent>) => {
    if (!e.uv) return;
    hover.current.x = e.uv.x - 0.5;
    hover.current.y = e.uv.y - 0.5;
  };

  return (
    <group position={[Math.sin(angle) * RADIUS, 0, Math.cos(angle) * RADIUS]} rotation={[0, angle, 0]}>
      <group ref={inner}>
        <mesh
          geometry={geometry}
          onPointerOver={over}
          onPointerOut={out}
          onPointerMove={move}
          onClick={(e) => {
            e.stopPropagation();
            onOpen(index);
          }}
        >
          <meshBasicMaterial
            ref={material}
            map={texture}
            transparent
            toneMapped={false}
            side={THREE.DoubleSide}
            onBeforeCompile={patch}
            customProgramCacheKey={() => "showcase-blur"}
          />
        </mesh>
      </group>
    </group>
  );
}

function Arc({
  items,
  progress,
  onOpen,
}: {
  items: readonly ShowcaseItem[];
  progress: RefObject<number>;
  onOpen: (i: number) => void;
}) {
  const arc = useRef<THREE.Group>(null);
  const geometry = useCardGeometry();

  const camera = useThree((s) => s.camera);
  const size = useThree((s) => s.size);

  // On narrow or portrait canvases pull the camera back so several cards stay in view.
  useEffect(() => {
    const aspect = size.width / size.height;
    camera.position.z = CAMERA_Z * Math.max(1, 1.5 / aspect);
    camera.updateProjectionMatrix();
  }, [camera, size]);

  useEffect(() => () => geometry.dispose(), [geometry]);
  useEffect(
    () => () => {
      setCursor(null);
      document.body.style.cursor = "";
    },
    [],
  );

  useFrame((_, dt) => {
    if (!arc.current) return;
    const target = -progress.current * (items.length - 1) * STEP;
    arc.current.rotation.y += (target - arc.current.rotation.y) * (1 - Math.exp(-dt * 7));
  });

  return (
    <group position={[0, 0.16, -RADIUS]}>
      <group ref={arc}>
        {items.map((item, i) => (
          <Card key={item.id ?? item.src} item={item} index={i} geometry={geometry} arc={arc} onOpen={onOpen} />
        ))}
      </group>
    </group>
  );
}

export default function ShowcaseCanvas({
  items,
  progress,
  active,
  onOpen,
}: {
  items: readonly ShowcaseItem[];
  progress: RefObject<number>;
  active: boolean;
  onOpen: (i: number) => void;
}) {
  return (
    <Canvas
      flat
      dpr={[1, 2]}
      frameloop={active ? "always" : "never"}
      camera={{ position: [0, 0, CAMERA_Z], fov: 32, near: 0.1, far: 50 }}
      gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
      aria-hidden="true"
    >
      <Suspense fallback={null}>
        <Arc items={items} progress={progress} onOpen={onOpen} />
      </Suspense>
    </Canvas>
  );
}
