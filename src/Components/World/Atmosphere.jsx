import { useMemo } from "react";
import * as THREE from "three";

export default function Atmosphere({
  trust = 0,
  altruism = 0,
  deceit = 0,
  greed = 0,
  standing = 0,
}) {
  const { colorHex, fogDensity, ambient, directional } = useMemo(() => {
    const norm = (v) => Math.min(40, Math.max(0, Number(v) || 0)) / 40;
    const t = norm(trust);
    const al = norm(altruism);
    const de = norm(deceit);
    const g = norm(greed);
    const st = Math.min(1, Math.max(0, (Number(standing) || 0) / 50));

    const hue = 0.08 + 0.12 * al - 0.06 * de - 0.04 * g + 0.05 * t;
    const lightness = 0.88 + 0.06 * st - 0.04 * de;
    const sat = 0.06 + 0.1 * al;
    const c = new THREE.Color().setHSL(
      Math.min(0.2, Math.max(0.06, hue)),
      Math.min(0.22, Math.max(0.03, sat)),
      Math.min(0.94, Math.max(0.82, lightness)),
    );
    const fogD = Math.max(0.0015, Math.min(0.006, 0.0042 - 0.0022 * st));
    return {
      colorHex: `#${c.getHexString()}`,
      fogDensity: fogD,
      ambient: 0.78 + 0.28 * st,
      directional: 0.85 + 0.25 * st,
    };
  }, [trust, altruism, deceit, greed, standing]);

  return (
    <>
      <color attach="background" args={[colorHex]} />
      <fogExp2 attach="fog" args={[colorHex, fogDensity]} />
      <ambientLight intensity={ambient} />
      <directionalLight
        color="#ffffff"
        position={[300, 50, 100]}
        intensity={directional}
      />
    </>
  );
}
