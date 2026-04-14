<script lang="ts">
	import { onMount } from 'svelte';
	import { soundEditorState } from '../game/soundConfig.svelte';
	import { initSoundHistory, soundUndo, soundRedo } from './editorSoundHistory.svelte';
	import { copySoundSelected, pasteSoundToSelected, resetSoundSelected } from './editorSoundClipboard.svelte';
	import { showAllSoundPanels, hideAllSoundPanels, areAllPanelsHidden } from './editorSoundPanels.svelte';

	function onKeyDown(e: KeyboardEvent) {
		// Tab: toggle all panels
		if (e.key === 'Tab') {
			e.preventDefault();
			if (areAllPanelsHidden()) showAllSoundPanels();
			else hideAllSoundPanels();
			return;
		}

		// Delete: reset selected sound
		if ((e.key === 'Delete' || e.key === 'Backspace') && soundEditorState.selected) {
			// Don't intercept if user is typing in an input
			if ((e.target as HTMLElement)?.tagName === 'INPUT') return;
			e.preventDefault();
			resetSoundSelected();
			return;
		}

		// Escape: deselect
		if (e.key === 'Escape' && soundEditorState.selected) {
			e.preventDefault();
			soundEditorState.selected = null;
			return;
		}

		const ctrl = e.ctrlKey || e.metaKey;
		if (!ctrl) return;

		if (e.key === 'z' && !e.shiftKey) {
			e.preventDefault();
			soundUndo();
		} else if ((e.key === 'z' && e.shiftKey) || e.key === 'y') {
			e.preventDefault();
			soundRedo();
		} else if (e.key === 'c') {
			e.preventDefault();
			copySoundSelected();
		} else if (e.key === 'v') {
			e.preventDefault();
			pasteSoundToSelected();
		}
	}

	onMount(() => {
		soundEditorState.enabled = true;
		initSoundHistory();
		window.addEventListener('keydown', onKeyDown);
		return () => {
			soundEditorState.enabled = false;
			soundEditorState.selected = null;
			window.removeEventListener('keydown', onKeyDown);
		};
	});
</script>

<!-- Host has no visible UI — toolbar is in SoundEditorToolbar.svelte -->
