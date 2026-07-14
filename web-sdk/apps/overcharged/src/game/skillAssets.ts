import type { SoundName } from './sound';

// Per-skill asset overrides.
// L3 currently reuses the same SFX and Spine animation as the M-symbol
// multiplier activation. This module exists so future L3-specific assets
// (dedicated sound, bespoke animation track, popup VFX) can be swapped in
// without touching the M-symbol activation path in
// `bookEventHandlerMap.multiplierSymbolActivated` or the default branch
// of `GlobalMultiplier.globalMultiplierUpdate`.
export const SKILL_L3_ASSETS = {
	sfx: 'sfx_skill_activation' as SoundName,
	// Animation name that GlobalMultiplier's Spine track plays when the
	// multiplier change originates from an L3 skill trigger.
	multiplierAnimation: 'increment' as const,
};

export type MultiplierUpdateSource = 'symbol' | 'skill';
