"use client";

import { Canvas, useFrame, useLoader, useThree, type ThreeEvent } from "@react-three/fiber";
import { Component, Suspense, useEffect, useMemo, useRef, type ReactNode, type RefObject } from "react";
import * as THREE from "three";
import type { ShowcaseItem } from "@/content/site";
import { resized } from "@/lib/images";
import { isVideoSrc } from "@/lib/media";
import { setCursor } from "./Cursor";

const CARD_W = 2;
const CARD_H = 3.3;
const RADIUS = 6.4;
const CAMERA_Z = 10.4;
export const STEP = 0.36; // radians between neighbours on the arc

/**
 * One card's image failing to load (a deleted upload, a mistyped link) only
 * removes that card; the rest of the arc and the page carry on.
 */
class SkipOnError extends Component<{ children: ReactNode; src: string }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  componentDidCatch(error: unknown) {
    console.warn(`Showcase image skipped: ${this.props.src}`, error);
  }
  render() {
    return this.state.failed ? null : this.props.children;
  }
}

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

type CardProps = {
  item: ShowcaseItem;
  index: number;
  geometry: THREE.ShapeGeometry;
  arc: RefObject<THREE.Group | null>;
  onOpen: (i: number) => void;
};

/** Tallest texture every GPU takes (phones included); taller emails are loaded narrower. */
const MAX_TEXTURE = 4096;

/**
 * The email as a texture, resized by the image optimizer: about 640px wide
 * is plenty for a card, and a fraction of the original's decode, upload and
 * GPU memory.
 */
function textureSrc(item: ShowcaseItem) {
  const aspect = item.height / item.width || 1;
  return resized(item.src, Math.min(640, MAX_TEXTURE / aspect));
}

function ImageCard(props: CardProps) {
  return <Card {...props} source={useLoader(THREE.TextureLoader, textureSrc(props.item))} />;
}

/** Video emails play muted on a loop right on the card. */
function VideoCard(props: CardProps) {
  const texture = useMemo(() => {
    const v = document.createElement("video");
    v.crossOrigin = "anonymous";
    v.muted = true;
    v.loop = true;
    v.playsInline = true;
    v.preload = "auto";
    v.src = props.item.src;
    return new THREE.VideoTexture(v);
  }, [props.item.src]);
  useEffect(() => {
    const v = texture.image as HTMLVideoElement;
    v.play().catch(() => {});
    return () => {
      v.pause();
      v.removeAttribute("src");
      v.load();
      texture.dispose();
    };
  }, [texture]);
  return <Card {...props} source={texture} />;
}

/** Runs when the browser is idle (or soon, where it has no idle callback). */
const idle = typeof window !== "undefined" && typeof window.requestIdleCallback === "function";
const whenIdle = (fn: () => void): number => (idle ? window.requestIdleCallback(fn, { timeout: 800 }) : Number(setTimeout(fn, 60)));
const cancelIdle = (id: number) => (idle ? window.cancelIdleCallback(id) : clearTimeout(id));

function Card({ item, index, geometry, arc, onOpen, source }: CardProps & { source: THREE.Texture }) {
  const { gl, scene, camera, invalidate } = useThree();
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
    // The saved size works for images and videos alike.
    const img = { width: item.width, height: item.height };
    const repeatY = Math.min(1, img.width / img.height / (CARD_W / CARD_H));
    t.colorSpace = THREE.SRGBColorSpace;
    t.anisotropy = 8;
    t.generateMipmaps = true;
    t.minFilter = THREE.LinearMipmapLinearFilter;
    t.repeat.set(1, repeatY);
    t.offset.set(0, 1 - repeatY);
    t.needsUpdate = true;
    return { texture: t, topOffset: 1 - repeatY };
  }, [source, item.width, item.height]);

  useEffect(() => () => texture.dispose(), [texture]);

  // Send the texture to the GPU (and build the shader once) while the section
  // is still below the fold, so scrolling into it doesn't stall on uploads.
  useEffect(() => {
    const id = whenIdle(() => {
      gl.initTexture(texture);
      gl.compile(scene, camera);
      invalidate();
    });
    return () => cancelIdle(id);
  }, [gl, scene, camera, texture, invalidate]);

  const isVideo = source instanceof THREE.VideoTexture;

  useFrame((state, dt) => {
    const g = inner.current;
    const m = material.current;
    if (!g || !m) return;
    const before = g.rotation.y + g.rotation.x + g.position.z + g.scale.x + m.opacity + blur.value + texture.offset.y;
    const k = 1 - Math.exp(-dt * 9);
    const h = hover.current;

    // Tilt toward the cursor and lift a little.
    g.rotation.y += ((h.on ? h.x * 0.38 : 0) - g.rotation.y) * k;
    g.rotation.x += ((h.on ? -h.y * 0.26 : 0) - g.rotation.x) * k;
    g.position.z += ((h.on ? 0.5 : 0) - g.position.z) * k;
    const s = g.scale.x + ((h.on ? 1.05 : 1) - g.scale.x) * k;
    g.scale.setScalar(s);

    // While hovered the email scrolls down inside its card, top to bottom in about six seconds.
    const target = h.on ? Math.max(0, texture.offset.y - dt * Math.max(0.035, topOffset / 6)) : topOffset;
    texture.offset.y += (target - texture.offset.y) * (h.on ? 1 : k * 0.6);

    // As the arc turns, each email blurs and fades in from the right, is
    // sharp and solid in the center, then blurs and fades out to the left.
    const dist = Math.abs(angle + (arc.current?.rotation.y ?? 0)) / STEP;
    const fade = THREE.MathUtils.clamp(1.35 - dist * 0.42, 0, 1);
    m.opacity += (fade - m.opacity) * k;
    m.visible = m.opacity > 0.01;
    const soft = h.on ? 0 : THREE.MathUtils.clamp((dist - 0.45) * 1.7, 0, 5);
    blur.value += (soft - blur.value) * k;

    // Frames are drawn on demand: ask for another while anything is still
    // easing, the email is scrolling under the pointer, or a video is playing.
    const after = g.rotation.y + g.rotation.x + g.position.z + g.scale.x + m.opacity + blur.value + texture.offset.y;
    if (Math.abs(after - before) > 1e-5 || (isVideo && m.visible)) state.invalidate();
  });

  const over = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    hover.current.on = true;
    invalidate();
    setCursor("view");
    document.body.style.cursor = "pointer";
  };
  const out = () => {
    hover.current.on = false;
    invalidate();
    setCursor(null);
    document.body.style.cursor = "";
  };
  const move = (e: ThreeEvent<PointerEvent>) => {
    if (!e.uv) return;
    hover.current.x = e.uv.x - 0.5;
    hover.current.y = e.uv.y - 0.5;
    invalidate();
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

  useFrame((state, dt) => {
    if (!arc.current) return;
    const target = -progress.current * (items.length - 1) * STEP;
    const gap = target - arc.current.rotation.y;
    arc.current.rotation.y += gap * (1 - Math.exp(-dt * 7));
    if (Math.abs(gap) > 1e-4) state.invalidate();
  });

  return (
    <group position={[0, 0.16, -RADIUS]}>
      <group ref={arc}>
        {items.map((item, i) => (
          <SkipOnError key={item.id ?? item.src} src={item.src}>
            <Suspense fallback={null}>
              {isVideoSrc(item.src) ? (
                <VideoCard item={item} index={i} geometry={geometry} arc={arc} onOpen={onOpen} />
              ) : (
                <ImageCard item={item} index={i} geometry={geometry} arc={arc} onOpen={onOpen} />
              )}
            </Suspense>
          </SkipOnError>
        ))}
      </group>
    </group>
  );
}

/** Hands the page a way to ask for a frame (scrolling), and draws one whenever the canvas comes back on screen. */
function Wake({ kick, active }: { kick: RefObject<(() => void) | null>; active: boolean }) {
  const invalidate = useThree((s) => s.invalidate);
  useEffect(() => {
    kick.current = invalidate;
    return () => {
      kick.current = null;
    };
  }, [kick, invalidate]);
  useEffect(() => {
    if (active) invalidate();
  }, [active, invalidate]);
  return null;
}

export default function ShowcaseCanvas({
  items,
  progress,
  kick,
  active,
  onOpen,
}: {
  items: readonly ShowcaseItem[];
  progress: RefObject<number>;
  /** Set to a function that requests a frame; the page calls it as it scrolls. */
  kick: RefObject<(() => void) | null>;
  active: boolean;
  onOpen: (i: number) => void;
}) {
  return (
    <Canvas
      flat
      // 1.5x is as sharp as the 640px textures get; 2x only costs fill rate.
      dpr={[1, 1.5]}
      // Nothing is drawn while the arc is still; scrolling, hovering and easing ask for frames.
      frameloop={active ? "demand" : "never"}
      camera={{ position: [0, 0, CAMERA_Z], fov: 32, near: 0.1, far: 50 }}
      // "default" keeps laptops on the integrated GPU instead of waking the discrete one.
      // Retina screens hide jagged edges by themselves, so multisampling is only paid for at 1x.
      gl={{ antialias: typeof window === "undefined" || window.devicePixelRatio < 1.5, alpha: true, powerPreference: "default" }}
      aria-hidden="true"
    >
      <Wake kick={kick} active={active} />
      <Suspense fallback={null}>
        <Arc items={items} progress={progress} onOpen={onOpen} />
      </Suspense>
    </Canvas>
  );
}
