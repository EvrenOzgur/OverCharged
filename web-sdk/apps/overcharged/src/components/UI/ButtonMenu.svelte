<script lang="ts">
	import type { ButtonProps } from 'components-pixi';
	import { stateUi } from 'state-shared';

	import UiButton from './UiButton.svelte';
	import { UI_BASE_SIZE } from '../../game/constants';
	import { getContext } from 'components-ui-pixi/src/context';
	import { getElementStyle } from '../../game/uiLayoutConfig.svelte';

	const props: Partial<Omit<ButtonProps, 'children'>> = $props();
	const context = getContext();
	// Tertiary chrome icon — smallest hierarchy tier.
	const sizes = { width: UI_BASE_SIZE * 0.55, height: UI_BASE_SIZE * 0.55 };
	const styleOverrides = $derived(getElementStyle('buttonMenu'));

	const onpress = () => {
		context.eventEmitter.broadcast({ type: 'soundPressGeneral' });
		stateUi.menuOpen = true;
	};
</script>

<UiButton {...props} {sizes} {onpress} icon="menu" {styleOverrides} hoverScale={1.08} />
