<script lang="ts">
	import SymbolSpine from './SymbolSpine.svelte';
	import SymbolSprite from './SymbolSprite.svelte';
	import type { SymbolState, RawSymbol } from '../game/types';
	import { getSymbolInfo } from '../game/utils';
	import { getContext } from '../game/context';

	type Props = {
		x?: number;
		y?: number;
		state: SymbolState;
		rawSymbol: RawSymbol;
		oncomplete?: () => void;
		loop?: boolean;
	};

	const props: Props = $props();
	const context = getContext();
	const symbolInfo = $derived(getSymbolInfo({ rawSymbol: props.rawSymbol, state: props.state }));
	const isSprite = $derived(symbolInfo.type === 'sprite');
	const isMultiplierSymbol = $derived(props.rawSymbol.name === 'M');

	// Stable listener — defining it inline in the SymbolSpine props would
	// allocate a new object on every render of this component, which makes
	// pixi-svelte think the prop changed and triggers a Spine track restart
	// (visible as a micro-flicker / dark flash). Wrap in $derived so the
	// callback closures pick up the latest props.
	const spineListener = $derived({
		complete: props.oncomplete,
		event: (_: unknown, event: { data?: { name?: string } }) => {
			if (event.data?.name === 'wildExplode') {
				context.eventEmitter?.broadcast({ type: 'soundOnce', name: 'sfx_wild_explode' });
			}
		},
	});

	// Idle states (static / postWinStatic) MUST loop — otherwise the Spine
	// animation plays once and freezes on its end frame, which for many
	// symbol skeletons is close to the bone-pose and reads as a visible
	// "darken" briefly. The next reactive prop sync re-applies setAnimation,
	// causing a "lighten" snap. That round-trip looks like a per-symbol
	// flicker after each tumble settles.
	const effectiveLoop = $derived(
		// Multiplier coin: never loop — `flip`/`land` play once and hold on the
		// value-facing last frame (the end pose is bright, so no freeze-darken).
		isMultiplierSymbol
			? false
			: props.loop ?? (props.state === 'static' || props.state === 'postWinStatic'),
	);
</script>

{#if isSprite}
	<SymbolSprite {symbolInfo} x={props.x} y={props.y} oncomplete={props.oncomplete} />
{:else}
	<SymbolSpine
		loop={effectiveLoop}
		{symbolInfo}
		multiplier={props.rawSymbol.multiplier}
		x={props.x}
		y={props.y}
		listener={spineListener}
	/>
{/if}
