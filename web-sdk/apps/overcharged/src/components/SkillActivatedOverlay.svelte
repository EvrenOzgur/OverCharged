<!--
	Fullscreen banner that fires when a skill activates. Shows the skill icon,
	name and description for ~1.5 seconds with fade-in + scale-pop + fade-out.

	Decoupled from skillActivated math event — Game.svelte fires this via the
	'skillActivatedDisplay' emitter event so timing can be coordinated with
	pre-highlight and screen-shake before the on-board animation runs.
-->
<script lang="ts" module>
	import type { SkillKey } from '../game/skillData';
	export type EmitterEventSkillActivatedDisplay = {
		type: 'skillActivatedDisplay';
		skillKey: SkillKey;
	};
</script>

<script lang="ts">
	import { Container, Rectangle, Text, Graphics, REM } from 'pixi-svelte';
	import { MainContainer } from 'components-layout';
	import { Tween } from 'svelte/motion';
	import { cubicIn, cubicOut, backOut } from 'svelte/easing';

	import { getContext } from '../game/context';
	import { SKILL_DATA, drawSkillIcon, type SkillKey as Key } from '../game/skillData';

	const context = getContext();

	let activeSkill = $state<Key | null>(null);
	const current = $derived(activeSkill ? SKILL_DATA[activeSkill] : null);

	const alpha = new Tween(0, { duration: 200, easing: cubicOut });
	const scale = new Tween(0.5, { duration: 200, easing: backOut });

	const mainLayout = $derived.by(context.stateLayoutDerived.mainLayout);

	// runId — every time the banner sequence starts we bump this. The handler
	// checks it after each await to drop out cleanly if `skipAnimation` was
	// broadcast (which bumps the id and snaps the banner away).
	let runId = 0;

	context.eventEmitter.subscribeOnMount({
		skillActivatedDisplay: async ({ skillKey }) => {
			const id = ++runId;
			activeSkill = skillKey;
			// Reset to start state instantly
			alpha.set(0, { duration: 0 });
			scale.set(0.5, { duration: 0 });
			// Fade in + scale pop
			await Promise.all([
				alpha.set(1, { duration: 220, easing: cubicOut }),
				scale.set(1, { duration: 280, easing: backOut }),
			]);
			if (id !== runId) return;
			// Hold the banner so the player can read it
			await new Promise((resolve) => setTimeout(resolve, 800));
			if (id !== runId) return;
			// Fade out
			await alpha.set(0, { duration: 380, easing: cubicIn });
			if (id !== runId) return;
			activeSkill = null;
		},
		skipAnimation: () => {
			if (activeSkill === null) return;
			// Invalidate the in-flight handler — its post-await guards drop out.
			++runId;
			// Quick fade so the dismiss still reads as motion, not a teleport.
			alpha.set(0, { duration: 120, easing: cubicIn }).then(() => {
				if (alpha.current <= 0.01) activeSkill = null;
			});
		},
	});
</script>

{#if activeSkill && current}
	<MainContainer>
		<!-- Dim layer covers the whole game area. No scale; fades with alpha. -->
		<Rectangle
			x={0}
			y={0}
			width={mainLayout.width}
			height={mainLayout.height}
			backgroundColor={0x000000}
			alpha={alpha.current * 0.65}
		/>

		<!-- Centered content. Scaled together for the "slam-in" pop. -->
		<Container
			x={mainLayout.width * 0.5}
			y={mainLayout.height * 0.5}
			alpha={alpha.current}
			scale={{ x: scale.current, y: scale.current }}
		>
			<!-- Big icon -->
			<Graphics
				y={-90}
				scale={{ x: 5, y: 5 }}
				draw={(g) => drawSkillIcon(g, current.kind, current.color)}
			/>

			<!-- Skill name -->
			<Text
				y={-10}
				anchor={0.5}
				text={current.name}
				style={{
					fill: current.color,
					fontFamily: 'proxima-nova',
					fontSize: REM * 3.2,
					fontWeight: '900',
					letterSpacing: 4,
					dropShadow: true,
					dropShadowColor: 0x000000,
					dropShadowDistance: 4,
					dropShadowBlur: 8,
				}}
			/>

			<!-- "ACTIVATED" subline -->
			<Text
				y={45}
				anchor={0.5}
				text="ACTIVATED"
				style={{
					fill: 0xffffff,
					fontFamily: 'proxima-nova',
					fontSize: REM * 1.1,
					fontWeight: '600',
					letterSpacing: 6,
					dropShadow: true,
					dropShadowColor: 0x000000,
					dropShadowDistance: 2,
				}}
			/>

			<!-- Description -->
			<Text
				y={95}
				anchor={0.5}
				text={current.description}
				style={{
					fill: 0xdddddd,
					fontFamily: 'proxima-nova',
					fontSize: REM * 1.0,
					fontWeight: '400',
					dropShadow: true,
					dropShadowColor: 0x000000,
					dropShadowDistance: 2,
				}}
			/>
		</Container>
	</MainContainer>
{/if}
