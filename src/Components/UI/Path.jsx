import { useRef, useEffect } from "react";
import gsap from "gsap";

export default function Path({ position, rotation, i, state }) {
  const pathRef = useRef();

  useEffect(() => {
    if (pathRef.current && state == true) {
      gsap.to(pathRef.current.position, {
        y: 26,
        duration: 1,
      });
    }
  }, [state, pathRef]);

  return (
    <>
      <group ref={pathRef} rotation={rotation}>
        <mesh
          position={[position[0] + 5 * i, -1, position[2] - 30]}
          rotation={[Math.PI / 2, 0, 0]}
        >
          <planeGeometry args={[10, 10]} />
          <meshBasicMaterial color={"#c8c8c8"} />
        </mesh>

        <mesh
          position={[position[0] - 5 * i, -1, position[2]]}
          rotation={[Math.PI / 2, 0, 0]}
        >
          <planeGeometry args={[10, 10]} />
          <meshBasicMaterial color={"#c8c8c8"} />
        </mesh>

        <mesh
          position={[position[0] + 5 * i, -1, position[2] + 30]}
          rotation={[Math.PI / 2, 0, 0]}
        >
          <planeGeometry args={[10, 10]} />
          <meshBasicMaterial color={"#c8c8c8"} />
        </mesh>
      </group>
    </>
  );
}
