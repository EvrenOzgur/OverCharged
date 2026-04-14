/**
 * Undo/Redo history for the layout editor.
 * Stores structuredClone snapshots of the full uiLayoutConfig.
 */

import { uiLayoutConfig, type UiLayoutConfig } from '../game/uiLayoutConfig.svelte';

type HistoryEntry = {
	snapshot: UiLayoutConfig;
	label: string;
};

const MAX_HISTORY = 50;

const _stack = $state<HistoryEntry[]>([]);
const _cursor = $state({ value: -1 });

export function canUndo(): boolean { return _cursor.value > 0; }
export function canRedo(): boolean { return _cursor.value < _stack.length - 1; }

/** Debounce timer for coalescing rapid inspector changes. */
let pushTimer: ReturnType<typeof setTimeout> | null = null;

/**
 * Take a snapshot of the current config and push it onto the history stack.
 * Truncates any forward (redo) entries.
 */
export function pushSnapshot(label: string) {
	const snapshot = JSON.parse(JSON.stringify($state.snapshot(uiLayoutConfig))) as UiLayoutConfig;
	// Truncate redo entries
	if (_cursor.value < _stack.length - 1) {
		_stack.splice(_cursor.value + 1);
	}
	_stack.push({ snapshot, label });
	// Enforce max size
	if (_stack.length > MAX_HISTORY) {
		_stack.shift();
	} else {
		_cursor.value = _stack.length - 1;
	}
}

/**
 * Debounced pushSnapshot — coalesces rapid value changes (e.g. slider drags)
 * into a single history entry. 500ms debounce.
 */
export function pushSnapshotDebounced(label: string) {
	if (pushTimer) clearTimeout(pushTimer);
	pushTimer = setTimeout(() => {
		pushTimer = null;
		pushSnapshot(label);
	}, 500);
}

/** Ensure an initial snapshot exists (call on editor mount). */
export function initHistory() {
	if (_stack.length === 0) {
		pushSnapshot('initial');
	}
}

function applySnapshot(entry: HistoryEntry) {
	const snap = JSON.parse(JSON.stringify($state.snapshot(entry.snapshot))) as UiLayoutConfig;

	// Apply desktop elements
	for (const key of Object.keys(uiLayoutConfig.desktop)) {
		if (!(key in snap.desktop)) delete uiLayoutConfig.desktop[key];
	}
	for (const [key, val] of Object.entries(snap.desktop)) {
		uiLayoutConfig.desktop[key] = val;
	}

	// Apply variant configs (tablet, landscape, portrait)
	for (const variant of ['tablet', 'landscape', 'portrait'] as const) {
		if (snap[variant]) {
			uiLayoutConfig[variant] = snap[variant];
		} else {
			uiLayoutConfig[variant] = undefined;
		}
	}

	// Apply presetConfigs
	if (snap.presetConfigs) {
		uiLayoutConfig.presetConfigs = snap.presetConfigs;
	} else {
		uiLayoutConfig.presetConfigs = undefined;
	}

	// Apply bgLayers
	uiLayoutConfig.bgLayers.length = 0;
	for (const layer of snap.bgLayers) {
		uiLayoutConfig.bgLayers.push(layer);
	}

	// Apply boardConfig
	if (snap.boardConfig) uiLayoutConfig.boardConfig = snap.boardConfig;
	// Apply palettes
	if (snap.palettes) uiLayoutConfig.palettes = snap.palettes;
}

export function undo() {
	if (!canUndo()) return;
	_cursor.value--;
	applySnapshot(_stack[_cursor.value]);
}

export function redo() {
	if (!canRedo()) return;
	_cursor.value++;
	applySnapshot(_stack[_cursor.value]);
}
