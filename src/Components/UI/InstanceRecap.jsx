import React from "react";
import { interpretGold, interpretOutcome } from "../../lib/interpretOutcome";
import { socialMood } from "../../lib/socialMood";

function fmtDelta(n) {
  const x = Math.trunc(Number(n) || 0);
  if(x > 0) return `+${x}`;
  return String(x);
}

function deltaLine(d) {
  if(!d) return "Trust 0 · Altruism 0 · Deceit 0 · Greed 0";
  const t = fmtDelta(d.trust);
  const al = fmtDelta(d.altruism);
  const de = fmtDelta(d.deceit);
  const g = fmtDelta(d.greed);
  return `Trust ${t} · Altruism ${al} · Deceit ${de} · Greed ${g}`;
}

export default function InstanceRecap({ recap, aggregate, onDismiss }) {
  if (!recap) return null;

  const mood = socialMood(recap.thoughtId, aggregate);
  const goldExplain = interpretGold(recap.thoughtId);
  const outcomeExplain = interpretOutcome(
    recap.thoughtId,
    recap.outcomeLabel,
  );
  const save = recap.saveStatus ?? "saved";
  const saveText =
    save === "saved"
    ? "Saved."
    : "Decision recorded. Settlement or sync may be incomplete.";
  
  const standingDelta = Math.round(
    (Number(recap.standingAfter) || 0) - (Number(recap.standingBefore) || 0),
  );

  const dismiss = () => {
    onDismiss?.();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="instance summary"
      style={{
        position: "absolute",
        inset: 0,
        zIndex: 2000,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        pointerEvents: "auto",
        background: "rgba(0, 0, 0, 0.35)",
      }}
    >
      <div
        style={{
          maxWidth: 420,
          width: "min(92vw, 420px)",
          color: "#111",
          background: "rgba(255, 255, 255, 0.96)",
          borderRadius: 10,
          padding: "16px 18px",
          fontWeight: 600,
          lineHeight: 1.45,
          boxShadow: "0 8px 32px rgba(0,0,0,0.12)",
        }}
      >
        <div style={{ fontSize: 15, marginBottom: 10}}>Instance Recap</div>
        {goldExplain ? (
          <div
            style={{
              fontSize: 12,
              marginBottom: 10,
              fontWeight: 500,
              opacity: 0.88,
            }}
          >
            {goldExplain}
          </div>
        ) : null}
        <div style={{ fontSize: 13, marginBottom: 8}}>
          Gold: {recap.stake} → {recap.payout} → net {fmtDelta(recap.net)}
        </div>
        <div style={{ fontSize: 13, marginBottom: 8 }}>
          Values: {deltaLine(recap.valueDeltas)}
        </div>
        <div style={{ fontSize: 13, marginBottom: 8 }}>
          Standing: {fmtDelta(standingDelta)} (now{" "}
          {Math.round(Number(recap.standingAfter) || 0)})
        </div>
        <div style={{ fontSize: 13, marginBottom: 8 }}>
          Outcome:{" "}
          <span style={{ fontFamily: "monospace", fontWeight: 700 }}>
            {recap.outcomeLabel}
          </span>
        </div>
        {outcomeExplain ? (
          <div
            style={{
              fontSize: 12,
              marginBottom: 10,
              fontWeight: 500,
              opacity: 0.88,
            }}
          >
            {outcomeExplain}
          </div>
        ) : null}
        {mood ? (
          <div
            style={{
              fontSize: 11,
              opacity: 0.55,
              marginBottom: 12,
              fontWeight: 500,
            }}
          >
            Social mood: {mood}
          </div>
        ) : null}

        {recap.valueDampMultiplier != null &&
        recap.valueDampMultiplier < 0.999 ? (
          <div
            style={{
              fontSize: 11,
              opacity: 0.55,
              marginBottom: 8,
              fontWeight: 500,
            }}
          >
            Diminishing returns: similar outcomes in the last window scaled value changes (x{recap.valueDampMultiplier.toFixed(2)}).
          </div>
        ) : null}

        <div
          style={{
            fontSize: 12,
            marginBottom: 12,
            paddingTop: 8,
            borderTop: "1px solid rgba(0, 0, 0, 0.08)",
            fontWeight: 600,
          }}
        >
          {saveText}
        </div>

        <button
          type="button"
          onClick={dismiss}
          style={{
            width: "100%",
            padding: "10px 10px",
            fontWeight: 700,
            borderRadius: 6,
            border: "1px solid rgba(0, 0, 0, 0.2)",
            background: "rgba(255, 255, 255, 0.95)",
            cursor: "pointer",
          }}
        >
          Continue
        </button>
      </div>
    </div>
  );
}