import { payoutForDecision } from "./gold";

const TRUST_HIGH_THRESHOLD = 5;

function normalizeExchange(value) {
  if(typeof value === "string"){
    const v = value.trim().toLowerCase();
    if(v === "exchange" || v === "honest") return "honest";
    return "deceive";
  }
  return value === true ? "honest" : "deceive";
}

function volunteerOutcomeTag(decisionValue, confedChoices = []){
  const choice = Number(decisionValue);
  const hasAnyOne = confedChoices.map(Number).some((v) => v === 1);

  if(choice === 1 && hasAnyOne) return "1_1";
  if(choice === 1 && !hasAnyOne) return "1_5";
  if(choice === 5 && hasAnyOne) return "5_1";
  return "5_5";
}

export function classifyOutcome(thoughtId, decisionValue, outcomeMeta = {}){
  const base = {
    goldPayout: payoutForDecision(thoughtId, decisionValue, outcomeMeta),
    valueDeltas: { trust: 0, altruism: 0, deceit: 0, greed: 0 },
    label: "neutral",
  };

  switch(thoughtId) {
    case "dictator": {
      const receiver = Number(decisionValue) || 0;
      const kept = Math.max(0, 10-receiver);
      if(kept >= 8){
        base.valueDeltas.greed += 2;
      } else if (kept >= 5){
        base.valueDeltas.greed += 1;
      }
      base.label = "dictator_settle";
      return base;
    }
    
    case "volunteer": {
      const confedChoices = Array.isArray(outcomeMeta.confedChoices)
        ? outcomeMeta.confedChoices
        : [];
      const tag = volunteerOutcomeTag(decisionValue, confedChoices);

      if(tag === "1_1"){
        base.valueDeltas.altruism += 2;
        base.label = "volunteer_1_1";
      } else if (tag === "1_5"){
        base.valueDeltas.altruism += 3;
        base.label = "volunteer_1_5";
      } else if (tag === "5_1"){
        base.valueDeltas.greed += 1;
        base.label = "volunteer_5_1";
      } else {
        base.valueDeltas.greed += 2;
        base.label = "volunteer_5_5";
      }
      return base;
    }

    case "exchange": {
      const player = normalizeExchange(decisionValue);
      const confed = normalizeExchange(outcomeMeta.confedChoice);

      if(player === "honest" && confed === "honest"){
        base.valueDeltas.trust += 2;
        base.label = "exchange_honest_honest";
      } else if (player === "honest" && confed === "deceive"){
        base.valueDeltas.trust -= 1;
        base.label = "exchange_honest_deceive";
      } else if (player === "deceive" && confed === "honest"){
        base.valueDeltas.deceit += 2;
        base.label = "exchange_deceive_honest";
      } else {
        base.valueDeltas.deceit += 1;
        base.label = "exchange_deceive_deceive";
      }
      return base;
    }

    case "trust": {
      const sent = Number(decisionValue) || 0;
      const returned = Number(outcomeMeta.returned) || 0;
      const highSend = sent >= TRUST_HIGH_THRESHOLD;
      const highReturn = returned >= sent;

      if(highSend && highReturn){
        base.valueDeltas.trust += 2;
        base.valueDeltas.altruism += 1;
        base.label = "trust_high_high";
      } else if (highSend && !highReturn){
        base.valueDeltas.trust += 1;
        base.valueDeltas.altruism += 2;
        base.label = "trust_high_low";
      } else if (!highSend && highReturn){
        base.valueDeltas.greed += 1;
        base.label = "trust_low_high";
      } else {
        base.valueDeltas.greed += 2;
        base.label = "trust_low_low";
      }
      return base;
    }

    default:
      return base;
  }
}