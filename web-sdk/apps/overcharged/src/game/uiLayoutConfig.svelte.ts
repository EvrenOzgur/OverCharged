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

export type UiElementStyle = {
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
};

export type UiElementConfig = UiElementTransform & {
	style: UiElementStyle;
};

export type UiLayoutConfig = {
	desktop: Record<string, UiElementConfig>;
};

// ── Style defaults ────────────────────────────────────────────────
export const BUTTON_STYLE_DEFAULTS: UiElementStyle = {
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
};

export const LABEL_STYLE_DEFAULTS: UiElementStyle = {
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

/** Merge raw JSON (which may lack `style`) into full UiElementConfig objects. */
function initConfig(raw: typeof initial): UiLayoutConfig {
	const config: UiLayoutConfig = { desktop: {} };
	for (const [id, v] of Object.entries(raw.desktop)) {
		config.desktop[id] = {
			x: v.x ?? 0,
			y: v.y ?? 0,
			scale: v.scale ?? 1,
			rotation: v.rotation ?? 0,
			style: { ...getDefaultStyle(id), ...((v as any).style ?? {}) },
		};
	}
	return config;
}

export const uiLayoutConfig = $state<UiLayoutConfig>(initConfig(initial));

// ── Hex ↔ Pixi color helpers ─────────────────────────────────────
export function hexToPixi(hex: string): number {
	return parseInt(hex.replace('#', ''), 16);
}

export function pixiToHex(num: number): string {
	return '#' + num.toString(16).padStart(6, '0');
}

/** Get the reactive style object for a layout element. */
export function getElementStyle(id: string): UiElementStyle | undefined {
	return uiLayoutConfig.desktop[id]?.style;
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
export const editorState = $state({
	enabled: false,
	selected: null as string | null,
});

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
