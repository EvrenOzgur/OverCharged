<script lang="ts">
	import { Text, Graphics, Container } from 'pixi-svelte';
	import { WHITE } from 'constants-shared/colors';
	import { UI_BASE_FONT_SIZE } from 'components-ui-pixi/src/constants';

	type Props = {
		label: string;
		value: string;
		tiled?: boolean;
		stacked?: boolean;
	};

	const props: Props = $props();

	// Lab Theme Colors
	const NEON_GREEN = 0x39ff14;
	const PANEL_BG = 0x1a1a1e;
	const PANEL_ALPHA = 0.85;

	function drawPanel(g: any) {
		g.clear();
		const w = UI_BASE_FONT_SIZE * 3 * (326 / 73);
		const h = UI_BASE_FONT_SIZE * 2.8;
		const b = 25; // bezel/radius

		// Background with alpha (Glassmorphism)
		g.beginFill(PANEL_BG, PANEL_ALPHA);
		g.lineStyle(2, 0x4a4a4e, 0.4);
		g.drawRoundedRect(0, 0, w, h, b);
		g.endFill();

		// Top Highlight line (Neon)
		g.lineStyle(2, NEON_GREEN, 0.4);
		g.moveTo(b, 0);
		g.lineTo(w - b, 0);
	}

	const labelStyle = {
		fontFamily: 'proxima-nova',
		fontSize: UI_BASE_FONT_SIZE * 0.82,
		fill: 0x999999, // Muted label color
		fontWeight: '600'
	} as const;

	const valueStyle = {
		fontFamily: 'proxima-nova',
		fontSize: UI_BASE_FONT_SIZE * 1.15,
		fill: props.label.toLowerCase().includes('win') ? NEON_GREEN : WHITE,
		fontWeight: '800',
		dropShadow: props.label.toLowerCase().includes('win'),
		dropShadowColor: 0x000000,
		dropShadowBlur: 6,
		dropShadowDistance: 2
	} as const;
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
