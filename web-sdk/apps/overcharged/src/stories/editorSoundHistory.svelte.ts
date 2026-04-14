/**
 * Undo/Redo history for the sound editor.
 * Stores structuredClone snapshots of the full soundConfig.
 */

import { soundConfig, type SoundEditorConfig } from '../game/soundConfig.svelte';

type HistoryEntry = {
	snapshot: SoundEditorConfig;
	label: string;
};

const MAX_HISTORY = 50;

const _stack = $state<HistoryEntry[]>([]);
const _cursor = $state({ value: -1 });

export function canSoundUndo(): boolean { return _cursor.value > 0; }
export function canSoundRedo(): boolean { return _cursor.value < _stack.length - 1; }

let pushTimer: ReturnType<typeof setTimeout> | null = null;

/**
 * Take a snapshot of the current config and push it onto the history stack.
 * Truncates any forward (redo) entries.
 */
export function pushSoundSnapshot(label: string) {
	const snapshot = JSON.parse(JSON.stringify($state.snapshot(soundConfig))) as SoundEditorConfig;
	if (_cursor.value < _stack.length - 1) {
		_stack.splice(_cursor.value + 1);
	}
	_stack.push({ snapshot, label });
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
export function pushSoundSnapshotDebounced(label: string) {
	if (pushTimer) clearTimeout(pushTimer);
	pushTimer = setTimeout(() => {
		pushTimer = null;
		pushSoundSnapshot(label);
	}, 500);
}

/** Ensure an initial snapshot exists (call on editor mount). */
export function initSoundHistory() {
	if (_stack.length === 0) {
		pushSoundSnapshot('initial');
	}
}

function applySnapshot(entry: HistoryEntry) {
	const snap = JSON.parse(JSON.stringify($state.snapshot(entry.snapshot))) as SoundEditorConfig;

	// Apply sounds
	for (const key of Object.keys(soundConfig.sounds)) {
		if (!(key in snap.sounds)) delete soundConfig.sounds[key];
	}
	for (const [key, val] of Object.entries(snap.sounds)) {
		soundConfig.sounds[key] = val;
	}

	// Apply groups
	for (const [key, val] of Object.entries(snap.groups)) {
		(soundConfig.groups as any)[key] = val;
	}

	// Apply sequences
	for (const key of Object.keys(soundConfig.sequences)) {
		if (!(key in snap.sequences)) delete soundConfig.sequences[key];
	}
	for (const [key, val] of Object.entries(snap.sequences)) {
		soundConfig.sequences[key] = val;
	}
}

export function soundUndo() {
	if (!canSoundUndo()) return;
	_cursor.value--;
	applySnapshot(_stack[_cursor.value]);
}

export function soundRedo() {
	if (!canSoundRedo()) return;
	_cursor.value++;
	applySnapshot(_stack[_cursor.value]);
}
