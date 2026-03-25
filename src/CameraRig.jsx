import React, {
  useRef,
  useState,
  useEffect,
  useCallback,
  useMemo,
  useLayoutEffect,
} from "react";
import { PerspectiveCamera } from "@react-three/drei";
import { useFrame, useThree } from "@react-three/fiber";
import { Vector3 } from "three";

import { CameraRigContext } from "./context/CameraRigContext";

const lookScratch = new Vector3();

/** Smooth raw physics position into a stable follow anchor (reduces micro-jitter). */
const SPHERE_SMOOTH = 7;
/** Camera chases the smoothed anchor */
const FOLLOW_SMOOTH = 12;
/** Slightly snappier when switching interaction → instruction (less “sticky” feel). */
const MODE_TRANSITION_SMOOTH = 14;

const MAX_DELTA = 1 / 30;

export default function CameraRig({ children }) {
  const cameraRef = useRef();
  const { size } = useThree();
  const aspect =
    size.height > 0 && size.width > 0 ? size.width / size.height : 1.6;

  const spherePositionRef = useRef({ x: 0, y: 100, z: 150 });
  const sphereSmoothedRef = useRef({ x: 0, y: 100, z: 150 });
  const thoughtPositionRef = useRef({ x: 0, y: 0, z: 0 });
  const cameraPositionRef = useRef({ x: 0, y: 100, z: 300 });

  const indexRef = useRef(0);
  const prevCameraIndexRef = useRef(0);
  const transitioningRef = useRef(false);

  const [instructionState, setInstructionState] = useState(false);
  const [proximityState, setProximityState] = useState(false);

  const handleInstructionStateChange = useCallback((newInstructionState) => {
    setInstructionState(newInstructionState);
  }, []);

  const handleProximity = useCallback((newProximityState) => {
    setProximityState(newProximityState);
  }, []);

  const handleSpherePositionChange = useCallback((newPosition) => {
    spherePositionRef.current = newPosition;
  }, []);

  const handleThoughtPosition = useCallback((newThoughtPosition) => {
    thoughtPositionRef.current = newThoughtPosition;
  }, []);

  const rigContextValue = useMemo(
    () => ({
      onPositionChange: handleSpherePositionChange,
      onProximity: handleProximity,
      onThoughtPosition: handleThoughtPosition,
      onInstructionStateChange: handleInstructionStateChange,
    }),
    [
      handleSpherePositionChange,
      handleProximity,
      handleThoughtPosition,
      handleInstructionStateChange,
    ],
  );

  useEffect(() => {
    const next = proximityState ? (instructionState ? 2 : 1) : 0;
    if (prevCameraIndexRef.current !== next) {
      transitioningRef.current = true;
      prevCameraIndexRef.current = next;
    }
    indexRef.current = next;
  }, [proximityState, instructionState]);

  useLayoutEffect(() => {
    const cam = cameraRef.current;
    if (cam) {
      cam.position.set(
        cameraPositionRef.current.x,
        cameraPositionRef.current.y,
        cameraPositionRef.current.z,
      );
    }
  }, []);

  useFrame((_, delta) => {
    const cam = cameraRef.current;
    if (!cam) return;

    const d = Math.min(Math.max(delta, 1e-4), MAX_DELTA);

    const raw = spherePositionRef.current;
    const sm = sphereSmoothedRef.current;
    const ks = 1 - Math.exp(-SPHERE_SMOOTH * d);
    sm.x += (raw.x - sm.x) * ks;
    sm.y += (raw.y - sm.y) * ks;
    sm.z += (raw.z - sm.z) * ks;

    const s = sm;
    const thirdPersonCam = { x: s.x, y: 100, z: s.z + 150 };
    const interactionCam = { x: s.x, y: 60, z: s.z + 80 };
    const instructionCam = { x: s.x, y: 20, z: s.z + 40 };

    const idx = indexRef.current;
    let target;
    if (idx === 0) target = thirdPersonCam;
    else if (idx === 1) target = interactionCam;
    else target = instructionCam;

    const t = thoughtPositionRef.current;
    if (idx === 2) {
      lookScratch.set(t.x, t.y, t.z - 40);
    } else {
      lookScratch.set(s.x, s.y, s.z);
    }

    const camPos = cameraPositionRef.current;
    const { x: tx, y: ty, z: tz } = target;

    const smooth = transitioningRef.current
      ? MODE_TRANSITION_SMOOTH
      : FOLLOW_SMOOTH;
    const k = 1 - Math.exp(-smooth * d);

    camPos.x += (tx - camPos.x) * k;
    camPos.y += (ty - camPos.y) * k;
    camPos.z += (tz - camPos.z) * k;

    if (transitioningRef.current) {
      const dx = camPos.x - tx;
      const dy = camPos.y - ty;
      const dz = camPos.z - tz;
      if (dx * dx + dy * dy + dz * dz < 0.25) {
        transitioningRef.current = false;
        camPos.x = tx;
        camPos.y = ty;
        camPos.z = tz;
      }
    }

    cam.position.set(camPos.x, camPos.y, camPos.z);
    cam.lookAt(lookScratch);
  });

  return (
    <CameraRigContext.Provider value={rigContextValue}>
      <PerspectiveCamera
        ref={cameraRef}
        makeDefault
        args={[60, aspect, 0.1, 4000]}
      />
      {children}
    </CameraRigContext.Provider>
  );
}
