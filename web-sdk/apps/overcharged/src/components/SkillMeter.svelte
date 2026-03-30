<script lang="ts" module>
	export type EmitterEventSkillMetersUpdate = {
		type: 'skillMetersUpdate';
		skillMeters: { L1: number; L2: number; L3: number; L4: number };
	};
</script>

<script lang="ts">
	import * as PIXI from 'pixi.js';
	import { Sprite, Container, Text, REM, Graphics } from 'pixi-svelte';
	import { getContext } from '../game/context';
	import { SYMBOL_SIZE } from '../game/constants';

	let {
		x,
		y,
		meterName,
		targetValue,
		currentValue,
		colorId,
	}: {
		x: number;
		y: number;
		meterName: string;
		targetValue: number;
		currentValue: number;
		colorId: number;
	} = $props();

	const context = getContext();

	// Calculate a simple percentage
	let progressPercentage = $derived(
		Math.min(Math.max(currentValue / targetValue, 0), 1)
	);

	$effect(() => {
		if (currentValue > 0) {
			console.log(`[DEBUG] SkillMeter ${meterName} updated to ${currentValue}`);
		}
	});

	const METER_WIDTH = SYMBOL_SIZE * 2;
	const METER_HEIGHT = SYMBOL_SIZE * 0.4;

	// Fill color mapping
	const colorCodes = {
		L1: 0x0000ff, // Blue
		L2: 0x00ff00, // Green
		L3: 0xff0000, // Red
		L4: 0xffd700, // Yellow
	} as Record<string, number>;

	let meterColor = $derived(colorCodes[meterName] ?? 0xffffff);

	// Display labels
	const nameLabels = {
		L1: 'Blue Skill',
		L2: 'Green Skill',
		L3: 'Red Skill',
		L4: 'Yellow Skill',
	} as Record<string, string>;

	let label = $derived(nameLabels[meterName] ?? meterName);

</script>

<Container {x} {y}>
	<!-- Label indicating which skill it is -->
	<Text
		x={METER_WIDTH / 2}
		y={-10}
		anchor={{ x: 0.5, y: 1 }}
		text={label}
		style={{
			fill: meterColor,
			fontFamily: 'proxima-nova',
			fontSize: REM * 0.9,
			fontWeight: 'bold',
			dropShadow: true,
			dropShadowDistance: 2,
			dropShadowColor: 0x000000,
		}}
	/>

	<!-- Background of the progress bar -->
	<Graphics
		draw={(g: PIXI.Graphics) => {
			g.clear();
			g.beginFill(0x333333, 0.8);
			g.drawRect(0, -METER_HEIGHT / 2, METER_WIDTH, METER_HEIGHT);
			g.endFill();
		}}
	/>

	<!-- Dynamic colored fill -->
	<Graphics
		draw={(g: PIXI.Graphics) => {
			g.clear();
			g.beginFill(meterColor, 1);
			g.drawRect(0, -METER_HEIGHT / 2, METER_WIDTH * progressPercentage, METER_HEIGHT);
			g.endFill();
		}}
	/>

	<!-- Decorative Frame (optional, keeping it if image exists) -->
	<Sprite
		key="progressBarFrame.png"
		width={METER_WIDTH}
		height={METER_HEIGHT}
		anchor={{ x: 0, y: 0.5 }}
	/>

	<!-- Text displaying current count / target -->
	<Text
		x={METER_WIDTH / 2}
		y={0}
		anchor={0.5}
		text="{Math.floor(currentValue)} / {targetValue}"
		style={{
			fill: 0xffffff,
			fontFamily: 'proxima-nova',
			fontSize: REM * 1.0,
			fontWeight: 'bold',
			dropShadow: true,
			dropShadowDistance: 2,
			dropShadowColor: 0x000000,
		}}
	/>
</Container>
