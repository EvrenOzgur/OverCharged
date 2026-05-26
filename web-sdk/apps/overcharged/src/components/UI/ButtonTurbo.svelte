<script lang="ts">
	import type { ButtonProps } from 'components-pixi';
	import { stateBet, stateBetDerived, stateConfig } from 'state-shared';

	import UiButton from './UiButton.svelte';
	import { UI_BASE_SIZE } from '../../game/constants';
	import { getContext } from 'components-ui-pixi/src/context';
	import { getElementStyle } from '../../game/uiLayoutConfig.svelte';

	const props: Partial<Omit<ButtonProps, 'children'>> = $props();
	const context = getContext();
	// Primary aux action (peer of AutoSpin) — mid-hierarchy size.
	const sizes = { width: UI_BASE_SIZE * 0.75, height: UI_BASE_SIZE * 0.75 };
	const active = $derived(stateBet.isTurbo && !stateConfig.jurisdiction.disabledTurbo);
	const disabled = $derived(stateBet.isSpaceHold || stateConfig.jurisdiction.disabledTurbo);
	const styleOverrides = $derived(getElementStyle('buttonTurbo'));

	const onpress = () => {
		context.eventEmitter.broadcast({ type: 'soundPressGeneral' });
		stateBetDerived.updateIsTurbo(!stateBet.isTurbo, { persistent: true });
	};

	context.eventEmitter.subscribeOnMount({
		stopButtonClick: () => stateBetDerived.updateIsTurbo(true, { persistent: false }),
		stopButtonEnable: () => stateBetDerived.updateIsTurbo(false, { persistent: false }),
	});
</script>

<UiButton
	{...props}
	{sizes}
	{active}
	{onpress}
	{disabled}
	icon="turbo"
	{styleOverrides}
	hoverScale={1.08}
/>
