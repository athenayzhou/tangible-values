import React, { useState, useEffect, useMemo, useCallback } from "react";
import { Vector3, Plane } from "three";

import DragObj from "../Components/Interaction/DragObj";
import Text from "../Components/Text/Text";
import Sensor from "../Components/Interaction/Sensor";
import Submit from "../Components/Decision/Submit";
import Coin from "../Components/Interaction/Coin";
import Path from "../Components/World/Path";

/** Seconds after triple before returned coins start flying (was hardcoded 5s in Coin). */
const TRUST_RETURN_LEAD_IN_SEC = 2;

function SensorMult({ option, position, handleSensedChange, i, resetSensor }) {
  return (
    <>
      <Sensor
        type="number"
        args={[7, 7]}
        sensorArgs={[4, 4, 4]}
        option={option}
        number={0}
        sensorPosition={[position[0] - 54, 0, position[2] - 45 * i]}
        onSensedChange={handleSensedChange}
        resetSensor={resetSensor}
      />
      <Sensor
        type="number"
        args={[7, 7]}
        sensorArgs={[4, 4, 4]}
        option={option}
        number={1}
        sensorPosition={[position[0] - 44, 0, position[2] - 27 * i]}
        onSensedChange={handleSensedChange}
        resetSensor={resetSensor}
      />
      <Sensor
        type="number"
        args={[7, 7]}
        sensorArgs={[4, 4, 4]}
        option={option}
        number={2}
        sensorPosition={[position[0] - 34, 0, position[2] - 12 * i]}
        onSensedChange={handleSensedChange}
        resetSensor={resetSensor}
      />
      <Sensor
        type="number"
        args={[7, 7]}
        sensorArgs={[4, 4, 4]}
        option={option}
        number={3}
        sensorPosition={[position[0] - 21, 0, position[2] - 4 * i]}
        onSensedChange={handleSensedChange}
        resetSensor={resetSensor}
      />
      <Sensor
        type="number"
        args={[7, 7]}
        sensorArgs={[4, 4, 4]}
        option={option}
        number={4}
        sensorPosition={[position[0] - 7, 0, position[2] + 0]}
        onSensedChange={handleSensedChange}
        resetSensor={resetSensor}
      />

      <Sensor
        type="number"
        args={[7, 7]}
        sensorArgs={[4, 4, 4]}
        option={option}
        number={5}
        sensorPosition={[position[0] + 7, 0, position[2] + 0]}
        onSensedChange={handleSensedChange}
        resetSensor={resetSensor}
      />
      <Sensor
        type="number"
        args={[7, 7]}
        sensorArgs={[4, 4, 4]}
        option={option}
        number={6}
        sensorPosition={[position[0] + 21, 0, position[2] - 4 * i]}
        onSensedChange={handleSensedChange}
        resetSensor={resetSensor}
      />
      <Sensor
        type="number"
        args={[7, 7]}
        sensorArgs={[4, 4, 4]}
        option={option}
        number={7}
        sensorPosition={[position[0] + 34, 0, position[2] - 12 * i]}
        onSensedChange={handleSensedChange}
        resetSensor={resetSensor}
      />
      <Sensor
        type="number"
        args={[7, 7]}
        sensorArgs={[4, 4, 4]}
        option={option}
        number={8}
        sensorPosition={[position[0] + 44, 0, position[2] - 27 * i]}
        onSensedChange={handleSensedChange}
        resetSensor={resetSensor}
      />
      <Sensor
        type="number"
        args={[7, 7]}
        sensorArgs={[4, 4, 4]}
        option={option}
        number={9}
        sensorPosition={[position[0] + 54, 0, position[2] - 45 * i]}
        onSensedChange={handleSensedChange}
        resetSensor={resetSensor}
      />
    </>
  );
}
function CoinMult({ position, setDragState, floorPlane, sensedCoinState }) {
  return (
    <>
      {sensedCoinState[1] && (
        <DragObj
          name="coin"
          num={1}
          startPosition={[position[0] - 54, 0, position[2] + 45]}
          state={setDragState}
          plane={floorPlane}
          lift={10}
        />
      )}

      {sensedCoinState[2] && (
        <DragObj
          name="coin"
          num={2}
          startPosition={[position[0] - 44, 1, position[2] + 27]}
          state={setDragState}
          plane={floorPlane}
          lift={10}
        />
      )}

      {sensedCoinState[3] && (
        <DragObj
          name="coin"
          num={3}
          startPosition={[position[0] - 34, 1, position[2] + 12]}
          state={setDragState}
          plane={floorPlane}
          lift={10}
        />
      )}

      {sensedCoinState[4] && (
        <DragObj
          name="coin"
          num={4}
          startPosition={[position[0] - 21, 1, position[2] + 4]}
          state={setDragState}
          plane={floorPlane}
          lift={10}
        />
      )}

      {sensedCoinState[5] && (
        <DragObj
          name="coin"
          num={5}
          startPosition={[position[0] - 7, 1, position[2] + 0]}
          state={setDragState}
          plane={floorPlane}
          lift={10}
        />
      )}

      {sensedCoinState[6] && (
        <DragObj
          name="coin"
          num={6}
          startPosition={[position[0] + 7, 1, position[2] + 0]}
          state={setDragState}
          plane={floorPlane}
          lift={10}
        />
      )}

      {sensedCoinState[7] && (
        <DragObj
          name="coin"
          num={7}
          startPosition={[position[0] + 21, 1, position[2] + 4]}
          state={setDragState}
          plane={floorPlane}
          lift={10}
        />
      )}

      {sensedCoinState[8] && (
        <DragObj
          name="coin"
          num={8}
          startPosition={[position[0] + 34, 1, position[2] + 12]}
          state={setDragState}
          plane={floorPlane}
          lift={10}
        />
      )}

      {sensedCoinState[9] && (
        <DragObj
          name="coin"
          num={9}
          startPosition={[position[0] + 44, 1, position[2] + 27]}
          state={setDragState}
          plane={floorPlane}
          lift={10}
        />
      )}

      {sensedCoinState[10] && (
        <DragObj
          name="coin"
          num={10}
          startPosition={[position[0] + 54, 1, position[2] + 45]}
          state={setDragState}
          plane={floorPlane}
          lift={10}
        />
      )}
    </>
  );
}

export default function Trust({
  position,
  sendSubmit,
  communityAggregate,
  confederateMemory = null,
}) {
  const floorPlane = new Plane(new Vector3(0, 1, 0), 0);
  const posX = position[0];
  const posZ = position[2];
  const [, setDragState] = useState(false);
  const [confedSensors, setConfedSensors] = useState({});
  const [userSensors, setUserSensors] = useState({});
  const [confedCounter, setConfedCounter] = useState(0);
  const [userCounter, setUserCounter] = useState(0);

  const [confed, setConfed] = useState(null);
  const [multiply, setMultiply] = useState(false);
  const [confedState, setConfedState] = useState(false);

  const [coinSpawns, setCoinSpawns] = useState([]);
  const [, setReactionState] = useState(false);
  const [reaction, setReaction] = useState(`null`);

  const [userText, setUserText] = useState(`null`);
  const [confedText, setConfedText] = useState(`null`);

  const returnCenter = useMemo(() => [posX, 10, posZ + 170], [posX, posZ]);
  const [resetSensor, setResetSensor] = useState(false);

  const [submitRefractory, setSubmitRefractory] = useState(false);
  const [pathState, setPathState] = useState(false);

  const [sensedCoinState, setSensedCoinState] = useState({
    1: true,
    2: true,
    3: true,
    4: true,
    5: true,
    6: true,
    7: true,
    8: true,
    9: true,
    10: true,
  });

  const handleSensedChange = (option, number, count, sensorPosition, num) => {
    if (option == "confed") {
      setConfedSensors((prevSensors) => ({
        ...prevSensors,
        [number]: { count, sensorPosition, num },
      }));
    } else if (option == "user") {
      setUserSensors((prevSensors) => ({
        ...prevSensors,
        [number]: { count, sensorPosition },
      }));
    }
  };
  useEffect(() => {
    //acutal total sensed
    // const totalSensed = Object.values(sensors).reduce((acc, currentValue) => acc + currentValue, 0);
    //max 1 sensed allowed in each sensor
    const totalConfedSensed = Object.values(confedSensors)
      .map((value) => Math.min(value.count, 1))
      .reduce((acc, currentValue) => acc + currentValue, 0);
    setConfedCounter(totalConfedSensed);

    //max 1 sensed
    const totalUserSensed = Object.values(userSensors)
      .map((value) => Math.min(value.count, 1))
      .reduce((acc, currentValue) => acc + currentValue, 0);
    setUserCounter(totalUserSensed);
  }, [confedSensors, userSensors]);

  const reconcile = useCallback(() => {
    setReactionState(true);
    setReaction(":|");

    const sensed = [];
    for (const [number, data] of Object.entries(confedSensors)) {
      if (data.count === 1) {
        sensed.push({
          number,
          position: data.sensorPosition,
          sensedCoin: data.num,
        });
      }
    }

    const updateSensedCoinState = { ...sensedCoinState };
    sensed.forEach(({ sensedCoin }) => {
      updateSensedCoinState[sensedCoin] = false;
    });
    setSensedCoinState(updateSensedCoinState);

    const returnedCount =
      typeof confed === "number" && Number.isFinite(confed) ? confed : 0;

    const spawns = sensed.flatMap(({ position }, index) => {
      const coinIndex = index * 3;
      const baseY = (position?.[1] ?? 0) + 1;
      return [0, 1, 2].map((_, yIndex) => {
        return {
          key: `coin-${coinIndex + yIndex}`,
          // Keep one coin at the original sent position, then stack two above it.
          position: [position[0], baseY + yIndex * 10, position[2]],
          delay: (coinIndex + yIndex) * 0.2,
        };
      });
    });

    const total = spawns.length;
    setCoinSpawns(
      spawns.map((spawn, index) => ({
        ...spawn,
        payoutState: index >= total - returnedCount,
        sendPos:
          index >= total - returnedCount
            ? (() => {
                const scatterIndex = index - (total - returnedCount);
                const scatterCount = Math.max(returnedCount, 1);
                const angle = (scatterIndex / scatterCount) * Math.PI * 2;
                const radius = 2 + (scatterIndex % 2) * 1.5;
                return [
                  returnCenter[0] + Math.cos(angle) * radius,
                  returnCenter[1] + (scatterIndex % 3) * 0.6,
                  returnCenter[2] + Math.sin(angle) * radius,
                ];
              })()
            : returnCenter,
      })),
    );
    setMultiply(true);

    setTimeout(() => {
      setConfedState(true);
      setReaction(":)");
      // console.log(`Stage 2: Returned ${confed}`)
    }, 3000);

    setTimeout(
      () => {
        setSubmitRefractory(false);
        setPathState(true);
      },
      confed * 1000 + 5000,
    );
  }, [confedSensors, sensedCoinState, confed, returnCenter]);

  useEffect(() => {
    if (multiply) {
      setTimeout(
        () => {
          setUserText(`${userCounter + confed}`);
          setConfedText(`${confedCounter * 3 - confed}`);
        },
        TRUST_RETURN_LEAD_IN_SEC * 1000 + 800,
      );
    } else {
      setUserText(`${userCounter}`);
      setConfedText(`${confedCounter}`);
    }
  }, [userCounter, confedCounter, multiply, confed]);

  useEffect(() => {
    if (confed !== null) {
      reconcile();
      setResetSensor(false);

      setSubmitRefractory(true);
    }
  }, [confed, reconcile]);

  return (
    <>
      <Text
        text={confedText}
        state={true}
        position={[position[0] - 6, 0, position[2] + 60]}
        rotation={[-Math.PI * 0.5, 0, -Math.PI]}
      />
      <Text
        text={userText}
        state={true}
        position={[position[0] + 3, 0, position[2] + 145]}
        rotation={[-Math.PI * 0.5, 0, 0]}
      />

      <Text
        text={`giving ${confedCounter}`}
        state={!confedState}
        position={[position[0], 22, position[2] + 100]}
        rotation={[-Math.PI * 0.1, 0, 0]}
        scale={[3, 3, 2]}
      />
      <Text
        text={`returning ${confed}`}
        state={confedState}
        position={[position[0], 10, position[2] + 100]}
        rotation={[-Math.PI * 0.1, 0, 0]}
      />
      <Text
        text={reaction}
        position={[position[0] - 1.5, 12, position[2] + 8]}
        rotation={[-Math.PI * 0.2, 0, -Math.PI / 2]}
        state={false}
        scale={3}
      />

      <Submit
        position={[position[0] + 100, 0, position[2] + 120]}
        valid={confedCounter + userCounter === 10}
        decisionType={"trust"}
        decisionValue={confedCounter}
        refractory={submitRefractory}
        onSubmit={(randomAssignment) => {
          setConfed(randomAssignment);
        }}
        errorPosition={[position[0] + 30, 1, position[2] - 5]}
        sendSubmit={sendSubmit}
        communityAggregate={communityAggregate}
        confederateMemory={confederateMemory}
      />

      <SensorMult
        option="confed"
        position={[position[0], position[1] + 0.5, position[2] + 80]}
        handleSensedChange={handleSensedChange}
        i={1}
        resetSensor={resetSensor}
      />
      <SensorMult
        option="user"
        position={[position[0], position[1] + 0.5, position[2] + 125]}
        handleSensedChange={handleSensedChange}
        i={-1}
        resetSensor={false}
      />
      {/* <Sensor type="number" args={[40, 30]} sensorArgs={[20, 4,15]} option="user" number={0} sensorPosition={[position[0], 0, position[2]+170]} onSensedChange={handleSensedChange} /> */}

      <CoinMult
        position={[position[0], position[1], position[2] + 125]}
        setDragState={setDragState}
        floorPlane={floorPlane}
        sensedCoinState={sensedCoinState}
      />

      {multiply &&
        coinSpawns.map((spawn) => (
          <Coin
            key={spawn.key}
            position={spawn.position}
            sendPos={spawn.sendPos ?? returnCenter}
            payoutState={spawn.payoutState}
            delay={spawn.delay}
            payoutLeadIn={TRUST_RETURN_LEAD_IN_SEC}
          />
        ))}

      <Path
        position={[position[0] + 325, position[1], position[2] + 900]}
        i={-1}
        rotation={[0, Math.PI * 0.4, 0]}
        state={pathState}
      />
    </>
  );
}
