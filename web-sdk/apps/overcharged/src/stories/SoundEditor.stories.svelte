<script lang="ts" module>
	import { defineMeta } from '@storybook/addon-svelte-csf';

	const { Story } = defineMeta({
		title: 'Sound/Sound Editor',
	});
</script>

<script lang="ts">
	import { StoryLocale, StoryGameTemplate } from 'components-storybook';

	import Game from '../components/Game.svelte';
	import { setContext } from '../game/context';
	import SoundEditorHost from './SoundEditorHost.svelte';
	import SoundEditorToolbar from './SoundEditorToolbar.svelte';
	import SoundLibrary from './SoundLibrary.svelte';
	import SoundInspector from './SoundInspector.svelte';
	import SoundTimeline from './SoundTimeline.svelte';
	import SoundSequencer from './SoundSequencer.svelte';
	import SoundEventMapper from './SoundEventMapper.svelte';
	import { soundPanels } from './editorSoundPanels.svelte';

	setContext();
</script>

<Story name="Sound Editor">
	<!-- Host: keyboard shortcuts, lifecycle (always active) -->
	<SoundEditorHost />

	<!-- Toolbar: panel toggles, undo/redo, clipboard, save (always visible) -->
	<SoundEditorToolbar />

	<!-- Each panel toggles independently -->
	{#if soundPanels.library}
		<SoundLibrary />
	{/if}
	{#if soundPanels.inspector}
		<SoundInspector />
	{/if}
	{#if soundPanels.timeline}
		<SoundTimeline />
	{/if}
	{#if soundPanels.sequencer}
		<SoundSequencer />
	{/if}
	{#if soundPanels.eventMapper}
		<SoundEventMapper />
	{/if}

	<StoryGameTemplate skipLoadingScreen={true} action={async () => {}}>
		<StoryLocale lang="en">
			<Game />
		</StoryLocale>
	</StoryGameTemplate>
</Story>
