import {
  useGLTF,
  useTexture,
  useCubeTexture,
  useFont,
} from "@react-three/drei";

import nunito from "../assets/fonts/Nunito_SemiBold_Regular.json";
import { assetUrl } from "../lib/assetUrl";

const GLB = [
  "models/coin.glb",
  "models/apple.glb",
  "models/orange.glb",
  "models/eraser.glb",
  "models/rounded_arch.glb",
  "models/stone_arch.glb",
  "models/circle_arch.glb",
  "models/pointed_arch.glb",
].map((p) => assetUrl(p));

const MATCAPS = [
  "matcaps/3B3C3F_DAD9D5_929290_ABACA8.png",
  "matcaps/C7C7D7_4C4E5A_818393_6C6C74.png",
  "matcaps/7A7A7A_D9D9D9_BCBCBC_B4B4B4.png",
].map((p) => assetUrl(p));

const ENVCUBE = ["px.png", "nx.png", "py.png", "ny.png", "pz.png", "nz.png"];

/**
 * Registers network + parse work for dilemma assets before the player reaches a thought.
 * Safe to call every render; drei dedupes preloads.
 */
export default function PreloadThoughtAssets() {
  GLB.forEach((url) => {
    useGLTF.preload(url);
  });
  MATCAPS.forEach((url) => {
    useTexture.preload(url);
  });
  useCubeTexture.preload(ENVCUBE, { path: assetUrl("envmap/") });
  useFont.preload(nunito);
  return null;
}
