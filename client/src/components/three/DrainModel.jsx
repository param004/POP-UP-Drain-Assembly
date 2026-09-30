import { useEffect, useLayoutEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { useGLTF } from "@react-three/drei";
import * as THREE from "three";

import {
  MODEL_URL,
  HIDDEN_NODES,
  OUTER_SHELL_NODES,
  explodeOffsetFor,
  pressOffsetFor,
} from "../../data/explodeConfig.js";

/**
 * Loads the supplied GLB and drives every moving part.
 *
 * Three things are applied to the loaded scene:
 *   1. Explode  — per-node Y offsets from the retargeted tier table in
 *                 explodeConfig.js, with a per-tier stagger and damping.
 *   2. Press    — the small mechanism demo, layered on top of the explode.
 *   3. Section  — a clip plane that cuts the outer shell for the cross-section
 *                 variant. The GLB has no separate cutaway asset, so the
 *                 cutaway is produced on the client instead of shipping a
 *                 second 1.5 MB file.
 *
 * The model is deep-cloned because useGLTF caches one instance, and two viewers
 * on the same page (home + related products) would otherwise fight over the same
 * transforms and materials.
 */
export default function DrainModel({
  modelUrl = MODEL_URL,
  viewRef,
  hoveredNode,
  focusedNode = null,
  focusedNodes = null,
  section = false,
  pressDemo = 0,
}) {
  const gltf = useGLTF(modelUrl);
  const groupRef = useRef();

  // Clone the scene and its materials so this instance is fully independent.
  const scene = useMemo(() => {
    const clone = gltf.scene.clone(true);
    clone.traverse((obj) => {
      if (HIDDEN_NODES.has(obj.name)) {
        obj.visible = false;
        obj.userData.permanentlyHidden = true;
        return;
      }
      if (obj.isMesh) {
        obj.material = Array.isArray(obj.material)
          ? obj.material.map((m) => m.clone())
          : obj.material.clone();
        // Remember each material's authored envMapIntensity so the focus dimming can
        // be turned on and off without permanently altering the look.
        const mats = Array.isArray(obj.material) ? obj.material : [obj.material];
        for (const m of mats) m.userData.baseEnvIntensity = m.envMapIntensity ?? 1;
        obj.castShadow = true;
        obj.receiveShadow = true;
      }
    });
    return clone;
  }, [gltf.scene]);

  // nodeName -> Object3D, plus each moving node's rest transform.
  const { nodeMap, rest } = useMemo(() => {
    const map = {};
    const restPose = {};
    scene.traverse((obj) => {
      if (!obj.name || obj.userData.permanentlyHidden) return;
      map[obj.name] = obj;
      if (obj.name) {
        restPose[obj.name] = {
          y: obj.position.y,
          rz: obj.rotation.z,
        };
      }
    });
    return { nodeMap: map, rest: restPose };
  }, [scene]);

  /*
   * Expose the node map so the hotspot projector can find the real part objects.
   *
   * NOTE: always through `viewRef.current`. The ref holds a plain mutable object,
   * so every reader and writer must agree on `.current` — mixing the two forms
   * silently reads `undefined` and makes the explode do nothing at all.
   */
  useLayoutEffect(() => {
    if (viewRef?.current) viewRef.current.nodes = nodeMap;
  }, [viewRef, nodeMap]);

  // Damped explode value: the slider writes `viewRef.current.target`, this eases toward it.
  const stateRef = useRef({ smooth: 0, press: 0 });

  /* ------------------------- focus / hover highlight ------------------------- */

  // Materials are cloned per mesh above, so highlighting one part does not drag
  // every other part that shares the same source material along with it.
  //
  // `focusedNode` / `focusedNodes` (the part the scroll story is introducing) take
  // priority over `hoveredNode` (a pointer hover). The rest of the assembly is
  // dimmed by lowering envMapIntensity rather than by going transparent: these are
  // thin nested shells, and fading them produces sorting artefacts where you can
  // see straight through the wrong surfaces.
  useEffect(() => {
    // `focusedNodes` highlights a whole part (an explode tier can be several
    // meshes); `hoveredNode` highlights a single mesh. Both fall back to the other.
    const set = new Set(focusedNodes?.length ? focusedNodes : focusedNode ? [focusedNode] : []);
    if (!set.size && hoveredNode) set.add(hoveredNode);
    const dim = set.size > 0;

    scene.traverse((obj) => {
      if (!obj.isMesh || !obj.material) return;
      const isActive = set.has(obj.name);
      const mats = Array.isArray(obj.material) ? obj.material : [obj.material];
      for (const m of mats) {
        if (m.emissive) {
          m.emissive.setHex(isActive ? 0x3a1a08 : 0x000000);
          m.emissiveIntensity = isActive ? 1 : 0;
        }
        const base = m.userData.baseEnvIntensity ?? 1;
        m.envMapIntensity = isActive ? base * 1.15 : dim ? base * 0.3 : base;
      }
    });
  }, [focusedNodes, focusedNode, hoveredNode, nodeMap, scene]);

  /* --------------------------- cross-section clipping -------------------------- */

  const clipPlane = useMemo(
    () => new THREE.Plane(new THREE.Vector3(0, 0, -1), 0),
    []
  );

  useEffect(() => {
    const planes = section ? [clipPlane] : null;
    for (const obj of Object.values(nodeMap)) {
      if (!obj.isMesh || !obj.material) continue;
      const mats = Array.isArray(obj.material) ? obj.material : [obj.material];
      for (const m of mats) {
        m.clippingPlanes = planes;
        // Only the outer shell is cut, so double-siding just the cut parts keeps
        // the section reading as solid rather than as a hollow shell.
        m.side = section && OUTER_SHELL_NODES.has(obj.name)
          ? THREE.DoubleSide
          : THREE.FrontSide;
        m.needsUpdate = true;
      }
    }
  }, [section, nodeMap, clipPlane]);

  /* -------------------------------- the loop -------------------------------- */

  // `viewRef` is written to here on purpose. It is a plain mutable ref holding the
  // slider's target value, shared with CameraRig and HotspotProjector, because all
  // three read it every animation frame. Routing that through React state would
  // re-render the tree 60 times a second to move one number. The lint rule that
  // flags this is React Compiler declining to optimise the component, which is the
  // correct trade for a render-loop hot path.
  useFrame((_state, delta) => {
    // Frame-rate independent damping, clamped so a background tab cannot produce
    // a huge dt and snap the model.
    const dt = Math.min(delta, 0.05);
    const target = viewRef?.current?.target ?? 0;

    const s = stateRef.current;
    s.smooth += (target - s.smooth) * (1 - Math.exp(-dt * 7));
    if (Math.abs(target - s.smooth) < 0.0002) s.smooth = target;

    const pressTarget = pressDemo;
    s.press += (pressTarget - s.press) * (1 - Math.exp(-dt * 6));

    if (viewRef?.current) viewRef.current.smooth = s.smooth;

    for (const [name, node] of Object.entries(nodeMap)) {
      if (node.userData.permanentlyHidden) continue;
      const base = rest[name];
      if (!base) continue;

      const e = explodeOffsetFor(name, s.smooth);
      const p = pressOffsetFor(name, s.press);

      node.position.y = base.y + e.dy + p.dy;
      if (p.rz !== 0 || e.rz !== 0) node.rotation.z = base.rz + e.rz + p.rz;
    }
  });

  return (
    <group ref={groupRef}>
      <primitive object={scene} />
    </group>
  );
}

useGLTF.preload(MODEL_URL);
