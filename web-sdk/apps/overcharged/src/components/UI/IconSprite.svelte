<!--
	UI icon rendered as a tinted Sprite. Assets are Material Icons SVGs
	(Apache 2.0) loaded once at app startup via the assets.ts manifest and
	tinted at render time so a single white-filled texture re-themes per
	button. Crisp at any display size because the SVG is rasterised at
	192×192 (≈2-3× the typical button icon size).
-->
<script lang="ts" module>
	export type IconType =
		| 'refresh'
		| 'stop'
		| 'autoSpin'
		| 'repeat'
		| 'repeatActive'
		| 'turbo'
		| 'turboActive'
		| 'menu'
		| 'menuExit'
		| 'settings'
		| 'payTable'
		| 'info'
		| 'soundOn'
		| 'soundOff'
		| 'increase'
		| 'decrease'
		| 'buyBonus';

	const ICON_ASSET_KEYS: Record<IconType, string> = {
		refresh: 'iconRefresh',
		stop: 'iconStop',
		autoSpin: 'iconAutoSpin',
		repeat: 'iconRepeat',
		repeatActive: 'iconRepeatActive',
		turbo: 'iconTurbo',
		turboActive: 'iconTurboActive',
		menu: 'iconMenu',
		menuExit: 'iconMenuExit',
		settings: 'iconSettings',
		payTable: 'iconPayTable',
		info: 'iconInfo',
		soundOn: 'iconSoundOn',
		soundOff: 'iconSoundOff',
		increase: 'iconIncrease',
		decrease: 'iconDecrease',
		buyBonus: 'iconBuyBonus',
	};
</script>

<script lang="ts">
	import { Sprite } from 'pixi-svelte';

	type Props = {
		iconType: IconType;
		size: number;
		color?: number;
		alpha?: number;
		x?: number;
		y?: number;
	};

	const { iconType, size, color = 0xffffff, alpha = 1, x = 0, y = 0 }: Props = $props();

	const assetKey = $derived(ICON_ASSET_KEYS[iconType]);
</script>

<Sprite
	key={assetKey}
	width={size}
	height={size}
	anchor={0.5}
	{x}
	{y}
	{alpha}
	tint={color}
/>
