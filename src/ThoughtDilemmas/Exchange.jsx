import { useState, useRef, useEffect, useCallback } from "react";
import { CuboidCollider, RigidBody } from "@react-three/rapier";
import { useGLTF } from "@react-three/drei";

import { assetUrl } from "../lib/assetUrl";
import gsap from "gsap";

import Text from "../Components/Text/Text";
import Sensor from "../Components/Interaction/Sensor";
import Submit from "../Components/Decision/Submit";
import Wall from "../Components/Interaction/Wall";
import Path from "../Components/World/Path";
import { useTimedStages } from "../hooks/useTimedStages";

export default function Exchange({ position, sendSubmit, communityAggregate }) {
  const { schedule } = useTimedStages();
  const { nodes: appleNodes } = useGLTF(assetUrl("models/apple.glb"));
  const { nodes: orangeNodes } = useGLTF(assetUrl("models/orange.glb"));

  const [deceive, setDeceive] = useState(false);
  const [exchange, setExchange] = useState(false);

  const [confed, setConfed] = useState(null);
  const [confedState, setConfedState] = useState(false);
  const [confedText, setConfedText] = useState("null");
  const [confedTextPosition, setConfedTextPosition] = useState([
    position[0],
    15,
    position[2] + 50,
  ]);

  const userFruit = useRef();
  const [userFruitPos, setUserFruitPos] = useState([
    position[0] - 30,
    5,
    position[2] + 125,
  ]);
  const confedFruit = useRef();
  const [confedFruitPos, setConfedFruitPos] = useState([
    position[0] + 50,
    1,
    position[2] + 25,
  ]);
  const [confedFruitRo, setConfedFruitRo] = useState([0, -Math.PI * 0.1, 0]);

  const [payoutState, setPayoutState] = useState(false);
  const [reaction, setReaction] = useState("null");
  const [submitRefractory, setSubmitRefractory] = useState(false);
  const [pathState, setPathState] = useState(false);
  const posX = position[0];
  const posZ = position[2];

  const handleSensedChange = (option, bool) => {
    if (option == "deceive") {
      setDeceive(bool);
    } else if (option == "exchange") {
      setExchange(bool);
    }
  };

  useEffect(() => {
    if (payoutState == true) {
      if (confed == true) {
        const tl = gsap.timeline();
        tl.to(confedFruit.current.parent.position, {
          x: posX - 70,
          z: posZ + 140,
          duration: 5,
          ease: "power2.inOut",
          onUpdate: () => {
            setConfedFruitPos([...confedFruit.current.parent.position]);
            // setConfedFruitPos(confedFruit.current.parent.position);
          },
        });
      }
      if (exchange == true) {
        const tl = gsap.timeline();
        tl.to(userFruit.current.parent.position, {
          x: posX + 50,
          z: posZ + 45,
          duration: 5,
          ease: "power2.inOut",
          onUpdate: () => {
            setUserFruitPos([...userFruit.current.parent.position]);
            // setUserFruitPos(userFruit.current.parent.position);
          },
        });
      }
    }
  }, [payoutState, confed, exchange, posX, posZ]);

  useEffect(() => {
    if (confed == true) {
      const tl = gsap.timeline();
      tl.to(confedFruit.current.parent.position, {
        x: posX,
        z: posZ + 50,
        duration: 5,
        ease: "power2.inOut",
        onUpdate: () => {
          setConfedFruitPos([...confedFruit.current.parent.position]);
          // setConfedFruitPos(confedFruit.current.parent.position);
        },
      });
      tl.to(
        confedFruit.current.parent.rotation,
        {
          y: 0,
          duration: 1,
          ease: "power2.inOut",
          onUpdate: () => {
            setConfedFruitRo([...confedFruit.current.parent.rotation]);
            // setConfedFruitRo(confedFruit.current.parent.rotation);
          },
        },
        ">-2",
      );
    } else if (confed == false) {
      const tl = gsap.timeline();
      tl.to(confedFruit.current.parent.position, {
        x: posX + 65,
        z: posZ + 95,
        duration: 5,
        ease: "power2.inOut",
        onUpdate: () => {
          setConfedFruitPos([...confedFruit.current.parent.position]);
          // setConfedFruitPos(confedFruit.current.parent.position);
        },
      });
      tl.to(
        confedFruit.current.parent.rotation,
        {
          y: -Math.PI * 0.3,
          duration: 1,
          ease: "power2.inOut",
          onUpdate: () => {
            setConfedFruitRo([...confedFruit.current.parent.rotation]);
            // setConfedFruitRo(confedFruit.current.parent.rotation);
          },
        },
        ">-2",
      );
    }
  }, [confed, posX, posZ]);

  const reconcile = useCallback(() => {
    setConfedState(true);

    if (confed == true && exchange == true) {
      // console.log(`equal trade: confed ${confed}, user ${exchange}`)
      setReaction(":>");
    } else if (
      (confed == true && deceive == true) ||
      (confed == false && exchange == true)
    ) {
      // console.log(`unequal trade: confed ${confed}, user ${exchange}`)
      if (confed == true && deceive == true) {
        setReaction(":<");
      } else {
        setReaction(":}");
      }
    } else if (confed == false && deceive == true) {
      // console.log(`no trade: confed ${confed}, user ${exchange}`)
      setReaction(":{");
    }

    if (confed == true) {
      setConfedText("trade");
      setConfedTextPosition([posX - 7, 15, posZ + 50]);
    } else {
      setConfedText("deceive");
      setConfedTextPosition([posX - 6, 15, posZ + 50]);
    }

    schedule(4000, () => setPayoutState(true));
    schedule(10000, () => setPathState(true));
  }, [confed, exchange, deceive, posX, posZ, schedule]);

  useEffect(() => {
    // console.log(confed)
    if (confed !== null) {
      reconcile();
      setSubmitRefractory(true);
    }
  }, [confed, reconcile]);

  return (
    <>
      <Text
        text={`you`}
        state={true}
        position={[position[0] - 60, 0, position[2] + 70]}
        rotation={[-Math.PI / 2, 0, 0]}
      />
      <Text
        text={`trader`}
        state={true}
        position={[position[0], 0, position[2] + 70]}
        rotation={[-Math.PI / 2, 0, 0]}
      />
      <Text
        text={`<-->`}
        state={true}
        position={[position[0] - 30, 0, position[2] + 50]}
        rotation={[-Math.PI / 2, 0, 0]}
      />
      <Text
        text={`trade`}
        state={exchange}
        position={[position[0] - 60, 15, position[2] + 50]}
      />
      <Text
        text={`deceive`}
        state={deceive}
        position={[position[0] - 60, 15, position[2] + 190]}
      />
      <Text
        text={`${confedText}`}
        state={confedState}
        position={confedTextPosition}
      />
      <Text
        text={reaction}
        position={[position[0] - 2, 15, position[2] + 7]}
        rotation={[-Math.PI * 0.2, 0, -Math.PI / 2]}
        scale={3}
        state={false}
      />

      <Submit
        position={[position[0] - 30, 0, position[2] + 80]}
        valid={deceive || exchange}
        decisionType={"exchange"}
        decisionValue={exchange}
        refractory={submitRefractory}
        onSubmit={(randomAssignment) => {
          setConfed(randomAssignment);
        }}
        errorPosition={[position[0] - 53, 1, position[2] + 100]}
        sendSubmit={sendSubmit}
        communityAggregate={communityAggregate}
      />

      <Sensor
        type="boolean"
        args={[38, 20]}
        sensorArgs={[20, 5, 9]}
        option="deceive"
        sensorPosition={[position[0] - 60, 0.5, position[2] + 192]}
        onSensedChange={handleSensedChange}
      />
      <Sensor
        type="boolean"
        args={[30, 20]}
        sensorArgs={[13, 5, 9]}
        option="exchange"
        sensorPosition={[position[0] - 60, 0.5, position[2] + 50]}
        onSensedChange={handleSensedChange}
      />
      <Sensor
        type="boolean"
        args={[30, 20]}
        sensorArgs={[13, 5, 9]}
        option="confed"
        sensorPosition={[position[0], 0.5, position[2] + 50]}
        onSensedChange={handleSensedChange}
      />

      <RigidBody
        name="fruit"
        mass={80}
        gravityScale={100}
        type="dynamic"
        colliders={false}
        position={userFruitPos}
        canSleep={false}
        lockRotations={true}
        visible={true}
      >
        <mesh
          ref={userFruit}
          geometry={appleNodes.apple_apple_u1_v1_0.geometry}
          position={[-1, -5.5, 0]}
          scale={0.5}
        >
          {/* <MeshTransmissionMaterial resolution={1024} distortion={0.25} color="#494949" thickness={10} anisotropy={1} /> */}
          {/* <meshStandardMaterial color="#97989d" transparent opacity={0.7}/> */}
          <meshBasicMaterial color="#44454c" />
        </mesh>
        <CuboidCollider args={[5, 5, 5]} />
      </RigidBody>

      <RigidBody
        name="confedFruit"
        mass={800}
        gravityScale={800}
        type="dynamic"
        colliders={false}
        position={confedFruitPos}
        rotation={confedFruitRo}
        canSleep={false}
        visible={true}
      >
        <mesh
          ref={confedFruit}
          geometry={orangeNodes.Object_2.geometry}
          position={[0, -6, 0]}
          rotation={[-Math.PI / 2, 0, 0]}
          scale={140}
        >
          <meshBasicMaterial color="#44454c" />
          {/* <meshStandardMaterial color="#97989d" transparent opacity={0.7}/> */}
          {/* <MeshTransmissionMaterial resolution={1024} distortion={0.25} color="#a9a9a9" thickness={10} anisotropy={1} /> */}
        </mesh>
        <CuboidCollider args={[5, 5, 5]} />
      </RigidBody>

      <Wall
        position={[position[0] - 60, 5, position[2] + 180]}
        rotation={[0, 0, 0]}
      />
      <Wall
        position={[position[0] + 60, 5, position[2] + 100]}
        rotation={[0, -Math.PI * 0.3, 0]}
      />

      <Path
        position={[position[0] - 800, position[1], position[2] + 300]}
        i={-1}
        rotation={[0, -Math.PI * 0.2, 0]}
        state={pathState}
      />
      <Path
        position={[position[0] - 775, position[1], position[2] + 500]}
        i={1}
        rotation={[0, -Math.PI * 0.2, 0]}
        state={pathState}
      />

      <Path
        position={[position[0] + 775, position[1], position[2] + 300]}
        i={1}
        rotation={[0, Math.PI * 0.2, 0]}
        state={pathState}
      />
      <Path
        position={[position[0] + 750, position[1], position[2] + 500]}
        i={-1}
        rotation={[0, Math.PI * 0.2, 0]}
        state={pathState}
      />
    </>
  );
}
