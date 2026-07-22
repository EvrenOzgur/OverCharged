<script lang="ts">
	import { SpineProvider, SpineTrack } from 'pixi-svelte';
	import { stateBetDerived } from 'state-shared';

	import type { Reel } from '../game/stateGame.svelte';
	import { REEL_PADDING, SYMBOL_SIZE, BOARD_DIMENSIONS } from '../game/constants';
	import BoardContainer from './BoardContainer.svelte';
	import BoardMask from './BoardMask.svelte';
	import HideSpineSlot from './HideSpineSlot.svelte';

	type Props = {
		reel: Reel;
		oncomplete: () => void;
	};

	const props: Props = $props();

	// Anticipation spine'ının yüksekliği (sembol cinsinden). Board 8 sembol;
	// bunu board'dan küçük tutarak animasyonu üst/alta pay bırakacak şekilde
	// küçültüyoruz. Maske board boyunda kalır, sadece spine küçülür.
	// Büyüt/küçült için TEK yer burası.
	const ANT_HEIGHT = SYMBOL_SIZE * 4;

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
	<!-- Spine'ın dust/sparks/glow'u board dışına taşmasın diye board alanına
	     kırpıyoruz. Maske board boyunda kalır; boyut ayarı spine'ın kendisinde
	     (ANT_HEIGHT) yapılır. -->
	<BoardMask />
	<SpineProvider
		asset="anticipation"
		width={SYMBOL_SIZE * 0.5}
		height={ANT_HEIGHT}
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
		<!-- `anticipation_loop` animates slot `glow2`'s color through bright
		     green keyframes (28f11d/3fe729/43d532/4fd821) — reads as a green
		     arc sweeping the reel while waiting on a scatter. `glow` (the
		     other glow slot) stays white/neutral, left alone. -->
		<HideSpineSlot slotNames={['glow2']} />
	</SpineProvider>
</BoardContainer>
