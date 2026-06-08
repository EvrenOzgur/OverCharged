import _ from 'lodash';
import { stateBet } from 'state-shared';
import { createPlayBookUtils } from 'utils-book';
import { createGetEmptyPaddedBoard } from 'utils-slots';

import { SYMBOL_SIZE, REEL_PADDING, SYMBOL_INFO_MAP, BOARD_DIMENSIONS } from './constants';
import { eventEmitter } from './eventEmitter';
import type { Bet, BookEventOfType } from './typesBookEvent';
import { bookEventHandlerMap } from './bookEventHandlerMap';
import type { RawSymbol, SymbolState } from './types';

// general utils
export const getEmptyBoard = createGetEmptyPaddedBoard({ reelsDimensions: BOARD_DIMENSIONS }).getEmptyBoard;
const rawPlayBookUtils = createPlayBookUtils({ bookEventHandlerMap });
export const playBookEvent = rawPlayBookUtils.playBookEvent;

// ─── STAKE-DEBUG: per-bet flow logging ────────────────────────────────────
// Default ON during the test/QA phase. To silence in a session, run in console:
//   localStorage.STAKE_DEBUG = '0'
// Or set window.__STAKE_DEBUG = false. To turn back on:
//   localStorage.STAKE_DEBUG = '1'
// Stake's iframe shell strips URL params and reloads to its canonical URL, so
// URL-param toggling does not survive — use localStorage (origin-persistent)
// for sticky control across sessions.
const isDebug = () => {
	if (typeof window === 'undefined') return false;
	try {
		const ls = window.localStorage?.getItem('STAKE_DEBUG');
		if (ls === '1') return true;
		if (ls === '0') return false;
	} catch {
		// localStorage may throw in sandboxed iframes — fall through
	}
	const w = window as { __STAKE_DEBUG?: boolean };
	if (w.__STAKE_DEBUG === true) return true;
	if (w.__STAKE_DEBUG === false) return false;
	try {
		const p = new URLSearchParams(window.location.search).get('debug');
		if (p === '1') return true;
		if (p === '0') return false;
	} catch {
		// URLSearchParams parse failure — fall through
	}
	// Test/QA default. Flip to `false` when shipping to production.
	return true;
};

export const playBookEvents = async (bookEvents: Bet['state']) => {
	if (!isDebug()) {
		await rawPlayBookUtils.playBookEvents(bookEvents);
		return;
	}
	// Debug-mode iteration: log every event with index + type + key fields.
	for (let i = 0; i < bookEvents.length; i++) {
		const ev = bookEvents[i] as any;
		const summary = (() => {
			if (ev.type === 'reveal') return `gameType=${ev.gameType}`;
			if (ev.type === 'winInfo')
				return `totalWin=${ev.totalWin} wins=${ev.wins?.length}`;
			if (ev.type === 'tumbleBoard')
				return `explode=${ev.explodingSymbols?.length}`;
			if (ev.type === 'skillActivated')
				return `skill=${ev.skillType}${ev.positions ? ' pos=' + ev.positions.length : ''}`;
			if (ev.type === 'multiplierSymbolActivated')
				return `symbols=${ev.symbols?.length} globalMult=${ev.newGlobalMultiplier}`;
			if (ev.type === 'updateGlobalMult') return `globalMult=${ev.globalMult}`;
			if (ev.type === 'finalMultiplierApplied')
				return `finalMult=${ev.finalMultiplier} baseWin=${ev.baseWin} totalWin=${ev.totalWin}`;
			if (ev.type === 'setWin') return `amount=${ev.amount} winLevel=${ev.winLevel}`;
			if (ev.type === 'setTotalWin') return `amount=${ev.amount}`;
			if (ev.type === 'freeSpinTrigger')
				return `totalFs=${ev.totalFs} addedFs=${ev.addedFs}`;
			if (ev.type === 'freeSpinRetrigger')
				return `totalFs=${ev.totalFs} addedFs=${ev.addedFs}`;
			if (ev.type === 'updateFreeSpin') return `${ev.amount}/${ev.total}`;
			if (ev.type === 'updateTumbleWin') return `amount=${ev.amount}`;
			if (ev.type === 'finalWin') return `amount=${ev.amount}`;
			if (ev.type === 'wincap') return 'WINCAP!';
			return '';
		})();
		const t0 = performance.now();
		console.log(`[STAKE-DEBUG] [${i + 1}/${bookEvents.length}] ${ev.type} ${summary}`);
		try {
			await playBookEvent(ev, { bookEvents } as any);
		} catch (err) {
			console.error(
				`[STAKE-DEBUG] event [${i + 1}/${bookEvents.length}] ${ev.type} FAILED:`,
				err,
				'event payload:',
				ev,
			);
			throw err;
		}
		const elapsed = (performance.now() - t0).toFixed(0);
		if (Number(elapsed) > 100) {
			console.log(`[STAKE-DEBUG]   └─ took ${elapsed}ms`);
		}
	}
};

export const playBet = async (bet: Bet) => {
	if (isDebug()) {
		console.group(
			`[STAKE-DEBUG] playBet :: mode=${(bet as any).mode ?? '?'} amount=${(bet as any).amount ?? '?'} events=${bet.state?.length ?? 0} payoutMult=${(bet as any).payoutMultiplier ?? '?'}`,
		);
	}
	const t0 = performance.now();
	stateBet.winBookEventAmount = 0;
	try {
		await playBookEvents(bet.state);
		eventEmitter.broadcast({ type: 'stopButtonEnable' });
		if (isDebug()) {
			const elapsed = ((performance.now() - t0) / 1000).toFixed(2);
			console.log(
				`[STAKE-DEBUG] playBet DONE in ${elapsed}s — final balance: winBookEventAmount=${stateBet.winBookEventAmount}`,
			);
		}
	} catch (err) {
		console.error('[STAKE-DEBUG] playBet FAILED:', err);
		throw err;
	} finally {
		if (isDebug()) console.groupEnd();
	}
};

// resume bet
const BOOK_EVENT_TYPES_TO_RESERVE_FOR_SNAPSHOT = [
	'updateGlobalMult',
	'freeSpinTrigger',
	'freeSpinRetrigger',
	'updateFreeSpin',
	'setTotalWin',
	'skillActivated',
	'multiplierSymbolActivated',
];

export const convertTorResumableBet = (lastBetData: Bet) => {
	const resumingIndex = Number(lastBetData.event);
	const bookEventsBeforeResume = lastBetData.state.filter(
		(_, eventIndex) => eventIndex < resumingIndex,
	);
	const bookEventsAfterResume = lastBetData.state.filter(
		(_, eventIndex) => eventIndex >= resumingIndex,
	);

	const bookEventToCreateSnapshot: BookEventOfType<'createBonusSnapshot'> = {
		index: 0,
		type: 'createBonusSnapshot',
		bookEvents: bookEventsBeforeResume.filter((bookEvent) =>
			BOOK_EVENT_TYPES_TO_RESERVE_FOR_SNAPSHOT.includes(bookEvent.type),
		),
	};

	const stateToResume = [bookEventToCreateSnapshot, ...bookEventsAfterResume];

	return { ...lastBetData, state: stateToResume };
};

// other utils
export const getSymbolX = (reelIndex: number) => SYMBOL_SIZE * (reelIndex + REEL_PADDING);
export const getSymbolY = (symbolIndexOfBoard: number) => (symbolIndexOfBoard + 0.5) * SYMBOL_SIZE;

export const getSymbolKey = ({ rawSymbol }: { rawSymbol: RawSymbol }) => {
	const baseName = rawSymbol.name as keyof typeof SYMBOL_INFO_MAP;
	if (rawSymbol.multiplier !== undefined) {
		const keyWithMultiplier = `${rawSymbol.name}_${rawSymbol.multiplier}` as keyof typeof SYMBOL_INFO_MAP;
		if (SYMBOL_INFO_MAP[keyWithMultiplier]) {
			return keyWithMultiplier;
		}
	}
	return baseName;
};

export const getSymbolInfo = ({
	rawSymbol,
	state,
}: {
	rawSymbol: RawSymbol;
	state: SymbolState;
}) => {
	const symbolKey = getSymbolKey({ rawSymbol });
	const info = SYMBOL_INFO_MAP[symbolKey][state];
	// Multiplier symbol: pick the per-value skin (`2x`, `5x`, …) from the
	// rawSymbol's multiplier so the new `multipliers` spine shows the right value.
	if (info && (info as { assetKey?: string }).assetKey === 'multipliers' && rawSymbol.multiplier) {
		return { ...info, skin: `${rawSymbol.multiplier}x` };
	}
	return info;
};
