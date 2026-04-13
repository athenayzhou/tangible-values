import React, { useState } from "react";
import { RigidBody, CapsuleCollider } from "@react-three/rapier";
import Text from "./Components/Text/Text";
import { Float } from "@react-three/drei";
import { formatAggregate } from "./lib/aggregateDisplay";

export default function Portal({
  id,
  position,
  onEnter,
  submissions,
  onProximityChange,
  aggregate,
  aggregateLoading = false,
}) {
  const [near, setNear] = useState(false);

  const getAggregate = () => {
    if(id === "exit") {
      return "step through to return"
    }
    if(aggregateLoading) {
      return "COMMUNITY: loading..";
    }
    
    const formatted = formatAggregate(id, aggregate);
    if (formatted) {
      return `COMMUNITY: ${formatted}`;
    }

    const hasEnv =
      import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY;
    return hasEnv
      ? "COMMUNITY: no data yet"
      : "set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY";
  };

  return (
    <>
      <RigidBody
        name="portal"
        mass={1}
        type="fixed"
        position={[position[0], position[1], position[2] + 40]}
        colliders={false}
      >
            <Float
              speed={1}
              rotationIntensity={0}
              floatIntensity={2}
              floatingRange={[-1, 1]}
            >
              <mesh position={[0, 6, 0]}>
                <octahedronGeometry args={[8]} />
                <meshBasicMaterial color={"#878787"} />
              </mesh>
              <mesh position={[0, 0, 0]} rotation={[-Math.PI / 2, 0, 0]}>
                <ringGeometry args={[30, 28, 64]} />
                <meshBasicMaterial color="#4488ff" transparent opacity={0.7} />
              </mesh>
            </Float>
            <CapsuleCollider
              args={[5, 70, 5]}
              sensor
              position={[0, 0, 40]}
              onIntersectionEnter={(payload) => {
                if(payload.other.rigidBodyObject?.name === "person"){
                  setNear(true);
                  onProximityChange?.(id, true);
                }
              }}
              onIntersectionExit={(payload) => {
                if(payload.other.rigidBodyObject?.name === "person"){
                  setNear(false);
                  onProximityChange?.(id, false)
                }
              }}
            />
            <CapsuleCollider
              args={[5, 30, 5]}
              sensor
              position={[0, 0, 0]}
              onIntersectionEnter={(payload) => {
                if(payload.other.rigidBodyObject?.name === "person") {
                  onEnter(id);
                }
              }}
            />
          </RigidBody>
          <mesh
            position={[position[0], position[1] - 4.8, position[2] + 80]}
            rotation={[-Math.PI / 2, 0, 0]}
          >
            <ringGeometry args={[68, 72, 64, 1]} />
            <meshBasicMaterial color="#ffffff" />
          </mesh>

      {near && (
        <Text
          text={getAggregate()}
          state={true}
          position={[position[0], position[1] + 55, position[2] + 40]}
          scale={[1.8, 1.8, 1.8]}
          rotation={[-Math.PI * 0.1, 0, 0]}
        />
      )}
    </>
  )

}