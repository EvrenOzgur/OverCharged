<script lang="ts">
	import { onMount, tick } from 'svelte';
	import { editorState, getActivePreset } from '../game/uiLayoutConfig.svelte';
	import { getContext } from '../game/context';
	import { initHistory, undo, redo } from './editorHistory.svelte';
	import { copySelected, pasteToSelected } from './editorClipboard.svelte';
	import { panelsVisible } from './editorPanels.svelte';

	const context = getContext();

	function onKeyDown(e: KeyboardEvent) {
		// Tab: toggle panels
		if (e.key === 'Tab') {
			e.preventDefault();
			panelsVisible.value = !panelsVisible.value;
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
	// Also track activeVariant so effect re-runs when layout component changes.
	$effect(() => {
		const app = context.stateApp.pixiApplication;
		if (!app) return;
		const preset = getActivePreset();
		const _variant = editorState.activeVariant; // track variant changes

		if (editorState.enabled && preset) {
			// Wait for DOM to settle after layout component swap, then apply
			tick().then(() => {
				applyPresetSize(preset.width, preset.height);
			});
			// Also apply immediately for instant feedback
			applyPresetSize(preset.width, preset.height);
		} else if (editorState.enabled) {
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
