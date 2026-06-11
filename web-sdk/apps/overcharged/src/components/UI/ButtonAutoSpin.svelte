<script lang="ts">
	import { Container } from 'pixi-svelte';
	import type { ButtonProps } from 'components-pixi';
	import { stateBet, stateBetDerived, stateModal, stateConfig } from 'state-shared';

	import UiButton from './UiButton.svelte';
	import { getContext } from 'components-ui-pixi/src/context';
	import { UI_BASE_SIZE } from '../../game/constants';
	import ButtonBetAutoSpinsCounter from './ButtonBetAutoSpinsCounter.svelte';
	import { getElementStyle } from '../../game/uiLayoutConfig.svelte';

	const props: Partial<Omit<ButtonProps, 'children'>> = $props();
	const context = getContext();
	// Primary aux action — sits between the giant Spin button and the
	// tertiary icon row, so use a mid-hierarchy size.
	const sizes = { width: UI_BASE_SIZE * 0.75, height: UI_BASE_SIZE * 0.75 };
	const active = $derived(stateBetDerived.hasAutoBetCounter());
	const styleOverrides = $derived(getElementStyle('buttonAutoSpin'));
	const disabled = $derived.by(() => {
		if (stateConfig.jurisdiction.disabledAutoplay) return true;
		if (stateBet.isSpaceHold) return true;
		if (!context.stateXstateDerived.isIdle() && !stateBetDerived.hasAutoBetCounter()) return true;
		if (!stateBetDerived.isBetCostAvailable()) return true;
		return false;
	});

	const stopAutoSpin = () => (stateBet.autoSpinsCounter = 0);
	const openModal = () => (stateModal.modal = { name: 'autoSpin' });
	const onpress = () => {
		context.eventEmitter.broadcast({ type: 'soundPressGeneral' });
		stateBetDerived.hasAutoBetCounter() ? stopAutoSpin() : openModal();
	};
</script>

<UiButton
	{...props}
	{sizes}
	{active}
	{onpress}
	{disabled}
	icon={active ? 'repeatActive' : 'repeat'}
	{styleOverrides}
	hoverScale={1.08}
>
	<Container x={0} y={0}>
		<ButtonBetAutoSpinsCounter />
	</Container>
</UiButton>
