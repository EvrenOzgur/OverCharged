import _ from 'lodash';
import type { Tween } from 'svelte/motion';

import { stateBet } from 'state-shared';
import { createEnhanceBoard, createReelForCascading } from 'utils-slots';
import { createGetWinLevelDataByWinLevelAlias } from 'utils-shared/winLevel';

import type { GameType, RawSymbol, SymbolState } from './types';
import { stateLayoutDerived } from './stateLayout';
import { boardCalibration } from './boardCalibration.svelte';
import { winLevelMap } from './winLevelMap';
import { eventEmitter } from './eventEmitter';
import {
	SYMBOL_SIZE,
	BOARD_SIZES,
	INITIAL_BOARD,
	BOARD_DIMENSIONS,
	SPIN_OPTIONS_DEFAULT,
	SPIN_OPTIONS_FAST,
	INITIAL_SYMBOL_STATE,
	SCATTER_LAND_SOUND_MAP,
} from './constants';

const onSymbolLand = ({
	rawSymbol,
	symbolIndexOfBoard,
}: {
	rawSymbol: RawSymbol;
	symbolIndexOfBoard?: number;
}) => {
	// The reel fires onSymbolLand for EVERY raw symbol, including the off-screen
	// padding rows (top = -1, bottom = BOARD_DIMENSIONS.y). Those must not play
	// landing sounds or bump the scatter counter — only visible rows count.
	// (The tumble path already gates padding itself and passes no index → skip.)
	if (
		symbolIndexOfBoard !== undefined &&
		(symbolIndexOfBoard < 0 || symbolIndexOfBoard >= BOARD_DIMENSIONS.y)
	) {
		return;
	}

	if (rawSymbol.name === 'S') {
		eventEmitter.broadcast({ type: 'soundScatterCounterIncrease' });
		eventEmitter.broadcast({
			type: 'soundOnce',
			name: SCATTER_LAND_SOUND_MAP[scatterLandIndex()],
		});
	}

	if (rawSymbol.name === 'W') {
		eventEmitter.broadcast({
			type: 'soundOnce',
			name: 'sfx_multiplier_landing',
		});
	}
};

const board = _.range(BOARD_DIMENSIONS.x).map((reelIndex) => {
	const reel = createReelForCascading({
		reelIndex,
		symbolHeight: SYMBOL_SIZE,
		initialSymbols: INITIAL_BOARD[reelIndex],
		initialSymbolState: INITIAL_SYMBOL_STATE,
		onReelStopping: () => {
			eventEmitter.broadcast({
				type: 'soundOnce',
				name: 'sfx_reel_stop_1',
				forcePlay: !stateBet.isTurbo,
			});
		},
		onSymbolLand,
	});

	reel.reelState.spinOptions = () =>
		reel.reelState.spinType === 'fast' ? SPIN_OPTIONS_FAST : SPIN_OPTIONS_DEFAULT;

	return reel;
});

export type Reel = (typeof board)[number];
export type ReelSymbol = Reel['reelState']['symbols'][number];

export type TumbleSymbol = {
	symbolY: Tween<number>;
	rawSymbol: RawSymbol;
	symbolState: SymbolState;
	oncomplete: () => void;
};

export const stateGame = $state({
	board,
	gameType: 'basegame' as GameType,
	tumbleBoardAdding: [] as TumbleSymbol[][],
	tumbleBoardBase: [] as TumbleSymbol[][],
	scatterCounter: 0,
	globalMultiplier: 1,
	// TEST/MODE toggle: when true, every spin auto-skips the symbol explosion
	// animations (the tumble per-symbol explosions AND the green L2 explosion
	// burst). Lets QA reach the final board fast without manually pressing Space.
	// Driven by the MODE button in FooterMenuOverlay; read by TumbleBoard +
	// Board explosion handlers.
	skipExplosions: false,
	skillMeters: {
		L1: 0, // Yellow
		L2: 0, // Green
		L3: 0, // Blue
		L4: 0, // Red
	},
});

const boardLayout = () => ({
	// Centre on the canvas, then shift by the measured offset so the grid lands
	// on the bgCharacters spine's embedded board well (see boardCalibration).
	// The board well is lifted in laptop/desktop via the target_landscape_board
	// bone (see BackgroundLayer), and the symbols follow it through this measured
	// offset — no separate symbol nudge needed.
	x: stateLayoutDerived.mainLayout().width * 0.5 + boardCalibration.offsetX,
	y: stateLayoutDerived.mainLayout().height * 0.5 + boardCalibration.offsetY,
	anchor: { x: 0.5, y: 0.5 },
	pivot: { x: BOARD_SIZES.width / 2, y: BOARD_SIZES.height / 2 },
	// Applied by BoardContainer so the board scales as one unit to fill the
	// bgCharacters well across orientations.
	scale: boardCalibration.scale,
	...BOARD_SIZES,
});

const boardRaw = () =>
	board.map((reel) => reel.reelState.symbols.map((reelSymbol) => reelSymbol.rawSymbol));

const tumbleBoardCombined = () => {
	const tumbleBoardCombined = stateGame.tumbleBoardBase.map((tumbleReelBase, reelIndex) => {
		const tumbleReelAdding = stateGame.tumbleBoardAdding[reelIndex] ?? [];
		return [...tumbleReelAdding, ...tumbleReelBase];
	});

	return tumbleBoardCombined;
};

const scatterLandIndex = () => {
	if (stateGame.scatterCounter > 5) return 5;
	if (stateGame.scatterCounter < 1) return 1;
	return stateGame.scatterCounter as 1 | 2 | 3 | 4 | 5;
};

const { enhanceBoard } = createEnhanceBoard();
const enhancedBoard = enhanceBoard({ board: stateGame.board });

// win levels

export const { getWinLevelDataByWinLevelAlias } = createGetWinLevelDataByWinLevelAlias({
	winLevelMap,
});

export const stateGameDerived = {
	onSymbolLand,
	boardLayout,
	boardRaw,
	tumbleBoardCombined,
	scatterLandIndex,
	enhancedBoard,
	getWinLevelDataByWinLevelAlias,
};
