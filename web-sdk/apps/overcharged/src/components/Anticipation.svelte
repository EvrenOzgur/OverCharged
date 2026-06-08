<script lang="ts">
	import { SpineProvider, SpineTrack } from 'pixi-svelte';
	import { stateBetDerived } from 'state-shared';

	import type { Reel } from '../game/stateGame.svelte';
	import { REEL_PADDING, SYMBOL_SIZE, BOARD_DIMENSIONS } from '../game/constants';
	import BoardContainer from './BoardContainer.svelte';

	type Props = {
		reel: Reel;
		oncomplete: () => void;
	};

	const props: Props = $props();

	type AnimationName = 'anticipation_intro' | 'anticipation_loop' | 'anticipation_out';

	let animationName = $state<AnimationName>('anticipation_intro');

	$effect(() => {
		if (props.reel.reelState.motion === 'stopped') {
			animationName = 'anticipation_out';
		}
	});
</script>

<!-- Inside BoardContainer so it shares the board's calibration scale + offset
     (same space as the symbols). Positioned in board-local coords on its reel's
     column (matching getSymbolX); the spine's own origin centres it. No anchor —
     mirrors the original placement so the streak stays column-aligned. -->
<BoardContainer>
	<SpineProvider
		asset="anticipation"
		width={SYMBOL_SIZE * 0.6}
		height={SYMBOL_SIZE * 5}
		x={SYMBOL_SIZE * (props.reel.reelIndex + REEL_PADDING)}
		y={(SYMBOL_SIZE * BOARD_DIMENSIONS.y) / 2 - SYMBOL_SIZE * 0.06}
	>
		<SpineTrack
			trackIndex={0}
			{animationName}
			loop={animationName === 'anticipation_loop'}
			timeScale={stateBetDerived.timeScale()}
			listener={{
				complete: () => {
					if (animationName === 'anticipation_intro') {
						animationName = 'anticipation_loop';
					}

					if (animationName === 'anticipation_out') {
						props.oncomplete();
					}
				},
			}}
		/>
	</SpineProvider>
</BoardContainer>
