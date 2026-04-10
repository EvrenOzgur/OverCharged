<script lang="ts">
	import { Text, Graphics, Container } from 'pixi-svelte';
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

	// Resolved colors: use overrides when available, otherwise hardcoded defaults.
	const PANEL_BG = $derived(props.styleOverrides ? hexToPixi(props.styleOverrides.backgroundColor) : 0x1a1a1e);
	const PANEL_BORDER = $derived(props.styleOverrides ? hexToPixi(props.styleOverrides.borderColor) : 0x4a4a4e);
	const ACCENT = $derived(props.styleOverrides ? hexToPixi(props.styleOverrides.activeColor) : 0x39ff14);
	const LABEL_COLOR = $derived(props.styleOverrides ? hexToPixi(props.styleOverrides.fontColor) : 0x999999);
	const VALUE_COLOR = $derived(props.styleOverrides ? hexToPixi(props.styleOverrides.valueColor) : WHITE);
	const FONT_MULT = $derived(props.styleOverrides?.fontSize ?? 1);
	const PANEL_ALPHA = 0.85;

	function drawPanel(g: any) {
		g.clear();
		const w = UI_BASE_FONT_SIZE * 3 * (326 / 73);
		const h = UI_BASE_FONT_SIZE * 2.8;
		const b = 25; // bezel/radius

		// Background with alpha (Glassmorphism)
		g.beginFill(PANEL_BG, PANEL_ALPHA);
		g.lineStyle(2, PANEL_BORDER, 0.4);
		g.drawRoundedRect(0, 0, w, h, b);
		g.endFill();

		// Top Highlight line (Accent)
		g.lineStyle(2, ACCENT, 0.4);
		g.moveTo(b, 0);
		g.lineTo(w - b, 0);
	}

	const isWin = $derived(props.label.toLowerCase().includes('win'));

	const labelStyle = $derived({
		fontFamily: 'proxima-nova',
		fontSize: UI_BASE_FONT_SIZE * 0.82 * FONT_MULT,
		fill: LABEL_COLOR,
		fontWeight: '600' as const,
	});

	const valueStyle = $derived({
		fontFamily: 'proxima-nova',
		fontSize: UI_BASE_FONT_SIZE * 1.15 * FONT_MULT,
		fill: isWin ? ACCENT : VALUE_COLOR,
		fontWeight: '800' as const,
		dropShadow: isWin,
		dropShadowColor: 0x000000,
		dropShadowBlur: 6,
		dropShadowDistance: 2,
	});
</script>

<Container x={props.stacked ? - (UI_BASE_FONT_SIZE * 3 * (326 / 73)) / 2 : 0}>
	{#if props.tiled}
		<Graphics draw={drawPanel} y={-20} x={props.stacked ? 0 : - (UI_BASE_FONT_SIZE * 3 * (326 / 73)) / 2} />
	{/if}

	{#if props.stacked}
		<Container x={(UI_BASE_FONT_SIZE * 3 * (326 / 73)) / 2}>
			<Text
				anchor={{ x: 0.5, y: 0.5 }}
				text={props.label.toUpperCase()}
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
		<Container x={0}>
			<Text
				anchor={{ x: 1, y: 0.5 }}
				text={props.label.toUpperCase() + ":"}
				style={labelStyle}
				x={-10}
				y={UI_BASE_FONT_SIZE * 0.5}
			/>
			<Text
				anchor={{ x: 0, y: 0.5 }}
				text={props.value}
				style={valueStyle}
				x={10}
				y={UI_BASE_FONT_SIZE * 0.5}
			/>
		</Container>
	{/if}
</Container>
