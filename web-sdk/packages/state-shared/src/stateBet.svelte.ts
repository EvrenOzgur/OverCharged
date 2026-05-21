import type { BaseBet } from 'utils-bet';
import { stateMeta } from './stateMeta.svelte';
import { stateConfig } from './stateConfig.svelte';

export type Currency = string;
export type LastBet = BaseBet | null;
export type BetModeKey = string;

export const stateBet = $state({
	currency: 'USD' as Currency,
	balanceAmount: 0,
	betAmount: 1,
	wageredBetAmount: 1,
	lastBet: null as LastBet,
	activeBetModeKey: 'BASE' as BetModeKey,
	winBookEventAmount: 0,
	autoSpinsLoss: 0,
	autoSpinsCounter: 0,
	autoSpinsLossLimitAmount: Infinity,
	autoSpinsSingleWinLimitAmount: Infinity,
	isSpaceHold: false,
	isTurbo: false,
});

const correctBetAmount = (value: number) => {
	if (value <= 0) return 0;
	const costMultiplier = betCostMultiplier();
	if (costMultiplier === 0) return 0;
	// Stake spec: bet * costMultiplier must satisfy minBet <= total <= maxBet
	// and not exceed player balance.
	const balanceCap = stateBet.balanceAmount / costMultiplier;
	const maxBetCap = (stateConfig.maxBet ?? Infinity) / costMultiplier;
	const max = Math.min(balanceCap, maxBetCap);
	if (value >= max) return max;
	const minBetFloor = (stateConfig.minBet ?? 0) / costMultiplier;
	if (value < minBetFloor && minBetFloor <= max) return minBetFloor;
	return value;
};

const setBetAmount = (value: number) => {
	stateBet.betAmount = correctBetAmount(value);
};

const updateBetAmount = (update: (value: number) => number) => {
	stateBet.betAmount = correctBetAmount(update(stateBet.betAmount));
};

let isTurboLocked = false;

const updateIsTurbo = (value: boolean, options: { persistent: boolean }) => {
	const { persistent } = options;

	if (!persistent && isTurboLocked) return;
	if (persistent) isTurboLocked = value;

	stateBet.isTurbo = value;
};

// Defensive case-insensitive lookup. Math SDK BetMode names are lowercase
// ("base", "bonus") while DEFAULT_BET_MODE_META uses uppercase keys ("BASE",
// "BONUS", ...). Stake's bet-replay URL passes the math key as-is, so a
// strict lookup misses and returns null — which then crashes downstream
// readers like betCostMultiplier(). Try the exact key, then upper / lower.
const activeBetMode = () => {
	const meta = stateMeta.betModeMeta;
	if (!meta) return null;
	const key = stateBet.activeBetModeKey;
	return meta[key] || meta[key?.toUpperCase?.()] || meta[key?.toLowerCase?.()] || null;
};
const isContinuousBet = () => stateBet.autoSpinsCounter > 1 || stateBet.isSpaceHold;
const timeScale = () => (stateBet.isTurbo ? 2 : 1);
const betCostMultiplier = () => {
	const m = stateBetDerived.activeBetMode();
	return m?.type === 'activate' ? m.costMultiplier : 1;
};
const betCost = () => stateBet.betAmount * betCostMultiplier();
const isBetCostAvailable = () => betCost() > 0 && betCost() <= stateBet.balanceAmount;
const hasAutoBetCounter = () => stateBet.autoSpinsCounter !== 0;

export const stateBetDerived = {
	setBetAmount,
	updateBetAmount,
	updateIsTurbo,
	activeBetMode,
	isContinuousBet,
	timeScale,
	betCost,
	isBetCostAvailable,
	hasAutoBetCounter,
};
