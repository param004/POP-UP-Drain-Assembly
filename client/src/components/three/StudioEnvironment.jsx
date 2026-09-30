import { Environment, Lightformer } from "@react-three/drei";

/**
 * The shared studio lighting rig.
 *
 * The GLB's chrome parts have a metallic factor of 1.0, which means they reflect
 * the environment and *nothing else* — no diffuse term, no self-shading. With a
 * near-black environment they render as harsh black-and-white blobs rather than
 * chrome, so this rig does two things:
 *
 *   1. Sets a base tone inside <Environment> via a background colour, so metal
 *      always has something to reflect.
 *   2. Adds large soft light cards (a top softbox, two vertical strips and a
 *      floor bounce) which produce the long vertical highlight streaks that read
 *      as polished metal.
 *
 * It is built entirely from local lightformers rather than an HDRI preset, so
 * the site needs no network access and no CDN round-trip to look right.
 */
export default function StudioEnvironment({
  /** Environment map resolution. Lower is fine for small thumbnails. */
  resolution = 256,
  /** Keep re-rendering the env map. Only turn off once everything is static. */
  frames = 1,
  intensity = 1,
}) {
  return (
    <Environment resolution={resolution} frames={frames}>
      {/*
        A DARK base tone, deliberately. Polished chrome is a mirror: what makes it
        read as chrome is the contrast between dark reflected areas and bright
        reflected light sources. Lighting the environment uniformly pale instead
        turns the chrome into flat white plastic.
      */}
      <color attach="background" args={["#232326"]} />

      {/* Overhead softbox — the broad highlight across the top of the cap. */}
      <Lightformer
        form="rect"
        intensity={5.5 * intensity}
        position={[0, 5, 0.5]}
        rotation={[-Math.PI / 2, 0, 0]}
        scale={[9, 6, 1]}
        color="#ffffff"
      />

      {/* Tall vertical strips. These are what produce the long streak highlights
          running down the shank and around the flange. */}
      <Lightformer
        form="rect"
        intensity={4.5 * intensity}
        position={[-5, 1.2, 2]}
        rotation={[0, Math.PI / 2, 0]}
        scale={[8, 8, 1]}
        color="#ffffff"
      />
      <Lightformer
        form="rect"
        intensity={3.2 * intensity}
        position={[5, 1.2, -1.5]}
        rotation={[0, -Math.PI / 2, 0]}
        scale={[7, 8, 1]}
        color="#eef2f7"
      />
      {/* A narrower accent strip gives the highlight a second, sharper edge. */}
      <Lightformer
        form="rect"
        intensity={2.4 * intensity}
        position={[-2.5, 2, 5.5]}
        rotation={[0, 0, 0.35]}
        scale={[0.9, 6, 1]}
        color="#ffffff"
      />

      {/* Warm rim from behind separates the silhouette from the backdrop. */}
      <Lightformer
        form="rect"
        intensity={2.2 * intensity}
        position={[0, 1.5, -6]}
        scale={[8, 5, 1]}
        color="#fff0dc"
      />

      {/* Dim floor bounce, so the underside of the flange is not dead black. */}
      <Lightformer
        form="rect"
        intensity={0.5 * intensity}
        position={[0, -4, 1]}
        rotation={[Math.PI / 2, 0, 0]}
        scale={[9, 9, 1]}
        color="#cfd3d8"
      />

      {/* Low front fill to lift the face of the product toward the camera. */}
      <Lightformer
        form="ring"
        intensity={0.55 * intensity}
        position={[0, 0.5, 6]}
        scale={[4, 4, 1]}
        color="#ffffff"
      />
    </Environment>
  );
}
