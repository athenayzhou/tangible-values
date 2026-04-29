import { Canvas } from "@react-three/fiber";
import React, { Suspense, useState, useRef, useCallback, useEffect } from "react";
import { Stats, KeyboardControls } from "@react-three/drei";
import { Physics } from "@react-three/rapier";

import LoadingScreen from "./Components/LoadingScreen";
import Ground from "./Components/World/Ground";
import CameraRig from "./CameraRig";
import Person from "./Person";
import Thought from "./Thought";
import Portal from "./Portal";

import Foyer from "./Components/World/Foyer";
import Archways from "./Components/World/Archways";
import Directory from "./Components/World/Directory";
import Atmosphere from "./Components/World/Atmosphere";
import PreloadThoughtAssets from "./Components/PreloadThoughtAssets";
import Hud from "./Components/UI/Hud";
import InstanceRecap from "./Components/UI/InstanceRecap";

import { thoughtConfigs } from "./context/thoughtConfigs";
import { isInsufficientStake, stakeForThought } from "./lib/gold";
import { isDictatorLockedForSession } from "./lib/dictatorLock";
import {
  clearPendingInstanceRecapIfMatch,
  takePendingInstanceRecap,
} from "./lib/settleRecap";

import { useAggregate } from "./hooks/useAggregate";
import { useSubmission } from "./hooks/useSubmission";
import { useGold } from "./hooks/useGold";
import { useValues } from "./hooks/useValues";
import { useSettle } from "./hooks/useSettle";
import {
  initialConfederate,
  updateState,
  normalizeState,
} from "./lib/confederate";

const THOUGHT_IDS = ["dictator", "volunteer", "exchange", "trust"];

const proximityToThoughts = [true, true, true, true];

const THOUGHT_CENTER = [0, 5, -400];
const PLAYER_SPAWN = [0, 20, -100];
const EXIT_POS = [0, 12, -660];
const EXIT_COOLDOWN_MS = 1500;
const REENTRY_COOLDOWN_MS = 1200;
const PORTAL_RESUME = new Set(["volunteer", "exchange", "trust"]);

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
  const { aggregate, aggregateLoading, handlePortalProximity, refreshAggregate } = useAggregate();
  const { submissions, storeSubmissions, beginSubmission, hydrateDictatorLock } = useSubmission();
  const { sessionId, balance, initSession, startThoughtInstance, settleThought, instancesByThought, hydrateOpenInstance } = useGold();
  const { values, refreshValues } = useValues();

  const [mode, setMode] = useState("base");
  const [activeThoughtId, setActiveThoughtId] = useState(null);
  const [dilemmaMountNonce, setDilemmaMountNonce] = useState(0);
  const [stakePortalNotice, setStakePortalNotice] = useState(null);
  const [recap, setRecap] = useState(null);
  const [confederate, setConfederate] = useState(() =>
    initialConfederate(),
  );

  const playerRef = useRef(null);
  const exitUnlockTimeRef = useRef(0);
  const portalUnlockTimeRef = useRef(0);
  const returnPositionRef = useRef({ x: 0, y: 100, z: 150 });
  const sessionIdRef = useRef(sessionId);
  sessionIdRef.current = sessionId;
  const activeThoughtIdRef = useRef(activeThoughtId);
  activeThoughtIdRef.current = activeThoughtId;
  const spatialResumeRef = useRef(null);
  const lastHydratedSessionRef = useRef(null);
  const confederateSessionRef = useRef(null);

  const { settle, recapBufferRef } = useSettle({
    settleThought,
    refreshAggregate,
    refreshValues,
    initSession,
    sessionId,
    values,
    setRecap,
  });

  useEffect(() => {
    if (!stakePortalNotice) return;
    const id = window.setTimeout(() => setStakePortalNotice(null), 8000);
    return () => clearTimeout(id);
  }, [stakePortalNotice]);

  useEffect(() => {
    void initSession();
  }, [initSession]);

  useEffect(() => {
    if (!sessionId) {
      return;
    }
    const sessionChanged = confederateSessionRef.current !== sessionId;
    confederateSessionRef.current = sessionId;

    setConfederate((prev) => {
      if (sessionChanged) {
        const base = initialConfederate();
        for (const tid of THOUGHT_IDS) {
          const agg = aggregate[tid];
          if (agg != null && typeof agg === "object") {
            base[tid] = updateState(base[tid], tid, agg);
          }
        }
        return base;
      }
      const next = { ...prev };
      for (const tid of THOUGHT_IDS) {
        const agg = aggregate[tid];
        if (agg == null || typeof agg !== "object") continue;
        next[tid] = updateState(prev[tid], tid, agg);
      }
      return next;
    });
  }, [sessionId, aggregate]);

  const resumePortal = useCallback((thoughtId, instanceId, { refreshAgg = true } = {}) => {
    if (!PORTAL_RESUME.has(thoughtId) || !instanceId) return;
    if (refreshAgg) refreshAggregate(thoughtId);
    beginSubmission(thoughtId, instanceId);
    setDilemmaMountNonce((n) => n + 1);
    const cfg = thoughtConfigs[thoughtId];
    if (cfg?.basePosition) {
      returnPositionRef.current = posNearPortal(cfg.basePosition);
    }
    exitUnlockTimeRef.current =
      performance.now() + EXIT_COOLDOWN_MS;
    setMode("portaled");
    setActiveThoughtId(thoughtId);
    let frames = 0;
    const maxFrames = 36;
    const placeSpawn = () => {
      if (playerRef.current) {
        playerRef.current.setTranslation(
          { x: PLAYER_SPAWN[0], y: PLAYER_SPAWN[1], z: PLAYER_SPAWN[2] },
          true,
        );
        playerRef.current.setLinvel({ x: 0, y: 0, z: 0 });
        return;
      }
      frames += 1;
      if (frames < maxFrames) {
        requestAnimationFrame(placeSpawn);
      } else if (import.meta.env.DEV) {
        console.warn("resumePortal: playerRef not ready after rAF retries");
      }
    };
    requestAnimationFrame(placeSpawn);
  }, [beginSubmission, refreshAggregate]);

  useEffect(() => {
    if (!sessionId) return;
    if (lastHydratedSessionRef.current !== sessionId) {
      spatialResumeRef.current = null;
      lastHydratedSessionRef.current = sessionId;
    }
    hydrateDictatorLock(sessionId);
    refreshAggregate("dictator");
    void refreshValues(sessionId);

    let cancelled = false;
    void (async () => {
      const { thoughtIds, instanceMap } = await hydrateOpenInstance(sessionId);
      if (cancelled) return;
      for (const tid of thoughtIds) {
        refreshAggregate(tid);
      }
      if (cancelled) return;
      const pendingRecap = takePendingInstanceRecap(sessionId);
      if (cancelled) return;
      if (pendingRecap) {
        setRecap(pendingRecap);
        return;
      }
      const portalOpen = thoughtIds.filter((t) => PORTAL_RESUME.has(t));
      if (
        portalOpen.length === 1 &&
        spatialResumeRef.current !== sessionId
      ) {
        const tid = portalOpen[0];
        const iid = instanceMap[tid];
        if (!iid) {
          if (import.meta.env.DEV) {
            console.warn("spatial resume skipped: missing instance for", tid, {
              thoughtIds,
              instanceMap,
            });
          }
        } else {
          spatialResumeRef.current = sessionId;
          resumePortal(tid, iid, { refreshAgg: false });
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [
    sessionId,
    hydrateDictatorLock,
    hydrateOpenInstance,
    refreshAggregate,
    refreshValues,
    resumePortal,
    setRecap,
  ]);

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
        onPersisted: settle,
      })
    },
    [
      instancesByThought,
      initSession,
      sessionId,
      startThoughtInstance,
      storeSubmissions,
      settle,
    ],
  );

  const handlePortalEnter = useCallback(
    (thoughtId) => {
      if (performance.now() < portalUnlockTimeRef.current) {
        return;
      }
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
        resumePortal(thoughtId, instanceId, { refreshAgg: true });
      })();
    },
    [startThoughtInstance, resumePortal],
  );

  const handlePortalExit = useCallback(() => {
    if (performance.now() < exitUnlockTimeRef.current) {
      return;
    }
    const tid = activeThoughtIdRef.current;
    const buf = recapBufferRef.current;
    if (tid && buf && buf.thoughtId === tid) {
      setRecap(buf);
      clearPendingInstanceRecapIfMatch(sessionIdRef.current, tid);
    }
    recapBufferRef.current = null;

    setMode("base");
    setActiveThoughtId(null);
    portalUnlockTimeRef.current =
      performance.now() + REENTRY_COOLDOWN_MS;
    if (playerRef.current) {
      const p = returnPositionRef.current;
      playerRef.current.setTranslation(
        { x: p.x, y: p.y, z: p.z },
        true,
      );
      playerRef.current.setLinvel({ x: 0, y: 0, z: 0 });
    }
  }, [recapBufferRef, setRecap]);


  const isPortaled = mode === "portaled";



  return (
    <div id="canvas_wrapper">
      <Hud balance={balance} values={values} />
      <InstanceRecap recap={recap} aggregate={recap ? aggregate[recap.thoughtId] : null} onDismiss={() => setRecap(null)} />
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
          <Atmosphere
            trust={values.trust}
            altruism={values.altruism}
            deceit={values.deceit}
            greed={values.greed}
            standing={values.standing}
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
                          communityAggregate:
                            aggregate[activeThoughtId] ?? null,
                          confederateMemory:
                            confederate[activeThoughtId] ??
                            normalizeState(null),
                        },
                      )}
                    </Thought>
                  )}

                {isPortaled && (
                  <Portal
                    id="exit"
                    position={EXIT_POS}
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
