// Seasonal zone map for the learning world.
// The world is one tall vertical canvas; as the learner scrolls down the
// roadmap the scenery drifts from a sunny summer meadow through a golden
// autumn into a cold, snowy winter.
export const WORLD_HEIGHT = 3200;

export const SEASON_BANDS = {
  summer: { start: 0, end: 1050 },
  autumn: { start: 1050, end: 2150 },
  winter: { start: 2150, end: 3200 },
} as const;

// Deterministic PRNG so particle fields (leaves, snow) render identically on
// the server and the client instead of hydration-mismatching on Math.random.
export function seededRandom(seed: number) {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
