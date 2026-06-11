<!--
	UI button primitive. Wraps `Button` from components-pixi ve butonu artık
	SADECE tam boyutlu PNG (IconSprite) olarak çizer — eski glow/ring/zemin
	(ButtonFx/CircularButtonBg) ve tint katmanları kaldırıldı. İstenen: yalnızca
	static/menu/ PNG'leri buton görüntüsü olsun.
-->
<script lang="ts">
	import { Container } from 'pixi-svelte';
	import { Button, type ButtonProps } from 'components-pixi';
	import type { Snippet } from 'svelte';
	import type { ButtonIcon } from 'components-ui-pixi/src/types';

	import HoverAnimContainer from './HoverAnimContainer.svelte';
	import IconSprite, { type IconType } from './IconSprite.svelte';
	import type { UiElementStyle } from '../../game/uiLayoutConfig.svelte';

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
		// active/styleOverrides artık görselde kullanılmıyor ama Button'a sızmasın
		// diye destructure'da tutuluyor (PNG'ler durumları kendi içinde taşıyor).
		active: _active,
		children: childrenFromParent,
		sizes,
		styleOverrides: _styleOverrides,
		hoverScale = 1.08,
		...buttonProps
	}: Props = $props();

	const iconType = $derived(icon as IconType);
</script>

<Button {...buttonProps} {sizes}>
	{#snippet children({ center, hovered })}
		{@const iconAlpha = buttonProps.disabled ? 0.65 : 1}
		{@const punch = hoverScale > 1}

		{#snippet layers()}
			<!-- Buton görüntüsü SADECE PNG (tam boyut, tint yok). Eski glow/zemin/ring
			     katmanları ve yarım-boyut tintli icon kaldırıldı — istenen: yalnızca
			     menu/ PNG'leri buton olsun. -->
			<IconSprite {iconType} size={sizes.width} alpha={iconAlpha} />

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
