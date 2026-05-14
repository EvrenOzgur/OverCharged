<!--
	Replay-mode overlay — Stake Bet Replay compliance.

	Behavior:
	  • Mounts only when `?replay=true` and the round payload loaded successfully.
	  • Renders a dimmed full-screen layer with a "Start Replay" panel that shows
	    mode + bet amount + currency (no event id, per Stake spec).
	  • On "Start Replay" → broadcasts `resumeBet` so the existing playEvents
	    pipeline (EnableGameActor → gameActor RESUME_BET) plays the round
	    identical to a live spin.
	  • When the spin finishes, broadcasts `replayFinished` (we listen for the
	    `finalWin` book event) and shows "Play Again" — clicking restarts the
	    same replay from the beginning.

	No bet buttons, balance, or other live-mode UI is rendered while replay
	is active. The Game canvas underneath is fully visible so animations play.
-->
<script lang="ts">
	import { stateBet, stateUrlDerived } from 'state-shared';
	import { getContext } from '../game/context';
	import { playBookEvents } from '../game/utils';

	const context = getContext();
	const params = $derived(stateUrlDerived.replayParams());
	let phase = $state<'ready' | 'playing' | 'finished'>('ready');

	// Don't render the overlay until the game has finished loading its assets
	// and the LoadingScreen has handed control to the main canvas. Otherwise
	// the user could click "Start Replay" while gameActor is still in IDLE
	// state and the playback would be ignored.
	const ready = $derived(context.stateApp?.loaded === true);

	async function startReplay() {
		const events = stateBet.lastBet?.state;
		// Expose to DevTools for manual inspection (`__replay` in console).
		(globalThis as any).__replay = {
			lastBet: stateBet.lastBet,
			events,
			firstEvent: events?.[0],
			eventTypes: events?.map?.((e: any) => e?.type),
		};
		console.log('[REPLAY-DEBUG] Start Replay clicked', {
			lastBetExists: !!stateBet.lastBet,
			stateExists: !!events,
			stateLength: events?.length,
			eventTypes: events?.map?.((e: any) => e?.type),
			firstEvent: events?.[0],
			lastEvent: events?.[(events?.length ?? 1) - 1],
			lastBetSnapshot: stateBet.lastBet,
		});
		if (!events?.length) {
			console.warn('[REPLAY-DEBUG] startReplay aborted — no state in lastBet');
			return;
		}
		stateBet.activeBetModeKey = (stateBet.lastBet as any)?.mode ?? params.mode;
		phase = 'playing';
		try {
			// Bypass `resumeBet` → gameActor entirely. The resumeBet machine
			// triggers `requestEndRound` after playback (live-spin cleanup),
			// which 400s in replay mode (no sessionID). Calling playBookEvents
			// directly drives the renderer through bookEventHandlerMap with no
			// /wallet/* side effects.
			console.log('[REPLAY-DEBUG] playing book events directly (length=' + events.length + ')');
			await playBookEvents(events as any);
			console.log('[REPLAY-DEBUG] playback complete');
		} catch (err) {
			console.error('[REPLAY-DEBUG] playback failed', err);
		} finally {
			phase = 'finished';
		}
	}

	function playAgain() {
		// Re-run from the top by replaying the same event stream.
		void startReplay();
	}

	const currency = $derived(params.currency || (stateUrlDerived.social() ? 'XSC' : 'USD'));
	const displayAmount = $derived(stateBet.betAmount.toFixed(2));
	const costMultiplier = $derived(
		(stateBet.lastBet as any)?.payoutMultiplier !== undefined
			? // costMultiplier comes from the round payload; fall back to 1 if absent
				((stateBet.lastBet as any)?.costMultiplier ?? 1)
			: 1,
	);
	const totalSpent = $derived((Number(displayAmount) * Number(costMultiplier)).toFixed(2));
</script>

{#if ready && phase !== 'playing'}
	<div class="replay-overlay">
		<div class="replay-panel">
			{#if phase === 'ready'}
				<div class="replay-title">Bet Replay</div>
				<div class="replay-row">
					<span class="replay-label">Mode</span>
					<span class="replay-value">{params.mode}</span>
				</div>
				<div class="replay-row">
					<span class="replay-label">Bet</span>
					<span class="replay-value">{currency} {displayAmount}</span>
				</div>
				{#if Number(costMultiplier) !== 1}
					<div class="replay-row">
						<span class="replay-label">Cost ×</span>
						<span class="replay-value">{costMultiplier}</span>
					</div>
					<div class="replay-row">
						<span class="replay-label">Total Spent</span>
						<span class="replay-value">{currency} {totalSpent}</span>
					</div>
				{/if}
				<button class="replay-button" onclick={startReplay}>Start Replay</button>
			{:else}
				<div class="replay-title">Replay Finished</div>
				<button class="replay-button" onclick={playAgain}>Play Again</button>
			{/if}
		</div>
	</div>
{/if}

<style>
	.replay-overlay {
		position: fixed;
		inset: 0;
		display: flex;
		align-items: center;
		justify-content: center;
		background: rgba(0, 0, 0, 0.7);
		z-index: 9999;
		font-family: 'proxima-nova', sans-serif;
	}
	.replay-panel {
		min-width: 280px;
		padding: 24px 32px;
		background: linear-gradient(180deg, #1a1a1e, #0d0d10);
		border: 1px solid #4a4a4e;
		border-radius: 8px;
		color: #fff;
		box-shadow: 0 8px 32px rgba(0, 0, 0, 0.6);
	}
	.replay-title {
		font-size: 18px;
		font-weight: 700;
		text-align: center;
		margin-bottom: 16px;
		color: #39ff14;
		letter-spacing: 0.05em;
		text-transform: uppercase;
	}
	.replay-row {
		display: flex;
		justify-content: space-between;
		padding: 6px 0;
		font-size: 14px;
	}
	.replay-label {
		color: #999;
	}
	.replay-value {
		color: #fff;
		font-weight: 600;
	}
	.replay-button {
		display: block;
		width: 100%;
		margin-top: 20px;
		padding: 12px 16px;
		background: #39ff14;
		color: #000;
		border: none;
		border-radius: 4px;
		font-weight: 700;
		font-size: 14px;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		cursor: pointer;
		transition: background 120ms ease;
	}
	.replay-button:hover {
		background: #4dff2e;
	}
	.replay-button:active {
		background: #2dcf10;
	}
</style>
