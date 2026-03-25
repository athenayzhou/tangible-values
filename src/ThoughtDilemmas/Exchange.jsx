import { useState, useRef, useEffect } from "react";
import { CuboidCollider, RigidBody } from "@react-three/rapier";
import { useGLTF } from "@react-three/drei";

import { assetUrl } from "../lib/assetUrl";
import gsap from "gsap";
import { MeshTransmissionMaterial } from "@react-three/drei";

import Text from "../Text/Text";
import Sensor from "../Interaction/Sensor";
import Submit from "../Decision/Submit";
import Reset from "../Decision/Reset";
import Wall from "../Interaction/Wall";
import Path from "../Components/Path";

export default function Exchange({ position, sendSubmit }) {
  const { nodes: appleNodes } = useGLTF(assetUrl("models/apple.glb"));
  const { nodes: orangeNodes } = useGLTF(assetUrl("models/orange.glb"));

  const [deceive, setDeceive] = useState(false);
  const [exchange, setExchange] = useState(false);

  const [confed, setConfed] = useState(null);
  const [confedState, setConfedState] = useState(false);
  const [confedText, setConfedText] = useState("null");
  const [confedText1, setConfedText1] = useState("n");
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
  const [resetPos, setResetPos] = useState(false);
  const [resetRefractory, setResetRefractory] = useState(false);
  const [submitRefractory, setSubmitRefractory] = useState(false);
  const [pathState, setPathState] = useState(false);

  const handleSensedChange = (option, bool) => {
    if (option == "deceive") {
      setDeceive(bool);
    } else if (option == "exchange") {
      setExchange(bool);
    }
  };

  useEffect(() => {
    if (resetPos == true) {
      const tl = gsap.timeline();
      tl.to(confedFruit.current.parent.position, {
        x: position[0] + 50,
        z: position[2] + 15,
        duration: 7,
        ease: "power2.inOut",
        onUpdate: () => {
          setConfedFruitPos([...confedFruit.current.parent.position]);
        },
      });
      tl.to(
        userFruit.current.parent.position,
        {
          x: position[0] - 30,
          z: position[2] + 125,
          duration: 6,
          ease: "power2.inOut",
          onUpdate: () => {
            setUserFruitPos([...userFruit.current.parent.position]);
          },
        },
        "<",
      );
      setResetPos(false);
    }
  }, [resetPos]);

  useEffect(() => {
    if (payoutState == true) {
      if (confed == true) {
        const tl = gsap.timeline();
        tl.to(confedFruit.current.parent.position, {
          x: position[0] - 70,
          z: position[2] + 140,
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
          x: position[0] + 50,
          z: position[2] + 45,
          duration: 5,
          ease: "power2.inOut",
          onUpdate: () => {
            setUserFruitPos([...userFruit.current.parent.position]);
            // setUserFruitPos(userFruit.current.parent.position);
          },
        });
      }
    }
  }, [payoutState]);

  useEffect(() => {
    if (confed == true) {
      const tl = gsap.timeline();
      tl.to(confedFruit.current.parent.position, {
        x: position[0],
        z: position[2] + 50,
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
        x: position[0] + 65,
        z: position[2] + 95,
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
  }, [confed, position]);

  const reconcile = () => {
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
      setConfedText1("O");
      setConfedTextPosition([position[0] - 7, 15, position[2] + 50]);
    } else {
      setConfedText("deceive");
      setConfedText1("X");
      setConfedTextPosition([position[0] - 6, 15, position[2] + 50]);
    }

    setTimeout(() => {
      setPayoutState(true);
    }, 4000);

    setTimeout(() => {
      setResetRefractory(false);
      setPathState(true);
    }, 10000);
  };

  useEffect(() => {
    // console.log(confed)
    if (confed !== null) {
      reconcile();
      setResetRefractory(true);
      setSubmitRefractory(true);
    }
  }, [confed]);

  const handleReset = () => {
    setConfed(null);
    setConfedState(false);
    setPayoutState(false);
    setResetPos(true);

    setPathState(false);
    setSubmitRefractory(false);
  };

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
      />
      {/* <Reset position={[position[0], 0, position[2]-100]} onReset={handleReset} refractory={resetRefractory} /> */}

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
        mass={800}
        gravityScale={800}
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
