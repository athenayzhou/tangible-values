import { RigidBody } from "@react-three/rapier";
import Button from "./Button";

export default function Reset({ position, onReset, refractory }) {
  const handleClick = () => {
    if (refractory) return;
    onReset();
  };

  return (
    <>
      <RigidBody
        name="reset"
        mass={1}
        type="fixed"
        colliders="cuboid"
        position={position}
      >
        <mesh rotation={[-Math.PI / 2, 0, 0]} onClick={handleClick}>
          <boxGeometry args={[19, 5, 2]} />
          <meshBasicMaterial transparent opacity={0} />
        </mesh>
        <Button position={[0, 0, 0]} text={"RESET"} />
      </RigidBody>
    </>
  );
}
