<script lang="ts">
	import { Text, Sprite, SpineProvider, SpineTrack } from 'pixi-svelte';
	import { Button, type ButtonProps } from 'components-pixi';
	import { stateModal, stateBet, stateBetDerived, stateConfig } from 'state-shared';

	import HoverAnimContainer from './HoverAnimContainer.svelte';
	import UiSprite from './UiSprite.svelte';
	import { UI_BASE_FONT_SIZE, UI_BASE_SIZE } from 'components-ui-pixi/src/constants';
	import { getContext } from 'components-ui-pixi/src/context';
	import { i18nDerived } from 'components-ui-pixi/src/i18n/i18nDerived';
	import { getElementStyle, hexToPixi } from '../../game/uiLayoutConfig.svelte';

	const props: Partial<Omit<ButtonProps, 'children'>> = $props();
	const { stateXstateDerived, eventEmitter } = getContext();
	const sizes = { width: UI_BASE_SIZE, height: UI_BASE_SIZE };
	const hidden = $derived(
		stateConfig.jurisdiction.disabledBuyFeature || stateConfig.jurisdiction.socialCasino,
	);
	const disabled = $derived(!stateXstateDerived.isIdle() || hidden);
	const active = $derived(stateBetDerived.activeBetMode()?.type === 'activate');
	const style = $derived(getElementStyle('buttonBuyBonus'));
	const textColor = $derived(style ? hexToPixi(style.fontColor) : 0xffffff);
	const fontMult = $derived(style?.fontSize ?? 1);
	const textOverride = $derived(style?.textOverride ?? '');
	const bgType = $derived(style?.bgType ?? 'color');
	const bgSpriteKey = $derived(style?.bgSpriteKey ?? '');
	const bgSpineKey = $derived(style?.bgSpineKey ?? '');
	const bgSpineAnim = $derived(style?.bgSpineAnim ?? '');
	const bgSpineLoop = $derived(style?.bgSpineLoop ?? true);

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

	const getState = (value: {
		active: boolean;
		disabled: boolean;
		hovered: boolean;
		pressed: boolean;
	}) => {
		if (value.disabled) return 'disabled' as const;
		if (value.pressed) return 'pressed' as const;
		if (value.hovered) return 'hovered' as const;
		if (value.active) return 'active' as const;
		return 'default' as const;
	};
</script>

{#if !hidden}
<Button {...props} {sizes} {disabled} {onpress}>
	{#snippet children({ center, hovered, pressed })}
		{@const state = getState({
			active,
			disabled,
			hovered,
			pressed,
		})}

		<HoverAnimContainer {...center} {hovered} {disabled} hoverScale={1.08}>
			<!-- Background: sprite / spine / default UiSprite -->
			{#if bgType === 'sprite' && bgSpriteKey}
				<Sprite
					key={bgSpriteKey}
					anchor={0.5}
					width={sizes.width}
					height={sizes.height}
				/>
			{:else if bgType === 'spine' && bgSpineKey}
				<SpineProvider
					key={bgSpineKey}
					anchor={0.5}
					width={sizes.width}
					height={sizes.height}
				>
					{#if bgSpineAnim}
						<SpineTrack trackIndex={0} animationName={bgSpineAnim} loop={bgSpineLoop} />
					{/if}
				</SpineProvider>
			{:else if bgType !== 'color' && (!bgSpriteKey && !bgSpineKey)}
				<UiSprite
					key="buyBonus"
					anchor={0.5}
					width={sizes.width}
					height={sizes.height}
					backgroundColor={0xff9f14}
				/>
			{:else}
				<UiSprite
					key="buyBonus"
					anchor={0.5}
					width={sizes.width}
					height={sizes.height}
					{...disabled
						? {
								backgroundColor: 0xaaaaaa,
							}
						: {}}
					{...active
						? {
								borderWidth: 10,
								borderColor: 0xffffff,
							}
						: {}}
				/>
			{/if}

			<Text
				anchor={0.5}
				text={textOverride || (state === 'active' ? i18nDerived.disable() : i18nDerived.buyBonus())}
				style={{
					align: 'center',
					wordWrap: true,
					wordWrapWidth: 200,
					fontFamily: 'proxima-nova',
					fontWeight: '600',
					fontSize: UI_BASE_FONT_SIZE * 0.9 * fontMult,
					fill: textColor,
				}}
			/>
		</HoverAnimContainer>
	{/snippet}
</Button>
{/if}
