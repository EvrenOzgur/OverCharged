import _ from 'lodash';
import { stateBet } from 'state-shared';
import { createPlayBookUtils } from 'utils-book';
import { createGetEmptyPaddedBoard } from 'utils-slots';

import { SYMBOL_SIZE, REEL_PADDING, ROW_PADDING, SYMBOL_INFO_MAP, BOARD_DIMENSIONS } from './constants';
import { eventEmitter } from './eventEmitter';
import type { Bet, BookEventOfType } from './typesBookEvent';
import { bookEventHandlerMap } from './bookEventHandlerMap';
import type { RawSymbol, SymbolState } from './types';

// general utils
export const getEmptyBoard = createGetEmptyPaddedBoard({ reelsDimensions: BOARD_DIMENSIONS }).getEmptyBoard;
const rawPlayBookUtils = createPlayBookUtils({ bookEventHandlerMap });
export const playBookEvent = rawPlayBookUtils.playBookEvent;

export const playBookEvents = async (bookEvents: Bet['state']) => {
	await rawPlayBookUtils.playBookEvents(bookEvents);
};

export const playBet = async (bet: Bet) => {
	stateBet.winBookEventAmount = 0;
	await playBookEvents(bet.state);
	eventEmitter.broadcast({ type: 'stopButtonEnable' });
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
export const getSymbolY = (symbolIndexOfBoard: number) =>
	(symbolIndexOfBoard + ROW_PADDING) * SYMBOL_SIZE;

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
