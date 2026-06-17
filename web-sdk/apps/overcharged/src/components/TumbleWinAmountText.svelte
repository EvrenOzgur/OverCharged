<script lang="ts">
	import { Tween } from 'svelte/motion';

	import { SpineProvider, SpineTrack, SpineSlot } from 'pixi-svelte';
	import { ResponsiveBitmapText } from 'components-pixi';
	import { bookEventAmountToCurrencyString } from 'utils-shared/amount';

	import { SYMBOL_SIZE } from '../game/constants';

	type Props = {
		width: number;
		amount: number;
		animate: boolean;
		oncomplete: () => void;
	};

	const props: Props = $props();
	const amount = new Tween(0);

	// tumble_win spine sadece 'idle' oynar (kazanç çerçevesi + sayı). Çarpan
	// uygulanırken (props.animate) ayrı `tumbleWinExplosion` spine'ı oynar ve
	// bitince oncomplete'i çağırır. Çarpan yokken sayı tween bitince oncomplete.
	const updateAmount = async () => {
		await amount.set(props.amount);
		if (!props.animate) props.oncomplete();
	};

	$effect(() => {
		updateAmount();
	});

	// Stabil listener — inline obje track restart etmesin diye.
	const explosionListener = { complete: () => props.oncomplete() };
</script>

<SpineProvider asset="tumble_win" width={props.width}>
	<SpineTrack trackIndex={0} animationName="idle" />
	<SpineSlot slotName="slot_win">
		<ResponsiveBitmapText
			anchor={0.5}
			style={{
				fontFamily: 'gold',
				fontSize: 0.65 * SYMBOL_SIZE,
			}}
			text={bookEventAmountToCurrencyString(amount.current)}
			maxWidth={props.width}
		/>
	</SpineSlot>
</SpineProvider>

{#if props.animate}
	<!-- Çarpan patlaması (tumbleWinExplosion). Bitince oncomplete tetiklenir. -->
	<SpineProvider asset="tumbleWinExplosion" width={props.width * 0.5}>
		<SpineTrack trackIndex={0} animationName="tumblewin" listener={explosionListener} />
	</SpineProvider>
{/if}
