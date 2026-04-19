const TRUST_START_COINS = 10;

function resolveExchange(value) {
  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    if (normalized === "exchange" || normalized === "deceive") {
      return normalized;
    }
  }
  return value === true ? "exchange" : "deceive";
}

export function stakeForThought(thoughtId) {
  switch (thoughtId) {
    case "dictator":
      return 0;
    case "volunteer":
      return 0;
    case "exchange":
      return 3;
    case "trust":
      return TRUST_START_COINS;
    default:
      return 0;
  }
}

export function isInsufficientStake(err) {
  const parts = [
    err?.message,
    err?.details,
    err?.hint,
    typeof err === "string" ? err : "",
  ]
    .filter(Boolean)
    .join(" ");
  return /insufficient gold for stake/i.test(parts);
}

export function payoutForDecision(thoughtId, decisionValue, outcomeMeta = {}) {
  switch (thoughtId) {
    case "dictator": {
      const receiver = Number(decisionValue) || 0;
      return Math.max(0, 10 - receiver);
    }
    case "volunteer": {
      const choice = Number(decisionValue);
      if (choice === 1) return 1;
      if (choice !== 5) return 0;
      const confedChoices = Array.isArray(outcomeMeta.confedChoices)
        ? outcomeMeta.confedChoices.map((value) => Number(value))
        : [];
      return confedChoices.some((value) => value === 1) ? 5 : 0;
    }
    case "trust": {
      const sent = Math.max(
        0,
        Math.min(TRUST_START_COINS, Number(decisionValue) || 0),
      );
      const returned = Math.max(0, Number(outcomeMeta.returned) || 0);
      return TRUST_START_COINS - sent + returned;
    }
    case "exchange": {
      const playerChoice = resolveExchange(decisionValue);
      const confedChoice = resolveExchange(outcomeMeta.confedChoice);
      if (playerChoice === "deceive" && confedChoice === "deceive") return 2;
      if (playerChoice === "exchange" && confedChoice === "exchange") return 5;
      if (playerChoice === "deceive" && confedChoice === "exchange") return 7;
      return 0;
    }
    default:
      return 0;
  }
}
