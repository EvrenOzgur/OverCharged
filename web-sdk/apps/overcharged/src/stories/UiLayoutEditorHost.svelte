<script lang="ts">
	import { onMount } from 'svelte';
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

	// Cache DOM references once Pixi is ready
	let wrapperEl: HTMLElement | null = null;
	let parentEl: HTMLElement | null = null;

	function findElements() {
		const app = context.stateApp.pixiApplication;
		if (!app?.canvas) return;
		wrapperEl = app.canvas.parentElement;
		parentEl = wrapperEl?.parentElement ?? null;
	}

	function applyPresetSize(w: number, h: number) {
		const app = context.stateApp.pixiApplication;
		if (!app) return;
		if (!wrapperEl) findElements();

		(app as any).resizeTo = undefined;
		app.renderer.resize(w, h);
		app.canvas.style.width = `${w}px`;
		app.canvas.style.height = `${h}px`;

		if (wrapperEl) {
			wrapperEl.style.cssText = `width:${w}px;height:${h}px;overflow:hidden;border:1px solid #39ff14;border-radius:4px;box-shadow:0 0 20px rgba(57,255,20,0.3);`;
		}
		if (parentEl) {
			parentEl.style.cssText = 'display:flex;justify-content:center;align-items:center;width:100%;height:100vh;background:#0a0a0a;';
		}
	}

	function restoreFullscreen() {
		const app = context.stateApp.pixiApplication;
		if (!app) return;
		if (!wrapperEl) findElements();

		(app as any).resizeTo = window;
		app.resize();
		app.canvas.style.width = '100%';
		app.canvas.style.height = '100%';

		if (wrapperEl) wrapperEl.style.cssText = '';
		if (parentEl) parentEl.style.cssText = '';
	}

	// Resize Pixi renderer + DOM when a resolution preset is active
	$effect(() => {
		const app = context.stateApp.pixiApplication;
		if (!app) return;
		const preset = getActivePreset();
		if (editorState.enabled && preset) {
			applyPresetSize(preset.width, preset.height);
		} else if (editorState.enabled) {
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
