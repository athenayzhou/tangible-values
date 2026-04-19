import { Canvas } from "@react-three/fiber";
import React, {
  Suspense,
  useState,
  useRef,
  useCallback,
  useEffect,
} from "react";
import { Stats, KeyboardControls } from "@react-three/drei";
import { Physics } from "@react-three/rapier";

import LoadingScreen from "./Components/LoadingScreen";
import Ground from "./Components/World/Ground";
import CameraRig from "./CameraRig";
import Person from "./Person";
import Thought from "./Thought";
import Foyer from "./Components/World/Foyer";
import Portal from "./Portal";

import Archways from "./Components/World/Archways";
import Directory from "./Components/World/Directory";
import PreloadThoughtAssets from "./Components/PreloadThoughtAssets";
import Hud from "./Components/UI/Hud";
import { thoughtConfigs } from "./context/thoughtConfigs";
import { isInsufficientStake, stakeForThought } from "./lib/gold";
import { useAggregate } from "./hooks/useAggregate";
import { useSubmission } from "./hooks/useSubmission";
import { useGold } from "./hooks/useGold";
import { useValues } from "./hooks/useValues";
import {
  isDictatorLockedForSession,
  persistDictatorComplete,
} from "./lib/dictatorLock";

const proximityToThoughts = [true, true, true, true];

const THOUGHT_CENTER = [0, 5, -400];
const PLAYER_SPAWN = [0, 20, -100];
const EXIT_PORTAL = [0, 12, -660];
const EXIT_PORTAL_COOLDOWN_MS = 1500;

function posNearPortal(basePosition) {
  const [bx, , bz] = basePosition;
  const y = 100;
  const ox = bx;
  const oz = bz;
  const len = Math.hypot(ox, oz);
  if (!Number.isFinite(len) || len < 1e-6) {
    return { x: 0, y, z: 150 };
  }
  const ux = ox / len;
  const uz = oz / len;
  const dist = 95;
  return {
    x: bx - ux * dist,
    y,
    z: bz - uz * dist,
  };
}

function Scene() {
  const {
    aggregate,
    aggregateLoading,
    handlePortalProximity,
    refreshAggregate,
  } = useAggregate();
  const {
    submissions,
    storeSubmissions,
    beginSubmissionForInstance,
    hydrateDictatorLock,
  } = useSubmission();
  const {
    sessionId,
    balance,
    initSession,
    startThoughtInstance,
    settleThought,
    instancesByThought,
  } = useGold();
  const { values, refreshValues } = useValues();

  const playerRef = useRef(null);
  const exitPortalUnlockTimeRef = useRef(0);
  const portalReturnPositionRef = useRef({ x: 0, y: 100, z: 150 });
  const sessionIdRef = useRef(sessionId);
  sessionIdRef.current = sessionId;
  const [mode, setMode] = useState("base");
  const [activeThoughtId, setActiveThoughtId] = useState(null);
  const [dilemmaMountNonce, setDilemmaMountNonce] = useState(0);
  const [stakePortalNotice, setStakePortalNotice] = useState(null);

  useEffect(() => {
    if (!stakePortalNotice) return;
    const id = window.setTimeout(() => setStakePortalNotice(null), 8000);
    return () => clearTimeout(id);
  }, [stakePortalNotice]);
  useEffect(() => {
    void initSession();
  }, [initSession]);

  useEffect(() => {
    if (!sessionId) return;
    hydrateDictatorLock(sessionId);
    refreshAggregate("dictator");
    void refreshValues(sessionId);
  }, [sessionId, hydrateDictatorLock, refreshAggregate, refreshValues]);

  const refreshDictator = useCallback(() => {
    refreshAggregate("dictator");
  }, [refreshAggregate]);

  const handleSubmit = useCallback(
    async (thoughtId, submitState) => {
      if (
        thoughtId === "dictator" &&
        sessionIdRef.current &&
        isDictatorLockedForSession(sessionIdRef.current)
      ) {
        return;
      }

      let instanceId = instancesByThought[thoughtId];
      if (!instanceId) {
        try {
          instanceId = await startThoughtInstance(thoughtId);
        } catch (err) {
          console.error("startThoughtInstance (submit)", thoughtId, err);
          return;
        }
      }
      if (thoughtId !== "dictator" && !instanceId) {
        console.error("submit blocked: no instance id", thoughtId);
        return;
      }
      setStakePortalNotice(null);
      let submitSessionId = sessionId;
      if (
        !submitSessionId &&
        import.meta.env.VITE_SUPABASE_URL &&
        import.meta.env.VITE_SUPABASE_ANON_KEY
      ) {
        try {
          submitSessionId = await initSession();
        } catch (err) {
          console.error("initSession (submit)", err);
          return;
        }
      }
      void storeSubmissions(thoughtId, submitState, {
        sessionId: submitSessionId,
        instanceId,
        onPersisted: async ({
          thoughtId: persistedThoughtId,
          decisionValue,
          outcomeMeta,
          payload,
        }) => {
          const { row: settleRow, sessionId: settledSessionId } =
            (await settleThought({
              thoughtId: persistedThoughtId,
              decisionValue,
              outcomeMeta,
              payload,
            })) ?? {};
          if (!settleRow) {
            console.error(
              "settleThought returned no row; values may be stale",
              persistedThoughtId,
            );
          }
          refreshAggregate(persistedThoughtId);
          const sessionForValues =
            settledSessionId || sessionIdRef.current || (await initSession());
          if (sessionForValues) {
            try {
              await new Promise((r) => setTimeout(r, 220));
              await refreshValues(sessionForValues, settleRow);
            } catch (err) {
              console.error("refreshValues after settle", err);
            }
          }
          if (persistedThoughtId === "dictator" && sessionForValues) {
            persistDictatorComplete(sessionForValues);
          }
        },
      }).catch((err) => console.error("storeSubmissions", thoughtId, err));
    },
    [
      instancesByThought,
      refreshAggregate,
      refreshValues,
      initSession,
      sessionId,
      settleThought,
      startThoughtInstance,
      storeSubmissions,
    ],
  );

  const handlePortalEnter = useCallback(
    (thoughtId) => {
      void (async () => {
        let instanceId = null;
        try {
          instanceId = await startThoughtInstance(thoughtId);
        } catch (err) {
          console.error("startThoughtInstance", thoughtId, err);
          if (isInsufficientStake(err)) {
            const stake = stakeForThought(thoughtId);
            setStakePortalNotice({
              thoughtId,
              text: `insufficient gold for stake. need ${stake} gold.`,
            });
          }
          return;
        }
        if (!instanceId) {
          console.error("startThoughtInstance returned no instance", thoughtId);
          return;
        }
        setStakePortalNotice(null);
        beginSubmissionForInstance(thoughtId, instanceId);
        setDilemmaMountNonce((n) => n + 1);

        const cfg = thoughtConfigs[thoughtId];
        if (cfg?.basePosition) {
          portalReturnPositionRef.current =
            posNearPortal(cfg.basePosition);
        }

        exitPortalUnlockTimeRef.current =
          performance.now() + EXIT_PORTAL_COOLDOWN_MS;
        setMode("portaled");
        setActiveThoughtId(thoughtId);
        if (playerRef.current) {
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
      })();
    },
    [startThoughtInstance, beginSubmissionForInstance],
  );

  const handlePortalExit = useCallback(() => {
    if (performance.now() < exitPortalUnlockTimeRef.current) {
      return;
    }
    setMode("base");
    setActiveThoughtId(null);
    if (playerRef.current) {
      const p = portalReturnPositionRef.current;
      playerRef.current.setTranslation(
        { x: p.x, y: p.y, z: p.z },
        true,
      );
      playerRef.current.setLinvel({ x: 0, y: 0, z: 0 });
    }
  }, []);

  const isPortaled = mode === "portaled";

  return (
    <div id="canvas_wrapper">
      <Hud balance={balance} values={values} />
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
                    <Directory
                      submitted={submissions.dictator?.submitted || false}
                    />

                    {proximityToThoughts[0] && (
                      <Thought
                        key={thoughtConfigs.dictator.key}
                        thoughtId="dictator"
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
                          sendSubmit={handleSubmit}
                          aggregate={aggregate.dictator}
                          aggregateLoading={!!aggregateLoading.dictator}
                          aggregateRefresh={refreshDictator}
                          dictatorLocked={submissions.dictator.submitted}
                          dictatorSubmitted={submissions.dictator.submitted}
                          dictatorDecision={submissions.dictator.decisionValue}
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
                          stakeNotice={
                            stakePortalNotice?.thoughtId === id
                              ? stakePortalNotice.text
                              : null
                          }
                        />
                      );
                    })}
                  </>
                )}

                {isPortaled &&
                  activeThoughtId &&
                  activeThoughtId !== "dictator" && (
                    <Thought
                      key={`portaled-${activeThoughtId}-${dilemmaMountNonce}`}
                      thoughtId={activeThoughtId}
                      position={THOUGHT_CENTER}
                      meshPos={thoughtConfigs[activeThoughtId].meshPos}
                      startDialogue={
                        thoughtConfigs[activeThoughtId].startDialogue
                      }
                      startPosition={
                        thoughtConfigs[activeThoughtId].startPosition
                      }
                      updateDialogue={
                        thoughtConfigs[activeThoughtId].updateDialogue
                      }
                      updatePosition={
                        thoughtConfigs[activeThoughtId].updatePosition
                      }
                      endDialogue={thoughtConfigs[activeThoughtId].endDialogue}
                      endPosition={thoughtConfigs[activeThoughtId].endPosition}
                      prompt={thoughtConfigs[activeThoughtId].prompt}
                      promptPosition={
                        thoughtConfigs[activeThoughtId].promptPosition
                      }
                      submissions={submissions}
                    >
                      {React.createElement(
                        thoughtConfigs[activeThoughtId].dilemmaComponent,
                        {
                          position: THOUGHT_CENTER,
                          sendSubmit: handleSubmit,
                          aggregate: aggregate[activeThoughtId],
                        },
                      )}
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
