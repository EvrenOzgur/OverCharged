import _ from 'lodash';

import {
	UI_BASE_SIZE as _SDK_UI_BASE_SIZE,
	UI_BASE_FONT_SIZE as _SDK_UI_BASE_FONT_SIZE,
} from 'components-ui-pixi/src/constants';

import type { RawSymbol, SymbolState } from './types';

// 57 ≈ 70 × 0.8152 — calibrated so the 8×8 board exactly fills the bgCharacters
// spine's embedded board well (SlotArea); see migration notes. The whole board
// composition (symbols, masks, counters, meters) is sized relative to this, so
// it scales as one unit to sit inside the painted grid.
export const SYMBOL_SIZE = 57;

// Portrait-only shrink of the bg's board WELL (grid). Applied to the spine's
// `target_portrait_board` bone (setup scale below); the SlotArea grid follows
// it and the symbol board follows the grid via boardCalibration — so both the
// cells and the symbols get smaller together, leaving room for the bottom
// button bar. The lab scene (bone_bg) is unaffected. 1 = no extra shrink.
export const PORTRAIT_WELL_SHRINK = 0.85;
// Setup scale of `target_portrait_board` in the bg_characters skeleton — the
// portrait well's base size that PORTRAIT_WELL_SHRINK multiplies.
export const PORTRAIT_WELL_SETUP_SCALE = 0.7075084;
// Portrait-only upward shift of the bg's board WELL, in spine units, so the
// grid sits flush under the OVERCHARGED logo (no gap) and the symbol board
// follows it via boardCalibration. Larger = higher. Applied as the SpineBone's
// `y` prop NEGATED (SpineBone does `bone.y = -y`, and spine +y is up), so we
// pass `y={-PORTRAIT_WELL_LIFT}`.
export const PORTRAIT_WELL_LIFT = 60;

// Render scale of the symbol art within its grid cell (1 = fills the cell).
// <1 shrinks every symbol slightly, leaving a small gap, WITHOUT changing the
// board grid spacing (which stays SYMBOL_SIZE). Note: shrinking SYMBOL_SIZE
// itself has no net effect — the board auto-calibrates to the bg well.
export const SYMBOL_RENDER_SCALE = 0.9;

// Size of the multiplier (M) coin spine relative to a normal symbol cell.
// The coin skeleton (+ its glow halo) fills more of its bounds than the other
// symbols, so it reads ~2× too big at ratio 1 — tune here to taste.
export const MULTIPLIER_SYMBOL_RATIO = 0.5;

export const REEL_PADDING = 0.53;

/**
 * Multiplier applied to the shared SDK `UI_BASE_SIZE` (150) when sizing
 * OverCharged's buttons. Bumped above 1 to make the Pragmatic-style
 * buttons physically bigger than the base SDK default without having
 * to touch the shared constant (which is consumed by other apps).
 *
 * Button files import `UI_BASE_SIZE` from THIS file (not the SDK one)
 * to pick up the local override — the name is intentionally shadowed
 * so the existing `UI_BASE_SIZE * 0.55` etc. tier expressions stay valid.
 */
export const BUTTON_SIZE_MULT = 1.3;
export const UI_BASE_SIZE = _SDK_UI_BASE_SIZE * BUTTON_SIZE_MULT;
// Font size is passed through unchanged — per-button `fontSize` in
// uiLayout.json already handles label tuning where needed.
export const UI_BASE_FONT_SIZE = _SDK_UI_BASE_FONT_SIZE;

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

export const HIGH_SYMBOLS = ['H1', 'H2', 'H3', 'H4'];

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

const highExplosion = {
	type: 'spine',
	assetKey: 'highSymbols',
	animationName: 'explosion',
	sizeRatios: { width: 1, height: 1 },
};

const lowExplosion = {
	type: 'spine',
	assetKey: 'lowSymbols',
	animationName: 'explosion',
	sizeRatios: { width: 1, height: 1 },
};

export const SYMBOL_INFO_MAP = {
	H1: {
		explosion: highExplosion,
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
		explosion: highExplosion,
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
		explosion: highExplosion,
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
		explosion: highExplosion,
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
		explosion: lowExplosion,
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
	L2: {
		explosion: lowExplosion,
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
		explosion: lowExplosion,
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
	L4: {
		explosion: lowExplosion,
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
	W: {
		explosion: lowExplosion,
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
	// Multiplier symbol — new coin-flip `multipliers` spine. `skin` is a
	// placeholder ('default'); getSymbolInfo() overrides it with `${value}x`
	// (e.g. '5x') from rawSymbol.multiplier. `flip` reveals the value and holds
	// on its last (value-facing) frame; `land` is the drop. explosion keeps the
	// shared lowExplosion.
	// Multiplier symbol — coin-flip `multipliers` spine. The coin stays FROZEN
	// on its value-facing pose for every state except `win`: only when the
	// multiplier is collected (winning tumble) does it play `flip` once. skin is
	// overridden per value (`5x` …) by getSymbolInfo. `frozen` is read by
	// SymbolSpineMain → timeScale 0 + held last frame.
	M: {
		explosion: lowExplosion,
		win: {
			type: 'spine',
			assetKey: 'multipliers',
			skin: 'default',
			animationName: 'flip',
			sizeRatios: { width: MULTIPLIER_SYMBOL_RATIO, height: MULTIPLIER_SYMBOL_RATIO },
		},
		postWinStatic: {
			type: 'spine',
			assetKey: 'multipliers',
			skin: 'default',
			animationName: 'land',
			frozen: true,
			sizeRatios: { width: MULTIPLIER_SYMBOL_RATIO, height: MULTIPLIER_SYMBOL_RATIO },
		},
		static: {
			type: 'spine',
			assetKey: 'multipliers',
			skin: 'default',
			animationName: 'land',
			frozen: true,
			sizeRatios: { width: MULTIPLIER_SYMBOL_RATIO, height: MULTIPLIER_SYMBOL_RATIO },
		},
		spin: {
			type: 'spine',
			assetKey: 'multipliers',
			skin: 'default',
			animationName: 'land',
			frozen: true,
			sizeRatios: { width: MULTIPLIER_SYMBOL_RATIO, height: MULTIPLIER_SYMBOL_RATIO },
		},
		land: {
			type: 'spine',
			assetKey: 'multipliers',
			skin: 'default',
			animationName: 'land',
			frozen: true,
			sizeRatios: { width: MULTIPLIER_SYMBOL_RATIO, height: MULTIPLIER_SYMBOL_RATIO },
		},
	},
	S: {
		explosion: lowExplosion,
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
