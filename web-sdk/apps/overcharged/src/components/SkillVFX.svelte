<!--
	Programmatic per-skill VFX layer. Fires when handleSkillActivated broadcasts
	`skillActivatedDisplay`. Sits BELOW `SkillActivatedOverlay` so the banner
	stays readable on top, but ABOVE the board so the burst/rings draw over
	the symbols.

	Each skill has its own renderer:
	  L1 Wild Strike (yellow)  → bolt rain + sparkles
	  L2 Overload    (green)   → concentric shockwave rings
	  L3 Power Surge (blue)    → radial energy ring around the global mult
	  L4 Mega Bolt   (red)     → giant flash + thick shockwave

	Asset-free; Stake's "static files only" rule is preserved.
-->
<script lang="ts">
	import { Container, Graphics } from 'pixi-svelte';
	import { MainContainer } from 'components-layout';
	import { Tween } from 'svelte/motion';
	import { cubicIn, cubicOut, backOut } from 'svelte/easing';

	import { getContext } from '../game/context';
	import { SKILL_DATA, type SkillKey } from '../game/skillData';

	const context = getContext();

	// Currently playing skill (null = idle / nothing drawn).
	let activeSkill = $state<SkillKey | null>(null);
	const meta = $derived(activeSkill ? SKILL_DATA[activeSkill] : null);

	// Master alpha for the whole VFX layer. Each skill schedules its own
	// internal Tweens but they all live inside this fade-in/fade-out envelope.
	const masterAlpha = new Tween(0, { duration: 180, easing: cubicOut });

	// Generic radial burst — used as a base for every skill until each gets
	// its own bespoke renderer. Scales from 0 → ~ board diagonal.
	const burstScale = new Tween(0, { duration: 300, easing: cubicOut });
	const burstAlpha = new Tween(0, { duration: 220, easing: cubicOut });

	const mainLayout = $derived.by(context.stateLayoutDerived.mainLayout);

	context.eventEmitter.subscribeOnMount({
		skillActivatedDisplay: async ({ skillKey }) => {
			activeSkill = skillKey;
			// Reset tween starting positions instantly so re-fires don't carry
			// over residual alpha from the previous skill.
			masterAlpha.set(0, { duration: 0 });
			burstScale.set(0, { duration: 0 });
			burstAlpha.set(0, { duration: 0 });

			// Fade in the layer, kick off the base burst.
			void masterAlpha.set(1, { duration: 180, easing: cubicOut });
			void burstAlpha.set(1, { duration: 180, easing: cubicOut });
			await burstScale.set(1, { duration: 380, easing: backOut });

			// Hold for readability (banner is also visible ~800ms).
			await new Promise((resolve) => setTimeout(resolve, 500));

			// Fade out.
			await Promise.all([
				masterAlpha.set(0, { duration: 320, easing: cubicIn }),
				burstAlpha.set(0, { duration: 320, easing: cubicIn }),
			]);
			activeSkill = null;
		},
	});

	// Base burst — radial gradient-ish ring centered on the board.
	// (Placeholder; per-skill renderers will overlay or replace this.)
	function drawBaseBurst(g: any, color: number, alpha: number, scale: number) {
		g.clear();
		if (alpha <= 0 || scale <= 0) return;
		const cx = mainLayout.width * 0.5;
		const cy = mainLayout.height * 0.5;
		const maxR = Math.hypot(mainLayout.width, mainLayout.height) * 0.5;

		// Outer faint glow band.
		g.circle(cx, cy, maxR * scale).fill({ color, alpha: alpha * 0.12 });

		// Inner brighter ring.
		g.circle(cx, cy, maxR * scale * 0.55).stroke({ width: 6, color, alpha: alpha * 0.6 });

		// Hot core.
		g.circle(cx, cy, maxR * scale * 0.18).fill({ color, alpha: alpha * 0.35 });
	}
</script>

{#if activeSkill && meta}
	<MainContainer>
		<Container alpha={masterAlpha.current}>
			<!--
				Base burst (placeholder).
				Per-skill VFX components will be wired here in subsequent
				iterations (L1 bolt rain, L2 shockwave, L3 energy ring, L4
				mega flash). For now every skill gets the same radial burst
				tinted by its own color — a visible starting point so the
				event chain can be smoke-tested end-to-end.
			-->
			<Graphics
				draw={(g) => drawBaseBurst(g, meta.color, burstAlpha.current, burstScale.current)}
			/>
		</Container>
	</MainContainer>
{/if}
