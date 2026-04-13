import { useRef, useEffect } from "react";
import gsap from "gsap";
import Text from "../Text/Text";

export default function Paper({
  paperPosition,
  paperRotation,
  textPosition,
  textRotation,
  text,
  confedState,
  flipState,
}) {
  const paper = useRef();

  useEffect(() => {
    if (flipState == true) {
      gsap.from(
        paper.current.rotation,
        {
          z: 0,
          duration: 0.1,
        },
        ">",
      );
      gsap.to(paper.current.position, {
        y: 5,
        duration: 0.5,
      });
      gsap.to(
        paper.current.rotation,
        {
          z: Math.PI,
          duration: 1,
        },
        ">",
      );
      gsap.to(
        paper.current.position,
        {
          y: 0,
          duration: 0.5,
        },
        ">",
      );
    }
  }, [flipState]);

  return (
    <mesh ref={paper} position={paperPosition} rotation={paperRotation}>
      <boxGeometry args={[10, 0.5, 12]} />
      <meshBasicMaterial color="#97989d" />
      <Text
        text={`${text}`}
        state={confedState}
        position={textPosition}
        rotation={textRotation}
      />
    </mesh>
  );
}
