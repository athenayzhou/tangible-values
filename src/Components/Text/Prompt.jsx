import { RigidBody } from "@react-three/rapier";
import { Text3D, Center } from "@react-three/drei";
import { useTexture } from "@react-three/drei";
import { assetUrl } from "../../lib/assetUrl";
import nunito from "../../assets/fonts/Nunito_SemiBold_Regular.json";

export default function Prompt({ position, prompt, state }) {
  const matcap = useTexture(
    assetUrl("matcaps/3B3C3F_DAD9D5_929290_ABACA8.png"),
  );

  return (
    <>
      <RigidBody type="fixed">
        <Center
          position={position ? position : [0, 0, 0]}
          rotation={[Math.PI * 0.125, 0, 0]}
        >
          <Text3D
            visible={state}
            font={nunito}
            scale={[2.5, 2, 1]}
            height={0.1}
            lineHeight={1.1}
            letterSpacing={0.1}
            curveSegments={8}
          >
            {prompt}
            <meshMatcapMaterial color={"#707070"} matcap={matcap} />
          </Text3D>
        </Center>
      </RigidBody>
    </>
  );
}
