<script lang="ts">
	import { Text, Sprite, SpineProvider, SpineTrack, Container } from 'pixi-svelte';
	import { Button, type ButtonProps } from 'components-pixi';
	import { stateModal, stateBet, stateBetDerived, stateConfig } from 'state-shared';

	import HoverAnimContainer from './HoverAnimContainer.svelte';
	import ButtonFx, { type ButtonFxState } from './ButtonFx.svelte';
	import CircularButtonBg from './CircularButtonBg.svelte';
	import { UI_BASE_FONT_SIZE, UI_BASE_SIZE } from '../../game/constants';
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

	// Text styling
	const textColor = $derived(style ? hexToPixi(style.fontColor) : 0xffffff);
	const fontMult = $derived(style?.fontSize ?? 1);
	const textOverride = $derived(style?.textOverride ?? '');

	// Background override hooks (sprite/spine still supported)
	const bgType = $derived(style?.bgType ?? 'color');
	const bgSpriteKey = $derived(style?.bgSpriteKey ?? '');
	const bgSpineKey = $derived(style?.bgSpineKey ?? '');
	const bgSpineAnim = $derived(style?.bgSpineAnim ?? '');
	const bgSpineLoop = $derived(style?.bgSpineLoop ?? true);

	// FX fields (mirror ButtonBet)
	const ringEnabled = $derived(style?.ringEnabled ?? false);
	const ringColor = $derived(style?.ringColor ? hexToPixi(style.ringColor) : 0xb0bec5);
	const ringWidth = $derived(style?.ringWidth ?? 3);
	const glowColor = $derived(style?.glowColor ? hexToPixi(style.glowColor) : 0xb0bec5);
	const activeColor = $derived(style?.activeColor ? hexToPixi(style.activeColor) : 0x39ff14);
	const hoverEffect = $derived(style?.hoverEffect ?? 'shine');
	const hoverGlowIntensity = $derived(style?.hoverGlowIntensity ?? 0.6);
	const activeGlowIntensity = $derived(style?.activeGlowIntensity ?? 0.55);
	const bgAlpha = $derived(style?.bgAlpha ?? 0.4);

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
		{#snippet children({ center, hovered, pressed })}
			{@const state = (disabled
				? 'disabled'
				: active
					? 'active'
					: pressed
						? 'pressed'
						: hovered
							? 'hover'
							: 'idle') as ButtonFxState}
			{@const baseAlpha = disabled ? 0.55 : 1}
			{@const textAlpha = disabled ? 0.45 : 1}
			{@const fxGlowColor = active ? activeColor : glowColor}
			{@const labelFill = active ? activeColor : textColor}

			<HoverAnimContainer {...center} {hovered} {disabled} hoverScale={1.08}>
				<!-- Layer 1: Glow halo (behind everything) -->
				<ButtonFx
					width={sizes.width}
					height={sizes.height}
					{state}
					effects={{ glow: hoverEffect === 'glow' || active }}
					glowColor={fxGlowColor}
					{hoverGlowIntensity}
					{activeGlowIntensity}
				/>

				<!-- Layer 2: Pragmatic 3D base (or sprite/spine override) -->
				<Container alpha={baseAlpha}>
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
					{:else}
						<CircularButtonBg size={sizes.width} baseColor={glowColor} {bgAlpha} />
					{/if}
				</Container>

				<!-- Layer 3: Outer ring + shine sweep -->
				<ButtonFx
					width={sizes.width}
					height={sizes.height}
					{state}
					effects={{
						ring: ringEnabled,
						ringPulse: hoverEffect === 'pulse',
						shine: hoverEffect === 'shine',
					}}
					{ringColor}
					{ringWidth}
				/>

				<!-- Layer 4: Text label (preserved — BUY BONUS / DISABLE) -->
				<Text
					anchor={0.5}
					alpha={textAlpha}
					text={textOverride || (active ? i18nDerived.disable() : i18nDerived.buyBonus())}
					style={{
						align: 'center',
						wordWrap: true,
						wordWrapWidth: sizes.width * 0.7,
						fontFamily: 'proxima-nova',
						fontWeight: '700',
						fontSize: UI_BASE_FONT_SIZE * 0.7 * fontMult,
						fill: labelFill,
						dropShadow: true,
						dropShadowColor: 0x000000,
						dropShadowBlur: 3,
						dropShadowDistance: 1,
					}}
				/>
			</HoverAnimContainer>
		{/snippet}
	</Button>
{/if}
