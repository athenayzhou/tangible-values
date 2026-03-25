import { RigidBody } from "@react-three/rapier";
import { useGLTF, useTexture } from "@react-three/drei";

import { assetUrl } from "../lib/assetUrl";

export default function Archways({
  dictatorPos,
  volunteerPos,
  exchangePos,
  trustPos,
}) {
  const { nodes: dictator } = useGLTF(assetUrl("models/rounded_arch.glb"));
  const { nodes: exchange } = useGLTF(assetUrl("models/stone_arch.glb"));
  const { nodes: trust } = useGLTF(assetUrl("models/circle_arch.glb"));
  const { nodes: volunteer } = useGLTF(assetUrl("models/pointed_arch.glb"));

  const matcap = useTexture(
    assetUrl("matcaps/7A7A7A_D9D9D9_BCBCBC_B4B4B4.png"),
  );

  return (
    <>
      {/* dictator */}
      <RigidBody mass={1} type="fixed" colliders="hull">
        {Object.keys(dictator).map((nodeName) => {
          if (nodeName.startsWith("Object_")) {
            return (
              <mesh
                key={nodeName}
                geometry={dictator[nodeName].geometry}
                position={[
                  dictatorPos[0],
                  dictatorPos[1] - 5,
                  dictatorPos[2] + 445,
                ]}
                rotation={[-Math.PI / 2, 0, 0]}
                scale={0.15}
              >
                {/* <meshMatcapMaterial matcap={matcap} /> */}
                <meshMatcapMaterial color={"#bbbdc9"} matcap={matcap} />
              </mesh>
            );
          }
          return null;
        })}
      </RigidBody>

      {/* volunteer */}
      <RigidBody mass={1} type="fixed" colliders="trimesh">
        <mesh
          geometry={volunteer.Object_4.geometry}
          position={[
            volunteerPos[0] + 250,
            volunteerPos[1] - 5,
            volunteerPos[2] + 175,
          ]}
          rotation={[0, -Math.PI * 0.2, 0]}
          scale={15}
        >
          <meshMatcapMaterial color={"#bbbdc9"} matcap={matcap} />
        </mesh>
      </RigidBody>

      {/* exchange */}
      <RigidBody mass={1} type="fixed" colliders="hull">
        <mesh
          geometry={exchange.Arch_01_LPUNHPZBSG1_0.geometry}
          position={[
            exchangePos[0] - 22,
            exchangePos[1] - 5,
            exchangePos[2] + 330,
          ]}
          rotation={[0, -Math.PI / 2, 0]}
          scale={5}
        >
          <meshMatcapMaterial color={"#bbbdc9"} matcap={matcap} />
        </mesh>
      </RigidBody>
      <RigidBody mass={1} type="fixed" colliders="hull">
        <mesh
          geometry={exchange.Arch_01_1_LPUNHPZBSG1_0.geometry}
          position={[
            exchangePos[0] + 22,
            exchangePos[1] - 5,
            exchangePos[2] + 330,
          ]}
          rotation={[0, Math.PI / 2, 0]}
          scale={5}
        >
          <meshMatcapMaterial color={"#bbbdc9"} matcap={matcap} />
        </mesh>
      </RigidBody>

      {/* trust */}
      <RigidBody mass={1} type="fixed" colliders="trimesh">
        <mesh
          geometry={trust.Object_2.geometry}
          position={[trustPos[0] - 250, trustPos[1] - 5, trustPos[2] + 175]}
          rotation={[-Math.PI / 2, 0, -Math.PI * 0.25]}
          scale={0.8}
        >
          <meshMatcapMaterial color={"#bbbdc9"} matcap={matcap} />
        </mesh>
      </RigidBody>
    </>
  );
}
