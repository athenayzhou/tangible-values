import { useTexture } from "@react-three/drei";

import { assetUrl } from "../lib/assetUrl";
import Text from "../Text/Text";

export default function Button({ position, text }) {
  const matcap = useTexture(
    assetUrl("matcaps/C7C7D7_4C4E5A_818393_6C6C74.png"),
  );

  return (
    <group position={position}>
      <mesh position={[0, 1, -3]} rotation={[-Math.PI / 2, 0, -Math.PI / 2]}>
        <capsuleGeometry args={[0.75, 18, 4, 8]} />
        <meshMatcapMaterial color={"#909199"} matcap={matcap} />
      </mesh>
      <mesh position={[0, 1, 3]} rotation={[-Math.PI / 2, 0, -Math.PI / 2]}>
        <capsuleGeometry args={[0.75, 18, 4, 8]} />
        <meshMatcapMaterial color={"#909199"} matcap={matcap} />
      </mesh>
      <mesh position={[-9.05, 1, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <capsuleGeometry args={[0.75, 5.5, 4, 8]} />
        <meshMatcapMaterial color={"#909199"} matcap={matcap} />
      </mesh>
      <mesh position={[9.05, 1, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <capsuleGeometry args={[0.75, 5.5, 4, 8]} />
        <meshMatcapMaterial color={"#909199"} matcap={matcap} />
      </mesh>

      <Text
        text={`${text}`}
        state={true}
        position={[0, 0, 0.5]}
        rotation={[-Math.PI / 2, 0, 0]}
        scale={[2, 2, 3]}
      />
    </group>
  );
}
