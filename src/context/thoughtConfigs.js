import {
  DICTATOR_PROMPT,
  VOLUNTEER_PROMPT,
  EXCHANGE_PROMPT,
  TRUST_PROMPT,
} from "./thoughtPrompts";
import {
  LazyDictator,
  LazyVolunteer,
  LazyExchange,
  LazyTrust,
} from "../Components/DilemmaLazy";

export const thoughtConfigs = {
  dictator: {
    id: "dictator",
    key: "dictatorGame",

    basePosition: [0, 5, -370],
    portalPosition: [0, 5, -400],
    meshPos: [0, 6, 150],
    playerSpawn: [0, 20, -100],

    startDialogue: `HELLO THERE ! COME CLOSER`,
    startPosition: [0, 20, 150],
    updateDialogue: `DRAG THE COINS TO THE MARKED AREA \nACCORDING TO YOUR PROPOSED DIVISION.`,
    updatePosition: [-10, 20, 150],
    endDialogue: `TAKE YOUR TIME.`,
    endPosition: [15, 20, 150],
    prompt: DICTATOR_PROMPT,
    promptPosition: [0, 40, 130],
    dilemmaComponent: LazyDictator,
    dilemmaPosition: [0, 5, -470],
  },

  volunteer: {
    id: "volunteer",
    key: "volunteerDilemma",

    basePosition: [-550, 5, -800],
    portalPosition: [0, 4, -400],
    meshPos: [0, 6, 0],
    playerSpawn: [0, 20, -100],

    startDialogue: `FEELING  RISKY  TODAY ?`,
    startPosition: [0, 20, 0],
    updateDialogue: `COLOR THE OPTION BY WALKING OVER IT.\nIF YOU CHANGE YOUR MIND, USE THE ERASER.`,
    updatePosition: [-20, 20, 0],
    endDialogue: `MAY LUCK BE ON YOUR SIDE.`,
    endPosition: [0, 20, 0],

    prompt: VOLUNTEER_PROMPT,
    promptPosition: [0, 40, 0],
    dilemmaComponent: LazyVolunteer,
    dilemmaPosition: [-550, 5, -800],
  },

  exchange: {
    id: "exchange",
    key: "exchangeGame",

    basePosition: [0, 5, -1100],
    portalPosition: [0, 5, -400],
    meshPos: [0, 6, 0],
    playerSpawn: [0, 20, -100],

    startDialogue: `WANNA  MAKE  A  TRADE ?`,
    startPosition: [0, 20, 0],
    updateDialogue: `PUSH THE APPLE ONTO THE LEFT AREA TO EXCHANGE \n    OR HIDE IT BEHIND THE LEFT WALL TO KEEP.`,
    updatePosition: [-35, 20, 0],
    endDialogue: `ONCE BITTEN, TWICE SHY.`,
    endPosition: [0, 20, 0],

    prompt: EXCHANGE_PROMPT,
    promptPosition: [0, 40, -20],
    dilemmaComponent: LazyExchange,
    dilemmaPosition: [0, 5, -1100],
  },

  trust: {
    id: "trust",
    key: "trustGame",

    basePosition: [550, 5, -800],
    portalPosition: [0, 5, -400],
    meshPos: [0, 6, 0],
    playerSpawn: [0, 20, -100],

    startDialogue: `DO  YOU  TRUST  ME ?`,
    startPosition: [0, 20, 0],
    updateDialogue: `DRAG THE AMOUNT OF COINS YOU WANT \n    TO SEND ONTO THE MARKED AREAS.`,
    updatePosition: [-20, 20, 0],
    endDialogue: `FOOL ME ONCE, SHAME ON YOU. \nFOOL ME TWICE, SHAME ON ME.`,
    endPosition: [0, 20, 0],

    prompt: TRUST_PROMPT,
    promptPosition: [0, 40, 0],
    dilemmaComponent: LazyTrust,
    dilemmaPosition: [550, 5, -800],
  },
};
