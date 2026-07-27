import _ from 'lodash';

import { stateBet, stateBetDerived } from 'state-shared';
import { checkIsMultipleRevealEvents } from 'utils-book';
import { createPrimaryMachines, createIntermediateMachines, createGameActor } from 'utils-xstate';

import type { Bet } from './typesBookEvent';
import { stateXstateDerived } from './stateXstate';
import { playBet, convertTorResumableBet } from './utils';
import { stateGameDerived } from './stateGame.svelte';

const primaryMachines = createPrimaryMachines<Bet>({
	onResumeGameActive: (lastBetData) => {
		return convertTorResumableBet(lastBetData);
	},
	onResumeGameInactive: (lastBetData) => {
		const lastRevealEvent = _.findLast(
			lastBetData.state,
			(bookEvent) => bookEvent?.type === 'reveal',
		);

		if (lastRevealEvent) stateGameDerived.enhancedBoard.settle(lastRevealEvent.board);
	},
	onNewGameStart: async () => {
		if ((stateBet.isTurbo && stateXstateDerived.isAutoBetting()) || stateBet.isSpaceHold) return;
		stateBet.winBookEventAmount = 0;
		// Deliberately NOT awaited: createPrimaryMachines.ts's `newGame` actor
		// runs `await onNewGameStart(); await handleRequestBet(...)` in strict
		// sequence, so awaiting the full fallOut animation here means the
		// /wallet/play request doesn't even start until every reel has
		// finished visually clearing — stacking full network latency on top
		// of the clear animation, with the board empty the whole time. Firing
		// preSpin without awaiting lets the RGS call start immediately,
		// overlapping with the clear animation instead of waiting for it.
		// Still safe: `enhancedBoard.spin()` (called once the reveal event
		// arrives) awaits each reel's own `readyToSpin` before doing
		// anything, so fall-in still correctly waits for fall-out to finish
		// if the network responds first.
		stateGameDerived.enhancedBoard.preSpin({}).catch(() => {});
	},
	onNewGameError: () => {
		stateGameDerived.enhancedBoard.settle();
	},
	onPlayGame: async (bet) => {
		await playBet(bet);
		// A bonus "buy" is a one-shot purchase: revert to BASE once the bought
		// round has fully played out, so the next manual spin is a normal base
		// bet rather than another 100× buy. The old Pixi ButtonBuyBonus used to
		// own this reset; it was lost when FooterMenuOverlay replaced that UI.
		if (stateBetDerived.activeBetMode()?.type === 'buy') {
			stateBet.activeBetModeKey = 'BASE';
		}
	},
	checkIsBonusGame: (bet) => checkIsMultipleRevealEvents({ bookEvents: bet.state }),
});

const intermediateMachines = createIntermediateMachines(primaryMachines);

export const gameActor = createGameActor(intermediateMachines);
