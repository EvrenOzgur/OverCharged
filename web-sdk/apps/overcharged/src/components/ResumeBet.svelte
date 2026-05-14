<script lang="ts">
	import { stateBet, stateUrlDerived } from 'state-shared';
	import { getContext } from '../game/context';
	import { onMount } from 'svelte';

	const context = getContext();

	onMount(() => {
		const replay = stateUrlDerived.isReplayMode();
		console.log('[REPLAY-DEBUG] ResumeBet onMount', {
			isReplayMode: replay,
			lastBetActive: stateBet.lastBet?.active,
			lastBetMode: stateBet.lastBet?.mode,
			stateLength: (stateBet.lastBet as any)?.state?.length,
		});
		// Replay mode: don't auto-resume — `ReplayOverlay` triggers playback
		// after the user clicks "Start Replay" (Stake compliance: replay must
		// not auto-play before user interaction).
		if (replay) {
			console.log('[REPLAY-DEBUG] ResumeBet → SKIP (replay mode)');
			return;
		}

		if (stateBet.lastBet?.active && stateBet.lastBet.mode) {
			stateBet.activeBetModeKey = stateBet.lastBet.mode;
		}
		console.log('[REPLAY-DEBUG] ResumeBet → broadcasting resumeBet (live mode)');
		context.eventEmitter.broadcast({ type: 'resumeBet' });
	});
</script>
