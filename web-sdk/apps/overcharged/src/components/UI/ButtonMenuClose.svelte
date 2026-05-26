<script lang="ts">
	import type { ButtonProps } from 'components-pixi';
	import { stateUi } from 'state-shared';

	import UiButton from './UiButton.svelte';
	import { getContext } from 'components-ui-pixi/src/context';
	import { UI_BASE_SIZE } from '../../game/constants';

	const props: Partial<Omit<ButtonProps, 'children'>> = $props();
	const context = getContext();
	// Tertiary chrome icon — smallest hierarchy tier.
	const sizes = { width: UI_BASE_SIZE * 0.55, height: UI_BASE_SIZE * 0.55 };

	const onpress = () => {
		context.eventEmitter.broadcast({ type: 'soundPressGeneral' });
		stateUi.menuOpen = false;
	};
</script>

<UiButton {...props} {sizes} {onpress} icon="menuExit" />
