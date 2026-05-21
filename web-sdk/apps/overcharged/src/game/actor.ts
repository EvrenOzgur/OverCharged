import _ from 'lodash';

import { stateBet } from 'state-shared';
import { checkIsMultipleRevealEvents } from 'utils-book';
import { createPrimaryMachines, createIntermediateMachines, createGameActor } from 'utils-xstate';

import type { Bet } from './typesBookEvent';
import { stateXstateDerived } from './stateXstate';
import { playBet, convertTorResumableBet } from './utils';
import { stateGameDerived } from './stateGame.svelte';

// STAKE-DEBUG helper — same toggle as utils.ts isDebug(): localStorage.STAKE_DEBUG,
// window.__STAKE_DEBUG, or URL ?debug=1. Default ON during test/QA. Logs gameActor
// lifecycle so the full BET-click → /wallet/play → playBet → done chain is visible.
const isDebug = () => {
	if (typeof window === 'undefined') return false;
	try {
		const ls = window.localStorage?.getItem('STAKE_DEBUG');
		if (ls === '1') return true;
		if (ls === '0') return false;
	} catch {
		// noop
	}
	const w = window as { __STAKE_DEBUG?: boolean };
	if (w.__STAKE_DEBUG === true) return true;
	if (w.__STAKE_DEBUG === false) return false;
	try {
		const p = new URLSearchParams(window.location.search).get('debug');
		if (p === '1') return true;
		if (p === '0') return false;
	} catch {
		// noop
	}
	return true;
};
const dbg = (...args: unknown[]) => {
	if (isDebug()) console.log('[STAKE-DEBUG]', ...args);
};

const primaryMachines = createPrimaryMachines<Bet>({
	onResumeGameActive: (lastBetData) => {
		dbg(
			`actor.onResumeGameActive — resuming bonus from event=${(lastBetData as { event?: number }).event}, total events=${lastBetData.state?.length}`,
		);
		return convertTorResumableBet(lastBetData);
	},
	onResumeGameInactive: (lastBetData) => {
		dbg('actor.onResumeGameInactive — settle last board, no resume');
		const lastRevealEvent = _.findLast(
			lastBetData.state,
			(bookEvent) => bookEvent?.type === 'reveal',
		);

		if (lastRevealEvent) stateGameDerived.enhancedBoard.settle(lastRevealEvent.board);
	},
	onNewGameStart: async () => {
		dbg(
			`actor.onNewGameStart — mode=${stateBet.activeBetModeKey} turbo=${stateBet.isTurbo} — about to call /wallet/play`,
		);
		if ((stateBet.isTurbo && stateXstateDerived.isAutoBetting()) || stateBet.isSpaceHold) return;
		stateBet.winBookEventAmount = 0;
		await stateGameDerived.enhancedBoard.preSpin({});
	},
	onNewGameError: () => {
		dbg('actor.onNewGameError — /wallet/play failed, settling board');
		stateGameDerived.enhancedBoard.settle();
	},
	onPlayGame: async (bet) => {
		dbg(
			`actor.onPlayGame — RGS returned bet: payoutMult=${(bet as { payoutMultiplier?: number }).payoutMultiplier}, events=${bet.state?.length}`,
		);
		await playBet(bet);
	},
	checkIsBonusGame: (bet) => checkIsMultipleRevealEvents({ bookEvents: bet.state }),
});

const intermediateMachines = createIntermediateMachines(primaryMachines);

export const gameActor = createGameActor(intermediateMachines);
