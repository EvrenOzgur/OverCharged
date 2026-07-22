<script lang="ts">
	import { BitmapText, SpineProvider, SpineTrack, type SpineTrackProps } from 'pixi-svelte';
	import { stateBetDerived } from 'state-shared';

	import HideSpineSlot from './HideSpineSlot.svelte';
	import { getSymbolInfo } from '../game/utils';
	import { SYMBOL_SIZE, SYMBOL_RENDER_SCALE } from '../game/constants';
	import { timingConfig } from '../game/timingConfig.svelte';

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

	// 'win' and 'explosion' are the two longest per-symbol states (1.333s /
	// 0.9s declared) and both fully block cascade progression — the flash
	// must finish before the explode, which must finish before the next
	// tumble's symbols slide in. Playing them faster (timeScale multiplier,
	// live-tunable in timingConfig) trims that dead time without touching
	// the Spine asset itself. Multiplies on top of turbo's own timeScale.
	const animationSpeed = $derived(
		timingConfig.symbolAnimationSpeed[
			props.symbolInfo.animationName as keyof typeof timingConfig.symbolAnimationSpeed
		] ?? 1,
	);
</script>

{#if props.symbolInfo}
	<SpineProvider
		x={props.x}
		y={props.y}
		asset={props.symbolInfo.assetKey}
		height={SYMBOL_SIZE * props.symbolInfo.sizeRatios.height * SYMBOL_RENDER_SCALE}
		skin={props.symbolInfo.skin}
	>
		<SpineTrack
			loop={props.loop}
			trackIndex={0}
			animationName={props.symbolInfo.animationName}
			timeScale={frozen ? 0 : stateBetDerived.timeScale() * animationSpeed}
			trackTime={frozen ? 9999 : undefined}
			listener={props.listener}
		/>
		<!-- High symbols' `win` animation drives a bright-green streak VFX
		     (slots glow/glow2/glow3/glow4, hardcoded color 06fb00 in the
		     skeleton) that sweeps across adjacent winning symbols like a green
		     arc. Dropped per request — no-op on symbol types without these
		     slot names (low/special). -->
		<HideSpineSlot slotNames={['glow', 'glow2', 'glow3', 'glow4']} />
	</SpineProvider>
{/if}
