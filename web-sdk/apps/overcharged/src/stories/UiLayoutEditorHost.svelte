<script lang="ts">
	import { onMount } from 'svelte';
	import { editorState } from '../game/uiLayoutConfig.svelte';
	import { initHistory, undo, redo } from './editorHistory.svelte';
	import { copySelected, pasteToSelected } from './editorClipboard.svelte';
	import { panelsVisible } from './editorPanels.svelte';

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

	onMount(() => {
		editorState.enabled = true;
		initHistory();
		window.addEventListener('keydown', onKeyDown);
		return () => {
			editorState.enabled = false;
			editorState.selected = null;
			window.removeEventListener('keydown', onKeyDown);
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
