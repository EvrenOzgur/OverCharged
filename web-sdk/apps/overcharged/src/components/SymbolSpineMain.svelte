<script lang="ts">
	import { BitmapText, SpineProvider, SpineTrack, type SpineTrackProps } from 'pixi-svelte';
	import { stateBetDerived } from 'state-shared';

	import { getSymbolInfo } from '../game/utils';
	import { SYMBOL_SIZE } from '../game/constants';

	type Props = {
		symbolInfo: ReturnType<typeof getSymbolInfo>;
		x?: number;
		y?: number;
		listener: SpineTrackProps['listener'];
		loop?: boolean;
		multiplier?: number;
	};

	const props: Props = $props();

	// `frozen` symbols (the multiplier coin's idle states) hold their animation's
	// last frame instead of playing — timeScale 0 + a trackTime past the end
	// clamps the non-looping animation to its final (value-facing) pose. Only the
	// `win` state is unfrozen, so the coin flips exactly once when collected.
	const frozen = $derived(Boolean((props.symbolInfo as { frozen?: boolean })?.frozen));
</script>

{#if props.symbolInfo}
	<SpineProvider
		x={props.x}
		y={props.y}
		asset={props.symbolInfo.assetKey}
		height={SYMBOL_SIZE * props.symbolInfo.sizeRatios.height}
		skin={props.symbolInfo.skin}
	>
		<SpineTrack
			loop={props.loop}
			trackIndex={0}
			animationName={props.symbolInfo.animationName}
			timeScale={frozen ? 0 : stateBetDerived.timeScale()}
			trackTime={frozen ? 9999 : undefined}
			listener={props.listener}
		/>
	</SpineProvider>
{/if}
