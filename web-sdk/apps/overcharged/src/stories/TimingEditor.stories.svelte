<script lang="ts" module>
	import { defineMeta } from '@storybook/addon-svelte-csf';

	const { Story } = defineMeta({
		title: 'Sound/Timing Editor',
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
	import TimingEditorPanel from './TimingEditorPanel.svelte';

	setContext();

	// Same trick as SoundEditor: no RGS in Storybook, so seed a mock balance
	// and replay a recorded book to drive the real tumble flow (explosions,
	// slide-downs, cluster win amounts, multiplier combine/reset) so the
	// timing knobs above can be tuned against the actual animation.
	onMount(() => {
		stateBet.balanceAmount = 1_000_000;
	});

	let testSpinning = $state(false);
	const runBook = async (books: any[], index?: number) => {
		if (testSpinning) return;
		testSpinning = true;
		try {
			await installGoldBitmapFont();
			const i = index ?? randomInteger({ min: 0, max: books.length - 1 });
			const data = books[i];
			await playBet({ ...data, state: data.events });
		} catch (err) {
			console.error('[TimingEditor] test spin failed', err);
		} finally {
			testSpinning = false;
		}
	};
</script>

<Story name="Timing Editor">
	<div class="timing-test-spin">
		<span class="tts-label">REPLAY TUMBLE</span>
		<button disabled={testSpinning} onclick={() => runBook(baseBooks)}>▶ Base</button>
		<button disabled={testSpinning} onclick={() => runBook(bonusBooks)}>▶ Bonus</button>
		<!-- bonus #48: wilds drop naturally into tumbles → exercises multiplier combine/reset -->
		<button disabled={testSpinning} onclick={() => runBook(bonusBooks, 48)}>▶ Wild Drop</button>
	</div>

	<TimingEditorPanel />

	<StoryGameTemplate skipLoadingScreen={true} action={async () => {}}>
		<StoryLocale lang="en">
			<Game />
		</StoryLocale>
	</StoryGameTemplate>
</Story>

<style>
	.timing-test-spin {
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
	.tts-label {
		font-size: 10px;
		letter-spacing: 0.12em;
		color: #45d3e3;
	}
	.timing-test-spin button {
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
	.timing-test-spin button:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}
</style>
