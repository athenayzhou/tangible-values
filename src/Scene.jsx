import { Canvas } from "@react-three/fiber";
import { Suspense, useState } from "react";
import { Stats, KeyboardControls } from "@react-three/drei";
import { Physics } from "@react-three/rapier";

import LoadingScreen from "./Components/LoadingScreen";
import Ground from "./Components/Ground";
import CameraRig from "./CameraRig";
import Person from "./Person";
import Thought from "./Thought";
import Foyer from "./Components/Foyer";

import {
  LazyDictator,
  LazyVolunteer,
  LazyExchange,
  LazyTrust,
} from "./Components/DilemmaLazy";
import Archways from "./Components/Archways";
import Directory from "./Components/Directory";
import PreloadThoughtAssets from "./Components/PreloadThoughtAssets";
import {
  DICTATOR_PROMPT,
  VOLUNTEER_PROMPT,
  EXCHANGE_PROMPT,
  TRUST_PROMPT,
} from "./thoughtPrompts";

const proximityToThoughts = [true, true, true, true];

function Scene() {
  const [submissions, setSubmissions] = useState({
    dictator: false,
    volunteer: false,
    exchange: false,
    trust: false,
  });

  const storeSubmissions = (key, submitState) => {
    setSubmissions((prevSubmitState) => ({
      ...prevSubmitState,
      [key]: submitState,
    }));
    // console.log(submissions)
  };

  return (
    <div id="canvas_wrapper">
      <KeyboardControls
        map={[
          { name: "forward", keys: ["ArrowUp", "w", "W"] },
          { name: "backward", keys: ["ArrowDown", "s", "S"] },
          { name: "left", keys: ["ArrowLeft", "a", "A"] },
          { name: "right", keys: ["ArrowRight", "d", "D"] },
        ]}
      >
        <Canvas
          shadows
          tabIndex={0}
          exposure={3}
          frameloop="always"
          dpr={[1, 1.75]}
          gl={{ antialias: true, powerPreference: "high-performance" }}
        >
          <color args={["#eeeeee"]} attach="background" />
          <fogExp2 attach="fog" args={["#eeeeee", 0.003]} />
          {/* <axesHelper args={[10]} /> */}

          <ambientLight intensity={1} />
          <directionalLight
            color="#ffffff"
            position={[300, 50, 100]}
            intensity={1}
          />

          <Suspense fallback={<LoadingScreen />}>
            <Physics gravity={[0, -9.8, 0]} colliders={false}>
              <PreloadThoughtAssets />
              <Ground />

              <CameraRig>
                <Foyer position={[20, 0, 70]} />
                <Archways
                  dictatorPos={[0, 5, -470]}
                  volunteerPos={[-550, 5, -800]}
                  exchangePos={[0, 5, -1100]}
                  trustPos={[550, 5, -800]}
                />
                <Directory submitted={submissions.dictator} />

                <Person submissions={submissions} />

                {proximityToThoughts[0] && (
                  <Thought
                    key={"dictatorGame"}
                    position={[0, 5, -370]}
                    meshPos={[0, 6, 150]}
                    startDialogue={"HELLO THERE ! COME CLOSER"}
                    startPosition={[0, 20, 150]}
                    updateDialogue={` DRAG THE COINS TO THE MARKED AREA \nACCORDING TO YOUR PROPOSED DIVISION.`}
                    updatePosition={[-10, 20, 150]}
                    endDialogue={`TAKE YOUR TIME.`}
                    endPosition={[15, 20, 150]}
                    prompt={DICTATOR_PROMPT}
                    promptPosition={[0, 40, 130]}
                    submissions={submissions}
                  >
                    <LazyDictator
                      key={"dictator"}
                      position={[0, 5, -470]}
                      sendSubmit={storeSubmissions}
                    />
                  </Thought>
                )}

                {proximityToThoughts[1] && (
                  <Thought
                    key={"volunteerDilemma"}
                    position={[-550, 5, -800]}
                    startDialogue={"FEELING  RISKY  TODAY ?"}
                    startPosition={[0, 20, 0]}
                    updateDialogue={`  COLOR THE OPTION BY WALKING OVER IT.\nIF YOU CHANGE YOUR MIND, USE THE ERASER.`}
                    updatePosition={[-20, 20, 0]}
                    endDialogue={`MAY LUCK BE ON YOUR SIDE.`}
                    endPosition={[0, 20, 0]}
                    prompt={VOLUNTEER_PROMPT}
                    submissions={submissions}
                  >
                    <LazyVolunteer
                      key={"volunteer"}
                      position={[-550, 5, -800]}
                      sendSubmit={storeSubmissions}
                    />
                  </Thought>
                )}

                {proximityToThoughts[2] && (
                  <Thought
                    key={"exchangeGame"}
                    position={[0, 5, -1100]}
                    startDialogue={"WANNA  MAKE  A  TRADE ?"}
                    startPosition={[0, 20, 0]}
                    updateDialogue={`PUSH THE APPLE ONTO THE LEFT AREA TO EXCHANGE \n    OR HIDE IT BEHIND THE LEFT WALL TO KEEP.`}
                    updatePosition={[-35, 20, 0]}
                    endDialogue={`ONCE BITTEN, TWICE SHY.`}
                    endPosition={[0, 20, 0]}
                    prompt={EXCHANGE_PROMPT}
                    promptPosition={[0, 40, -20]}
                    submissions={submissions}
                  >
                    <LazyExchange
                      key={"exchange"}
                      position={[0, 5, -1100]}
                      sendSubmit={storeSubmissions}
                    />
                  </Thought>
                )}

                {proximityToThoughts[3] && (
                  <Thought
                    key={"trustGame"}
                    position={[550, 5, -800]}
                    startDialogue={"DO  YOU  TRUST  ME ?"}
                    startPosition={[0, 20, 0]}
                    updateDialogue={`DRAG THE AMOUNT OF COINS YOU WANT \n    TO SEND ONTO THE MARKED AREAS.`}
                    updatePosition={[-20, 20, 0]}
                    endDialogue={`FOOL ME ONCE, SHAME ON YOU. \nFOOL ME TWICE, SHAME ON ME.`}
                    endPosition={[0, 20, 0]}
                    prompt={TRUST_PROMPT}
                    submissions={submissions}
                  >
                    <LazyTrust
                      key={"trust"}
                      position={[550, 5, -800]}
                      sendSubmit={storeSubmissions}
                    />
                  </Thought>
                )}
              </CameraRig>
            </Physics>
          </Suspense>
          {import.meta.env.DEV ? <Stats /> : null}
        </Canvas>
      </KeyboardControls>
    </div>
  );
}

export default Scene;
