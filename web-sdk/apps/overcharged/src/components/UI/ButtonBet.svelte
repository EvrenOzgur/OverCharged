<script lang="ts">
	import { Sprite, SpineProvider, SpineTrack, Container } from 'pixi-svelte';
	import { Button, type ButtonProps } from 'components-pixi';
	import { OnHotkey } from 'components-shared';
	import { stateBetDerived } from 'state-shared';

	import HoverAnimContainer from './HoverAnimContainer.svelte';
	import ButtonBetProvider from './ButtonBetProvider.svelte';
	import ButtonFx, { type ButtonFxState, type ButtonFxEffects } from './ButtonFx.svelte';
	import IconSprite from './IconSprite.svelte';
	import CircularButtonBg from './CircularButtonBg.svelte';
	import { UI_BASE_SIZE } from '../../game/constants';
	import { getElementStyle, hexToPixi } from '../../game/uiLayoutConfig.svelte';

	const props: Partial<Omit<ButtonProps, 'children'>> = $props();
	const disabled = $derived(!stateBetDerived.isBetCostAvailable());
	const sizes = { width: UI_BASE_SIZE, height: UI_BASE_SIZE };
	const style = $derived(getElementStyle('buttonBet'));

	// Background mode (existing fields)
	const bgType = $derived(style?.bgType ?? 'color');
	const bgSpriteKey = $derived(style?.bgSpriteKey ?? '');
	const bgSpineKey = $derived(style?.bgSpineKey ?? '');
	const bgSpineAnim = $derived(style?.bgSpineAnim ?? '');
	const bgSpineLoop = $derived(style?.bgSpineLoop ?? true);

	// New Stake-style FX fields (defaults applied when uiLayout.json doesn't set them)
	const ringEnabled = $derived(style?.ringEnabled ?? true);
	const ringColor = $derived(style?.ringColor ? hexToPixi(style.ringColor) : 0xb0bec5);
	const ringWidth = $derived(style?.ringWidth ?? 3);
	const rotateRingOnSpin = $derived(style?.rotateRingOnSpin ?? true);
	const glowColor = $derived(style?.glowColor ? hexToPixi(style.glowColor) : 0xb0bec5);
	const hoverEffect = $derived(style?.hoverEffect ?? 'shine');
	const hoverGlowIntensity = $derived(style?.hoverGlowIntensity ?? 0.6);
	const activeGlowIntensity = $derived(style?.activeGlowIntensity ?? 0);
	const bgAlpha = $derived(style?.bgAlpha ?? 0.4);
	const iconColor = $derived(style?.iconColor ? hexToPixi(style.iconColor) : 0xffffff);
</script>

<ButtonBetProvider>
	{#snippet children({ key, onpress })}
		<OnHotkey hotkey="Space" {disabled} {onpress} />
		<Button {...props} {sizes} {onpress} {disabled}>
			{#snippet children({ center, hovered, pressed })}
				{@const spinning = key === 'stop_default' || key === 'stop_disabled'}
				{@const isDisabledVisual = disabled || key === 'spin_disabled'}
				{@const state = (isDisabledVisual
					? 'disabled'
					: spinning
						? 'active'
						: pressed
							? 'pressed'
							: hovered
								? 'hover'
								: 'idle') as ButtonFxState}
				{@const fxEffects = {
					glow: hoverEffect === 'glow',
					ring: ringEnabled,
					ringPulse: hoverEffect === 'pulse',
					rotateRing: rotateRingOnSpin,
					shine: hoverEffect === 'shine',
				} as ButtonFxEffects}
				{@const iconAlpha = isDisabledVisual ? 0.45 : 1}
				{@const baseAlpha = isDisabledVisual ? 0.55 : 1}

				<HoverAnimContainer
					{...center}
					{hovered}
					disabled={isDisabledVisual}
					hoverScale={1.08}
				>
					<!-- Layer 1: Glow halo (behind everything) -->
					<ButtonFx
						width={sizes.width}
						height={sizes.height}
						{state}
						effects={{ glow: fxEffects.glow }}
						{glowColor}
						{hoverGlowIntensity}
						{activeGlowIntensity}
					/>

					<!-- Layer 2: Base button — Pragmatic 3D embossed circle, with optional
					     sprite/spine bg overrides for advanced users via uiLayout.json -->
					<Container alpha={baseAlpha}>
						{#if bgType === 'sprite' && bgSpriteKey}
							<Sprite
								key={bgSpriteKey}
								width={sizes.width}
								height={sizes.height}
								anchor={0.5}
							/>
						{:else if bgType === 'spine' && bgSpineKey}
							<SpineProvider
								key={bgSpineKey}
								width={sizes.width}
								height={sizes.height}
								anchor={0.5}
							>
								{#if bgSpineAnim}
									<SpineTrack trackIndex={0} animationName={bgSpineAnim} loop={bgSpineLoop} />
								{/if}
							</SpineProvider>
						{:else}
							<CircularButtonBg size={sizes.width} baseColor={glowColor} {bgAlpha} />
						{/if}
					</Container>

					<!-- Layer 3: Outer ring + shine sweep (in front of base) -->
					<ButtonFx
						width={sizes.width}
						height={sizes.height}
						{state}
						effects={{
							ring: fxEffects.ring,
							ringPulse: fxEffects.ringPulse,
							rotateRing: fxEffects.rotateRing,
							shine: fxEffects.shine,
						}}
						{ringColor}
						{ringWidth}
					/>

					<!-- Layer 4: Icon — Material Icons SVG, tinted.
					     Idle uses 'autoSpin' (autorenew double-arrow) for a more
					     dramatic spin glyph; spinning swaps to 'stop'. -->
					<IconSprite
						iconType={spinning ? 'stop' : 'autoSpin'}
						size={sizes.width * 0.55}
						color={iconColor}
						alpha={iconAlpha}
					/>
				</HoverAnimContainer>
			{/snippet}
		</Button>
	{/snippet}
</ButtonBetProvider>
