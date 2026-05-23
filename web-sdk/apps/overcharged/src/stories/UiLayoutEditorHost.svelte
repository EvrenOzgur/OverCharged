<script lang="ts">
	import { onMount, tick } from 'svelte';
	import { editorState, getActivePreset, getEditableElement } from '../game/uiLayoutConfig.svelte';
	import { getContext } from '../game/context';
	import { initHistory, pushSnapshot, undo, redo } from './editorHistory.svelte';
	import { copySelected, pasteToSelected, resetSelected } from './editorClipboard.svelte';
	import { panelsVisible } from './editorPanels.svelte';
	import { gridState } from './editorGrid.svelte';

	const context = getContext();

	function nudgeSelected(dx: number, dy: number) {
		const id = editorState.selected;
		if (!id) return;
		const t = getEditableElement(id);
		if (!t) return;
		pushSnapshot('nudge ' + id);
		t.x += dx;
		t.y += dy;
	}

	function onKeyDown(e: KeyboardEvent) {
		// Tab: toggle panels
		if (e.key === 'Tab') {
			e.preventDefault();
			panelsVisible.value = !panelsVisible.value;
			return;
		}

		// Arrow keys: nudge selected element
		if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key) && editorState.selected) {
			e.preventDefault();
			const step = e.shiftKey ? (gridState.gridSize || 10) : (gridState.gridSize || 1);
			if (e.key === 'ArrowUp') nudgeSelected(0, -step);
			if (e.key === 'ArrowDown') nudgeSelected(0, step);
			if (e.key === 'ArrowLeft') nudgeSelected(-step, 0);
			if (e.key === 'ArrowRight') nudgeSelected(step, 0);
			return;
		}

		// Delete: reset selected element
		if ((e.key === 'Delete' || e.key === 'Backspace') && editorState.selected) {
			e.preventDefault();
			resetSelected();
			return;
		}

		const ctrl = e.ctrlKey || e.metaKey;
		if (!ctrl) return;

		if (e.key === 'z' && !e.shiftKey) {
			e.preventDefault();
			undo();
		} else if ((e.key === 'z' && e.shiftKey) || e.key === 'y') {
			e.preventDefault();
			redo();
		} else if (e.key === 'c') {
			e.preventDefault();
			copySelected();
		} else if (e.key === 'v') {
			e.preventDefault();
			pasteToSelected();
		}
	}

	function applyPresetSize(w: number, h: number) {
		const app = context.stateApp.pixiApplication;
		if (!app?.canvas) return;

		(app as any).resizeTo = undefined;
		app.renderer.resize(w, h);

		// Position canvas fixed-center, independent of any parent layout
		const canvas = app.canvas;
		canvas.style.cssText = `
			position:fixed;
			top:50%;left:50%;
			transform:translate(-50%,-50%);
			width:${w}px;height:${h}px;
			border:1px solid #39ff14;
			border-radius:4px;
			box-shadow:0 0 20px rgba(57,255,20,0.3);
			z-index:1;
		`;
		document.body.style.background = '#0a0a0a';
	}

	function restoreFullscreen() {
		const app = context.stateApp.pixiApplication;
		if (!app?.canvas) return;

		(app as any).resizeTo = window;
		app.resize();
		app.canvas.style.cssText = '';
		document.body.style.background = '';
	}

	// Resize Pixi renderer + DOM when a resolution preset is active.
	//
	// IMPORTANT: read all reactive dependencies BEFORE any early return.
	// If we early-return when `pixiApplication` is undefined, Svelte only
	// tracks `pixiApplication` for this effect — subsequent dropdown changes
	// to `editorState.activePreset` won't trigger a rerun, so the canvas
	// silently stays at the default `resizeTo: window` size. Reading
	// `getActivePreset()` and `activeVariant` up front guarantees they are
	// recorded as dependencies on every cycle.
	$effect(() => {
		const preset = getActivePreset();
		const _variant = editorState.activeVariant;
		const _enabled = editorState.enabled;
		const app = context.stateApp.pixiApplication;
		if (!app) return;

		if (_enabled && preset) {
			tick().then(() => {
				applyPresetSize(preset.width, preset.height);
			});
			applyPresetSize(preset.width, preset.height);
		} else if (_enabled) {
			tick().then(() => restoreFullscreen());
			restoreFullscreen();
		}
	});

	onMount(() => {
		editorState.enabled = true;
		initHistory();
		window.addEventListener('keydown', onKeyDown);
		return () => {
			editorState.enabled = false;
			editorState.selected = null;
			editorState.activePreset = -1;
			window.removeEventListener('keydown', onKeyDown);

			restoreFullscreen();
		};
	});
</script>

<!-- Floating toggle button (always visible) -->
<button
	class="panel-toggle"
	onclick={() => panelsVisible.value = !panelsVisible.value}
	title="Toggle panels (Tab)"
	aria-label="Toggle editor panels"
>
	{panelsVisible.value ? '✕ Hide' : '☰ Show'}
</button>

<style>
	.panel-toggle {
		position: fixed;
		top: 8px;
		left: 50%;
		transform: translateX(-50%);
		z-index: 10000;
		background: rgba(20, 20, 24, 0.9);
		color: #39ff14;
		border: 1px solid #39ff14;
		padding: 4px 14px;
		border-radius: 4px;
		font-size: 11px;
		font-weight: 700;
		cursor: pointer;
		font-family: -apple-system, system-ui, sans-serif;
		transition: all 0.15s;
	}
	.panel-toggle:hover {
		background: #39ff14;
		color: #111;
	}
</style>
