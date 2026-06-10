/**
 * Live-editable UI layout configuration.
 *
 * Initial values are loaded from ./uiLayout.json (single source of truth,
 * git-tracked). The Storybook layout editor mutates this $state in-memory and
 * the "Save" button POSTs the current state back to that JSON via a Vite
 * middleware (see .storybook/main.ts), so the next reload picks it up.
 */

import initial from './uiLayout.json';

export type UiElementTransform = {
	x: number;
	y: number;
	scale: number;
	/** Rotation in radians (Pixi convention). Inspector edits in degrees. */
	rotation: number;
};

export type BgType = 'color' | 'sprite' | 'spine';

/** Hover-time visual effect a button can opt into. Single-select so the
 *  layout editor can pick one via a dropdown. Layered effects (e.g. shine
 *  + ring rotation) are independent and stay on regardless of this. */
export type HoverEffect = 'none' | 'shine' | 'pulse' | 'glow';

export type UiElementStyle = {
	/** Override the element's display text (empty = use default i18n text) */
	textOverride: string;
	fontColor: string;
	valueColor: string;
	fontSize: number;
	backgroundColor: string;
	borderColor: string;
	activeColor: string;
	alpha: number;
	visible: boolean;
	/** Background rendering mode */
	bgType: BgType;
	/** Asset key for sprite background (type='sprite'|'sprites') */
	bgSpriteKey: string;
	/** Asset key for Spine animation background */
	bgSpineKey: string;
	/** Animation name to play on the Spine skeleton */
	bgSpineAnim: string;
	/** Whether the Spine animation should loop */
	bgSpineLoop: boolean;

	// ── Stake-style FX fields (consumed by ButtonFx / IconGraphics) ──
	/** Programmatic icon tint (used by IconGraphics-based buttons like ButtonBet) */
	iconColor?: string;
	/** Draw an outer ring stroke around the button */
	ringEnabled?: boolean;
	ringColor?: string;
	ringWidth?: number;
	/** Slowly rotate the outer ring while the button is in its "active" state
	 *  (e.g. spinning for ButtonBet). */
	rotateRingOnSpin?: boolean;
	/** Color for the multi-ring concentric glow halo */
	glowColor?: string;
	/** Which hover-only effect to play (single-select) */
	hoverEffect?: HoverEffect;
	/** Glow halo alpha during hover (0..1); used when hoverEffect === 'glow' */
	hoverGlowIntensity?: number;
	/** Glow halo alpha while button is active/spinning (0..1) */
	activeGlowIntensity?: number;
	/** AlphaFilter alpha applied uniformly to the CircularButtonBg.
	 *  < 1 lets the game background show through the button (translucent). */
	bgAlpha?: number;
};

export type UiElementConfig = UiElementTransform & {
	style: UiElementStyle;
};

// ── Background layer types ───────────────────────────────────────
export type SpineAnimTrack = {
	trackIndex: number;
	animationName: string;
	loop: boolean;
};

export type BgLayerType = 'color' | 'sprite' | 'spine';

/**
 * One-shot animation triggered by a runtime event (skill activation,
 * multiplier landing, free-spin entry, etc.). Played on `trackIndex`
 * (default 0) on top of the layer's normal `spineAnims`. When the
 * animation completes (or after `holdMs`), the track returns to
 * `idleAnimation` if `returnToIdle !== false`.
 */
export type BgLayerTrigger = {
	/** Spine animation name to play (default / basegame) */
	animation: string;
	/** Override used when the layer's effective gameType is 'freegame'. Lets
	 *  a single trigger play different animations during a bonus round (e.g.
	 *  swap yellow_mana_work for hulk_mana_yellow). */
	animationFreegame?: string;
	/** Whether the trigger animation itself should loop */
	loop?: boolean;
	/** Spine track to play it on (default 0, share-safe with spineAnims) */
	trackIndex?: number;
	/** After complete, snap back to idleAnimation? (default true) */
	returnToIdle?: boolean;
	/**
	 * When the trigger fires, force the layer's effective gameType to this
	 * value until `stateGame.gameType` becomes 'basegame' (which clears it).
	 * Use for early-transition events that fire BEFORE the real gameType
	 * change — e.g. `freeSpinIntroShow` fires during the FS intro screen,
	 * a few hundred ms before `stateGame.gameType` flips to 'freegame', so
	 * the post-transition baseline (`hulk_idle`) must already be in effect
	 * when `normal_to_hulk` completes.
	 */
	sustainAsGameType?: 'basegame' | 'freegame';
};

/** Animation to play when entering/leaving a gameType. */
export type GameTypeTransition = {
	animation: string;
	trackIndex?: number;
	loop?: boolean;
};

export type BgLayer = {
	id: string;
	name: string;
	type: BgLayerType;
	/** Solid fill color (hex) when type='color' */
	color: string;
	/** Asset key when type='sprite' */
	spriteKey: string;
	/** Asset key when type='spine' */
	spineKey: string;
	/** Multiple animation tracks for spine. These play continuously and are
	 *  the layer's "static" baseline. Trigger animations override track N
	 *  temporarily. */
	spineAnims: SpineAnimTrack[];
	/**
	 * Optional fallback animation to return to after a one-shot trigger
	 * completes. If unset, the layer reverts to whatever spineAnims defines
	 * for the trigger's track.
	 */
	idleAnimation?: string;
	/**
	 * Optional per-gametype animation override on track 0. When `stateGame.gameType`
	 * matches a key, that animation replaces track 0's spineAnims entry.
	 */
	gameTypeAnimations?: {
		basegame?: string;
		freegame?: string;
	};
	/**
	 * Per-track gameType baseline override. Lets track 1+ also swap idle
	 * animations on gameType change (e.g. normal_idle ↔ hulk_idle for the
	 * character layer in bonus mode). Keys are track index as string.
	 */
	gameTypeAnimationsByTrack?: Record<string, { basegame?: string; freegame?: string }>;
	/**
	 * One-shot transition animations triggered on gameType change.
	 * - `toFreegame`: plays once when basegame → freegame
	 * - `toBasegame`: plays once when freegame → basegame
	 * The track returns to its baseline (which by then reflects the NEW
	 * gameType via gameTypeAnimationsByTrack) once the transition completes.
	 */
	gameTypeTransitions?: {
		toFreegame?: GameTypeTransition;
		toBasegame?: GameTypeTransition;
	};
	/**
	 * Triggers fired once on mount. Useful for resetting a spine's setup-pose
	 * visibility (e.g. play hulk_to_normal at startup so the hulk slots — which
	 * are default-visible in the spine's setup pose — get hidden before any
	 * idle animation runs). Each trigger plays once, then the track snaps
	 * back to its baseline via onTrackComplete.
	 */
	bootstrapTriggers?: BgLayerTrigger[];
	/**
	 * Map from event-key → trigger config.
	 * Key format: "<eventType>" or "<eventType>.<subType>".
	 *   - "skillActivated.L1"           → fires when skillActivated.skillType === 'L1'
	 *   - "skillActivated.L4"           → fires for L4
	 *   - "multiplierSymbolActivated"   → fires for any M activation
	 *   - "freeSpinTrigger"             → fires once on FS entry
	 *   - "wincap"                      → fires on wincap event
	 */
	triggers?: Record<string, BgLayerTrigger>;
	x: number;
	y: number;
	scaleX: number;
	scaleY: number;
	alpha: number;
	visible: boolean;
	/** Use responsive layout helper (normalBackgroundLayout) */
	useResponsiveLayout: boolean;
	/** Scale passed to normalBackgroundLayout */
	responsiveScale: number;
	/**
	 * When true, the spine skin is selected reactively from layoutType
	 * ('portrait' → 'portrait', else 'landscape'). For skeletons that ship
	 * orientation skins instead of a 'default' skin (e.g. bgCharacters).
	 */
	orientationSkin?: boolean;
	/**
	 * When true, the spine is scaled to COVER the whole canvas (fill at any
	 * resolution, no letterbox) instead of the responsive fit sizing. scaleX/Y
	 * act as an extra over-scale factor on top (to compensate for art that is
	 * smaller than the skeleton bounds).
	 */
	coverCanvas?: boolean;
};

export type ColorPalette = {
	id: string;
	name: string;
	colors: {
		primary: string;
		secondary: string;
		accent: string;
		background: string;
		border: string;
		text: string;
		value: string;
	};
};

export type BoardConfig = {
	glowColor: string;
	frameTint: string;
	symbolSize: number;
	gridGapX: number;
	gridGapY: number;
	boardPaddingX: number;
	boardPaddingY: number;
	/**
	 * @deprecated No longer consumed. The board well + frame + logo are baked
	 * into the bgCharacters spine (SlotArea / boardFrame / logo slots); the old
	 * SDK frame + reelhouse win-glow were removed. Kept for config back-compat;
	 * safe to remove once no persisted layout references it.
	 */
	showBoardFrame?: boolean;
	/**
	 * Global-multiplier panel (BoardmultiplierPart.png backing plate + the
	 * value, kept centred together — see GlobalMultiplier.svelte).
	 *   • multiplierBgX/Y — position offset of the whole panel+value group, in
	 *     board (mainLayout) coordinate space, added to its default corner spot.
	 *   • multiplierBgWidth/Height — backing-plate size in the spine's local
	 *     space (the legacy frame was 725×450). The value stays centred in it.
	 */
	multiplierBgX: number;
	multiplierBgY: number;
	multiplierBgWidth: number;
	multiplierBgHeight: number;
};

export const BOARD_CONFIG_DEFAULTS: BoardConfig = {
	glowColor: '#39ff14',
	frameTint: '#ffffff',
	symbolSize: 70,
	gridGapX: 0,
	gridGapY: 0,
	boardPaddingX: 0,
	boardPaddingY: 0,
	// Deprecated/no-op: board frame now comes from the bgCharacters spine.
	showBoardFrame: true,
	// Multiplier backing plate — defaults match the legacy frame footprint.
	multiplierBgX: 0,
	multiplierBgY: 0,
	multiplierBgWidth: 725,
	multiplierBgHeight: 450,
};

export type LayoutVariant = 'desktop' | 'tablet' | 'landscape' | 'portrait';

export type UiLayoutConfig = {
	desktop: Record<string, UiElementConfig>;
	tablet?: Record<string, UiElementConfig>;
	landscape?: Record<string, UiElementConfig>;
	portrait?: Record<string, UiElementConfig>;
	/** Per-preset configs keyed by preset name. Each preset has its own element layout. */
	presetConfigs?: Record<string, Record<string, UiElementConfig>>;
	bgLayers: BgLayer[];
	palettes?: ColorPalette[];
	activePaletteId?: string;
	boardConfig?: BoardConfig;
};

// ── Style defaults ────────────────────────────────────────────────
export const BUTTON_STYLE_DEFAULTS: UiElementStyle = {
	textOverride: '',
	fontColor: '#ffffff',
	valueColor: '#ffffff',
	fontSize: 1,
	backgroundColor: '#242428',
	borderColor: '#4a4a4e',
	activeColor: '#39ff14',
	alpha: 1,
	visible: true,
	bgType: 'color',
	bgSpriteKey: '',
	bgSpineKey: '',
	bgSpineAnim: '',
	bgSpineLoop: true,
	// FX defaults (consumed by ButtonBet pilot; other buttons ignore unknown fields)
	iconColor: '#ffffff',
	// Pragmatic-style CircularButtonBg has its own bevelled rim — the
	// external orbital ring is off by default; opt back in via layout editor.
	ringEnabled: false,
	// Silver/chrome metallic palette — neutral premium look that contrasts the
	// game's grass green background without competing on hue. activeColor (lime)
	// is intentionally distinct so an "active" button (e.g. AutoSpin ON) reads
	// as a clear state change.
	ringColor: '#B0BEC5',
	ringWidth: 3,
	rotateRingOnSpin: true,
	glowColor: '#B0BEC5',
	hoverEffect: 'shine',
	hoverGlowIntensity: 0.6,
	activeGlowIntensity: 0.55,
	bgAlpha: 0.4,
};

export const LABEL_STYLE_DEFAULTS: UiElementStyle = {
	textOverride: '',
	fontColor: '#999999',
	valueColor: '#ffffff',
	fontSize: 1,
	backgroundColor: '#1a1a1e',
	borderColor: '#4a4a4e',
	activeColor: '#39ff14',
	alpha: 1,
	visible: true,
	bgType: 'color',
	bgSpriteKey: '',
	bgSpineKey: '',
	bgSpineAnim: '',
	bgSpineLoop: true,
};

function getDefaultStyle(id: string): UiElementStyle {
	return id.startsWith('button')
		? { ...BUTTON_STYLE_DEFAULTS }
		: { ...LABEL_STYLE_DEFAULTS };
}

export const DEFAULT_BG_LAYERS: BgLayer[] = [
	{
		id: 'base',
		name: 'Black Base',
		type: 'color',
		color: '#000000',
		spriteKey: '',
		spineKey: '',
		spineAnims: [],
		x: 0,
		y: 0,
		scaleX: 1,
		scaleY: 1,
		alpha: 1,
		visible: true,
		useResponsiveLayout: false,
		responsiveScale: 1,
	},
	{
		id: 'bgCharacters',
		name: 'BG Characters',
		type: 'spine',
		color: '#000000',
		spriteKey: '',
		spineKey: 'bgCharacters',
		spineAnims: [
			{ trackIndex: 0, animationName: 'bg_idle', loop: true },
			{ trackIndex: 1, animationName: 'normal_idle', loop: true },
		],
		x: 0,
		y: 0,
		scaleX: 1,
		scaleY: 1,
		alpha: 1,
		visible: true,
		useResponsiveLayout: true,
		responsiveScale: 0.66,
		orientationSkin: true,
		coverCanvas: true,
	},
];

/** Merge raw JSON (which may lack `style` or `bgLayers`) into full config. */
function initConfig(raw: typeof initial): UiLayoutConfig {
	const config: UiLayoutConfig = { desktop: {}, bgLayers: [] };
	for (const [id, v] of Object.entries(raw.desktop)) {
		config.desktop[id] = {
			x: v.x ?? 0,
			y: v.y ?? 0,
			scale: v.scale ?? 1,
			rotation: v.rotation ?? 0,
			style: { ...getDefaultStyle(id), ...((v as any).style ?? {}) },
		};
	}
	const rawLayers = (raw as any).bgLayers as BgLayer[] | undefined;
	config.bgLayers = rawLayers?.length
		? rawLayers.map((l) => ({ ...l }))
		: DEFAULT_BG_LAYERS.map((l) => ({ ...l, spineAnims: l.spineAnims.map((a) => ({ ...a })) }));
	config.boardConfig = { ...BOARD_CONFIG_DEFAULTS, ...((raw as any).boardConfig ?? {}) };
	if ((raw as any).palettes) config.palettes = (raw as any).palettes;
	if ((raw as any).presetConfigs) config.presetConfigs = (raw as any).presetConfigs;
	return config;
}

export const uiLayoutConfig = $state<UiLayoutConfig>(initConfig(initial));

// ── Hex ↔ Pixi color helpers ─────────────────────────────────────
const HEX_RE = /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i;

export function hexToPixi(hex: string): number {
	const m = HEX_RE.exec(hex);
	if (!m) return 0x000000;
	let h = m[1];
	if (h.length === 3) h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2];
	const v = parseInt(h, 16);
	return isNaN(v) ? 0x000000 : v;
}

export function pixiToHex(num: number): string {
	return '#' + (num & 0xffffff).toString(16).padStart(6, '0');
}

/** Normalize any hex string to #rrggbb format. */
export function normalizeHex(hex: string): string {
	return pixiToHex(hexToPixi(hex));
}

// ── Save debounce ────────────────────────────────────────────────
let saveTimer: ReturnType<typeof setTimeout> | null = null;
let saveInFlight = false;
let saveQueued = false;

async function doSave(): Promise<boolean> {
	saveInFlight = true;
	try {
		return await saveUiLayoutConfig();
	} finally {
		saveInFlight = false;
		if (saveQueued) {
			saveQueued = false;
			doSave();
		}
	}
}

/**
 * Debounced save — coalesces rapid changes into a single write.
 * Both inspector panels should call this instead of saveUiLayoutConfig().
 */
export function debouncedSave(callback?: (ok: boolean) => void) {
	if (saveTimer) clearTimeout(saveTimer);
	saveTimer = setTimeout(async () => {
		saveTimer = null;
		if (saveInFlight) {
			saveQueued = true;
			return;
		}
		const ok = await doSave();
		callback?.(ok);
	}, 300);
}

/** Get the reactive style object for a layout element (variant-aware). Pass
 *  `live` so the running game reads the style from the auto-selected preset. */
export function getElementStyle(
	id: string,
	live?: LiveLayoutContext,
): UiElementStyle | undefined {
	return getActiveVariantConfig(live)[id]?.style;
}

export function exportUiLayoutConfig(): string {
	return JSON.stringify(uiLayoutConfig, null, 2);
}

/**
 * Persist the current in-memory layout to disk via the Storybook Vite
 * middleware. Returns true on success, false on failure.
 */
export async function saveUiLayoutConfig(): Promise<boolean> {
	try {
		const res = await fetch('/__ui-layout-save', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: exportUiLayoutConfig(),
		});
		return res.ok;
	} catch (err) {
		// eslint-disable-next-line no-console
		console.error('[uiLayoutConfig] save failed', err);
		return false;
	}
}

/**
 * Editor-only flag. When true, DraggableInEditor wrappers become interactive
 * (outline + drag handles). Toggled on by the Storybook layout-editor story,
 * off everywhere else (production Game).
 */
// ── Resolution presets (Stake requirements) ─────────────────────
export type ResolutionPreset = {
	name: string;
	width: number;
	height: number;
	layoutType: LayoutVariant;
};

export const RESOLUTION_PRESETS: ResolutionPreset[] = [
	{ name: 'Desktop', width: 1200, height: 675, layoutType: 'desktop' },
	{ name: 'Laptop', width: 1024, height: 576, layoutType: 'desktop' },
	{ name: 'Popout S', width: 400, height: 225, layoutType: 'landscape' },
	{ name: 'Popout L', width: 800, height: 450, layoutType: 'desktop' },
	{ name: 'Mobile L', width: 425, height: 812, layoutType: 'portrait' },
	{ name: 'Mobile M', width: 375, height: 667, layoutType: 'portrait' },
	{ name: 'Mobile S', width: 320, height: 568, layoutType: 'portrait' },
];

export const editorState = $state({
	enabled: false,
	selected: null as string | null,
	multiSelected: [] as string[],
	activeVariant: 'desktop' as LayoutVariant,
	/** Active resolution preset index, -1 = auto (use window size) */
	activePreset: -1,
});

/** Get the editor's forced layout type, or null for auto-detection. */
export function getEditorLayoutOverride(): LayoutVariant | null {
	if (!editorState.enabled || editorState.activePreset < 0) return null;
	return RESOLUTION_PRESETS[editorState.activePreset]?.layoutType ?? null;
}

/** Get the active resolution preset, or null. */
export function getActivePreset(): ResolutionPreset | null {
	if (editorState.activePreset < 0) return null;
	return RESOLUTION_PRESETS[editorState.activePreset] ?? null;
}

/** Live window context used to auto-pick a resolution preset config in the
 *  running game (no editor preset forced). Passed in by the layout components
 *  so the selection stays reactive to window resizes without this module
 *  importing the layout state (which would create an import cycle). */
export type LiveLayoutContext = {
	width: number;
	height: number;
	layoutType: LayoutVariant;
};

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

type PresetEntry = { preset: ResolutionPreset; cfg: Record<string, UiElementConfig> };

/**
 * Find the two configured presets (same layoutType) that bracket a live window
 * WIDTH, plus the 0..1 interpolation factor between them. Presets are sorted by
 * width; outside the configured range the result clamps to the nearest end
 * (lo === hi, t = 0). Returns null when no matching preset is configured.
 */
function findPresetBracket(
	width: number,
	layoutType: LayoutVariant,
): { lo: PresetEntry; hi: PresetEntry; t: number } | null {
	const cfgs = uiLayoutConfig.presetConfigs;
	if (!cfgs) return null;
	const candidates: PresetEntry[] = RESOLUTION_PRESETS.filter(
		(p) => p.layoutType === layoutType && cfgs[getPresetKey(p)],
	)
		.map((preset) => ({ preset, cfg: cfgs[getPresetKey(preset)] }))
		.sort((a, b) => a.preset.width - b.preset.width);

	if (candidates.length === 0) return null;
	if (candidates.length === 1) return { lo: candidates[0], hi: candidates[0], t: 0 };

	const first = candidates[0];
	const last = candidates[candidates.length - 1];
	if (width <= first.preset.width) return { lo: first, hi: first, t: 0 };
	if (width >= last.preset.width) return { lo: last, hi: last, t: 0 };

	for (let i = 0; i < candidates.length - 1; i++) {
		const lo = candidates[i];
		const hi = candidates[i + 1];
		if (width >= lo.preset.width && width <= hi.preset.width) {
			const span = hi.preset.width - lo.preset.width;
			return { lo, hi, t: span > 0 ? (width - lo.preset.width) / span : 0 };
		}
	}
	return { lo: last, hi: last, t: 0 };
}

/**
 * Build the live UI config by INTERPOLATING element transforms between the two
 * presets (of the matching layoutType) that bracket the current window width.
 * This is what makes the layout "scale at the right ratio" between resolution
 * settings and land exactly on a preset's tuned layout when the window reaches
 * it — rather than snapping to a single preset's (differently-tuned) values at
 * an in-between size, which made elements drift / overlap. x/y/scale/rotation
 * are lerped; non-numeric fields (style, etc.) come from the nearer endpoint.
 * Returns null when no matching preset is configured (caller falls back).
 */
export function getInterpolatedPresetConfig(
	width: number,
	layoutType: LayoutVariant,
): Record<string, UiElementConfig> | null {
	const bracket = findPresetBracket(width, layoutType);
	if (!bracket) return null;
	const { lo, hi, t } = bracket;
	if (lo === hi || t <= 0) return lo.cfg;
	if (t >= 1) return hi.cfg;

	const nearer = t < 0.5 ? lo.cfg : hi.cfg;
	const merged: Record<string, UiElementConfig> = {};
	const ids = new Set([...Object.keys(lo.cfg), ...Object.keys(hi.cfg)]);
	for (const id of ids) {
		const a = lo.cfg[id];
		const b = hi.cfg[id];
		if (a && b) {
			merged[id] = {
				...(nearer[id] ?? a),
				x: lerp(a.x, b.x, t),
				y: lerp(a.y, b.y, t),
				scale: lerp(a.scale ?? 1, b.scale ?? 1, t),
				rotation: lerp(a.rotation ?? 0, b.rotation ?? 0, t),
			};
		} else {
			merged[id] = (a ?? b)!;
		}
	}
	return merged;
}

/** Nearest configured preset of the matching layoutType (used in editor-auto,
 *  where a stable object is needed for dragging — no interpolation). */
export function getAutoPresetConfig(
	width: number,
	height: number,
	layoutType: LayoutVariant,
): Record<string, UiElementConfig> | null {
	const cfgs = uiLayoutConfig.presetConfigs;
	if (!cfgs) return null;
	let best: Record<string, UiElementConfig> | null = null;
	let bestDist = Infinity;
	for (const p of RESOLUTION_PRESETS) {
		if (p.layoutType !== layoutType) continue;
		const cfg = cfgs[getPresetKey(p)];
		if (!cfg) continue;
		const dw = p.width - width;
		const dh = p.height - height;
		const dist = dw * dw + dh * dh;
		if (dist < bestDist) {
			bestDist = dist;
			best = cfg;
		}
	}
	return best;
}

/** Human-readable description of which config is currently in effect, for the
 *  layout debug HUD. Mirrors getActiveVariantConfig's selection logic. */
export function getActiveConfigLabel(live?: LiveLayoutContext): string {
	const preset = getActivePreset();
	if (preset) return `${preset.name} ${preset.width}x${preset.height} [forced]`;
	if (live && editorState.activePreset < 0) {
		const bracket = findPresetBracket(live.width, live.layoutType);
		if (bracket) {
			const { lo, hi, t } = bracket;
			if (lo === hi) return `${lo.preset.name} [clamped]`;
			return `${lo.preset.name}↔${hi.preset.name}  t=${t.toFixed(2)} [lerp]`;
		}
	}
	return `fallback:${editorState.activeVariant}`;
}

/** Get the active preset/variant's element config (falls back to desktop).
 *  Pass `live` (current window size + layoutType) so the RUNNING game
 *  auto-selects the matching resolution preset; omit it in editor-only call
 *  sites where an explicit preset/variant is in effect. */
export function getActiveVariantConfig(
	live?: LiveLayoutContext,
): Record<string, UiElementConfig> {
	// 1. Editor: an explicitly selected resolution preset always wins.
	const preset = getActivePreset();
	if (preset) {
		const key = getPresetKey(preset);
		if (uiLayoutConfig.presetConfigs?.[key]) return uiLayoutConfig.presetConfigs[key];
	}
	// 2. No preset forced: derive a config from the live window size.
	if (live && editorState.activePreset < 0) {
		// Live game → smoothly interpolate between bracketing presets so the
		// layout scales proportionally and only "lands" on a preset's tuned
		// values at its resolution. Editor-auto → nearest preset (a stable
		// object so dragging/inspector edits aren't lost on a throwaway lerp).
		const cfg = editorState.enabled
			? getAutoPresetConfig(live.width, live.height, live.layoutType)
			: getInterpolatedPresetConfig(live.width, live.layoutType);
		if (cfg) return cfg;
	}
	// 3. Fallback to variant-level or desktop.
	const v = editorState.activeVariant;
	if (v !== 'desktop' && uiLayoutConfig[v]) return uiLayoutConfig[v]!;
	return uiLayoutConfig.desktop;
}

/** Get a stable key for a preset (used in presetConfigs). */
function getPresetKey(preset: ResolutionPreset): string {
	return `${preset.width}x${preset.height}`;
}

/** Ensure a preset has its own config (copy from desktop if needed). */
export function ensurePresetConfig(preset: ResolutionPreset) {
	if (!uiLayoutConfig.presetConfigs) uiLayoutConfig.presetConfigs = {};
	const key = getPresetKey(preset);
	if (!uiLayoutConfig.presetConfigs[key]) {
		uiLayoutConfig.presetConfigs[key] = structuredClone(
			$state.snapshot(uiLayoutConfig.desktop),
		) as Record<string, UiElementConfig>;
	}
}

/** Copy desktop config to another variant. */
export function copyDesktopToVariant(variant: LayoutVariant) {
	if (variant === 'desktop') return;
	uiLayoutConfig[variant] = structuredClone($state.snapshot(uiLayoutConfig.desktop)) as Record<string, UiElementConfig>;
}

/** All selected element IDs (single + multi merged). */
export function getAllSelectedIds(): string[] {
	const ids = [...editorState.multiSelected];
	if (editorState.selected && !ids.includes(editorState.selected)) {
		ids.push(editorState.selected);
	}
	return ids;
}

/**
 * Registry of all draggable elements currently mounted, keyed by id.
 * Lets the Inspector panel resolve the selected element's transform without
 * hardcoding lookups.
 */
const registry = new Map<string, UiElementTransform>();

export function registerEditableElement(id: string, transform: UiElementTransform) {
	registry.set(id, transform);
}

export function unregisterEditableElement(id: string) {
	registry.delete(id);
}

export function getEditableElement(id: string): UiElementTransform | undefined {
	return registry.get(id);
}

// ── Background layer helpers ─────────────────────────────────────
let bgLayerCounter = 0;

export function addBgLayer(type: BgLayerType = 'color'): BgLayer {
	bgLayerCounter++;
	const layer: BgLayer = {
		id: `layer_${Date.now()}_${bgLayerCounter}`,
		name: `Layer ${uiLayoutConfig.bgLayers.length}`,
		type,
		color: '#000000',
		spriteKey: '',
		spineKey: '',
		spineAnims: [],
		x: 0,
		y: 0,
		scaleX: 1,
		scaleY: 1,
		alpha: 1,
		visible: true,
		useResponsiveLayout: type !== 'color',
		responsiveScale: 0.5,
	};
	uiLayoutConfig.bgLayers.push(layer);
	return layer;
}

export function removeBgLayer(id: string) {
	const idx = uiLayoutConfig.bgLayers.findIndex((l) => l.id === id);
	if (idx >= 0) uiLayoutConfig.bgLayers.splice(idx, 1);
}

export function moveBgLayer(id: string, direction: -1 | 1) {
	const layers = uiLayoutConfig.bgLayers;
	const idx = layers.findIndex((l) => l.id === id);
	const target = idx + direction;
	if (idx < 0 || target < 0 || target >= layers.length) return;
	[layers[idx], layers[target]] = [layers[target], layers[idx]];
}

// ── Palette helpers ──────────────────────────────────────────────
export function addPalette(name: string): ColorPalette {
	if (!uiLayoutConfig.palettes) uiLayoutConfig.palettes = [];
	const palette: ColorPalette = {
		id: `pal_${Date.now()}`,
		name,
		colors: {
			primary: '#ffffff',
			secondary: '#999999',
			accent: '#39ff14',
			background: '#242428',
			border: '#4a4a4e',
			text: '#ffffff',
			value: '#ffffff',
		},
	};
	uiLayoutConfig.palettes.push(palette);
	return palette;
}

export function removePalette(id: string) {
	if (!uiLayoutConfig.palettes) return;
	const idx = uiLayoutConfig.palettes.findIndex((p) => p.id === id);
	if (idx >= 0) uiLayoutConfig.palettes.splice(idx, 1);
	if (uiLayoutConfig.activePaletteId === id) uiLayoutConfig.activePaletteId = undefined;
}

export function applyPalette(paletteId: string) {
	const palette = uiLayoutConfig.palettes?.find((p) => p.id === paletteId);
	if (!palette) return;
	const c = palette.colors;
	// Apply to all variants
	const variants: Record<string, UiElementConfig>[] = [uiLayoutConfig.desktop];
	for (const v of ['tablet', 'landscape', 'portrait'] as const) {
		if (uiLayoutConfig[v]) variants.push(uiLayoutConfig[v]!);
	}
	for (const variantConfig of variants) {
		for (const config of Object.values(variantConfig)) {
			config.style.fontColor = c.text;
			config.style.valueColor = c.value;
			config.style.backgroundColor = c.background;
			config.style.borderColor = c.border;
			config.style.activeColor = c.accent;
		}
	}
	uiLayoutConfig.activePaletteId = paletteId;
}

// ── Board config helpers ─────────────────────────────────────────
export function getBoardConfig(): BoardConfig {
	return uiLayoutConfig.boardConfig ?? { ...BOARD_CONFIG_DEFAULTS };
}

export function ensureBoardConfig(): BoardConfig {
	if (!uiLayoutConfig.boardConfig) {
		uiLayoutConfig.boardConfig = { ...BOARD_CONFIG_DEFAULTS };
	}
	return uiLayoutConfig.boardConfig;
}

// ── Export/Import helpers ────────────────────────────────────────
export function downloadConfigAsJson() {
	const data = exportUiLayoutConfig();
	const blob = new Blob([data], { type: 'application/json' });
	const url = URL.createObjectURL(blob);
	const a = document.createElement('a');
	a.href = url;
	a.download = `uiLayout_${new Date().toISOString().slice(0, 10)}.json`;
	a.click();
	URL.revokeObjectURL(url);
}

export function importConfig(jsonStr: string): { ok: boolean; error?: string } {
	try {
		const data = JSON.parse(jsonStr);
		if (!data || typeof data !== 'object') {
			return { ok: false, error: 'Invalid JSON structure' };
		}
		if (!data.desktop || typeof data.desktop !== 'object') {
			return { ok: false, error: 'Missing "desktop" key' };
		}
		// Validate desktop elements have required transform fields
		for (const [key, val] of Object.entries(data.desktop)) {
			const v = val as any;
			if (typeof v.x !== 'number' || typeof v.y !== 'number') {
				return { ok: false, error: `Element "${key}" missing x/y coordinates` };
			}
		}
		// Validate bgLayers if present
		if (data.bgLayers && !Array.isArray(data.bgLayers)) {
			return { ok: false, error: 'bgLayers must be an array' };
		}

		// Apply desktop (merge with defaults for missing style fields)
		for (const key of Object.keys(uiLayoutConfig.desktop)) {
			if (!(key in data.desktop)) delete uiLayoutConfig.desktop[key];
		}
		for (const [key, val] of Object.entries(data.desktop)) {
			const v = val as any;
			uiLayoutConfig.desktop[key] = {
				x: v.x ?? 0,
				y: v.y ?? 0,
				scale: v.scale ?? 1,
				rotation: v.rotation ?? 0,
				style: { ...getDefaultStyle(key), ...(v.style ?? {}) },
			};
		}
		// Apply variant configs
		for (const variant of ['tablet', 'landscape', 'portrait'] as const) {
			if (data[variant] && typeof data[variant] === 'object') {
				uiLayoutConfig[variant] = {};
				for (const [key, val] of Object.entries(data[variant])) {
					const v = val as any;
					uiLayoutConfig[variant]![key] = {
						x: v.x ?? 0, y: v.y ?? 0, scale: v.scale ?? 1, rotation: v.rotation ?? 0,
						style: { ...getDefaultStyle(key), ...(v.style ?? {}) },
					};
				}
			}
		}
		// Apply bgLayers
		if (Array.isArray(data.bgLayers)) {
			uiLayoutConfig.bgLayers.length = 0;
			for (const l of data.bgLayers) uiLayoutConfig.bgLayers.push(l);
		}
		// Apply palettes
		if (Array.isArray(data.palettes)) uiLayoutConfig.palettes = data.palettes;
		// Apply boardConfig
		if (data.boardConfig && typeof data.boardConfig === 'object') {
			uiLayoutConfig.boardConfig = { ...BOARD_CONFIG_DEFAULTS, ...data.boardConfig };
		}
		return { ok: true };
	} catch (e) {
		return { ok: false, error: String(e) };
	}
}
