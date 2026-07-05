<script lang="ts" module>
	import { defineMeta } from '@storybook/addon-svelte-csf';

	const { Story } = defineMeta({
		title: 'Sound/Sound Editor',
	});
</script>

<script lang="ts">
	import { onMount } from 'svelte';

	import { StoryLocale, StoryGameTemplate } from 'components-storybook';
	import { stateBet } from 'state-shared';
	import { randomInteger } from 'utils-shared/random';

	import Game from '../components/Game.svelte';
	import { setContext } from '../game/context';
	import { playBet } from '../game/utils';
	import { installGoldBitmapFont } from '../game/installGoldFont';
	import baseBooks from './data/base_books.json';
	import bonusBooks from './data/bonus_books.json';
	import SoundEditorHost from './SoundEditorHost.svelte';
	import SoundEditorToolbar from './SoundEditorToolbar.svelte';
	import SoundLibrary from './SoundLibrary.svelte';
	import SoundInspector from './SoundInspector.svelte';
	import SoundTimeline from './SoundTimeline.svelte';
	import SoundSequencer from './SoundSequencer.svelte';
	import SoundEventMapper from './SoundEventMapper.svelte';
	import { soundPanels } from './editorSoundPanels.svelte';

	setContext();

	// Storybook has no RGS/authenticate, so balance stays 0 and the Spin button
	// (and other balance-gated controls) render disabled — you can't click them
	// to hear their sounds. Seed a mock balance so the whole UI is interactive
	// for sound testing. Only affects this story; nothing hits the RGS.
	onMount(() => {
		stateBet.balanceAmount = 1_000_000;
	});

	// Game-flow sounds (reel stop, wins, multipliers, scatters…) only fire while
	// a real round animates. Storybook has no RGS, so instead we replay a local
	// recorded book — the reels spin/stop and every event sound plays, no RGS.
	let testSpinning = $state(false);
	const runBook = async (books: any[]) => {
		if (testSpinning) return;
		testSpinning = true;
		try {
			// Ensure the 'gold' bitmap font is fully installed before win/tumble
			// text renders — otherwise BitmapText falls back to a wrong font.
			await installGoldBitmapFont();
			const data = books[randomInteger({ min: 0, max: books.length - 1 })];
			await playBet({ ...data, state: data.events });
		} catch (err) {
			console.error('[SoundEditor] test spin failed', err);
		} finally {
			testSpinning = false;
		}
	};
</script>

<Story name="Sound Editor">
	<!-- Test Spin: replay a local book so game-flow sounds fire without RGS -->
	<div class="sound-test-spin">
		<span class="sts-label">TEST SPIN</span>
		<button disabled={testSpinning} onclick={() => runBook(baseBooks)}>▶ Base</button>
		<button disabled={testSpinning} onclick={() => runBook(bonusBooks)}>▶ Bonus</button>
	</div>

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

<style>
	.sound-test-spin {
		position: fixed;
		top: 8px;
		right: 12px;
		z-index: 1000;
		display: flex;
		align-items: center;
		gap: 6px;
		background: rgba(20, 26, 36, 0.9);
		border: 1px solid #2a3547;
		border-radius: 8px;
		padding: 6px 8px;
		font-family: ui-monospace, monospace;
	}
	.sts-label {
		font-size: 10px;
		letter-spacing: 0.12em;
		color: #45d3e3;
	}
	.sound-test-spin button {
		font: inherit;
		font-size: 12px;
		cursor: pointer;
		border-radius: 6px;
		border: 1px solid #3a465c;
		background: #f4b23e;
		color: #1a1204;
		font-weight: 600;
		padding: 5px 10px;
	}
	.sound-test-spin button:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}
</style>
