<script lang="ts">
	import { Sprite } from 'pixi-svelte';
	import { Button, type ButtonProps } from 'components-pixi';
	import { stateModal, stateBet, stateBetDerived, stateConfig } from 'state-shared';

	import HoverAnimContainer from './HoverAnimContainer.svelte';
	import { UI_BASE_SIZE } from '../../game/constants';
	import { getContext } from 'components-ui-pixi/src/context';

	const props: Partial<Omit<ButtonProps, 'children'>> = $props();
	const { stateXstateDerived, eventEmitter } = getContext();
	const sizes = { width: UI_BASE_SIZE, height: UI_BASE_SIZE };
	const hidden = $derived(
		stateConfig.jurisdiction.disabledBuyFeature || stateConfig.jurisdiction.socialCasino,
	);
	const disabled = $derived(!stateXstateDerived.isIdle() || hidden);
	const active = $derived(stateBetDerived.activeBetMode()?.type === 'activate');

	const openModal = () => (stateModal.modal = { name: 'buyBonus' });
	const disableActiveBetMode = () => (stateBet.activeBetModeKey = 'BASE');
	const onpress = () => {
		eventEmitter.broadcast({ type: 'soundPressGeneral' });
		if (active) {
			disableActiveBetMode();
		} else {
			openModal();
		}
	};
</script>

{#if !hidden}
	<Button {...props} {sizes} {disabled} {onpress}>
		{#snippet children({ center, hovered })}
			{@const baseAlpha = disabled ? 0.55 : 1}

			<HoverAnimContainer {...center} {hovered} {disabled} hoverScale={1.08}>
				<!-- Bonus butonu artık SADECE bonusButton.png (BONUS yazısı + zemin + ring
				     hepsi PNG'de baked). Eski metin/glow/ring katmanları kaldırıldı. -->
				<Sprite
					key="iconBuyBonus"
					anchor={0.5}
					width={sizes.width}
					height={sizes.height}
					alpha={baseAlpha}
				/>
			</HoverAnimContainer>
		{/snippet}
	</Button>
{/if}
