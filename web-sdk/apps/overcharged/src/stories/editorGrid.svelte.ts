/**
 * Grid snap & alignment utilities for the layout editor.
 */

import { uiLayoutConfig, getEditableElement, editorState } from '../game/uiLayoutConfig.svelte';

// ── Grid State ───────────────────────────────────────────────────
export const gridState = $state({
	gridSize: 0 as 0 | 8 | 16 | 32,
	showGrid: false,
});

export function snapToGrid(value: number): number {
	if (gridState.gridSize === 0) return value;
	return Math.round(value / gridState.gridSize) * gridState.gridSize;
}

// ── Alignment ────────────────────────────────────────────────────
type Axis = 'left' | 'centerH' | 'right' | 'top' | 'centerV' | 'bottom';

export function alignElements(ids: string[], axis: Axis) {
	if (ids.length < 2) return;
	const transforms = ids.map((id) => ({ id, t: getEditableElement(id) })).filter((e) => e.t);
	if (transforms.length < 2) return;

	const xs = transforms.map((e) => e.t!.x);
	const ys = transforms.map((e) => e.t!.y);

	switch (axis) {
		case 'left':
			{ const min = Math.min(...xs); transforms.forEach((e) => (e.t!.x = min)); }
			break;
		case 'centerH':
			{ const avg = Math.round(xs.reduce((a, b) => a + b, 0) / xs.length); transforms.forEach((e) => (e.t!.x = avg)); }
			break;
		case 'right':
			{ const max = Math.max(...xs); transforms.forEach((e) => (e.t!.x = max)); }
			break;
		case 'top':
			{ const min = Math.min(...ys); transforms.forEach((e) => (e.t!.y = min)); }
			break;
		case 'centerV':
			{ const avg = Math.round(ys.reduce((a, b) => a + b, 0) / ys.length); transforms.forEach((e) => (e.t!.y = avg)); }
			break;
		case 'bottom':
			{ const max = Math.max(...ys); transforms.forEach((e) => (e.t!.y = max)); }
			break;
	}
}

export function distributeElements(ids: string[], axis: 'horizontal' | 'vertical') {
	if (ids.length < 3) return;
	const transforms = ids.map((id) => ({ id, t: getEditableElement(id) })).filter((e) => e.t);
	if (transforms.length < 3) return;

	if (axis === 'horizontal') {
		transforms.sort((a, b) => a.t!.x - b.t!.x);
		const min = transforms[0].t!.x;
		const max = transforms[transforms.length - 1].t!.x;
		const step = (max - min) / (transforms.length - 1);
		transforms.forEach((e, i) => (e.t!.x = Math.round(min + step * i)));
	} else {
		transforms.sort((a, b) => a.t!.y - b.t!.y);
		const min = transforms[0].t!.y;
		const max = transforms[transforms.length - 1].t!.y;
		const step = (max - min) / (transforms.length - 1);
		transforms.forEach((e, i) => (e.t!.y = Math.round(min + step * i)));
	}
}
