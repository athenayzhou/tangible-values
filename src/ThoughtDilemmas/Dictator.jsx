import { useState } from "react";
import { Vector3, Plane } from "three";
import { RigidBody, CapsuleCollider } from "@react-three/rapier";

import DragObj from "../Components/Interaction/DragObj";
import Sensor from "../Components/Interaction/Sensor";
import Text from "../Components/Text/Text";
import Submit from "../Components/Decision/Submit";
import { dictatorAggregate } from "../lib/aggregateDisplay";

function CoinMult({ position, setDragState, floorPlane }) {
  return (
    <>
      <DragObj
        name="coin"
        startPosition={[position[0] - 10, 1, position[2] + 0]}
        state={setDragState}
        plane={floorPlane}
        lift={10}
      />
      <DragObj
        name="coin"
        startPosition={[position[0] - 5, 1, position[2] + 0]}
        state={setDragState}
        plane={floorPlane}
        lift={10}
      />
      <DragObj
        name="coin"
        startPosition={[position[0] - 0, 1, position[2] - 15]}
        state={setDragState}
        plane={floorPlane}
        lift={10}
      />
      <DragObj
        name="coin"
        startPosition={[position[0] + 5, 1, position[2] - 12]}
        state={setDragState}
        plane={floorPlane}
        lift={10}
      />
      <DragObj
        name="coin"
        startPosition={[position[0] - 0, 1, position[2] - 5]}
        state={setDragState}
        plane={floorPlane}
        lift={10}
      />
      <DragObj
        name="coin"
        startPosition={[position[0] + 5, 1, position[2] + 0]}
        state={setDragState}
        plane={floorPlane}
        lift={10}
      />
      <DragObj
        name="coin"
        startPosition={[position[0] - 10, 1, position[2] - 9]}
        state={setDragState}
        plane={floorPlane}
        lift={10}
      />
      <DragObj
        name="coin"
        startPosition={[position[0] - 5, 1, position[2] - 11]}
        state={setDragState}
        plane={floorPlane}
        lift={10}
      />
      <DragObj
        name="coin"
        startPosition={[position[0] + 10, 1, position[2] + 4]}
        state={setDragState}
        plane={floorPlane}
        lift={10}
      />
      <DragObj
        name="coin"
        startPosition={[position[0] - 0, 1, position[2] + 5]}
        state={setDragState}
        plane={floorPlane}
        lift={10}
      />
    </>
  );
}

export default function Dictator({
  position,
  sendSubmit,
  aggregate,
  aggregateLoading = false,
  aggregateRefresh,
  dictatorLocked,
  dictatorSubmitted = false,
  dictatorDecision,
}) {
  const floorPlane = new Plane(new Vector3(0, 1, 0), 0);
  const [, setDragState] = useState(false);
  const [dictator, setDictator] = useState(0);
  const [reciever, setReciever] = useState(0);
  const [showAggregate, setShowAggregate] = useState(false);

  const receiverCoins = Number(dictatorDecision);
  const keptAmount =
    dictatorSubmitted &&
    dictatorDecision != null &&
    Number.isFinite(receiverCoins)
      ? Math.max(0, 10 - receiverCoins)
      : null;

  const communityAggregate = aggregateLoading
    ? "COMMUNITY: loading…"
    : (dictatorAggregate(aggregate) ?? "COMMUNITY: no data yet");

  const handleSensedChange = (option, number, count) => {
    if (option == "dictator") {
      setDictator(count);
    } else if (option == "reciever") {
      setReciever(count);
    }
  };

  return (
    <>
      <RigidBody
        type="fixed"
        colliders={false}
        position={[position[0], position[1] + 18, position[2] + 55]}
      >
        <CapsuleCollider
          args={[5, 200, 5]}
          sensor
          position={[0, 0, 85]}
          onIntersectionEnter={(payload) => {
            if (payload.other.rigidBodyObject.children[0].name == "person") {
              aggregateRefresh?.();
              setShowAggregate(true);
            }
          }}
          onIntersectionExit={(payload) => {
            if (payload.other.rigidBodyObject.children[0].name == "person") {
              setShowAggregate(false);
            }
          }}
        />
      </RigidBody>

      <Text
        text={`${dictator}`}
        state={true}
        position={[position[0] - 50, 10, position[2] + 85]}
      />
      <Text
        text={`${reciever}`}
        state={true}
        position={[position[0] + 50, 10, position[2] + 85]}
      />
      <Text
        text={communityAggregate}
        state={showAggregate}
        position={[position[0], 12, position[2] + 15]}
        rotation={[0, 0, 0]}
        scale={[2, 2, 2]}
      />
      {keptAmount != null && (
        <Text
          text={`YOU: kept ${keptAmount} coins`}
          state={true}
          position={[position[0], 18, position[2] + 15]}
          rotation={[0, 0, 0]}
          scale={[2, 2, 2]}
        />
      )}
      
      <Text
        text={`dictator`}
        state={true}
        position={[position[0] - 50, 0, position[2] + 120]}
        rotation={[-Math.PI / 2, 0, 0]}
      />
      <Text
        text={`reciever`}
        state={true}
        position={[position[0] + 50, 0, position[2] + 120]}
        rotation={[-Math.PI / 2, 0, 0]}
      />

      <Submit
        position={[position[0], position[1] - 5, position[2] + 100]}
        valid={dictator + reciever === 10}
        decisionType={"dictator"}
        decisionValue={reciever}
        errorPosition={[position[0] - 20, 1, position[2] + 40]}
        refractory={!!dictatorLocked}
        sendSubmit={sendSubmit}
      />

      <Sensor
        type="number"
        args={[35, 20]}
        sensorArgs={[17.5, 5, 10]}
        option="dictator"
        number={0}
        sensorPosition={[position[0] - 50, 0.5, position[2] + 100]}
        onSensedChange={handleSensedChange}
      />
      <Sensor
        type="number"
        args={[35, 20]}
        sensorArgs={[17.5, 5, 10]}
        option="reciever"
        number={0}
        sensorPosition={[position[0] + 50, 0.5, position[2] + 100]}
        onSensedChange={handleSensedChange}
      />

      <CoinMult
        position={[position[0], position[1], position[2] + 80]}
        setDragState={setDragState}
        floorPlane={floorPlane}
      />
    </>
  );
}
