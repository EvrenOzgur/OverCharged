<script lang="ts">
	import type { ButtonProps } from 'components-pixi';
	import { stateBet, stateBetDerived, stateConfig } from 'state-shared';

	import UiButton from './UiButton.svelte';
	import { getContext } from 'components-ui-pixi/src/context';
	import { UI_BASE_SIZE } from '../../game/constants';
	import { getElementStyle } from '../../game/uiLayoutConfig.svelte';

	const props: Partial<Omit<ButtonProps, 'children'>> = $props();
	const context = getContext();
	// Bet adjuster — tertiary, smallest tier.
	const sizes = { width: UI_BASE_SIZE * 0.45, height: UI_BASE_SIZE * 0.45 };
	const biggest = $derived(stateConfig.betAmountOptions[stateConfig.betAmountOptions.length - 1]);
	const styleOverrides = $derived(getElementStyle('buttonIncrease'));
	const disabled = $derived(!context.stateXstateDerived.isIdle() || stateBet.betAmount === biggest);

	const onpress = () => {
		context.eventEmitter.broadcast({ type: 'soundPressGeneral' });

		const nextBigger = [...stateConfig.betAmountOptions]
			.sort((a, b) => a - b)
			.find((option) => option > stateBet.betAmount);

		stateBetDerived.setBetAmount(nextBigger || biggest);
	};
</script>

<UiButton {...props} {sizes} {onpress} {disabled} icon="increase" {styleOverrides} />
