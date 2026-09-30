import { Suspense, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { ContactShadows, AdaptiveDpr } from "@react-three/drei";

import DrainModel from "./DrainModel.jsx";
import CameraRig from "./CameraRig.jsx";
import StudioEnvironment from "./StudioEnvironment.jsx";
import { HotspotProjector } from "./Hotspot.jsx";
import { explodedBounds } from "../../data/explodeConfig.js";

/** Where the shadow plane sits at explode 0 — the model's rest bottom. */
const REST_FLOOR_Y = -1.72;

/**
 * The 3D stage.
 *
 * The canvas is transparent so the section's CSS gradient shows through, which
 * is how the product gets the soft studio sweep from the reference without a
 * flat backdrop plane. Lighting is a three-point setup plus an HDRI built from
 * <Lightformer>s, which keeps the chrome readable without loading an environment
 * map from a CDN (the site works offline).
 */
export default function SceneCanvas({
  modelUrl,
  hotspots = [],
  viewRef,
  markerRefs,
  tipRefs,
  hoveredNode = null,
  focusedNode = null,
  focusedNodes = null,
  section = false,
  pressDemo = 0,
  autoRotate = true,
  suspendRotate = false,
  onReady,
  showHotspots = true,
  dpr,
  /**
   * Set false to park the render loop. R3F keeps `frameloop="never"` meaning "do
   * not schedule frames", so the scene, textures and animation state are all
   * retained and it resumes instantly. This is how two viewers can share one page
   * without halving the frame rate.
   */
  active = true,
}) {
  return (
    <Canvas
      shadows
      dpr={dpr ?? [1, 2]}
      frameloop={active ? "always" : "never"}
      gl={{
        antialias: true,
        alpha: true,
        // Required for the cross-section clip plane to take effect.
        localClippingEnabled: true,
        preserveDrawingBuffer: false,
      }}
      camera={{ fov: 32, near: 0.1, far: 100, position: [3.4, 2.2, 6.2] }}
      onCreated={({ gl }) => {
        gl.toneMappingExposure = 1.05;
        onReady?.();
      }}
    >
      <Suspense fallback={null}>
        <DrainModel
          modelUrl={modelUrl}
          viewRef={viewRef}
          section={section}
          pressDemo={pressDemo}
          hoveredNode={hoveredNode}
          focusedNode={focusedNode}
          focusedNodes={focusedNodes}
        />

        {showHotspots && (
          <HotspotProjector
            hotspots={hotspots}
            viewRef={viewRef}
            markerRefs={markerRefs}
            tipRefs={tipRefs}
          />
        )}

        <CameraRig viewRef={viewRef} autoRotate={autoRotate} suspended={suspendRotate} />

        {/* Soft key from the upper front, cool fill from the left, warm rim behind. */}
        <ambientLight intensity={0.3} />
        <directionalLight
          position={[4, 7, 5]}
          intensity={1.5}
          castShadow
          shadow-mapSize={[1024, 1024]}
          shadow-bias={-0.0004}
        />
        <directionalLight position={[-5, 3, -4]} intensity={0.55} color="#cfe0ff" />
        <directionalLight position={[0, 2, -6]} intensity={0.5} color="#fff3e0" />

        <StudioEnvironment />

        {/* Grounds the product without a visible floor plane. */}
        <GroundedShadow viewRef={viewRef} />
      </Suspense>

      <AdaptiveDpr pixelated />
    </Canvas>
  );
}

/**
 * Contact shadow that tracks the bottom of the assembly.
 *
 * A shadow plane pinned to the model's rest position would be left hanging in
 * mid-air the moment the body tier drops, so this follows the exploded bounds and
 * damps the motion to avoid a jittery shadow.
 */
function GroundedShadow({ viewRef }) {
  const group = useRef();
  const current = useRef(REST_FLOOR_Y);

  useFrame((_state, delta) => {
    if (!group.current) return;
    const explode = viewRef?.current?.smooth ?? 0;
    const bounds = explodedBounds(explode);
    const target = bounds.min - 0.1;
    const k = 1 - Math.exp(-Math.min(delta, 0.05) * 6);
    current.current += (target - current.current) * k;
    group.current.position.y = current.current;
  });

  return (
    <group ref={group} position={[0, REST_FLOOR_Y, 0]}>
      <ContactShadows
        position={[0, 0, 0]}
        opacity={0.4}
        scale={15}
        blur={2.6}
        far={6}
        resolution={512}
        color="#2a2622"
      />
    </group>
  );
}
