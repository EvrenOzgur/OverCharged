/**
 * Copy/Paste/Reset clipboard for the sound editor.
 */

import {
	soundEditorState,
	getSoundItemConfig,
	soundConfig,
	SOUND_ITEM_DEFAULTS,
	type SoundItemConfig,
} from '../game/soundConfig.svelte';
import { pushSoundSnapshot } from './editorSoundHistory.svelte';

export const soundClipboardState = $state({
	hasData: false,
	lastAction: null as 'copy' | 'paste' | 'reset' | null,
	lastActionTime: 0,
});

let _copiedConfig: SoundItemConfig | null = null;

export function resetSoundClipboard() {
	_copiedConfig = null;
	soundClipboardState.hasData = false;
}

export function copySoundSelected() {
	const name = soundEditorState.selected;
	if (!name) return;
	const cfg = getSoundItemConfig(name);
	if (!cfg) return;

	_copiedConfig = structuredClone($state.snapshot(cfg)) as SoundItemConfig;
	soundClipboardState.hasData = true;
	soundClipboardState.lastAction = 'copy';
	soundClipboardState.lastActionTime = Date.now();
}

export function pasteSoundToSelected() {
	const name = soundEditorState.selected;
	if (!name || !_copiedConfig) return;
	const cfg = soundConfig.sounds[name];
	if (!cfg) return;

	pushSoundSnapshot('paste to ' + name);
	const pasted = structuredClone(_copiedConfig) as SoundItemConfig;
	// Preserve the group of the target sound
	pasted.group = cfg.group;
	Object.assign(cfg, pasted);
	soundClipboardState.lastAction = 'paste';
	soundClipboardState.lastActionTime = Date.now();
}

export function resetSoundSelected() {
	const name = soundEditorState.selected;
	if (!name) return;
	const cfg = soundConfig.sounds[name];
	if (!cfg) return;

	pushSoundSnapshot('reset ' + name);
	const group = cfg.group;
	Object.assign(cfg, structuredClone(SOUND_ITEM_DEFAULTS));
	cfg.group = group;
	soundClipboardState.lastAction = 'reset';
	soundClipboardState.lastActionTime = Date.now();
}
