<script lang="ts" module>
	import { defineMeta } from '@storybook/addon-svelte-csf';

	const { Story } = defineMeta({
		title: 'UI/Layout Editor',
	});
</script>

<script lang="ts">
	import { StoryLocale, StoryGameTemplate } from 'components-storybook';

	import Game from '../components/Game.svelte';
	import { setContext } from '../game/context';
	import UiLayoutEditorHost from './UiLayoutEditorHost.svelte';
	import { panelsVisible } from './editorPanels.svelte';
	import UiLayoutInspector from './UiLayoutInspector.svelte';
	import UiBackgroundEditor from './UiBackgroundEditor.svelte';
	import UiEditorToolbar from './UiEditorToolbar.svelte';
	import UiPaletteEditor from './UiPaletteEditor.svelte';

	setContext();
</script>

<Story name="Bottom Action Buttons (desktop)">
	<UiLayoutEditorHost />

	{#if panelsVisible.value}
		<UiLayoutInspector />
		<UiBackgroundEditor />
		<UiPaletteEditor />
		<UiEditorToolbar />
	{/if}

	<StoryGameTemplate skipLoadingScreen={true} action={async () => {}}>
		<StoryLocale lang="en">
			<Game />
		</StoryLocale>
	</StoryGameTemplate>
</Story>
