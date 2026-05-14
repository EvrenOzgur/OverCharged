<script lang="ts">
	import { Container, Text, Graphics, Sprite, SpineProvider, SpineTrack, Rectangle } from 'pixi-svelte';
	import { Button, type ButtonProps } from 'components-pixi';
	import type { Snippet } from 'svelte';
	import { i18nDerived } from 'components-ui-pixi/src/i18n/i18nDerived';
	import { UI_BASE_FONT_SIZE } from 'components-ui-pixi/src/constants';
	import { getContext } from 'components-ui-pixi/src/context';
	import type { ButtonIcon } from 'components-ui-pixi/src/types';
	import { hexToPixi, type UiElementStyle } from '../../game/uiLayoutConfig.svelte';
	import HoverAnimContainer from './HoverAnimContainer.svelte';

	const context = getContext();

	type Props = Omit<ButtonProps, 'children'> & {
		icon: ButtonIcon;
		sizes: { width: number; height: number };
		active?: boolean;
		children?: Snippet;
		variant?: 'dark' | 'light';
		styleOverrides?: UiElementStyle;
		/**
		 * Opt-in: when set (e.g. 1.08), wraps the button content in a
		 * looping punch animation while hovered. Existing hover/press
		 * bgScale logic is bypassed in this mode so the whole content
		 * scales as one unit.
		 */
		hoverScale?: number;
	};

	const {
		icon,
		active,
		variant = 'dark',
		children: childrenFromParent,
		sizes,
		styleOverrides,
		hoverScale,
		...buttonProps
	}: Props = $props();

	const punch = $derived(hoverScale !== undefined && hoverScale > 1);

	// Resolved colors: use overrides when available, otherwise hardcoded defaults.
	const BG_COLOR = $derived(styleOverrides ? hexToPixi(styleOverrides.backgroundColor) : 0x242428);
	const BORDER_COLOR = $derived(styleOverrides ? hexToPixi(styleOverrides.borderColor) : 0x4a4a4e);
	const ACTIVE_COLOR = $derived(styleOverrides ? hexToPixi(styleOverrides.activeColor) : 0x39ff14);
	const TEXT_COLOR = $derived(styleOverrides ? hexToPixi(styleOverrides.fontColor) : 0xffffff);
	const FONT_MULT = $derived(styleOverrides?.fontSize ?? 1);
	const TEXT_OVERRIDE = $derived(styleOverrides?.textOverride ?? '');
	const BG_TYPE = $derived(styleOverrides?.bgType ?? 'color');
	const BG_SPRITE_KEY = $derived(styleOverrides?.bgSpriteKey ?? '');
	const BG_SPINE_KEY = $derived(styleOverrides?.bgSpineKey ?? '');
	const BG_SPINE_ANIM = $derived(styleOverrides?.bgSpineAnim ?? '');
	const BG_SPINE_LOOP = $derived(styleOverrides?.bgSpineLoop ?? true);

	/** Check if an asset key actually exists in loaded assets. */
	const spriteKeyValid = $derived(BG_SPRITE_KEY ? !!context.stateApp.loadedAssets?.[BG_SPRITE_KEY] : false);
	const spineKeyValid = $derived(BG_SPINE_KEY ? !!context.stateApp.loadedAssets?.[BG_SPINE_KEY] : false);

	// Force re-draw key: any color/state change triggers a fresh Graphics render.
	const drawKey = $derived(`${BG_COLOR}-${BORDER_COLOR}-${ACTIVE_COLOR}-${active}-${sizes.width}-${sizes.height}`);

	function drawOctagon(g: any) {
		g.clear();
		const w = sizes.width;
		const h = sizes.height;
		const b = 15;

		g.beginFill(BG_COLOR);
		if (active) {
			g.lineStyle(2, ACTIVE_COLOR, 1);
		} else {
			g.lineStyle(1, BORDER_COLOR, 0.5);
		}

		const path = [
			b, 0, w - b, 0, w, b, w, h - b,
			w - b, h, b, h, 0, h - b, 0, b
		];
		g.drawPolygon(path);
		g.endFill();

		if (active) {
			g.beginFill(ACTIVE_COLOR, 0.1);
			g.drawPolygon(path);
			g.endFill();
		}
	}

	function drawPlaceholder(g: any) {
		g.clear();
		const w = sizes.width;
		const h = sizes.height;
		const sq = 10;
		// Checkerboard pattern to indicate "no asset set"
		for (let y = 0; y < h; y += sq) {
			for (let x = 0; x < w; x += sq) {
				const even = ((x / sq + y / sq) % 2) === 0;
				g.beginFill(even ? 0x333333 : 0x222222, 0.8);
				g.drawRect(x, y, Math.min(sq, w - x), Math.min(sq, h - y));
				g.endFill();
			}
		}
		g.lineStyle(1, 0xff9f14, 0.6);
		g.drawRect(0, 0, w, h);
	}
</script>

<Button {...buttonProps} {sizes}>
	{#snippet children({ center, hovered, pressed })}
		{@const bgAlpha = buttonProps.disabled ? 0.5 : 1}
		{@const bgScale = punch ? 1 : (pressed ? 0.95 : hovered ? 1.05 : 1)}
		{@const showOctagon = BG_TYPE === 'color' || (BG_TYPE !== 'color' && !spriteKeyValid && !spineKeyValid)}
		{@const ox = punch ? 0 : center.x}
		{@const oy = punch ? 0 : center.y}

		{#snippet layers()}
			<!-- Layer 1: Octagon (always mounted, hidden when sprite/spine active) -->
			{#key drawKey}
				<Graphics
					draw={showOctagon ? drawOctagon : drawPlaceholder}
					x={ox - sizes.width / 2}
					y={oy - sizes.height / 2}
					alpha={bgAlpha}
					scale={bgScale}
					visible={BG_TYPE === 'color' || (!spriteKeyValid && !spineKeyValid)}
				/>
			{/key}

			<!-- Layer 2: Sprite overlay (independent mount) -->
			{#if BG_TYPE === 'sprite' && spriteKeyValid}
				<Sprite
					key={BG_SPRITE_KEY}
					x={ox}
					y={oy}
					anchor={0.5}
					width={sizes.width}
					height={sizes.height}
					alpha={bgAlpha}
					scale={bgScale}
				/>
			{/if}

			<!-- Layer 3: Spine overlay (independent mount) -->
			{#if BG_TYPE === 'spine' && spineKeyValid}
				<SpineProvider
					key={BG_SPINE_KEY}
					x={ox}
					y={oy}
					anchor={0.5}
					width={sizes.width}
					height={sizes.height}
					alpha={bgAlpha}
					scale={bgScale}
				>
					{#if BG_SPINE_ANIM}
						<SpineTrack trackIndex={0} animationName={BG_SPINE_ANIM} loop={BG_SPINE_LOOP} />
					{/if}
				</SpineProvider>
			{/if}

			<!-- Layer 4: Text (always mounted, never destroyed) -->
			<Text
				x={ox}
				y={oy}
				anchor={0.5}
				text={TEXT_OVERRIDE || i18nDerived[icon]()}
				style={{
					align: 'center',
					wordWrap: true,
					wordWrapWidth: sizes.width * 0.8,
					fontFamily: 'proxima-nova',
					fontWeight: '700',
					fontSize: UI_BASE_FONT_SIZE * 0.8 * FONT_MULT,
					fill: active ? ACTIVE_COLOR : TEXT_COLOR,
					dropShadow: active,
					dropShadowColor: 0x000000,
					dropShadowBlur: 4,
					dropShadowDistance: 2
				}}
			/>

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
			{@render layers()}
		{/if}
	{/snippet}
</Button>
