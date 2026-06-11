<script lang="ts">
	import { Sprite } from 'pixi-svelte';
	import { Button, type ButtonProps } from 'components-pixi';
	import { OnHotkey } from 'components-shared';
	import { stateBetDerived } from 'state-shared';

	import HoverAnimContainer from './HoverAnimContainer.svelte';
	import ButtonBetProvider from './ButtonBetProvider.svelte';
	import { UI_BASE_SIZE } from '../../game/constants';

	const props: Partial<Omit<ButtonProps, 'children'>> = $props();
	const disabled = $derived(!stateBetDerived.isBetCostAvailable());
	const sizes = { width: UI_BASE_SIZE, height: UI_BASE_SIZE };
</script>

<ButtonBetProvider>
	{#snippet children({ key, onpress })}
		<OnHotkey hotkey="Space" {disabled} {onpress} />
		<Button {...props} {sizes} {onpress} {disabled}>
			{#snippet children({ center, hovered })}
				{@const spinning = key === 'stop_default' || key === 'stop_disabled'}
				{@const isDisabledVisual = disabled || key === 'spin_disabled'}
				{@const baseAlpha = isDisabledVisual ? 0.7 : 1}

				<HoverAnimContainer {...center} {hovered} disabled={isDisabledVisual} hoverScale={1.08}>
					<!-- Spin butonu artık komple PlayButton görseli: zemin + ring + icon
					     hepsi PNG'de baked. idle'da spin oku (playButtonSpin), spinning'de
					     yeşil "dur" karesi (playButtonStop). Eski ButtonFx/IconSprite/
					     CircularButtonBg katmanları kaldırıldı — görselde zaten mevcut. -->
					<Sprite
						key={spinning ? 'playButtonStop' : 'playButtonSpin'}
						width={sizes.width}
						height={sizes.height}
						anchor={0.5}
						alpha={baseAlpha}
					/>
				</HoverAnimContainer>
			{/snippet}
		</Button>
	{/snippet}
</ButtonBetProvider>
