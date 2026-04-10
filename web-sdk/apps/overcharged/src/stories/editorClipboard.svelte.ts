/**
 * Copy/Paste/Reset clipboard for the layout editor.
 */

import {
	uiLayoutConfig,
	editorState,
	getEditableElement,
	getElementStyle,
	BUTTON_STYLE_DEFAULTS,
	LABEL_STYLE_DEFAULTS,
	type UiElementTransform,
	type UiElementStyle,
} from '../game/uiLayoutConfig.svelte';
import { pushSnapshot } from './editorHistory.svelte';

export const clipboardState = $state({
	hasData: false,
	lastAction: null as 'copy' | 'paste' | 'reset' | null,
	lastActionTime: 0,
});

export function resetClipboard() {
	_copiedTransform = null;
	_copiedStyle = null;
	clipboardState.hasData = false;
}

let _copiedTransform: UiElementTransform | null = null;
let _copiedStyle: UiElementStyle | null = null;

export function copySelected() {
	const id = editorState.selected;
	if (!id) return;
	const t = getEditableElement(id);
	const s = getElementStyle(id);
	if (!t || !s) return;

	_copiedTransform = structuredClone($state.snapshot(t)) as UiElementTransform;
	_copiedStyle = structuredClone($state.snapshot(s)) as UiElementStyle;
	clipboardState.hasData = true;
	clipboardState.lastAction = 'copy';
	clipboardState.lastActionTime = Date.now();
}

export function pasteToSelected() {
	const id = editorState.selected;
	if (!id || !_copiedTransform || !_copiedStyle) return;
	const t = getEditableElement(id);
	const config = uiLayoutConfig.desktop[id];
	if (!t || !config) return;

	pushSnapshot('paste to ' + id);
	t.x = _copiedTransform.x;
	t.y = _copiedTransform.y;
	t.scale = _copiedTransform.scale;
	t.rotation = _copiedTransform.rotation;
	Object.assign(config.style, structuredClone(_copiedStyle));
	clipboardState.lastAction = 'paste';
	clipboardState.lastActionTime = Date.now();
}

export function resetSelected() {
	const id = editorState.selected;
	if (!id) return;
	const t = getEditableElement(id);
	const config = uiLayoutConfig.desktop[id];
	if (!t || !config) return;

	pushSnapshot('reset ' + id);
	t.x = 0;
	t.y = 0;
	t.scale = 1;
	t.rotation = 0;
	const defaults = id.startsWith('button') ? BUTTON_STYLE_DEFAULTS : LABEL_STYLE_DEFAULTS;
	Object.assign(config.style, structuredClone(defaults));
	clipboardState.lastAction = 'reset';
	clipboardState.lastActionTime = Date.now();
}
