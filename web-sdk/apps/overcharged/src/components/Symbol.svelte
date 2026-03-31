<script lang="ts">
	import { BitmapText, SpineProvider, SpineTrack, Graphics, Container } from 'pixi-svelte';

	import SymbolSpine from './SymbolSpine.svelte';
	import SymbolSprite from './SymbolSprite.svelte';
	import type { SymbolState, RawSymbol } from '../game/types';
	import { SYMBOL_SIZE } from '../game/constants';
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
	const showWinFrame = $derived(
		['win', 'postWinStatic', 'explosion'].includes(props.state) &&
			!['S', 'M'].includes(props.rawSymbol.name),
	);
</script>

{#if isMultiplierSymbol && props.state !== 'explosion'}
	<!-- Golden Glow Circle Behind Multiplier -->
	<Container x={props.x} y={props.y}>
		<Graphics
			draw={(g) => {
				g.clear();
				g.beginFill(0xffd700, 0.4);
				g.drawCircle(0, 0, SYMBOL_SIZE * 0.5);
				g.endFill();
			}}
		/>
	</Container>
{/if}

{#if isSprite}
	<SymbolSprite {symbolInfo} x={props.x} y={props.y} oncomplete={props.oncomplete} />
{:else}
	<SymbolSpine
		loop={props.loop}
		{symbolInfo}
		multiplier={props.rawSymbol.multiplier}
		x={props.x}
		y={props.y}
		listener={{
			complete: props.oncomplete,
			event: (_, event) => {
				if (event.data?.name === 'wildExplode') {
					context.eventEmitter?.broadcast({ type: 'soundOnce', name: 'sfx_wild_explode' });
				}
			},
		}}
	/>
{/if}

{#if props.rawSymbol.multiplier && props.state !== 'explosion'}
	<BitmapText
		x={props.x}
		y={props.y}
		anchor={0.5}
		text={`X${props.rawSymbol.multiplier}`}
		style={{
			fontFamily: 'gold',
			fontSize: SYMBOL_SIZE * 0.7,
		}}
		tint={0x5e3000} 
	/>
{/if}

{#if showWinFrame}
	<SpineProvider x={props.x} y={props.y} key="anticipation" width={SYMBOL_SIZE * 0.19}>
		<SpineTrack trackIndex={0} animationName={'payframe'} loop />
	</SpineProvider>
{/if}
