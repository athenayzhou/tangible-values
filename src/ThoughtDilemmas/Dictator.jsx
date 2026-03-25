import { useState } from "react";
import { Vector3, Plane } from "three";

import DragObj from "../Interaction/DragObj";
import Sensor from "../Interaction/Sensor";
import Text from "../Text/Text";
import Submit from "../Decision/Submit";

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

export default function Dictator({ position, sendSubmit }) {
  const floorPlane = new Plane(new Vector3(0, 1, 0), 0);
  const [dragState, setDragState] = useState(false);
  const [dictator, setDictator] = useState(0);
  const [reciever, setReciever] = useState(0);

  const handleSensedChange = (option, number, count) => {
    if (option == "dictator") {
      setDictator(count);
    } else if (option == "reciever") {
      setReciever(count);
    }
  };

  return (
    <>
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
        position={[0, 0, -370]}
        valid={dictator + reciever === 10}
        decisionType={"dictator"}
        decisionValue={reciever}
        errorPosition={[position[0] - 20, 1, position[2] + 40]}
        refractory={false}
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
