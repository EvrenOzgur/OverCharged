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
	import { SKILL_DATA, drawSkillIcon, type SkillKey } from '../game/skillData';

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
		/** When true, the meter mounts and runs all its tweens / event
		 *  subscriptions normally but the root Container is invisible — used
		 *  while we transition to the bgCharacters-embedded mana bars without
		 *  losing this component's working state machine. */
		hidden = false,
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
		hidden?: boolean;
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

	// Per-skill metadata lives in src/game/skillData.ts so SkillMeter and the
	// SkillActivatedOverlay stay in lockstep (same name, color, icon kind).
	const skill = $derived(
		SKILL_DATA[meterName as SkillKey] ?? {
			name: meterName,
			description: '',
			kind: 'bolt' as const,
			color: colorId,
		},
	);
	let label = $derived(skill.name);

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
	// Init at 0; $effect below syncs to progressPercentage on first render
	// (avoids the "state referenced in own scope" warning).
	const fillTween = new Tween(0, { duration: 280, easing: cubicOut });
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

	// READY state: when the meter is full and waiting to fire, the whole meter
	// gets a slow scale punch loop + an outer glow halo that pulses in/out.
	const isReady = $derived(progressPercentage >= 1);
	const readyScale = new Tween(1, { duration: 200, easing: cubicOut });
	const readyGlow = new Tween(0, { duration: 300, easing: cubicOut });
	$effect(() => {
		if (!isReady) {
			readyScale.set(1, { duration: 180, easing: cubicOut });
			readyGlow.set(0, { duration: 180, easing: cubicOut });
			return;
		}
		let cancelled = false;
		(async () => {
			// Run two concurrent loops: one for scale, one for glow.
			(async () => {
				while (!cancelled) {
					await readyScale.set(1.06, { duration: 350, easing: backOut });
					if (cancelled) break;
					await readyScale.set(1, { duration: 450, easing: cubicIn });
				}
			})();
			while (!cancelled) {
				await readyGlow.set(1, { duration: 500, easing: cubicOut });
				if (cancelled) break;
				await readyGlow.set(0.4, { duration: 500, easing: cubicIn });
			}
		})();
		return () => {
			cancelled = true;
		};
	});

	// ─── Halo drawing helper (icon lives in shared skillData.ts) ─────────────
	function drawHalo(g: any, color: number, alpha: number) {
		g.clear();
		if (alpha <= 0) return;
		// Concentric soft halo around the bar
		g.lineStyle(0);
		const pad = 14;
		const w = METER_WIDTH + pad * 2;
		const h = METER_HEIGHT + pad * 2;
		// Outer faint band
		g.beginFill(color, alpha * 0.18);
		g.drawRoundedRect(-pad, -METER_HEIGHT / 2 - pad, w, h, 12);
		g.endFill();
		// Inner tighter band
		g.beginFill(color, alpha * 0.28);
		g.drawRoundedRect(-pad / 2, -METER_HEIGHT / 2 - pad / 2, METER_WIDTH + pad, METER_HEIGHT + pad, 8);
		g.endFill();
	}
</script>

<!--
	Pivot at (METER_WIDTH/2, 0) so the readyScale pulse centers horizontally
	without shifting the bar left. Position is offset by METER_WIDTH/2 to
	compensate (pivot anchor lands at the originally-requested x).
-->
<Container
	x={x + METER_WIDTH / 2}
	{y}
	visible={!hidden}
	scale={{ x: readyScale.current, y: readyScale.current }}
	pivot={{ x: METER_WIDTH / 2, y: 0 }}
>
	<!-- READY-state halo (only visible when meter is full) -->
	<Graphics draw={(g) => drawHalo(g, meterColor, readyGlow.current)} />

	<!-- Icon (left of label, drawn with Graphics) -->
	<Graphics
		x={14}
		y={-22}
		draw={(g) => drawSkillIcon(g, skill.kind, meterColor)}
	/>

	<!-- Label indicating which skill it is -->
	<Text
		x={METER_WIDTH / 2 + 8}
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

	<!-- READY badge above the meter when full -->
	{#if isReady}
		<Text
			x={METER_WIDTH - 4}
			y={-METER_HEIGHT / 2 - 4}
			anchor={{ x: 1, y: 1 }}
			text="READY!"
			style={{
				fill: 0xffffff,
				fontFamily: 'proxima-nova',
				fontSize: REM * 0.65,
				fontWeight: 'bold',
				dropShadow: true,
				dropShadowDistance: 2,
				dropShadowColor: meterColor,
				dropShadowBlur: 4,
			}}
		/>
	{/if}

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
