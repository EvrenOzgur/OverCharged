<script lang="ts">
	import { onMount } from 'svelte';
	import { editorState } from '../game/uiLayoutConfig.svelte';

	onMount(() => {
		editorState.enabled = true;
		return () => {
			editorState.enabled = false;
			editorState.selected = null;
		};
	});
</script>
