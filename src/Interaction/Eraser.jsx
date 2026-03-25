import { CuboidCollider, RigidBody } from "@react-three/rapier";
import { useGLTF } from "@react-three/drei";

import { assetUrl } from "../lib/assetUrl";

export default function Eraser({ position, onHoldChange }) {
  const { nodes } = useGLTF(assetUrl("models/eraser.glb"));

  return (
    <>
      <RigidBody
        mass={500}
        gravityScale={500}
        type="dynamic"
        position={position}
        colliders={false}
        lockRotations={true}
        canSleep={false}
        name="eraser"
      >
        <mesh
          scale={300}
          position={[0, -2, 0]}
          rotation={[-Math.PI / 2, 0, 0]}
          geometry={nodes.Eraser_Low_eraser1_0.geometry}
        >
          <meshBasicMaterial color="#515157" />
        </mesh>
        <CuboidCollider args={[8, 3, 3]} />
        <CuboidCollider
          args={[8, 2, 3]}
          sensor
          onIntersectionEnter={(payload) => {
            if (payload.other.rigidBodyObject.name == "person") {
              onHoldChange(true);
            }
          }}
          onIntersectionExit={(payload) => {
            if (payload.other.rigidBodyObject.name == "person") {
              onHoldChange(false);
            }
          }}
        />
      </RigidBody>
    </>
  );
}
