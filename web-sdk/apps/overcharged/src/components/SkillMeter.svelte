<script lang="ts" module>
	export type EmitterEventSkillMetersUpdate = {
		type: 'skillMetersUpdate';
		skillMeters: { L1: number; L2: number; L3: number; L4: number };
	};
</script>

<script lang="ts">
	import { Sprite, Container, Text, REM, Graphics, SpineProvider, SpineTrack } from 'pixi-svelte';
	import { Tween } from 'svelte/motion';
	import { cubicOut, cubicIn, backOut } from 'svelte/easing';
	import { getContext } from '../game/context';
	import { SYMBOL_SIZE } from '../game/constants';

	let {
		x,
		y,
		meterName,
		targetValue,
		currentValue,
		colorId,
		// Spine animation (opt-in, all optional). When `spineKey` is set AND the
		// asset is loaded, the Graphics bar + frame are hidden and the Spine
		// drives the visual. Text overlays (label + count) stay on top.
		spineKey,
		spineSkin,
		spineWidth,
		spineHeight,
		idleAnim = 'idle',
		incrementAnim = 'increment',
		fullAnim = 'full',
	}: {
		x: number;
		y: number;
		meterName: string;
		targetValue: number;
		currentValue: number;
		colorId: number;
		spineKey?: string;
		spineSkin?: string;
		spineWidth?: number;
		spineHeight?: number;
		idleAnim?: string;
		incrementAnim?: string;
		fullAnim?: string;
	} = $props();

	const context = getContext();

	// Calculate a simple percentage
	let progressPercentage = $derived(
		Math.min(Math.max(currentValue / targetValue, 0), 1)
	);

	const METER_WIDTH = SYMBOL_SIZE * 2;
	const METER_HEIGHT = SYMBOL_SIZE * 0.4;

	let meterColor = $derived(colorId);

	// Display labels — must match math skill colours (L1=Yellow Wilds,
	// L2=Green Explode, L3=Blue Multiplier, L4=Red Mega Wild).
	const nameLabels = {
		L1: 'Yellow Skill',
		L2: 'Green Skill',
		L3: 'Blue Skill',
		L4: 'Red Skill',
	} as Record<string, string>;

	let label = $derived(nameLabels[meterName] ?? meterName);

	// ─── Spine handling ──────────────────────────────────────────────────────
	// Only render Spine when the asset has actually loaded; otherwise fall back
	// to the Graphics bar so the meter is never invisible while assets stream in.
	const spineValid = $derived(
		!!spineKey && !!context.stateApp.loadedAssets?.[spineKey],
	);

	// Animation state machine:
	//   - currentValue increases  →  incrementAnim (one-shot)
	//   - reached 100%             →  fullAnim     (loop, replaces idle)
	//   - otherwise                →  idleAnim     (loop)
	// On Spine `complete` for the one-shot increment anim we revert to the
	// appropriate looping base animation.
	let activeAnim = $state(idleAnim);
	let prevValue = currentValue;

	$effect(() => {
		const cv = currentValue;
		const pct = Math.min(Math.max(cv / targetValue, 0), 1);
		if (cv > prevValue && incrementAnim) {
			activeAnim = incrementAnim;
		} else if (pct >= 1 && fullAnim) {
			activeAnim = fullAnim;
		} else {
			activeAnim = idleAnim;
		}
		prevValue = cv;
	});

	const isLooping = $derived(activeAnim !== incrementAnim);

	const spineListener = {
		complete: () => {
			if (activeAnim === incrementAnim) {
				activeAnim = progressPercentage >= 1 && fullAnim ? fullAnim : idleAnim;
			}
		},
	};

	// ─── Graphics fallback tween animations ──────────────────────────────────
	// Same state machine as Spine (increment one-shot / full loop / idle) but
	// expressed as Tweens so we can test the timing/feel before assets land.
	// When Spine takes over these still update but nothing reads them.

	// Smooth fill bar — replaces the raw progressPercentage in the draw.
	const fillTween = new Tween(progressPercentage, { duration: 280, easing: cubicOut });
	$effect(() => {
		fillTween.set(progressPercentage);
	});

	// Increment punch: when currentValue increases, briefly scale the bar.
	const barScale = new Tween(1, { duration: 150, easing: cubicOut });
	let prevValueForPulse = currentValue;
	$effect(() => {
		const cv = currentValue;
		if (cv > prevValueForPulse) {
			(async () => {
				await barScale.set(1.08, { duration: 120, easing: backOut });
				await barScale.set(1, { duration: 220, easing: cubicIn });
			})();
		}
		prevValueForPulse = cv;
	});

	// Full-state breathing: at 100% the fill alpha gently pulses to signal
	// "ready to activate". Mirrors the Spine fullAnim loop.
	const fullAlpha = new Tween(1, { duration: 600, easing: cubicOut });
	$effect(() => {
		const isFull = progressPercentage >= 1;
		if (!isFull) {
			fullAlpha.set(1, { duration: 180, easing: cubicOut });
			return;
		}
		let cancelled = false;
		(async () => {
			while (!cancelled) {
				await fullAlpha.set(0.55, { duration: 700, easing: cubicOut });
				if (cancelled) break;
				await fullAlpha.set(1, { duration: 700, easing: cubicIn });
			}
		})();
		return () => {
			cancelled = true;
		};
	});
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

	{#if spineValid}
		<!-- Spine-driven visual. Asset key + skin + active animation are all
		     reactive — when activeAnim flips, SpineTrack switches animation. -->
		<SpineProvider
			key={spineKey}
			skin={spineSkin}
			width={spineWidth ?? METER_WIDTH}
			height={spineHeight ?? METER_HEIGHT}
			anchor={{ x: 0, y: 0.5 }}
		>
			<SpineTrack
				trackIndex={0}
				animationName={activeAnim}
				loop={isLooping}
				listener={spineListener}
			/>
		</SpineProvider>
	{:else}
		<!-- Graphics fallback. Inner Container scales around its center on the
		     increment pulse without affecting the label/count text positioning. -->
		<Container
			x={METER_WIDTH / 2}
			y={0}
			pivot={{ x: METER_WIDTH / 2, y: 0 }}
			scale={{ x: barScale.current, y: barScale.current }}
		>
			<!-- Background of the progress bar -->
			<Graphics
				draw={(g) => {
					g.clear();
					g.beginFill(0x333333, 0.8);
					g.drawRect(0, -METER_HEIGHT / 2, METER_WIDTH, METER_HEIGHT);
					g.endFill();
				}}
			/>

			<!-- Dynamic colored fill — width tweens, alpha breathes at 100%. -->
			<Graphics
				draw={(g) => {
					g.clear();
					g.beginFill(meterColor, fullAlpha.current);
					g.drawRect(
						0,
						-METER_HEIGHT / 2,
						METER_WIDTH * fillTween.current,
						METER_HEIGHT,
					);
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
		</Container>
	{/if}

	<!-- Text displaying current count / target — always on top of either visual. -->
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
