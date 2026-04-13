import { Canvas } from "@react-three/fiber";
import React, { Suspense, useState, useRef, useCallback } from "react";
import { Stats, KeyboardControls } from "@react-three/drei";
import { Physics } from "@react-three/rapier";

import LoadingScreen from "./Components/LoadingScreen";
import Ground from "./Components/UI/Ground";
import CameraRig from "./CameraRig";
import Person from "./Person";
import Thought from "./Thought";
import Foyer from "./Components/UI/Foyer";
import Portal from "./Portal";

import Archways from "./Components/UI/Archways";
import Directory from "./Components/UI/Directory";
import PreloadThoughtAssets from "./Components/PreloadThoughtAssets";
import { thoughtConfigs } from "./context/thoughtConfigs";
import { useAggregate } from "./hooks/useAggregate";

const proximityToThoughts = [true, true, true, true];

const THOUGHT_CENTER = [0, 5, -400];
const PLAYER_SPAWN = [0, 20, -100];
const EXIT_PORTAL = [0, 12, -660];
const EXIT_PORTAL_COOLDOWN_MS = 1500;

function Scene() {
  const {
    submissions,
    storeSubmissions,
    aggregate,
    aggregateLoading,
    handlePortalProximity,
  } = useAggregate();

  const playerRef = useRef(null);
  const exitPortalUnlockTimeRef = useRef(0);
  const [mode, setMode] = useState("base");
  const [activeThoughtId, setActiveThoughtId] = useState(null);

  const handlePortalEnter = useCallback((thoughtId) => {
    exitPortalUnlockTimeRef.current = performance.now() + EXIT_PORTAL_COOLDOWN_MS;
    setMode("portaled");
    setActiveThoughtId(thoughtId);
    if(playerRef.current){
      playerRef.current.setTranslation(
        {
          x: PLAYER_SPAWN[0],
          y: PLAYER_SPAWN[1],
          z: PLAYER_SPAWN[2],
        },
        true,
      );
      playerRef.current.setLinvel({ x: 0, y: 0, z: 0 });
    }
  }, []);

  const handlePortalExit = useCallback(() => {
    if (performance.now() < exitPortalUnlockTimeRef.current) {
      return;
    }
    setMode("base");
    setActiveThoughtId(null);
    if(playerRef.current){
      playerRef.current.setTranslation({ x: 0, y: 100, z: 150 }, true);
      playerRef.current.setLinvel({ x: 0, y: 0, z: 0 });
    }
  }, []);

  const isPortaled = mode === "portaled";

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
                {!isPortaled && (
                  <>
                <Foyer position={[20, 0, 70]} />
                <Archways
                  dictatorPos={[0, 5, -470]}
                  volunteerPos={[-550, 5, -800]}
                  exchangePos={[0, 5, -1100]}
                  trustPos={[550, 5, -800]}
                />
                <Directory submitted={submissions.dictator?.submitted || false} />

                {proximityToThoughts[0] && (
                  <Thought
                    key={thoughtConfigs.dictator.key}
                    position={thoughtConfigs.dictator.basePosition}
                    meshPos={thoughtConfigs.dictator.meshPos}
                    startDialogue={thoughtConfigs.dictator.startDialogue}
                    startPosition={thoughtConfigs.dictator.startPosition}
                    updateDialogue={thoughtConfigs.dictator.updateDialogue}
                    updatePosition={thoughtConfigs.dictator.updatePosition}
                    endDialogue={thoughtConfigs.dictator.endDialogue}
                    endPosition={thoughtConfigs.dictator.endPosition}
                    prompt={thoughtConfigs.dictator.prompt}
                    promptPosition={thoughtConfigs.dictator.promptPosition}
                    submissions={submissions}
                  >
                    <thoughtConfigs.dictator.dilemmaComponent
                      position={thoughtConfigs.dictator.dilemmaPosition}
                      sendSubmit={storeSubmissions}
                    />
                  </Thought>
                )}

                </>
                )}

                <Person submissions={submissions} ref={playerRef} />

                {!isPortaled && (
                  <>
                  {["volunteer", "exchange", "trust"].map((id) => {
                    const cfg = thoughtConfigs[id];
                    return (
                      <Portal
                        key={`portal-${id}`}
                        id={id}
                        position={cfg.basePosition}
                        onEnter={handlePortalEnter}
                        aggregate={aggregate[id]}
                        aggregateLoading={!!aggregateLoading[id]}
                        onProximityChange={handlePortalProximity}
                      />
                    );
                  })}
                  </>
                )}

                {isPortaled && activeThoughtId && activeThoughtId !== "dictator" && (
                  <Thought
                    key={`portaled-${activeThoughtId}`}
                    position={THOUGHT_CENTER}
                    meshPos={thoughtConfigs[activeThoughtId].meshPos}
                    startDialogue={thoughtConfigs[activeThoughtId].startDialogue}
                    startPosition={thoughtConfigs[activeThoughtId].startPosition}
                    updateDialogue={thoughtConfigs[activeThoughtId].updateDialogue}
                    updatePosition={thoughtConfigs[activeThoughtId].updatePosition}
                    endDialogue={thoughtConfigs[activeThoughtId].endDialogue}
                    endPosition={thoughtConfigs[activeThoughtId].endPosition}
                    prompt={thoughtConfigs[activeThoughtId].prompt}
                    promptPosition={thoughtConfigs[activeThoughtId].promptPosition}
                    submissions={submissions}
                  >
                    {React.createElement(thoughtConfigs[activeThoughtId].dilemmaComponent, {
                      position: THOUGHT_CENTER,
                      sendSubmit: storeSubmissions,
                    })}
                  </Thought>
                )}

                {isPortaled && (
                  <Portal
                    id="exit"
                    position={EXIT_PORTAL}
                    onEnter={handlePortalExit}
                  />
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
