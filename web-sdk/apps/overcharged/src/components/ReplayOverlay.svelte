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
	import { API_AMOUNT_MULTIPLIER } from 'constants-shared/bet';
	import { numberToWinCurrencyString } from 'utils-shared/amount';
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
		(globalThis as { __replay?: unknown }).__replay = {
			lastBet: stateBet.lastBet,
			events,
			firstEvent: events?.[0],
			eventTypes: events?.map?.((e: { type: string }) => e?.type),
		};
		if (!events?.length) {
			return;
		}
		// Keep the activeBetModeKey in the canonical uppercase form. Math SDK
		// emits lowercase mode strings, but the betModeMeta registry is keyed
		// uppercase, and downstream `mode === 'BONUS'` comparators expect it.
		stateBet.activeBetModeKey = (
			(stateBet.lastBet as { mode?: string })?.mode ??
			params.mode ??
			'BASE'
		).toUpperCase();
		phase = 'playing';
		try {
			// Bypass `resumeBet` → gameActor entirely. The resumeBet machine
			// triggers `requestEndRound` after playback (live-spin cleanup),
			// which 400s in replay mode (no sessionID). Calling playBookEvents
			// directly drives the renderer through bookEventHandlerMap with no
			// /wallet/* side effects.
			await playBookEvents(events as never);
		} catch {
			// swallow — phase still resolves to 'finished' below
		} finally {
			phase = 'finished';
		}
	}

	function playAgain() {
		// Re-run from the top by replaying the same event stream.
		void startReplay();
	}

	const rawCurrency = $derived(params.currency || (stateUrlDerived.social() ? 'XSC' : 'USD'));
	// Social-mode display: XSC → SC, XGC → GC (no $ sign anywhere on screen).
	const currency = $derived(
		rawCurrency === 'XSC' ? 'SC' : rawCurrency === 'XGC' ? 'GC' : rawCurrency,
	);
	// Mode label: math uses 'BASE'/'BONUS' keys. In social mode "BONUS" is OK
	// (not a restricted word) but the buy-bonus path implies "buy" — show
	// "FEATURE" instead. Non-social keeps the original label.
	const modeLabel = $derived.by(() => {
		const m = (params.mode ?? '').toUpperCase();
		if (stateUrlDerived.social() && m === 'BONUS') return 'FEATURE';
		return m;
	});
	const displayAmount = $derived(stateBet.betAmount.toFixed(2));
	const costMultiplier = $derived(
		(stateBet.lastBet as any)?.payoutMultiplier !== undefined
			? // costMultiplier comes from the round payload; fall back to 1 if absent
				((stateBet.lastBet as any)?.costMultiplier ?? 1)
			: 1,
	);
	const totalSpent = $derived((Number(displayAmount) * Number(costMultiplier)).toFixed(2));
	// Stake replay spec — "Show results": bet cost, payout multiplier, and win
	// amount must all be visible before the user presses Start Replay, not
	// just after playback. payoutMultiplier is the plain round multiplier
	// (e.g. 0, 1.25, 5); payout on lastBet is scaled the same way amount is
	// (see Authenticate.svelte's initReplay), so divide back down to a plain
	// currency float before formatting.
	const payoutMultiplier = $derived(
		typeof (stateBet.lastBet as any)?.payoutMultiplier === 'number'
			? (stateBet.lastBet as any).payoutMultiplier
			: 0,
	);
	const totalWinAmount = $derived(
		typeof (stateBet.lastBet as any)?.payout === 'number'
			? (stateBet.lastBet as any).payout / API_AMOUNT_MULTIPLIER
			: 0,
	);
</script>

{#if ready && phase !== 'playing'}
	<div class="replay-overlay">
		<div class="replay-panel">
			{#if phase === 'ready'}
				<div class="replay-title-pill">{stateUrlDerived.social() ? 'Spin Replay' : 'Replay'}</div>
				<div class="replay-box">
					<div class="replay-grid">
						<div class="replay-cell">
							<span class="replay-label">Mode</span>
							<span class="replay-value">{modeLabel}</span>
						</div>
						<div class="replay-cell">
							<span class="replay-label">{stateUrlDerived.social() ? 'Stake' : 'Bet'}</span>
							<span class="replay-value">{currency} {displayAmount}</span>
						</div>
						<div class="replay-cell">
							<span class="replay-label">Cost Mult</span>
							<span class="replay-value">{costMultiplier}×</span>
						</div>
						<div class="replay-cell">
							<span class="replay-label">Payout</span>
							<span class="replay-value">{payoutMultiplier}×</span>
						</div>
					</div>
				</div>
				<div class="replay-box replay-box-results">
					<div class="replay-row">
						<span class="replay-label">Total Cost</span>
						<span class="replay-value">{currency} {totalSpent}</span>
					</div>
					<div class="replay-row replay-row-win">
						<span class="replay-label">Total Win</span>
						<span class="replay-value">{numberToWinCurrencyString(totalWinAmount)}</span>
					</div>
				</div>
				<button class="replay-button" onclick={startReplay}>
					<span class="replay-button-icon">▶</span> Start Replay
				</button>
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
		font-family: 'ranchers', sans-serif;
	}
	.replay-panel {
		position: relative;
		min-width: 320px;
		padding: 28px 24px 24px;
		margin-top: 20px;
		background: #16161a;
		border: 1px solid #333338;
		border-radius: 16px;
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
	.replay-title-pill {
		position: absolute;
		top: -20px;
		left: 50%;
		transform: translateX(-50%);
		padding: 8px 20px;
		background: #1e1e23;
		border: 1px solid #3a3a40;
		border-radius: 999px;
		font-size: 13px;
		font-weight: 700;
		letter-spacing: 0.08em;
		text-transform: uppercase;
		color: #fff;
		white-space: nowrap;
	}
	.replay-box {
		margin-top: 18px;
		padding: 14px 18px;
		border: 1px solid #303036;
		border-radius: 10px;
	}
	.replay-grid {
		display: grid;
		grid-template-columns: 1fr 1fr;
		row-gap: 14px;
	}
	.replay-cell {
		display: flex;
		flex-direction: column;
		gap: 4px;
	}
	.replay-box-results {
		padding: 0;
		overflow: hidden;
	}
	.replay-row {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 12px 18px;
		font-size: 14px;
	}
	.replay-row-win {
		background: rgba(57, 255, 20, 0.1);
	}
	.replay-label {
		color: #8a8a90;
		font-size: 11px;
		font-weight: 600;
		letter-spacing: 0.06em;
		text-transform: uppercase;
	}
	.replay-value {
		color: #fff;
		font-weight: 700;
		font-size: 16px;
	}
	.replay-button {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 8px;
		width: 100%;
		margin-top: 20px;
		padding: 14px 16px;
		background: #39ff14;
		color: #0d0d10;
		border: none;
		border-radius: 8px;
		font-weight: 700;
		font-size: 15px;
		text-transform: none;
		letter-spacing: 0.02em;
		cursor: pointer;
		transition: background 120ms ease;
	}
	.replay-button-icon {
		font-size: 12px;
	}
	.replay-button:hover {
		background: #4dff2e;
	}
	.replay-button:active {
		background: #2dcf10;
	}
</style>
