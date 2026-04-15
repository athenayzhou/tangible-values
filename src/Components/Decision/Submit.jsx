import { useState, useRef, useEffect } from "react";
import { RigidBody, CuboidCollider } from "@react-three/rapier";
import Text from "../Text/Text";
import Button from "./Button";
import { sampleVolunteerChoice, sampleExchangeChoice, sampleTrustReturn } from "../../lib/probabilities";

export default function Submit({
  position,
  valid,
  decisionType,
  decisionValue,
  onSubmit,
  errorPosition,
  refractory,
  sendSubmit,
  communityAggregate,
}) {
  const intersectionTimeoutRef = useRef(null);
  const [errorState, setErrorState] = useState(false);
  const [errorText, setErrorText] = useState("null");

  const submitDecision = (valid, decisionType, decisionValue) => {
    if (!valid) {
      setErrorState(true);
      setErrorText("invalid answer");
      return;
    }
    setErrorState(false);

    switch (decisionType) {
      case "dictator": {
        sendSubmit("dictator", { decisionValue, outcomeMeta: {} });
        break;
      }
      case "volunteer": {
        const confedChoices = [
          sampleVolunteerChoice(communityAggregate),
          sampleVolunteerChoice(communityAggregate),
          sampleVolunteerChoice(communityAggregate),
        ];
        onSubmit?.(confedChoices);
        sendSubmit("volunteer", { decisionValue, outcomeMeta: { confedChoices } });
        break;
      }
      case "exchange": {
        const confedChoice = sampleExchangeChoice(communityAggregate);
        onSubmit?.(confedChoice);
        sendSubmit("exchange", { decisionValue, outcomeMeta: { confedChoice } });
        break;
      }
      case "trust": {
        const sent = Number(decisionValue) || 0;
        const returned = sampleTrustReturn(sent, communityAggregate);
        onSubmit?.(returned);
        sendSubmit("trust", { decisionValue, outcomeMeta: { returned } });
        break;
      }
      default:
        console.log(`Unknown submission type: ${decisionType}`);
    }
  };

  const handleIntersection = () => {
    if (intersectionTimeoutRef.current != null) {
      clearTimeout(intersectionTimeoutRef.current);
    }
    if (refractory === false) {
      intersectionTimeoutRef.current = setTimeout(() => {
        intersectionTimeoutRef.current = null;
        submitDecision(valid, decisionType, decisionValue);
      }, 500);
      setErrorState(false);
    } else {
      setErrorState(true);
      setErrorText(`please refresh \nbefore answering \nagain`);
    }
  };

  useEffect(() => {
    return () => {
      if (intersectionTimeoutRef.current != null) {
        clearTimeout(intersectionTimeoutRef.current);
      }
    };
  }, []);

  return (
    <>
      <RigidBody
        name="submit"
        mass={1}
        type="fixed"
        colliders="cuboid"
        position={position}
      >
        <Button position={[0, 0, 0]} text={"SUBMIT"} />
        <CuboidCollider
          args={[7.5, 2.5, 3]}
          sensor
          onIntersectionEnter={(payload) => {
            if (payload.other.rigidBodyObject.name === "person") {
              handleIntersection();
            }
          }}
        />
      </RigidBody>
      <Text
        text={`${errorText}`}
        state={errorState}
        position={errorPosition}
        rotation={[-Math.PI / 2, 0, 0]}
      />
    </>
  );
}
