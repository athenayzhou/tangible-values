import { useState, useEffect } from "react";
import { CuboidCollider, RigidBody } from "@react-three/rapier";
import { useTexture } from "@react-three/drei";

import { assetUrl } from "../lib/assetUrl";

export default function Sensor({
  type,
  args,
  sensorArgs,
  option,
  number,
  sensorPosition,
  onSensedChange,
  eraserState,
  resetSensor,
}) {
  const matcap = useTexture(
    assetUrl("matcaps/C7C7D7_4C4E5A_818393_6C6C74.png"),
  );

  const [count, setCount] = useState(0);
  const [bool, setBool] = useState(false);
  const [color, setColor] = useState("gray");
  const [opacity, setOpacity] = useState(0);
  const [colorState, setColorState] = useState(false);
  const [num, setNum] = useState(0);

  useEffect(() => {
    if (type === "number") {
      onSensedChange(option, number, count, sensorPosition, num);
    } else if (type === "boolean") {
      onSensedChange(option, bool);
    } else if (type === "color") {
      onSensedChange(option, number, colorState, eraserState);
      if (colorState == true) {
        setColor("#494949");
        setOpacity(1);
      } else {
        setColor("gray");
        setOpacity(0);
      }
    }
  }, [count, bool, colorState, num]);

  useEffect(() => {
    if (resetSensor == true) {
      setColorState(false);
      setCount(0);
    }
  }, [resetSensor]);

  return (
    <>
      <RigidBody
        name="sensor"
        mass={1}
        type="fixed"
        colliders={false}
        position={sensorPosition}
      >
        <mesh position={[0, 0.1, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={args} />
          <meshBasicMaterial color={"#696870"} transparent opacity={opacity} />
        </mesh>
        <CuboidCollider
          sensor
          args={sensorArgs}
          onIntersectionEnter={(payload) => {
            if (type === "color") {
              if (
                eraserState == false &&
                payload.other.rigidBodyObject.name == "person"
              ) {
                setColorState(true);
              } else if (
                eraserState == true &&
                payload.other.rigidBodyObject.name == "eraser"
              ) {
                setColorState(false);
              } else if (payload.other.rigidBodyObject.name == "eraser") {
                setColorState(false);
              }
            } else {
              if (payload.other.rigidBodyObject.name === "coin") {
                setCount((value) => value + 1);
                setNum(payload.other.rigidBodyObject.num);
              } else if (payload.other.rigidBodyObject.name === "fruit") {
                setBool(true);
              }
            }
          }}
          onIntersectionExit={(payload) => {
            if (payload.other.rigidBodyObject.name === "coin") {
              setCount((value) => value - 1);
            } else if (payload.other.rigidBodyObject.name === "fruit") {
              setBool(false);
            }
          }}
        />
      </RigidBody>

      <mesh
        position={[
          sensorPosition[0] + args[0] / 2 + 0.5,
          sensorPosition[1],
          sensorPosition[2],
        ]}
        rotation={[-Math.PI / 2, 0, 0]}
      >
        {type !== "color" && (
          <>
            <capsuleGeometry args={[0.5, args[1], 4, 8]} />
            <meshMatcapMaterial color={"#909199"} matcap={matcap} opacity={1} />
          </>
        )}
        {type === "color" && (
          <meshMatcapMaterial color={"#909199"} matcap={matcap} opacity={0} />
        )}
      </mesh>
      <mesh
        position={[
          sensorPosition[0] - args[0] / 2 - 0.5,
          sensorPosition[1],
          sensorPosition[2],
        ]}
        rotation={[-Math.PI / 2, 0, 0]}
      >
        {type !== "color" && (
          <>
            <capsuleGeometry args={[0.5, args[1], 4, 8]} />
            <meshMatcapMaterial color={"#909199"} matcap={matcap} opacity={1} />
          </>
        )}
        {type === "color" && (
          <meshMatcapMaterial color={"#909199"} matcap={matcap} opacity={0} />
        )}
      </mesh>
      <mesh
        position={[
          sensorPosition[0],
          sensorPosition[1],
          sensorPosition[2] + args[1] / 2,
        ]}
        rotation={[-Math.PI / 2, 0, -Math.PI / 2]}
      >
        {type !== "color" && (
          <>
            <capsuleGeometry args={[0.5, args[0], 4, 8]} />
            <meshMatcapMaterial color={"#909199"} matcap={matcap} opacity={1} />
          </>
        )}
        {type === "color" && (
          <meshMatcapMaterial color={"#909199"} matcap={matcap} opacity={0} />
        )}
      </mesh>
      <mesh
        position={[
          sensorPosition[0],
          sensorPosition[1],
          sensorPosition[2] - args[1] / 2,
        ]}
        rotation={[-Math.PI / 2, 0, -Math.PI / 2]}
      >
        {type !== "color" && (
          <>
            <capsuleGeometry args={[0.5, args[0], 4, 8]} />
            <meshMatcapMaterial color={"#909199"} matcap={matcap} opacity={1} />
          </>
        )}
        {type === "color" && (
          <meshMatcapMaterial color={"#909199"} matcap={matcap} opacity={0} />
        )}
      </mesh>
    </>
  );
}
