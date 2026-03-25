import { Text3D, Center } from "@react-three/drei";
import { RigidBody } from "@react-three/rapier";
import { Float } from "@react-three/drei";
import { useTexture } from "@react-three/drei";

import { assetUrl } from "../lib/assetUrl";

import nunito from "../assets/fonts/Nunito_SemiBold_Regular.json";

export default function Label({ text, state, position, rotation, scale }) {
  const matcap = useTexture(
    assetUrl("matcaps/3B3C3F_DAD9D5_929290_ABACA8.png"),
  );

  return (
    <Float
      speed={1}
      rotationIntensity={0}
      floatIntensity={1}
      floatingRange={[-1, 1]}
    >
      <RigidBody type="fixed">
        <Center
          top
          position={position ? position : [0, 15, 0]}
          rotation={rotation ? rotation : [0, 0, 0]}
        >
          <Text3D
            visible={state}
            font={nunito}
            scale={scale ? scale : [4, 4, 3]}
            letterSpacing={0.5}
            height={0.01}
            lineHeight={1}
            bevelEnabled
            bevelSize={0.1}
            bevelSegments={20}
            bevelThickness={0.25}
            // curveSegments={64}
          >
            {text}
            <meshMatcapMaterial color={"darkgray"} matcap={matcap} />
          </Text3D>
        </Center>
      </RigidBody>
    </Float>
  );
}
