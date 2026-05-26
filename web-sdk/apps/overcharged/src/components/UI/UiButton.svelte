<!--
	Pragmatic-style UI button primitive. Wraps `Button` from components-pixi
	and renders a 3D-embossed circular base (CircularButtonBg) with a
	tinted Material-Icons SVG glyph (IconSprite). Hover/active state drive
	the shared FX layer (ButtonFx) — glow halo behind, ring + shine sweep
	in front. The `bgType` style hook in uiLayout.json still allows a
	per-button sprite or spine background to be swapped in.
-->
<script lang="ts">
	import { Container, Sprite, SpineProvider, SpineTrack } from 'pixi-svelte';
	import { Button, type ButtonProps } from 'components-pixi';
	import type { Snippet } from 'svelte';
	import type { ButtonIcon } from 'components-ui-pixi/src/types';

	import HoverAnimContainer from './HoverAnimContainer.svelte';
	import ButtonFx, { type ButtonFxState } from './ButtonFx.svelte';
	import IconSprite, { type IconType } from './IconSprite.svelte';
	import CircularButtonBg from './CircularButtonBg.svelte';
	import { hexToPixi, type UiElementStyle } from '../../game/uiLayoutConfig.svelte';
	import { getContext } from 'components-ui-pixi/src/context';

	const context = getContext();

	type Props = Omit<ButtonProps, 'children'> & {
		// Widened from shared `ButtonIcon` to local `IconType` so OverCharged
		// can use icons (e.g. 'repeat', 'buyBonus') that aren't in the shared
		// type. All ButtonIcon values are a subset of IconType.
		icon: IconType | ButtonIcon;
		sizes: { width: number; height: number };
		active?: boolean;
		children?: Snippet;
		variant?: 'dark' | 'light';
		styleOverrides?: UiElementStyle;
		/**
		 * Peak scale at the top of each looping hover punch (default 1.08).
		 * Passing 1 disables the punch entirely.
		 */
		hoverScale?: number;
	};

	const {
		icon,
		active,
		children: childrenFromParent,
		sizes,
		styleOverrides,
		hoverScale = 1.08,
		...buttonProps
	}: Props = $props();

	const iconType = $derived(icon as IconType);

	// ── Style resolution (with Pragmatic defaults) ───────────────────
	const baseColor = $derived(
		styleOverrides?.glowColor ? hexToPixi(styleOverrides.glowColor) : 0xb0bec5,
	);
	const activeColor = $derived(
		styleOverrides?.activeColor ? hexToPixi(styleOverrides.activeColor) : 0x39ff14,
	);
	const iconColorIdle = $derived(
		styleOverrides?.iconColor ? hexToPixi(styleOverrides.iconColor) : 0xffffff,
	);
	const ringEnabled = $derived(styleOverrides?.ringEnabled ?? false);
	const ringColor = $derived(
		styleOverrides?.ringColor ? hexToPixi(styleOverrides.ringColor) : 0xb0bec5,
	);
	const ringWidth = $derived(styleOverrides?.ringWidth ?? 3);
	// Active state recolours the glow halo to `activeColor` (lime), so an
	// "on" state pops off the gold button base instead of blending into it.
	const glowColor = $derived(active ? activeColor : baseColor);
	const hoverEffect = $derived(styleOverrides?.hoverEffect ?? 'shine');
	const hoverGlowIntensity = $derived(styleOverrides?.hoverGlowIntensity ?? 0.5);
	const activeGlowIntensity = $derived(styleOverrides?.activeGlowIntensity ?? 0.55);
	const bgAlpha = $derived(styleOverrides?.bgAlpha ?? 0.4);

	const BG_TYPE = $derived(styleOverrides?.bgType ?? 'color');
	const BG_SPRITE_KEY = $derived(styleOverrides?.bgSpriteKey ?? '');
	const BG_SPINE_KEY = $derived(styleOverrides?.bgSpineKey ?? '');
	const BG_SPINE_ANIM = $derived(styleOverrides?.bgSpineAnim ?? '');
	const BG_SPINE_LOOP = $derived(styleOverrides?.bgSpineLoop ?? true);
	const spriteKeyValid = $derived(
		BG_SPRITE_KEY ? !!context.stateApp.loadedAssets?.[BG_SPRITE_KEY] : false,
	);
	const spineKeyValid = $derived(
		BG_SPINE_KEY ? !!context.stateApp.loadedAssets?.[BG_SPINE_KEY] : false,
	);
</script>

<Button {...buttonProps} {sizes}>
	{#snippet children({ center, hovered, pressed })}
		{@const state = (buttonProps.disabled
			? 'disabled'
			: active
				? 'active'
				: pressed
					? 'pressed'
					: hovered
						? 'hover'
						: 'idle') as ButtonFxState}
		{@const baseAlpha = buttonProps.disabled ? 0.55 : 1}
		{@const iconAlpha = buttonProps.disabled ? 0.45 : 1}
		{@const iconColor = active ? activeColor : iconColorIdle}
		{@const punch = hoverScale > 1}

		{#snippet layers()}
			<!-- Layer 1: Glow halo (behind base) -->
			<ButtonFx
				width={sizes.width}
				height={sizes.height}
				{state}
				effects={{ glow: hoverEffect === 'glow' || !!active }}
				{glowColor}
				{hoverGlowIntensity}
				{activeGlowIntensity}
			/>

			<!-- Layer 2: Base — sprite/spine override or default CircularButtonBg -->
			<Container alpha={baseAlpha}>
				{#if BG_TYPE === 'sprite' && spriteKeyValid}
					<Sprite
						key={BG_SPRITE_KEY}
						width={sizes.width}
						height={sizes.height}
						anchor={0.5}
					/>
				{:else if BG_TYPE === 'spine' && spineKeyValid}
					<SpineProvider
						key={BG_SPINE_KEY}
						width={sizes.width}
						height={sizes.height}
						anchor={0.5}
					>
						{#if BG_SPINE_ANIM}
							<SpineTrack
								trackIndex={0}
								animationName={BG_SPINE_ANIM}
								loop={BG_SPINE_LOOP}
							/>
						{/if}
					</SpineProvider>
				{:else}
					<CircularButtonBg size={sizes.width} {baseColor} {bgAlpha} />
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

			<!-- Layer 4: Material-Icons SVG (tinted) -->
			<IconSprite
				{iconType}
				size={sizes.width * 0.5}
				color={iconColor}
				alpha={iconAlpha}
			/>

			<!-- Layer 5: Caller-provided overlay (e.g. AutoSpin counter) -->
			{@render childrenFromParent?.()}
		{/snippet}

		{#if punch}
			<HoverAnimContainer
				x={center.x}
				y={center.y}
				{hovered}
				disabled={buttonProps.disabled}
				{hoverScale}
			>
				{@render layers()}
			</HoverAnimContainer>
		{:else}
			<Container x={center.x} y={center.y}>
				{@render layers()}
			</Container>
		{/if}
	{/snippet}
</Button>
