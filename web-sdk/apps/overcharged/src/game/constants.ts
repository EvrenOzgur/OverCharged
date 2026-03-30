import _ from 'lodash';

import type { RawSymbol, SymbolState } from './types';

export const SYMBOL_SIZE = 70;

export const REEL_PADDING = 0.53;

// initial board (padded top and bottom)
export const INITIAL_BOARD: RawSymbol[][] = [
	[{ name: 'L1' }, { name: 'H1' }, { name: 'L1' }, { name: 'L2' }, { name: 'L2' }, { name: 'L3' }, { name: 'L2' }, { name: 'L3' }, { name: 'H3' }, { name: 'L1' }],
	[{ name: 'L2' }, { name: 'L2' }, { name: 'L3' }, { name: 'L2' }, { name: 'L2' }, { name: 'L3' }, { name: 'L2' }, { name: 'L2' }, { name: 'H2' }, { name: 'L1' }],
	[{ name: 'L3' }, { name: 'H3' }, { name: 'L1' }, { name: 'L1' }, { name: 'H4' }, { name: 'L2' }, { name: 'H4' }, { name: 'H4' }, { name: 'H2' }, { name: 'L1' }],
	[{ name: 'H4' }, { name: 'L1' }, { name: 'H2' }, { name: 'H2' }, { name: 'H4' }, { name: 'H2' }, { name: 'H2' }, { name: 'L3' }, { name: 'L3' }, { name: 'L1' }],
	[{ name: 'L1' }, { name: 'L1' }, { name: 'H3' }, { name: 'H1' }, { name: 'H1' }, { name: 'L2' }, { name: 'L2' }, { name: 'L3' }, { name: 'L3' }, { name: 'L1' }],
	[{ name: 'L1' }, { name: 'L2' }, { name: 'L2' }, { name: 'H1' }, { name: 'H4' }, { name: 'H4' }, { name: 'H2' }, { name: 'H3' }, { name: 'H2' }, { name: 'L1' }],
	[{ name: 'L3' }, { name: 'L3' }, { name: 'L3' }, { name: 'H3' }, { name: 'H1' }, { name: 'L3' }, { name: 'H3' }, { name: 'H3' }, { name: 'H2' }, { name: 'L1' }],
	[{ name: 'H1' }, { name: 'H2' }, { name: 'H3' }, { name: 'H4' }, { name: 'L1' }, { name: 'L2' }, { name: 'L3' }, { name: 'H1' }, { name: 'H2' }, { name: 'L1' }],
];

export const BOARD_DIMENSIONS = { x: INITIAL_BOARD.length, y: INITIAL_BOARD[0].length - 2 };

export const BOARD_SIZES = {
	width: SYMBOL_SIZE * BOARD_DIMENSIONS.x,
	height: SYMBOL_SIZE * BOARD_DIMENSIONS.y,
};

export const BACKGROUND_RATIO = 2039 / 1000;
export const PORTRAIT_BACKGROUND_RATIO = 1242 / 2208;
const PORTRAIT_RATIO = 800 / 1422;
const LANDSCAPE_RATIO = 1600 / 900;
const DESKTOP_RATIO = 1422 / 800;

const DESKTOP_HEIGHT = 800;
const LANDSCAPE_HEIGHT = 900;
const PORTRAIT_HEIGHT = 1422;
export const DESKTOP_MAIN_SIZES = { width: DESKTOP_HEIGHT * DESKTOP_RATIO, height: DESKTOP_HEIGHT };
export const LANDSCAPE_MAIN_SIZES = {
	width: LANDSCAPE_HEIGHT * LANDSCAPE_RATIO,
	height: LANDSCAPE_HEIGHT,
};
export const PORTRAIT_MAIN_SIZES = {
	width: PORTRAIT_HEIGHT * PORTRAIT_RATIO,
	height: PORTRAIT_HEIGHT,
};

export const HIGH_SYMBOLS = ['H1', 'H2', 'H3', 'H4', 'H5'];

export const INITIAL_SYMBOL_STATE: SymbolState = 'static';

const M_SIZE = 0.3;
const HIGH_SYMBOL_SIZE = 0.9;
const LOW_SYMBOL_SIZE = 0.9;
const SPECIAL_SYMBOL_SIZE = 1;

const SPIN_OPTIONS_SHARED = {
	reelFallInDelay: 80,
	reelPaddingMultiplierNormal: 1.25,
	reelPaddingMultiplierAnticipated: 18,
	reelFallOutDelay: 145,
};

export const SPIN_OPTIONS_DEFAULT = {
	...SPIN_OPTIONS_SHARED,
	symbolFallInSpeed: 3.5,
	symbolFallInInterval: 30,
	symbolFallInBounceSpeed: 0.15,
	symbolFallInBounceSizeMulti: 0.5,
	symbolFallOutSpeed: 3.5,
	symbolFallOutInterval: 20,
};

export const SPIN_OPTIONS_FAST = {
	...SPIN_OPTIONS_SHARED,
	symbolFallInSpeed: 7,
	symbolFallInInterval: 0,
	symbolFallInBounceSpeed: 0.3,
	symbolFallInBounceSizeMulti: 0.25,
	symbolFallOutSpeed: 7,
	symbolFallOutInterval: 0,
};

export const MOTION_BLUR_VELOCITY = 31;

export const zIndexes = {
	background: {
		backdrop: -3,
		normal: -2,
		feature: -1,
	},
};

const explosion = {
	type: 'spine',
	assetKey: 'highSymbols',
	animationName: 'explosion',
	sizeRatios: { width: 1, height: 1 },
};

export const SYMBOL_INFO_MAP = {
	H1: {
		explosion,
		win: {
			type: 'spine',
			assetKey: 'highSymbols',
			skin: 'h1',
			animationName: 'win',
			sizeRatios: { width: 1, height: 1 },
		},
		postWinStatic: {
			type: 'spine',
			assetKey: 'highSymbols',
			skin: 'h1',
			animationName: 'static',
			sizeRatios: { width: 1, height: 1 },
		},
		static: {
			type: 'spine',
			assetKey: 'highSymbols',
			skin: 'h1',
			animationName: 'static',
			sizeRatios: { width: 1, height: 1 },
		},
		spin: {
			type: 'spine',
			assetKey: 'highSymbols',
			skin: 'h1',
			animationName: 'spin',
			sizeRatios: { width: 1, height: 1 },
		},
		land: {
			type: 'spine',
			assetKey: 'highSymbols',
			skin: 'h1',
			animationName: 'land',
			sizeRatios: { width: 1, height: 1 },
		},
	},
	H2: {
		explosion,
		win: {
			type: 'spine',
			assetKey: 'highSymbols',
			skin: 'h2',
			animationName: 'win',
			sizeRatios: { width: 1, height: 1 },
		},
		postWinStatic: {
			type: 'spine',
			assetKey: 'highSymbols',
			skin: 'h2',
			animationName: 'static',
			sizeRatios: { width: 1, height: 1 },
		},
		static: {
			type: 'spine',
			assetKey: 'highSymbols',
			skin: 'h2',
			animationName: 'static',
			sizeRatios: { width: 1, height: 1 },
		},
		spin: {
			type: 'spine',
			assetKey: 'highSymbols',
			skin: 'h2',
			animationName: 'spin',
			sizeRatios: { width: 1, height: 1 },
		},
		land: {
			type: 'spine',
			assetKey: 'highSymbols',
			skin: 'h2',
			animationName: 'land',
			sizeRatios: { width: 1, height: 1 },
		},
	},
	H3: {
		explosion,
		win: {
			type: 'spine',
			assetKey: 'highSymbols',
			skin: 'h3',
			animationName: 'win',
			sizeRatios: { width: 1, height: 1 },
		},
		postWinStatic: {
			type: 'spine',
			assetKey: 'highSymbols',
			skin: 'h3',
			animationName: 'static',
			sizeRatios: { width: 1, height: 1 },
		},
		static: {
			type: 'spine',
			assetKey: 'highSymbols',
			skin: 'h3',
			animationName: 'static',
			sizeRatios: { width: 1, height: 1 },
		},
		spin: {
			type: 'spine',
			assetKey: 'highSymbols',
			skin: 'h3',
			animationName: 'spin',
			sizeRatios: { width: 1, height: 1 },
		},
		land: {
			type: 'spine',
			assetKey: 'highSymbols',
			skin: 'h3',
			animationName: 'land',
			sizeRatios: { width: 1, height: 1 },
		},
	},
	H4: {
		explosion,
		win: {
			type: 'spine',
			assetKey: 'highSymbols',
			skin: 'h4',
			animationName: 'win',
			sizeRatios: { width: 1, height: 1 },
		},
		postWinStatic: {
			type: 'spine',
			assetKey: 'highSymbols',
			skin: 'h4',
			animationName: 'static',
			sizeRatios: { width: 1, height: 1 },
		},
		static: {
			type: 'spine',
			assetKey: 'highSymbols',
			skin: 'h4',
			animationName: 'static',
			sizeRatios: { width: 1, height: 1 },
		},
		spin: {
			type: 'spine',
			assetKey: 'highSymbols',
			skin: 'h4',
			animationName: 'spin',
			sizeRatios: { width: 1, height: 1 },
		},
		land: {
			type: 'spine',
			assetKey: 'highSymbols',
			skin: 'h4',
			animationName: 'land',
			sizeRatios: { width: 1, height: 1 },
		},
	},
	H5: {
		explosion,
		win: {
			type: 'spine',
			assetKey: 'highSymbols',
			skin: 'h4',
			animationName: 'win',
			sizeRatios: { width: 1, height: 1 },
		},
		postWinStatic: {
			type: 'spine',
			assetKey: 'highSymbols',
			skin: 'h4',
			animationName: 'static',
			sizeRatios: { width: 1, height: 1 },
		},
		static: {
			type: 'spine',
			assetKey: 'highSymbols',
			skin: 'h4',
			animationName: 'static',
			sizeRatios: { width: 1, height: 1 },
		},
		spin: {
			type: 'spine',
			assetKey: 'highSymbols',
			skin: 'h4',
			animationName: 'spin',
			sizeRatios: { width: 1, height: 1 },
		},
		land: {
			type: 'spine',
			assetKey: 'highSymbols',
			skin: 'h4',
			animationName: 'land',
			sizeRatios: { width: 1, height: 1 },
		},
	},
	L1: {
		explosion,
		win: {
			type: 'spine',
			assetKey: 'lowSymbols',
			skin: 'blue',
			animationName: 'win',
			sizeRatios: { width: 1, height: 1 },
		},
		postWinStatic: {
			type: 'spine',
			assetKey: 'lowSymbols',
			skin: 'blue',
			animationName: 'static',
			sizeRatios: { width: 1, height: 1 },
		},
		static: {
			type: 'spine',
			assetKey: 'lowSymbols',
			skin: 'blue',
			animationName: 'static',
			sizeRatios: { width: 1, height: 1 },
		},
		spin: {
			type: 'spine',
			assetKey: 'lowSymbols',
			skin: 'blue',
			animationName: 'spin',
			sizeRatios: { width: 1, height: 1 },
		},
		land: {
			type: 'spine',
			assetKey: 'lowSymbols',
			skin: 'blue',
			animationName: 'land',
			sizeRatios: { width: 1, height: 1 },
		},
	},
	L2: {
		explosion,
		win: {
			type: 'spine',
			assetKey: 'lowSymbols',
			skin: 'green',
			animationName: 'win',
			sizeRatios: { width: 1, height: 1 },
		},
		postWinStatic: {
			type: 'spine',
			assetKey: 'lowSymbols',
			skin: 'green',
			animationName: 'static',
			sizeRatios: { width: 1, height: 1 },
		},
		static: {
			type: 'spine',
			assetKey: 'lowSymbols',
			skin: 'green',
			animationName: 'static',
			sizeRatios: { width: 1, height: 1 },
		},
		spin: {
			type: 'spine',
			assetKey: 'lowSymbols',
			skin: 'green',
			animationName: 'spin',
			sizeRatios: { width: 1, height: 1 },
		},
		land: {
			type: 'spine',
			assetKey: 'lowSymbols',
			skin: 'green',
			animationName: 'land',
			sizeRatios: { width: 1, height: 1 },
		},
	},
	L3: {
		explosion,
		win: {
			type: 'spine',
			assetKey: 'lowSymbols',
			skin: 'red',
			animationName: 'win',
			sizeRatios: { width: 1, height: 1 },
		},
		postWinStatic: {
			type: 'spine',
			assetKey: 'lowSymbols',
			skin: 'red',
			animationName: 'static',
			sizeRatios: { width: 1, height: 1 },
		},
		static: {
			type: 'spine',
			assetKey: 'lowSymbols',
			skin: 'red',
			animationName: 'static',
			sizeRatios: { width: 1, height: 1 },
		},
		spin: {
			type: 'spine',
			assetKey: 'lowSymbols',
			skin: 'red',
			animationName: 'spin',
			sizeRatios: { width: 1, height: 1 },
		},
		land: {
			type: 'spine',
			assetKey: 'lowSymbols',
			skin: 'red',
			animationName: 'land',
			sizeRatios: { width: 1, height: 1 },
		},
	},
	L4: {
		explosion,
		win: {
			type: 'spine',
			assetKey: 'lowSymbols',
			skin: 'yellow',
			animationName: 'win',
			sizeRatios: { width: 1, height: 1 },
		},
		postWinStatic: {
			type: 'spine',
			assetKey: 'lowSymbols',
			skin: 'yellow',
			animationName: 'static',
			sizeRatios: { width: 1, height: 1 },
		},
		static: {
			type: 'spine',
			assetKey: 'lowSymbols',
			skin: 'yellow',
			animationName: 'static',
			sizeRatios: { width: 1, height: 1 },
		},
		spin: {
			type: 'spine',
			assetKey: 'lowSymbols',
			skin: 'yellow',
			animationName: 'spin',
			sizeRatios: { width: 1, height: 1 },
		},
		land: {
			type: 'spine',
			assetKey: 'lowSymbols',
			skin: 'yellow',
			animationName: 'land',
			sizeRatios: { width: 1, height: 1 },
		},
	},
	W: {
		explosion,
		win: {
			type: 'spine',
			assetKey: 'specialSymbols',
			skin: 'wild',
			animationName: 'win',
			sizeRatios: { width: 1, height: 1 },
		},
		postWinStatic: {
			type: 'spine',
			assetKey: 'specialSymbols',
			skin: 'wild',
			animationName: 'static',
			sizeRatios: { width: 1, height: 1 },
		},
		static: {
			type: 'spine',
			assetKey: 'specialSymbols',
			skin: 'wild',
			animationName: 'static',
			sizeRatios: { width: 1, height: 1 },
		},
		spin: {
			type: 'spine',
			assetKey: 'specialSymbols',
			skin: 'wild',
			animationName: 'spin',
			sizeRatios: { width: 1, height: 1 },
		},
		land: {
			type: 'spine',
			assetKey: 'specialSymbols',
			skin: 'wild',
			animationName: 'land',
			sizeRatios: { width: 1, height: 1 },
		},
	},
	M: {
		explosion,
		win: {
			type: 'spine',
			assetKey: 'specialSymbols',
			skin: 'wild',
			animationName: 'win',
			sizeRatios: { width: 1, height: 1 },
		},
		postWinStatic: {
			type: 'spine',
			assetKey: 'specialSymbols',
			skin: 'wild',
			animationName: 'static',
			sizeRatios: { width: 1, height: 1 },
		},
		static: {
			type: 'spine',
			assetKey: 'specialSymbols',
			skin: 'wild',
			animationName: 'static',
			sizeRatios: { width: 1, height: 1 },
		},
		spin: {
			type: 'spine',
			assetKey: 'specialSymbols',
			skin: 'wild',
			animationName: 'spin',
			sizeRatios: { width: 1, height: 1 },
		},
		land: {
			type: 'spine',
			assetKey: 'specialSymbols',
			skin: 'wild',
			animationName: 'land',
			sizeRatios: { width: 1, height: 1 },
		},
	},
	S: {
		explosion,
		win: {
			type: 'spine',
			assetKey: 'specialSymbols',
			skin: 'scatter',
			animationName: 'win',
			sizeRatios: { width: 1, height: 1 },
		},
		postWinStatic: {
			type: 'spine',
			assetKey: 'specialSymbols',
			skin: 'scatter',
			animationName: 'static',
			sizeRatios: { width: 1, height: 1 },
		},
		static: {
			type: 'spine',
			assetKey: 'specialSymbols',
			skin: 'scatter',
			animationName: 'static',
			sizeRatios: { width: 1, height: 1 },
		},
		spin: {
			type: 'spine',
			assetKey: 'specialSymbols',
			skin: 'scatter',
			animationName: 'spin',
			sizeRatios: { width: 1, height: 1 },
		},
		land: {
			type: 'spine',
			assetKey: 'specialSymbols',
			skin: 'scatter',
			animationName: 'land',
			sizeRatios: { width: 1, height: 1 },
		},
	},
} as const;

export const SCATTER_LAND_SOUND_MAP = {
	1: 'sfx_scatter_stop_1',
	2: 'sfx_scatter_stop_2',
	3: 'sfx_scatter_stop_3',
	4: 'sfx_scatter_stop_4',
	5: 'sfx_scatter_stop_5',
} as const;
