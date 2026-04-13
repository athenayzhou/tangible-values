import { Text3D, Center } from "@react-three/drei";
import { RigidBody } from "@react-three/rapier";
import { useTexture } from "@react-three/drei";
import { assetUrl } from "../../lib/assetUrl";
import nunito from "../../assets/fonts/Nunito_SemiBold_Regular.json";

export default function Text({ text, state, position, rotation, scale, font }) {
  const matcap = useTexture(
    assetUrl("matcaps/C7C7D7_4C4E5A_818393_6C6C74.png"),
  );

  return (
    <>
      <RigidBody type="fixed">
        <Center
          top
          position={position ? position : [0, 15, 0]}
          rotation={rotation ? rotation : [0, 0, 0]}
        >
          <Text3D
            visible={state}
            font={font ? font : nunito}
            scale={scale ? scale : [4, 4, 3]}
            letterSpacing={0.5}
            height={0.01}
            lineHeight={1}
            bevelEnabled
            bevelSize={0.1}
            bevelSegments={8}
            bevelThickness={0.25}
            curveSegments={10}
          >
            {text}
            <meshMatcapMaterial color={"#909199"} matcap={matcap} />
          </Text3D>
        </Center>
      </RigidBody>
    </>
  );
}
