<script lang="ts">
	import { Text, Graphics } from 'pixi-svelte';
	import { Button, type ButtonProps } from 'components-pixi';
	import type { Snippet } from 'svelte';
	// We'll import from the shared packages to keep logic consistent
	import { i18nDerived } from 'components-ui-pixi/src/i18n/i18nDerived';
	import { UI_BASE_FONT_SIZE } from 'components-ui-pixi/src/constants';
	import type { ButtonIcon } from 'components-ui-pixi/src/types';

	type Props = Omit<ButtonProps, 'children'> & {
		icon: ButtonIcon;
		sizes: { width: number; height: number };
		active?: boolean;
		children?: Snippet;
		variant?: 'dark' | 'light';
	};

	const {
		icon,
		active,
		variant = 'dark',
		children: childrenFromParent,
		sizes,
		...buttonProps
	}: Props = $props();

	// Neongreen: 0x39ff14
	// Deep Metallic: 0x2a2a2e
	const NEON_GREEN = 0x39ff14;
	const METALLIC_FACE = 0x242428;
	const BEVEL_COLOR = 0x4a4a4e;

	function drawOctagon(g: any) {
		g.clear();
		const w = sizes.width;
		const h = sizes.height;
		const b = 15; // bevel size

		// Main Face (Octagon)
		g.beginFill(METALLIC_FACE);
		if (active) {
			g.lineStyle(2, NEON_GREEN, 1);
		} else {
			g.lineStyle(1, BEVEL_COLOR, 0.5);
		}
		
		const path = [
			b, 0,
			w - b, 0,
			w, b,
			w, h - b,
			w - b, h,
			b, h,
			0, h - b,
			0, b
		];
		g.drawPolygon(path);
		g.endFill();

		// Add a subtle inner glow if active
		if (active) {
			g.beginFill(NEON_GREEN, 0.1);
			g.drawPolygon(path);
			g.endFill();
		}
	}
</script>

<Button {...buttonProps} {sizes}>
	{#snippet children({ center, hovered, pressed })}
		<Graphics 
			draw={drawOctagon} 
			x={center.x - sizes.width / 2} 
			y={center.y - sizes.height / 2}
			alpha={buttonProps.disabled ? 0.5 : 1}
			scale={pressed ? 0.95 : hovered ? 1.05 : 1}
		/>

		<Text
			{...center}
			anchor={0.5}
			text={i18nDerived[icon]()}
			style={{
				align: 'center',
				wordWrap: true,
				wordWrapWidth: sizes.width * 0.8,
				fontFamily: 'proxima-nova',
				fontWeight: '700',
				fontSize: UI_BASE_FONT_SIZE * 0.8,
				fill: active ? NEON_GREEN : 0xffffff,
				dropShadow: active,
				dropShadowColor: 0x000000,
				dropShadowBlur: 4,
				dropShadowDistance: 2
			}}
		/>

		{@render childrenFromParent?.()}
	{/snippet}
</Button>
