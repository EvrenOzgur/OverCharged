<!--
	Debug stepper — pick a book by index, advance event-by-event with Next button.

	Use cases:
	  • Inspect what happens at a specific event when something looks wrong
	  • See exactly which event triggers a visual glitch
	  • Re-play a single event without re-running the full book sequence

	The control panel is an HTML overlay (fixed bottom-left) over the Pixi canvas
	so it stays visible regardless of what's happening in the game.
-->
<script lang="ts" module>
	import { defineMeta } from '@storybook/addon-svelte-csf';

	const { Story } = defineMeta({
		title: 'DEBUG/bookStepper',
	});
</script>

<script lang="ts">
	import { StoryGameTemplate, StoryLocale } from 'components-storybook';
	import { stateBet } from 'state-shared';

	import Game from '../components/Game.svelte';
	import { setContext } from '../game/context';
	import { playBookEvent } from '../game/utils';
	import baseBooks from './data/base_books.json';
	import bonusBooks from './data/bonus_books.json';

	setContext();

	// IMPORTANT: clear any leftover bet state from previously visited stories.
	// Otherwise ResumeBet (inside <Game />) broadcasts `resumeBet` on mount and
	// the gameActor auto-plays the cached book non-stop. Cleared at script
	// init (synchronously, before any child <Game /> subcomponent mounts).
	stateBet.lastBet = {} as any;

	type Mode = 'base' | 'bonus';

	let mode = $state<Mode>('bonus');
	let bookIndex = $state(48); // default: id=49 (all 4 skills + max payout in current sample)
	let currentEventIndex = $state(0);
	let isPlaying = $state(false);
	let jsonExpanded = $state(false);
	let bookIndexInput = $state(48);

	const books = $derived(mode === 'bonus' ? bonusBooks : baseBooks);
	const book = $derived(books[bookIndex] as any);
	const totalEvents = $derived(book?.events?.length ?? 0);
	const currentEvent = $derived(book?.events?.[currentEventIndex]);
	const finished = $derived(currentEventIndex >= totalEvents);

	async function playNext() {
		if (!book || finished) return;
		isPlaying = true;
		try {
			await playBookEvent(book.events[currentEventIndex], {
				bookEvents: book.events,
			} as any);
			currentEventIndex++;
		} finally {
			isPlaying = false;
		}
	}

	async function playRemaining() {
		if (!book || finished) return;
		isPlaying = true;
		try {
			while (currentEventIndex < totalEvents) {
				await playBookEvent(book.events[currentEventIndex], {
					bookEvents: book.events,
				} as any);
				currentEventIndex++;
			}
		} finally {
			isPlaying = false;
		}
	}

	function reset() {
		currentEventIndex = 0;
	}

	function loadBookIndex() {
		const idx = Math.max(0, Math.min(books.length - 1, bookIndexInput || 0));
		bookIndex = idx;
		bookIndexInput = idx;
		currentEventIndex = 0;
	}

	function switchMode(newMode: Mode) {
		mode = newMode;
		bookIndex = 0;
		bookIndexInput = 0;
		currentEventIndex = 0;
	}

	// Short preview of the current event (key fields only, not full JSON)
	const eventSummary = $derived.by(() => {
		const ev = currentEvent;
		if (!ev) return '(reached end of book)';
		const t = ev.type;
		if (t === 'reveal') return `reveal gameType=${ev.gameType}`;
		if (t === 'winInfo')
			return `winInfo totalWin=${ev.totalWin} wins=${ev.wins?.length}`;
		if (t === 'tumbleBoard')
			return `tumbleBoard explode=${ev.explodingSymbols?.length}`;
		if (t === 'skillActivated')
			return `skillActivated ${ev.skillType}${ev.positions ? ' positions=' + ev.positions.length : ''}`;
		if (t === 'multiplierSymbolActivated')
			return `multiplierSymbolActivated symbols=${ev.symbols?.length} globalMult=${ev.newGlobalMultiplier}`;
		if (t === 'updateGlobalMult') return `updateGlobalMult=${ev.globalMult}`;
		if (t === 'finalMultiplierApplied')
			return `finalMultiplier=${ev.finalMultiplier} baseWin=${ev.baseWin} totalWin=${ev.totalWin}`;
		if (t === 'setWin') return `setWin amount=${ev.amount} winLevel=${ev.winLevel}`;
		if (t === 'setTotalWin') return `setTotalWin=${ev.amount}`;
		if (t === 'updateFreeSpin') return `updateFreeSpin ${ev.amount}/${ev.total}`;
		if (t === 'updateTumbleWin') return `updateTumbleWin=${ev.amount}`;
		return t;
	});
</script>

{#snippet template()}
	<StoryGameTemplate skipLoadingScreen={true}>
		<StoryLocale lang="en">
			<Game />
		</StoryLocale>
	</StoryGameTemplate>

	<!-- HTML control panel overlay. Sits above Pixi canvas; pointer-events all
		 belong to HTML so canvas clicks are not affected. -->
	<div class="stepper-panel">
		<div class="row">
			<button
				class:active={mode === 'base'}
				onclick={() => switchMode('base')}>BASE</button
			>
			<button
				class:active={mode === 'bonus'}
				onclick={() => switchMode('bonus')}>BONUS</button
			>
			<span class="meta">id={book?.id} payout={book?.payoutMultiplier}</span>
		</div>

		<div class="row">
			<label>
				bookIndex:
				<input
					type="number"
					min="0"
					max={books.length - 1}
					bind:value={bookIndexInput}
				/>
			</label>
			<button onclick={loadBookIndex}>Load</button>
			<span class="meta">(0..{books.length - 1})</span>
		</div>

		<div class="row event-row">
			<span class="event-counter">
				Event {currentEventIndex} / {totalEvents}
			</span>
			<span class="event-summary">{eventSummary}</span>
		</div>

		<details bind:open={jsonExpanded}>
			<summary>Event JSON</summary>
			<pre>{currentEvent ? JSON.stringify(currentEvent, null, 2) : '(none)'}</pre>
		</details>

		<div class="row buttons">
			<button onclick={playNext} disabled={isPlaying || finished} class="primary">
				Next →
			</button>
			<button onclick={playRemaining} disabled={isPlaying || finished}>
				Play remaining
			</button>
			<button onclick={reset} disabled={isPlaying}>Reset to 0</button>
		</div>

		{#if finished}
			<div class="finished">📕 reached end of book</div>
		{/if}
	</div>
{/snippet}

<Story name="stepper" {template} />

<style>
	:global(.stepper-panel) {
		position: fixed;
		bottom: 16px;
		left: 16px;
		background: rgba(0, 0, 0, 0.85);
		color: #fff;
		padding: 12px 16px;
		border-radius: 8px;
		font-family: 'Courier New', monospace;
		font-size: 13px;
		min-width: 420px;
		max-width: 520px;
		z-index: 9999;
		border: 1px solid #ffaa00;
		box-shadow: 0 4px 24px rgba(0, 0, 0, 0.5);
	}

	:global(.stepper-panel .row) {
		display: flex;
		align-items: center;
		gap: 8px;
		margin-bottom: 6px;
		flex-wrap: wrap;
	}

	:global(.stepper-panel button) {
		background: #333;
		color: #fff;
		border: 1px solid #555;
		padding: 4px 10px;
		border-radius: 4px;
		cursor: pointer;
		font-family: inherit;
		font-size: 12px;
	}
	:global(.stepper-panel button:hover:not(:disabled)) {
		background: #444;
		border-color: #888;
	}
	:global(.stepper-panel button:disabled) {
		opacity: 0.4;
		cursor: not-allowed;
	}
	:global(.stepper-panel button.active) {
		background: #ffaa00;
		color: #000;
		border-color: #ffaa00;
	}
	:global(.stepper-panel button.primary) {
		background: #2a8;
		border-color: #4ca;
		font-weight: bold;
	}

	:global(.stepper-panel input[type='number']) {
		background: #111;
		color: #fff;
		border: 1px solid #555;
		border-radius: 4px;
		padding: 3px 6px;
		font-family: inherit;
		width: 80px;
	}

	:global(.stepper-panel .meta) {
		color: #aaa;
		font-size: 11px;
	}

	:global(.stepper-panel .event-row) {
		background: rgba(255, 170, 0, 0.1);
		padding: 6px 10px;
		border-radius: 4px;
		border: 1px solid rgba(255, 170, 0, 0.3);
		margin: 8px 0;
	}

	:global(.stepper-panel .event-counter) {
		color: #ffaa00;
		font-weight: bold;
		min-width: 110px;
	}

	:global(.stepper-panel .event-summary) {
		color: #fff;
		font-size: 12px;
		word-break: break-word;
	}

	:global(.stepper-panel details) {
		margin: 6px 0;
	}
	:global(.stepper-panel summary) {
		cursor: pointer;
		color: #aaa;
		user-select: none;
	}
	:global(.stepper-panel pre) {
		background: #111;
		padding: 8px;
		border-radius: 4px;
		max-height: 200px;
		overflow: auto;
		font-size: 11px;
		color: #ddd;
		margin-top: 4px;
	}

	:global(.stepper-panel .buttons) {
		margin-top: 8px;
		gap: 6px;
	}

	:global(.stepper-panel .finished) {
		margin-top: 6px;
		color: #ffaa00;
		font-weight: bold;
	}
</style>
