import { useState, useEffect } from "react";
import { RigidBody, CuboidCollider } from "@react-three/rapier";
import { Vector3, Plane } from "three";
import { useTexture, useCubeTexture } from "@react-three/drei";

import Text from "../Text/Text";
import { assetUrl } from "../lib/assetUrl";
import Sensor from "../Interaction/Sensor";
import Submit from "../Decision/Submit";
import Reset from "../Decision/Reset";
import Coin from "../Interaction/Coin";
import Eraser from "../Interaction/Eraser";
import Paper from "../Interaction/Paper";
import Path from "../Components/Path";

export default function Volunteer({ position, sendSubmit }) {
  const matcap = useTexture(
    assetUrl("matcaps/C7C7D7_4C4E5A_818393_6C6C74.png"),
  );
  const texture = useCubeTexture(
    ["px.png", "nx.png", "py.png", "ny.png", "pz.png", "nz.png"],
    { path: assetUrl("envmap/") },
  );

  const floorPlane = new Plane(new Vector3(0, 1, 0), 0);
  const [dragState, setDragState] = useState(false);

  const [oneSensors, setOneSensors] = useState({});
  const [fiveSensors, setFiveSensors] = useState({});
  const [majority, setMajority] = useState("tie");
  const [eraserState, setEraserState] = useState(false);

  const [confedState, setConfedState] = useState(false);
  const [confed, setConfed] = useState([]);
  const [flipState, setFlipState] = useState(false);
  const [payoutText, setPayoutText] = useState("null");
  const [reaction, setReaction] = useState("null");
  const [payoutState, setPayoutState] = useState(false);
  const [payoutPosition, setPayoutPosition] = useState([
    position[0],
    0,
    position[2] + 45,
  ]);
  const [resetSensor, setResetSensor] = useState(false);
  const [resetRefractory, setResetRefractory] = useState(false);
  const [submitRefractory, setSubmitRefractory] = useState(false);
  const [pathState, setPathState] = useState(false);

  const handleHoldChange = (holdState) => {
    setEraserState(holdState);
  };

  const handleSensedChange = (option, number, colorState, eraserState) => {
    if (option == "one") {
      setOneSensors((prevSensors) => ({
        ...prevSensors,
        [number]: colorState,
      }));
    } else if (option == "five") {
      setFiveSensors((prevSensors) => ({
        ...prevSensors,
        [number]: colorState,
      }));
    }
  };

  useEffect(() => {
    const totalOneSensed = Object.values(oneSensors).filter(
      (value) => value === true,
    ).length;
    const totalFiveSensed = Object.values(fiveSensors).filter(
      (value) => value === true,
    ).length;
    const portionOne = totalOneSensed / Object.values(oneSensors).length;
    const portionFive = totalFiveSensed / Object.values(fiveSensors).length;

    if (portionOne > portionFive) {
      setMajority(1);
    } else if (portionOne < portionFive) {
      setMajority(5);
    } else if (portionOne == portionFive) {
      setMajority("tie");
    }
  }, [oneSensors, fiveSensors]);

  const reconcile = () => {
    setFlipState(true);

    setTimeout(() => {
      setConfedState(true);
    }, 1000);

    if (
      majority === 5 &&
      confed[0] === 5 &&
      confed[1] === 5 &&
      confed[2] === 5
    ) {
      // console.log(`Lost: User ${majority}, Confed1 ${confed[0]}, Confed2 ${confed[1]}, Confed3 ${confed[2]}`)
      setPayoutState(false);
      setPayoutText(`try again \nnext time`);
      setPayoutPosition([position[0] - 12, 0, position[2] + 45]);
      setReaction(":/");
    } else {
      // console.log(`Pay Out: User ${majority}, Confed1 ${confed[0]}, Confed2 ${confed[1]}, Confed3 ${confed[2]}`)
      setPayoutText(`win`);
      setPayoutPosition([position[0], 0, position[2] + 45]);
      setReaction(":]");

      setTimeout(() => {
        setPayoutState(true);
        setPathState(true);
      }, 3500);
    }

    setTimeout(() => {
      setResetRefractory(false);
    }, 6000);
  };

  const renderCoins = (amount, position) => {
    const coinCount = typeof amount === "number" ? amount : 0;
    const coinArray = Array.from({ length: coinCount }, (_, index) => index);

    return coinArray.map((index) => (
      <Coin
        key={index}
        position={[position[0], (index + 1) * 3, position[2]]}
      />
    ));
  };

  useEffect(() => {
    if (confed.length > 0) {
      reconcile();
      setResetSensor(false);

      setResetRefractory(true);
      setSubmitRefractory(true);
    }
  }, [confed]);

  const handleReset = () => {
    setConfed([]);
    setConfedState(false);
    setFlipState(false);
    setPayoutState(false);
    setResetSensor(true);
    setPathState(false);

    setSubmitRefractory(false);
  };

  return (
    <>
      <RigidBody
        name="volunteer"
        mass={1}
        type="fixed"
        colliders="cuboid"
        position={[position[0] - 20, 1, position[2] - 100]}
      >
        <mesh position={[0, 0, 0]} rotation={[-Math.PI / 2, 0, 0]}></mesh>
      </RigidBody>

      <RigidBody mass={1} type="fixed" colliders="cuboid">
        <mesh
          position={[position[0] + 45, 10, position[2] + 45]}
          rotation={[0, -5, 0]}
        >
          <octahedronGeometry args={[8]} />
          <meshBasicMaterial
            color={"lightgray"}
            envMap={texture}
            reflectivity={1}
          />
        </mesh>
      </RigidBody>

      <RigidBody mass={1} type="fixed" colliders="cuboid">
        <mesh
          position={[position[0] - 45, 10, position[2] + 45]}
          rotation={[0, 5, 0]}
        >
          <octahedronGeometry args={[8]} />
          <meshBasicMaterial
            color={"lightgray"}
            envMap={texture}
            reflectivity={1}
          />
        </mesh>
      </RigidBody>

      <Paper
        paperPosition={[position[0] - 30, 0, position[2] + 45]}
        paperRotation={[0, 4.8, 0]}
        textPosition={[-19, 0, 2.5]}
        textRotation={[Math.PI / 2, 0, Math.PI]}
        text={confed[0]}
        confedState={confedState}
        flipState={flipState}
      />
      <Paper
        paperPosition={[position[0], 0, position[2] + 22]}
        paperRotation={[0, 0, 0]}
        textPosition={[-19, 0, -2.5]}
        textRotation={[-Math.PI / 2, 0, Math.PI]}
        text={confed[1]}
        confedState={confedState}
        flipState={flipState}
      />
      <Paper
        paperPosition={[position[0] + 30, 0, position[2] + 45]}
        paperRotation={[0, -5.25, 0]}
        textPosition={[19, 0, 2.5]}
        textRotation={[-Math.PI / 2, 0, 0]}
        text={confed[2]}
        confedState={confedState}
        flipState={flipState}
      />
      <Paper
        paperPosition={[position[0], 0, position[2] + 65]}
        paperRotation={[0, 0, 0]}
        textPosition={[3.5, 0, 2.5]}
        textRotation={[-Math.PI / 2, 0, 0]}
        text={majority}
        confedState={confedState}
        flipState={flipState}
      />

      {payoutState &&
        renderCoins(majority, [position[0], 20, position[2] + 65])}
      {payoutState &&
        renderCoins(confed[0], [position[0] - 30, 0, position[2] + 45])}
      {payoutState &&
        renderCoins(confed[1], [position[0], 0, position[2] + 22])}
      {payoutState &&
        renderCoins(confed[2], [position[0] + 30, 0, position[2] + 45])}

      <Text
        text={payoutText}
        state={flipState}
        position={payoutPosition}
        rotation={[-Math.PI * 0.5, 0, 0]}
      />
      <Text
        text={reaction}
        position={[position[0] - 1.5, 15, position[2] + 7]}
        rotation={[-Math.PI * 0.2, 0, -Math.PI / 2]}
        state={false}
        scale={3}
      />

      <Eraser
        position={[position[0], 15, position[2] + 85]}
        onHoldChange={handleHoldChange}
      />

      <Text
        text={`${majority}`}
        state={true}
        position={[position[0], 15, position[2] + 120]}
      />
      <Text
        text={"or"}
        state={true}
        position={[position[0], 0, position[2] + 120]}
        rotation={[-Math.PI * 0.5, 0, 0]}
      />
      <Text
        text={"$"}
        state={true}
        position={[position[0] - 28, 0, position[2] + 110]}
        rotation={[-Math.PI * 0.5, 0, 0]}
      />
      <Text
        text={"$"}
        state={true}
        position={[position[0] + 12, 0, position[2] + 110]}
        rotation={[-Math.PI * 0.5, 0, 0]}
      />

      <Submit
        position={[position[0], 0, position[2] + 180]}
        valid={majority !== "tie"}
        decisionType={"volunteer"}
        decisionValue={majority}
        refractory={submitRefractory}
        onSubmit={(randomAssignment) => {
          setConfed([
            randomAssignment[0],
            randomAssignment[1],
            randomAssignment[2],
          ]);
        }}
        errorPosition={[position[0] + 30, 1, position[2] - 5]}
        sendSubmit={sendSubmit}
      />
      {/* <Reset position={[position[0], 0, position[2]-100]} onReset={handleReset} refractory = {resetRefractory} /> */}

      <Path
        position={[position[0] + 1400, position[1], position[2] + 1100]}
        i={-1}
        rotation={[0, Math.PI * 0.75, 0]}
        state={pathState}
      />

      <Sensor
        type="color"
        args={[7, 7]}
        sensorArgs={[3.5, 4, 3.5]}
        option="one"
        number={0}
        sensorPosition={[position[0] - 20, 0, position[2] + 110]}
        onSensedChange={handleSensedChange}
        eraserState={eraserState}
        resetSensor={resetSensor}
      />
      <Sensor
        type="color"
        args={[7, 7]}
        sensorArgs={[3.5, 4, 3.5]}
        option="one"
        number={1}
        sensorPosition={[position[0] - 20, 0, position[2] + 117]}
        onSensedChange={handleSensedChange}
        eraserState={eraserState}
        resetSensor={resetSensor}
      />
      <Sensor
        type="color"
        args={[7, 7]}
        sensorArgs={[3.5, 4, 3.5]}
        option="one"
        number={2}
        sensorPosition={[position[0] - 20, 0, position[2] + 124]}
        onSensedChange={handleSensedChange}
        eraserState={eraserState}
        resetSensor={resetSensor}
      />
      <Sensor
        type="color"
        args={[7, 7]}
        sensorArgs={[3.5, 4, 3.5]}
        option="one"
        number={3}
        sensorPosition={[position[0] - 20, 0, position[2] + 131]}
        onSensedChange={handleSensedChange}
        eraserState={eraserState}
        resetSensor={resetSensor}
      />
      <Sensor
        type="color"
        args={[7, 7]}
        sensorArgs={[3.5, 4, 3.5]}
        option="one"
        number={4}
        sensorPosition={[position[0] - 20, 0, position[2] + 138]}
        onSensedChange={handleSensedChange}
        eraserState={eraserState}
        resetSensor={resetSensor}
      />

      <Sensor
        type="color"
        args={[7, 7]}
        sensorArgs={[3.5, 4, 3.5]}
        option="five"
        number={0}
        sensorPosition={[position[0] + 20, 0, position[2] + 110]}
        onSensedChange={handleSensedChange}
        eraserState={eraserState}
        resetSensor={resetSensor}
      />
      <Sensor
        type="color"
        args={[7, 7]}
        sensorArgs={[3.5, 4, 3.5]}
        option="five"
        number={1}
        sensorPosition={[position[0] + 20, 0, position[2] + 117]}
        onSensedChange={handleSensedChange}
        eraserState={eraserState}
        resetSensor={resetSensor}
      />
      <Sensor
        type="color"
        args={[7, 7]}
        sensorArgs={[3.5, 4, 3.5]}
        option="five"
        number={2}
        sensorPosition={[position[0] + 20, 0, position[2] + 124]}
        onSensedChange={handleSensedChange}
        eraserState={eraserState}
        resetSensor={resetSensor}
      />
      <Sensor
        type="color"
        args={[7, 7]}
        sensorArgs={[3.5, 4, 3.5]}
        option="five"
        number={3}
        sensorPosition={[position[0] + 27, 0, position[2] + 110]}
        onSensedChange={handleSensedChange}
        eraserState={eraserState}
        resetSensor={resetSensor}
      />
      <Sensor
        type="color"
        args={[7, 7]}
        sensorArgs={[3.5, 4, 3.5]}
        option="five"
        number={4}
        sensorPosition={[position[0] + 27, 0, position[2] + 124]}
        onSensedChange={handleSensedChange}
        eraserState={eraserState}
        resetSensor={resetSensor}
      />
      <Sensor
        type="color"
        args={[7, 7]}
        sensorArgs={[3.5, 4, 3.5]}
        option="five"
        number={5}
        sensorPosition={[position[0] + 27, 0, position[2] + 131]}
        onSensedChange={handleSensedChange}
        eraserState={eraserState}
        resetSensor={resetSensor}
      />
      <Sensor
        type="color"
        args={[7, 7]}
        sensorArgs={[3.5, 4, 3.5]}
        option="five"
        number={6}
        sensorPosition={[position[0] + 27, 0, position[2] + 138]}
        onSensedChange={handleSensedChange}
        eraserState={eraserState}
        resetSensor={resetSensor}
      />
      <Sensor
        type="color"
        args={[7, 7]}
        sensorArgs={[3.5, 4, 3.5]}
        option="five"
        number={7}
        sensorPosition={[position[0] + 20, 0, position[2] + 138]}
        onSensedChange={handleSensedChange}
        eraserState={eraserState}
        resetSensor={resetSensor}
      />

      <mesh
        position={[position[0] - 24, 0.5, position[2] + 124]}
        rotation={[-Math.PI / 2, 0, 0]}
      >
        <capsuleGeometry args={[0.5, 34, 4, 8]} />
        <meshMatcapMaterial color={"darkgray"} matcap={matcap} />
      </mesh>
      <mesh
        position={[position[0] - 16, 0.5, position[2] + 124]}
        rotation={[-Math.PI / 2, 0, 0]}
      >
        <capsuleGeometry args={[0.5, 34, 4, 8]} />
        <meshMatcapMaterial color={"darkgray"} matcap={matcap} />
      </mesh>
      <mesh
        position={[position[0] - 20, 0.5, position[2] + 107]}
        rotation={[-Math.PI / 2, 0, -Math.PI / 2]}
      >
        <capsuleGeometry args={[0.5, 8, 4, 8]} />
        <meshMatcapMaterial color={"darkgray"} matcap={matcap} />
      </mesh>
      <mesh
        position={[position[0] - 20, 0.5, position[2] + 141]}
        rotation={[-Math.PI / 2, 0, -Math.PI / 2]}
      >
        <capsuleGeometry args={[0.5, 8, 4, 8]} />
        <meshMatcapMaterial color={"darkgray"} matcap={matcap} />
      </mesh>

      <mesh
        position={[position[0] + 17, 0.5, position[2] + 117]}
        rotation={[-Math.PI / 2, 0, 0]}
      >
        <capsuleGeometry args={[0.5, 20, 4, 8]} />
        <meshMatcapMaterial color={"darkgray"} matcap={matcap} />
      </mesh>
      <mesh
        position={[position[0] + 17, 0.5, position[2] + 138]}
        rotation={[-Math.PI / 2, 0, 0]}
      >
        <capsuleGeometry args={[0.5, 7, 4, 8]} />
        <meshMatcapMaterial color={"darkgray"} matcap={matcap} />
      </mesh>
      <mesh
        position={[position[0] + 30, 0.5, position[2] + 110]}
        rotation={[-Math.PI / 2, 0, 0]}
      >
        <capsuleGeometry args={[0.5, 7, 4, 8]} />
        <meshMatcapMaterial color={"darkgray"} matcap={matcap} />
      </mesh>
      <mesh
        position={[position[0] + 30, 0.5, position[2] + 131]}
        rotation={[-Math.PI / 2, 0, 0]}
      >
        <capsuleGeometry args={[0.5, 20, 4, 8]} />
        <meshMatcapMaterial color={"darkgray"} matcap={matcap} />
      </mesh>
      <mesh
        position={[position[0] + 23, 0.5, position[2] + 131]}
        rotation={[-Math.PI / 2, 0, 0]}
      >
        <capsuleGeometry args={[0.5, 7, 4, 8]} />
        <meshMatcapMaterial color={"darkgray"} matcap={matcap} />
      </mesh>
      <mesh
        position={[position[0] + 24, 0.5, position[2] + 117]}
        rotation={[-Math.PI / 2, 0, 0]}
      >
        <capsuleGeometry args={[0.5, 7, 4, 8]} />
        <meshMatcapMaterial color={"darkgray"} matcap={matcap} />
      </mesh>

      <mesh
        position={[position[0] + 23.5, 0.5, position[2] + 106.5]}
        rotation={[-Math.PI / 2, 0, -Math.PI / 2]}
      >
        <capsuleGeometry args={[0.5, 13, 4, 8]} />
        <meshMatcapMaterial color={"darkgray"} matcap={matcap} />
      </mesh>
      <mesh
        position={[position[0] + 27, 0.5, position[2] + 113.5]}
        rotation={[-Math.PI / 2, 0, -Math.PI / 2]}
      >
        <capsuleGeometry args={[0.5, 6, 4, 8]} />
        <meshMatcapMaterial color={"darkgray"} matcap={matcap} />
      </mesh>
      <mesh
        position={[position[0] + 27, 0.5, position[2] + 121]}
        rotation={[-Math.PI / 2, 0, -Math.PI / 2]}
      >
        <capsuleGeometry args={[0.5, 6, 4, 8]} />
        <meshMatcapMaterial color={"darkgray"} matcap={matcap} />
      </mesh>
      <mesh
        position={[position[0] + 20, 0.5, position[2] + 127]}
        rotation={[-Math.PI / 2, 0, -Math.PI / 2]}
      >
        <capsuleGeometry args={[0.5, 6, 4, 8]} />
        <meshMatcapMaterial color={"darkgray"} matcap={matcap} />
      </mesh>
      <mesh
        position={[position[0] + 20, 0.5, position[2] + 134.5]}
        rotation={[-Math.PI / 2, 0, -Math.PI / 2]}
      >
        <capsuleGeometry args={[0.5, 6, 4, 8]} />
        <meshMatcapMaterial color={"darkgray"} matcap={matcap} />
      </mesh>
      <mesh
        position={[position[0] + 23.5, 0.5, position[2] + 141.5]}
        rotation={[-Math.PI / 2, 0, -Math.PI / 2]}
      >
        <capsuleGeometry args={[0.5, 13, 4, 8]} />
        <meshMatcapMaterial color={"darkgray"} matcap={matcap} />
      </mesh>
    </>
  );
}
