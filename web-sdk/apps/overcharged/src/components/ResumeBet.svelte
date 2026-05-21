<script lang="ts">
	import { stateBet, stateUrlDerived } from 'state-shared';
	import { getContext } from '../game/context';
	import { onMount } from 'svelte';

	const context = getContext();

	onMount(() => {
		const replay = stateUrlDerived.isReplayMode();
		// Replay mode: don't auto-resume — `ReplayOverlay` triggers playback
		// after the user clicks "Start Replay" (Stake compliance: replay must
		// not auto-play before user interaction).
		if (replay) return;

		if (stateBet.lastBet?.active && stateBet.lastBet.mode) {
			stateBet.activeBetModeKey = stateBet.lastBet.mode;
		}
		context.eventEmitter.broadcast({ type: 'resumeBet' });
	});
</script>
