<script lang="ts">
	import { Text, Graphics, Container } from 'pixi-svelte';
	import { AlphaFilter } from 'pixi.js';
	import { WHITE } from 'constants-shared/colors';
	import { UI_BASE_FONT_SIZE } from 'components-ui-pixi/src/constants';
	import { hexToPixi, type UiElementStyle } from '../../game/uiLayoutConfig.svelte';

	type Props = {
		label: string;
		value: string;
		tiled?: boolean;
		stacked?: boolean;
		styleOverrides?: UiElementStyle;
	};

	const props: Props = $props();

	// Resolved colors — match the Pragmatic silver palette used by buttons.
	const RIM_COLOR = $derived(
		props.styleOverrides?.glowColor ? hexToPixi(props.styleOverrides.glowColor) : 0xb0bec5,
	);
	const ACCENT = $derived(
		props.styleOverrides?.activeColor ? hexToPixi(props.styleOverrides.activeColor) : 0x39ff14,
	);
	const LABEL_COLOR = $derived(
		props.styleOverrides?.fontColor ? hexToPixi(props.styleOverrides.fontColor) : 0xcfd8dc,
	);
	const VALUE_COLOR = $derived(
		props.styleOverrides?.valueColor ? hexToPixi(props.styleOverrides.valueColor) : WHITE,
	);
	const FONT_MULT = $derived(props.styleOverrides?.fontSize ?? 1);
	const TEXT_OVERRIDE = $derived(props.styleOverrides?.textOverride ?? '');
	const BG_ALPHA = $derived(props.styleOverrides?.bgAlpha ?? 0.55);

	const W = UI_BASE_FONT_SIZE * 3 * (326 / 73);
	const H = UI_BASE_FONT_SIZE * 2.8;
	const RADIUS = 22;

	// AlphaFilter — same uniform-transparency approach used by CircularButtonBg
	// so the panel reads as a translucent glass plate instead of an opaque block.
	// Constructor takes a static placeholder (1); the $effect below pushes the
	// reactive BG_ALPHA in afterwards — keeps Svelte from warning about a
	// `$derived` being captured in module scope.
	const dpr =
		typeof window !== 'undefined' && window.devicePixelRatio ? window.devicePixelRatio : 1;
	const alphaFilter = new AlphaFilter({ alpha: 1, resolution: dpr * 2 });
	alphaFilter.padding = 2;
	$effect(() => {
		alphaFilter.alpha = BG_ALPHA;
	});
	const filters = $derived(BG_ALPHA < 1 ? [alphaFilter] : null);

	function darken(color: number, amount: number): number {
		const r = (color >> 16) & 0xff;
		const g = (color >> 8) & 0xff;
		const b = color & 0xff;
		const f = Math.max(0, 1 - amount);
		return (
			((Math.round(r * f) & 0xff) << 16) |
			((Math.round(g * f) & 0xff) << 8) |
			(Math.round(b * f) & 0xff)
		);
	}

	function lighten(color: number, amount: number): number {
		const r = (color >> 16) & 0xff;
		const g = (color >> 8) & 0xff;
		const b = color & 0xff;
		const lr = Math.min(255, Math.round(r + (255 - r) * amount));
		const lg = Math.min(255, Math.round(g + (255 - g) * amount));
		const lb = Math.min(255, Math.round(b + (255 - b) * amount));
		return (lr << 16) | (lg << 8) | lb;
	}

	function drawPanel(g: any) {
		g.clear();

		const outlineColor = darken(RIM_COLOR, 0.85);
		const innerEdge = darken(RIM_COLOR, 0.55);
		const darkBase = darken(RIM_COLOR, 0.45);
		const brightTop = lighten(RIM_COLOR, 0.45);
		const wellFill = darken(RIM_COLOR, 0.4);

		// Concentric rounded-rect bands (each inset from the previous)
		// produce the same metallic bevel as CircularButtonBg's rings.
		const bands: Array<{ offset: number; color: number }> = [
			{ offset: 0, color: outlineColor }, // outer crisp outline
			{ offset: 2, color: RIM_COLOR }, // bright rim begins
			{ offset: 3.5, color: brightTop }, // highlight band
			{ offset: 6, color: RIM_COLOR }, // main rim
			{ offset: 10, color: darkBase }, // bevel shadow
			{ offset: 13, color: innerEdge }, // inner edge
			{ offset: 15, color: wellFill }, // inner well
		];
		for (const band of bands) {
			g.beginFill(band.color, 1);
			g.drawRoundedRect(
				band.offset,
				band.offset,
				W - band.offset * 2,
				H - band.offset * 2,
				Math.max(0, RADIUS - band.offset),
			);
			g.endFill();
		}

		// Top glossy specular highlights — gives the metallic "reflective" feel.
		g.beginFill(0xffffff, 0.35);
		g.drawEllipse(W / 2, 8, W * 0.42, 3.5);
		g.endFill();
		g.beginFill(0xffffff, 0.6);
		g.drawEllipse(W / 2, 5, W * 0.22, 1.8);
		g.endFill();

		// Bottom rim shadow.
		g.beginFill(0x000000, 0.18);
		g.drawEllipse(W / 2, H - 8, W * 0.45, 5);
		g.endFill();
	}

	const isWin = $derived(props.label.toLowerCase().includes('win'));

	const labelStyle = $derived({
		fontFamily: 'ranchers',
		fontSize: UI_BASE_FONT_SIZE * 0.82 * FONT_MULT,
		fill: LABEL_COLOR,
		fontWeight: '600' as const,
	});

	const valueStyle = $derived({
		fontFamily: 'ranchers',
		fontSize: UI_BASE_FONT_SIZE * 1.15 * FONT_MULT,
		fill: isWin ? ACCENT : VALUE_COLOR,
		fontWeight: '800' as const,
		dropShadow: isWin,
		dropShadowColor: 0x000000,
		dropShadowBlur: 6,
		dropShadowDistance: 2,
	});

	const drawKey = $derived(`uilabel-${W}-${H}-${RIM_COLOR}`);
</script>

<Container x={props.stacked ? -W / 2 : 0}>
	{#if props.tiled}
		<Container {filters}>
			{#key drawKey}
				<Graphics draw={drawPanel} y={-20} x={props.stacked ? 0 : -W / 2} />
			{/key}
		</Container>
	{/if}

	{#if props.stacked}
		<Container x={W / 2}>
			<Text
				anchor={{ x: 0.5, y: 0.5 }}
				text={(TEXT_OVERRIDE || props.label).toUpperCase()}
				style={labelStyle}
				y={UI_BASE_FONT_SIZE * 0.5}
			/>
			<Text
				anchor={{ x: 0.5, y: 0.5 }}
				text={props.value}
				style={valueStyle}
				y={UI_BASE_FONT_SIZE * 1.6}
			/>
		</Container>
	{:else}
		{@const labelLeftX = -W / 2 + 35}
		{@const colonX = -W / 2 + 215}
		<Container x={0}>
			<!-- Label words left-aligned, colon at a FIXED x so colons line up
			     vertically across stacked rows. Value follows the colon. -->
			<Text
				anchor={{ x: 0, y: 0.5 }}
				text={(TEXT_OVERRIDE || props.label).toUpperCase()}
				style={labelStyle}
				x={labelLeftX}
				y={UI_BASE_FONT_SIZE * 0.5}
			/>
			<Text
				anchor={{ x: 0, y: 0.5 }}
				text=":"
				style={labelStyle}
				x={colonX}
				y={UI_BASE_FONT_SIZE * 0.5}
			/>
			<Text
				anchor={{ x: 0, y: 0.5 }}
				text={props.value}
				style={valueStyle}
				x={colonX + 22}
				y={UI_BASE_FONT_SIZE * 0.5}
			/>
		</Container>
	{/if}
</Container>
