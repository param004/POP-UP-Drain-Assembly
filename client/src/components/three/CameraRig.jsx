import { useCallback, useEffect, useRef, useState } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import * as THREE from "three";

import { MODEL_BOUNDS, explodedBounds } from "../../data/explodeConfig.js";

const IDLE_RESUME_MS = 3400;

/**
 * Orbit controls plus automatic framing.
 *
 * Two problems this solves that a plain <OrbitControls> does not:
 *
 *  1. FRAMING. The assembly is 4.46 units tall assembled and ~11 units tall at
 *     full explode. A fixed camera distance either crops the exploded state or
 *     leaves the assembled product as a speck, so the target and distance are
 *     re-derived from the current explode value every frame.
 *  2. USER INTENT. Auto-framing must not fight the visitor. Once they zoom, the
 *     rig stops adjusting distance (but keeps recentring the target, which is
 *     what stops the product drifting out of shot as it explodes).
 *
 * A caller can override the automatic framing by writing `focusY`, `focusDist` and
 * `takeControl` onto `viewRef`. That is how the scroll story flies the camera to
 * each individual part: it is a plain mutable channel read every frame, rather than
 * React state or a window event bus.
 */
export default function CameraRig({
  viewRef,
  autoRotate = true,
  suspended = false,
  minDistance = 2.6,
  maxDistance = 22,
}) {
  const controlsRef = useRef();
  const { camera } = useThree();

  // `true` while the visitor is dragging; auto-rotate is held off until they idle.
  const [spinning, setSpinning] = useState(autoRotate);
  const idleTimer = useRef(null);

  const rig = useRef({
    userZoomed: false,
    desiredY: 0.6,
    desiredDist: 7.4,
    initialised: false,
  });

  const pauseThenResume = useCallback(() => {
    setSpinning(false);
    clearTimeout(idleTimer.current);
    idleTimer.current = setTimeout(() => setSpinning(true), IDLE_RESUME_MS);
  }, []);

  useEffect(() => () => clearTimeout(idleTimer.current), []);

  // A suspended viewer (tooltip open, tab hidden, reduced motion) holds still.
  useEffect(() => {
    if (suspended) {
      clearTimeout(idleTimer.current);
      setSpinning(false);
    }
  }, [suspended]);

  useFrame((_state, delta) => {
    const controls = controlsRef.current;
    if (!controls) return;
    const r = rig.current;
    const dt = Math.min(delta, 0.05);

    const explode = viewRef?.current?.target ?? 0;
    const bounds = explodedBounds(explode);
    const envelopeMidY = (bounds.min + bounds.max) / 2;
    const height = Math.max(1, bounds.max - bounds.min);

    // A scripted move (the scroll story) asserts control of the framing.
    if (viewRef?.current?.takeControl) {
      r.userZoomed = false;
      viewRef.current.takeControl = false;
    }

    // A caller-supplied focus wins over the automatic envelope framing. The story
    // writes these every frame as it flies between parts.
    const scripted =
      typeof viewRef?.current?.focusY === "number" ||
      typeof viewRef?.current?.focusDist === "number";
    const wantY =
      typeof viewRef?.current?.focusY === "number" ? viewRef.current.focusY : envelopeMidY;

    let wantDist;
    if (typeof viewRef?.current?.focusDist === "number") {
      wantDist = viewRef.current.focusDist;
    } else {
      // Distance that fits the current height plus the model's radius, given the fov.
      // The multipliers leave a comfortable margin so the product never touches the
      // frame edge, while still filling the shot at the assembled default.
      const fov = THREE.MathUtils.degToRad(camera.fov);
      const needed =
        (Math.max(height * 0.5, MODEL_BOUNDS.radius) / Math.tan(fov / 2)) * 1.12 + 0.45;
      wantDist = needed;
    }
    wantDist = THREE.MathUtils.clamp(wantDist, minDistance, maxDistance);

    if (!r.initialised) {
      // First frame: snap into place so the product does not fly in from origin.
      const dir = new THREE.Vector3(0, 0, 1)
        .applyEuler(new THREE.Euler(-0.16, 0.5, 0))
        .normalize();
      camera.position.copy(dir.multiplyScalar(wantDist)).add(new THREE.Vector3(0, wantY, 0));
      controls.target.set(0, wantY, 0);
      controls.update();
      r.desiredY = wantY;
      r.desiredDist = wantDist;
      r.initialised = true;
      return;
    }

    r.desiredDist = wantDist;

    // Scripted moves get a slightly snappier response than the ambient auto-framing,
    // so the camera keeps pace with a fast flick of the scroll wheel.
    const k = 1 - Math.exp(-dt * (scripted ? 5.5 : 3.2));
    r.desiredY += (wantY - r.desiredY) * k;

    // Recentre the target every frame; this is what keeps the product framed.
    controls.target.y += (r.desiredY - controls.target.y) * k;

    if (!r.userZoomed) {
      const offset = camera.position.clone().sub(controls.target);
      const currentDist = offset.length();
      if (currentDist > 0.0001) {
        offset.setLength(currentDist + (r.desiredDist - currentDist) * k);
        camera.position.copy(controls.target).add(offset);
      }
    }

    controls.update();
  });

  return (
    <OrbitControls
      ref={controlsRef}
      makeDefault
      enablePan={false}
      enableDamping
      dampingFactor={0.07}
      rotateSpeed={0.85}
      zoomSpeed={0.7}
      minDistance={minDistance}
      maxDistance={maxDistance}
      // Keep the camera above the floor plane so the product is never seen from below.
      minPolarAngle={0.18}
      maxPolarAngle={1.62}
      autoRotate={spinning && autoRotate}
      autoRotateSpeed={0.5}
      onStart={() => {
        clearTimeout(idleTimer.current);
        setSpinning(false);
      }}
      onEnd={() => {
        // A change in distance to the target is exactly a dolly, so that is how
        // we detect the visitor taking control of the zoom.
        const controls = controlsRef.current;
        if (controls) {
          const dist = camera.position.distanceTo(controls.target);
          if (Math.abs(dist - rig.current.desiredDist) > 0.15) {
            rig.current.userZoomed = true;
          }
        }
        pauseThenResume();
      }}
    />
  );
}
