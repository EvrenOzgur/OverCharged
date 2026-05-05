import { type CascadingReelSymbolState } from 'utils-slots';
import type config from './config';

export type SymbolName = 'W' | 'M' | 'S' | 'H1' | 'H2' | 'H3' | 'H4' | 'L1' | 'L2' | 'L3' | 'L4';
export type RawSymbol = { name: SymbolName; multiplier?: number; scatter?: boolean };
export type BetMode = keyof typeof config.betModes;
export type GameType = keyof typeof config.paddingReels;

export const SYMBOL_STATES = [
	'static',
	'spin',
	'land',
	'win',
	'postWinStatic',
	'explosion',
] as const;

export type SymbolState = CascadingReelSymbolState | (typeof SYMBOL_STATES)[number];

export type Position = {
	reel: number;
	row: number;
};
