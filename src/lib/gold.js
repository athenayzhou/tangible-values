const TRUST_START_COINS = 10;

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
