import { RigidBody } from "@react-three/rapier";
import { Text3D } from "@react-three/drei";
import { useTexture } from "@react-three/drei";
import { assetUrl } from "../../lib/assetUrl";
import nunito from "../../assets/fonts/Nunito_SemiBold_Regular.json";
import Path from "./Path";

export default function Foyer({ position }) {
  const matcap = useTexture(
    assetUrl("matcaps/3B3C3F_DAD9D5_929290_ABACA8.png"),
  );

  return (
    <>
      <RigidBody mass={1} type="fixed" colliders="hull">
        <Text3D
          font={nunito}
          position={[position[0] - 110, 0, position[2] + 160]}
          rotation={[-Math.PI * 0.4, 0, 0]}
          // scale={4}
          // letterSpacing={0.1}
          scale={[4, 4, 2]}
          letterSpacing={0.5}
          height={0.01}
          lineHeight={1}
          bevelEnabled
          bevelSize={0.1}
          bevelSegments={20}
          bevelThickness={0.25}
        >
          {`TANGIBLE VALUES`}
          {/* <meshBasicMaterial color={"black"}/> */}
          <meshMatcapMaterial color={"#707070"} matcap={matcap} />
        </Text3D>
      </RigidBody>

      <RigidBody mass={1} type="fixed" colliders="hull">
        <Text3D
          font={nunito}
          position={[position[0] - 145, 15, position[2] + 105]}
          rotation={[-Math.PI * 0.5, 0, 0]}
          scale={4}
          letterSpacing={0.1}
        >
          {`a digital gallery space for direct 
interaction with thought experiments, 
providing a dynamic environment for 
exploration and contemplation`}
          <meshBasicMaterial color={"#dcdcdc"} />
        </Text3D>
      </RigidBody>

      <RigidBody mass={1} type="fixed" colliders="hull">
        <Text3D
          font={nunito}
          position={[position[0] + 20, 0.5, position[2] + 130]}
          rotation={[-Math.PI * 0.5, 0, 0]}
          scale={[5, 5, 2]}
          letterSpacing={0.3}
          height={0.01}
          lineHeight={1}
          bevelEnabled
          bevelSize={0.04}
          bevelSegments={20}
          bevelThickness={0.25}
        >
          {`  w \na s d`}
          <meshBasicMaterial color={"#63626e"} />
        </Text3D>
        <Text3D
          font={nunito}
          position={[position[0] + 50, 0.5, position[2] + 135]}
          rotation={[-Math.PI * 0.5, 0, 0]}
          letterSpacing={0.3}
          scale={[5, 5, 2]}
          height={0.01}
          lineHeight={1}
          bevelEnabled
          bevelSize={0.04}
          bevelSegments={20}
          bevelThickness={0.25}
        >
          {`+  mouse`}
          <meshBasicMaterial color={"#63626e"} />
        </Text3D>
      </RigidBody>

      <Path position={[0, 0, 25]} i={1} rotation={[0, 0, 0]} state={true} />
    </>
  );
}
