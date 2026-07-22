<script lang="ts">
	import { SpineProvider, SpineTrack } from 'pixi-svelte';

	import SymbolSpine from './SymbolSpine.svelte';
	import SymbolSprite from './SymbolSprite.svelte';
	import type { SymbolState, RawSymbol } from '../game/types';
	import { SYMBOL_SIZE } from '../game/constants';
	import { getSymbolInfo } from '../game/utils';

	type Props = {
		x?: number;
		y?: number;
		state: SymbolState;
		rawSymbol: RawSymbol;
		oncomplete?: () => void;
		loop?: boolean;
	};

	const props: Props = $props();
	const symbolInfo = $derived(getSymbolInfo({ rawSymbol: props.rawSymbol, state: props.state }));
	const isSprite = $derived(symbolInfo.type === 'sprite');
	const isMultiplierSymbol = $derived(props.rawSymbol.name === 'M');
	// Kazanan sembollerde (S/M/W hariç) anticipation spine'ının `payframe`
	// animasyonu — parlayan kazanç çerçevesi. Wild kendi `wildFrame`
	// animasyonunu kullanıyor (aşağıda). `explosion` hariç: sembol patlarken
	// halka artık dönmesin, sadece win/postWinStatic'te görünsün.
	const showWinFrame = $derived(
		['win', 'postWinStatic'].includes(props.state) &&
			!['S', 'M', 'W'].includes(props.rawSymbol.name),
	);
	// Wild sembollerde anticipation spine'ının `wildFrame` animasyonu —
	// diğer kazanan sembollerin payframe'inden ayrı, wild'a özel çerçeve.
	const showWildFrame = $derived(
		['win', 'postWinStatic'].includes(props.state) &&
			props.rawSymbol.name === 'W',
	);

	// Stable listener — defining it inline in the SymbolSpine props would
	// allocate a new object on every render of this component, which makes
	// pixi-svelte think the prop changed and triggers a Spine track restart
	// (visible as a micro-flicker / dark flash). Wrap in $derived so the
	// callback closures pick up the latest props.
	//
	// Wilds intentionally have NO dedicated explosion sound: they explode with
	// the standard symbol/tumble explosion sound (sfx_multiplier_explosion_b,
	// broadcast once per tumble in bookEventHandlerMap), same as every other
	// symbol. So we no longer listen for the spine `wildExplode` event.
	const spineListener = $derived({ complete: () => props.oncomplete?.() });

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

<!-- Parlayan kazanç çerçevesi (payframe). width: yeni anticipation spine'a göre
     ayarlı (eski 0.19 -> 0.14, çünkü skeleton declared genişliği 364->272 küçüldü). -->
{#if showWinFrame}
	<SpineProvider x={props.x} y={props.y} key="anticipation" width={SYMBOL_SIZE * 0.13}>
		<SpineTrack trackIndex={0} animationName={'payframe'} loop />
	</SpineProvider>
{/if}

<!-- Wild'a özel parlayan çerçeve (wildFrame) — payframe ile aynı mekanizma,
     farklı animasyon. -->
{#if showWildFrame}
	<SpineProvider x={props.x} y={props.y} key="anticipation" width={SYMBOL_SIZE * 0.13}>
		<SpineTrack trackIndex={0} animationName={'wildFrame'} loop />
	</SpineProvider>
{/if}
