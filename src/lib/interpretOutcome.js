import { stakeForThought } from "./gold";

export function interpretGold(thoughtId) {
  const stake = Number(stakeForThought(thoughtId)) || 0;
  if (thoughtId === "dictator") {
    return "no entry stake. you split 10 coins. coins you keep become your gold payout.";
  }
  if (thoughtId === "volunteer") {
    return "no entry stake. payout depends on your instance's majority choice.";
  }
  if (thoughtId === "exchange") {
    return `entering the exchange costs ${stake} gold (debited at the portal). payout follows this room’s payoff chart.`;
  }
  if (thoughtId === "trust") {
    return `entering trust costs ${stake} gold (debited at the portal). final gold is stake minus sent coins plus returned coins.`;
  }
  return "";
}

export function interpretOutcome(thoughtId, outcomeLabel) {
  const label = String(outcomeLabel || "neutral");

  const dictator = {
    dictator_settle:
      "your split was recorded. gold equals the coins you kept from the 10-coin pot.",
  };

  const volunteer = {
    volunteer_1_1:
      "you chose the cooperative majority (1) and at least one player did too. small payout, stronger altruism signal.",
    volunteer_1_5:
      "you chose 1 while the group leaned away from 1. small payout with a different altruism weighting.",
    volunteer_5_1:
      "you chose 5 while some players chose 1. larger payout with a greed tilt.",
    volunteer_5_5:
      "you and the group stayed on 5. no payout, strongest greed tilt.",
  };

  const trust = {
    trust_high_high:
      "you sent a high share and the partner returned generously. trust and altruism rise.",
    trust_high_low:
      "you sent a high share but got little back. trust dips while altruism still rises.",
    trust_low_high:
      "you held back but still received a strong return. greed signal rises.",
    trust_low_low:
      "low send and modest return. trust dips and greed rises.",
  };

  const exchange = {
    exchange_deceive_deceive:
      "both sides defected. small mutual payout, deceit and greed both tick up.",
    exchange_honest_honest:
      "both cooperated. solid mutual payout with trust and altruism gains.",
    exchange_deceive_honest:
      "you defected against a cooperator. large payout with deceit and greed gains.",
    exchange_honest_deceive:
      "you cooperated and were defected against. no payout and a trust penalty.",
  };

  const table = {
    ...dictator,
    ...volunteer,
    ...trust,
    ...exchange,
  };

  if (table[label]) return table[label];

  if (thoughtId === "dictator") {
    return "your dictator split was saved. see the value line for score changes this run.";
  }
  if (thoughtId === "volunteer") {
    return "volunteer round complete. see value deltas for how this run scored it.";
  }
  if (thoughtId === "trust") {
    return "trust round complete. see value deltas for how this run scored it.";
  }
  if (thoughtId === "exchange") {
    return "exchange round complete. see value deltas for how this run scored it.";
  }

  return "this round finished. see gold and value lines for the recorded result.";
}
