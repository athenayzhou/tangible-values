// key control reference: Minecraft by drcmda
// https://codesandbox.io/p/sandbox/minecraft-vkgi6?file=%2Fsrc%2FPlayer.js%3A24%2C5-24%2C60

import { useRef, useState, useEffect } from "react";
import { Vector3 } from "three";
import { useFrame } from "@react-three/fiber";
import { useKeyboardControls, useCubeTexture } from "@react-three/drei";

import { assetUrl } from "./lib/assetUrl";
import {
  RigidBody,
  BallCollider,
  useAfterPhysicsStep,
} from "@react-three/rapier";

import About from "./Components/About";
import { useCameraRig } from "./context/CameraRigContext";

const MAX_SPEED = 100;
const frontVector = new Vector3();
const sideVector = new Vector3();
const direction = new Vector3();
/** Horizontal velocity smoothing (frame-rate independent) */
const MOVE_SMOOTH = 12;

export default function Person({ position, submissions }) {
  const { onPositionChange, onProximity, onThoughtPosition } = useCameraRig();

  const texture = useCubeTexture(
    ["px.png", "nx.png", "py.png", "ny.png", "pz.png", "nz.png"],
    { path: assetUrl("envmap/") },
  );

  const ref = useRef();
  const [, get] = useKeyboardControls();
  const [aboutPosition, setAboutPosition] = useState([0, 0, 0]);

  useFrame((_, delta) => {
    if (!ref.current) return;

    const d = Math.min(Math.max(delta, 1e-4), 1 / 30);
    const { forward, backward, left, right } = get();
    const velocity = ref.current.linvel();

    frontVector.set(0, 0, Number(backward) - Number(forward));
    sideVector.set(Number(left) - Number(right), 0, 0);
    direction.subVectors(frontVector, sideVector);

    let targetX = 0;
    let targetZ = 0;
    if (direction.lengthSq() > 1e-6) {
      direction.normalize().multiplyScalar(MAX_SPEED);
      targetX = direction.x;
      targetZ = direction.z;
    }

    const t = 1 - Math.exp(-MOVE_SMOOTH * d);
    const nx = velocity.x + (targetX - velocity.x) * t;
    const nz = velocity.z + (targetZ - velocity.z) * t;
    ref.current.setLinvel({ x: nx, y: velocity.y, z: nz });
  });

  useAfterPhysicsStep(() => {
    if (!ref.current) return;
    const tr = ref.current.translation();
    onPositionChange({ x: tr.x, y: tr.y, z: tr.z });
  });

  const handleThoughtPosition = (thoughtPosition) => {
    onThoughtPosition({
      x: thoughtPosition.x,
      y: thoughtPosition.y + 30,
      z: thoughtPosition.z + 20,
    });
  };

  const [complete, setComplete] = useState(false);

  useEffect(() => {
    if (!ref.current) return;
    const pos = ref.current.translation();
    setAboutPosition([pos.x, 0, pos.z - 50]);
    let timeoutId;
    if (submissions && Object.keys(submissions).length > 0) {
      if (Object.values(submissions).every((value) => value === true)) {
        timeoutId = setTimeout(() => {
          setComplete(true);
        }, 10000);
      }
    }
    return () => {
      if (timeoutId != null) clearTimeout(timeoutId);
    };
  }, [submissions]);

  return (
    <>
      <RigidBody
        ref={ref}
        mass={20}
        gravityScale={20}
        type="Dynamic"
        position={position ? position : [0, 100, 150]}
        scale={5}
        colliders="ball"
        canSleep={false}
        name="person"
        linearDamping={0.35}
        angularDamping={4}
        lockRotations
        ccd
      >
        <mesh name="person">
          <sphereGeometry />
          <meshBasicMaterial
            color={"#b4b7bf"}
            envMap={texture}
            reflectivity={1}
          />
        </mesh>
        <BallCollider
          args={[1.1, 1.1, 1.1]}
          sensor
          onIntersectionEnter={(payload) => {
            if (payload.other.rigidBodyObject.name === "thought") {
              onProximity(true);
              handleThoughtPosition(payload.other.rigidBodyObject.position);
            }
          }}
          onIntersectionExit={(payload) => {
            if (payload.other.rigidBodyObject.name === "thought") {
              onProximity(false);
            }
          }}
        />
      </RigidBody>
      {complete && <About position={aboutPosition} />}
    </>
  );
}
