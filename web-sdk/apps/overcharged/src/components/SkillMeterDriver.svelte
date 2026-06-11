<!--
	Drives the bgCharacters spine's embedded mana fill bars from the live
	`context.stateGame.skillMeters` progress values.

	Two separate bone targets per skill:
	  • FILL bone (mana_kontur2 / mana_green3 / mana_blue / mana_kontur4)
	    — left-anchored, scaleX = progress ratio (0..1). Drives the coloured
	    bar growing from left to right.
	  • PARENT bone (bone_mana_yellow / green / blue / red) — sits at the
	    bar's centre. When the meter hits 100 %, scaleX AND scaleY pulse
	    together (1.0 ↔ 1.08) so the whole bar group "breathes" outward
	    uniformly, not sideways. Mirrors SkillMeter.svelte's readyScale.

	Mount inside a `SpineProvider`. Missing bones are silently skipped.
-->
<script lang="ts">
	import { Tween } from 'svelte/motion';
	import { cubicOut, cubicIn, backOut } from 'svelte/easing';
	import { getContextSpine } from 'pixi-svelte';

	import { getContext } from '../game/context';
	import config from '../game/config';
	import { BOARD_SIZES, BOARD_FIT_FACTOR } from '../game/constants';
	import { boardCalibration, bgCover } from '../game/boardCalibration.svelte';

	type SkillKey = 'L1' | 'L2' | 'L3' | 'L4';

	// Bone that drives the coloured fill width (left-anchored).
	const FILL_BONES: Record<SkillKey, string> = {
		L1: 'mana_kontur2', // yellow
		L2: 'mana_green3', // green
		L3: 'mana_blue', // blue
		L4: 'mana_kontur4', // red
	};

	// Parent bone whose origin sits at the bar's centre — used for the
	// uniform "ready" pulse so the whole bar grows outward, not sideways.
	const PARENT_BONES: Record<SkillKey, string> = {
		L1: 'bone_mana_yellow',
		L2: 'bone_mana_green',
		L3: 'bone_mana_blue',
		L4: 'bone_mana_red',
	};

	const SKILL_KEYS: SkillKey[] = ['L1', 'L2', 'L3', 'L4'];

	const spine = getContextSpine();
	const context = getContext();

	// ── Board ↔ well sync ──────────────────────────────────────────────────
	// Measure this spine's embedded board well (SlotArea) screen rect and write
	// the correction to boardCalibration so the symbol board fills the well.
	// The well is placed per-orientation by the skin's TC_board constraint, so
	// we re-measure on every canvas-size / orientation change (the spine re-fits
	// a frame or two later, hence the sampled delays). No-ops on skeletons that
	// don't define bone_board / SlotArea (i.e. any non-bgCharacters spine layer).
	$effect(() => {
		const cs = context.stateLayoutDerived.canvasSizes();
		void context.stateLayoutDerived.layoutType();
		if (!spine?.skeleton) return;

		const measure = () => {
			try {
				const sk: any = spine.skeleton;

				// ── bg cover: scale the BG scene to fill the canvas (any orientation).
				const bgSlot: any = sk.findSlot('BG');
				const bgBone = bgSlot?.bone;
				const bgAtt: any = bgSlot?.getAttachment?.();
				if (bgBone && bgAtt && bgCover.scale) {
					const bw = (bgAtt.width ?? 1200) * (bgAtt.scaleX ?? 1) * 0.5;
					const bh = (bgAtt.height ?? 675) * (bgAtt.scaleY ?? 1) * 0.5;
					const toGb = (lx: number, ly: number) =>
						spine.toGlobal({
							x: bgBone.a * lx + bgBone.b * ly + bgBone.worldX,
							y: bgBone.c * lx + bgBone.d * ly + bgBone.worldY,
						} as any);
					const o = toGb(0, 0);
					const sceneW = 2 * Math.hypot(toGb(bw, 0).x - o.x, toGb(bw, 0).y - o.y);
					const sceneH = 2 * Math.hypot(toGb(0, bh).x - o.x, toGb(0, bh).y - o.y);
					if (sceneW > 1 && sceneH > 1) {
						// `sceneW/H` are at the current bgCover.scale → divide it out to
						// get the scene's size at scale 1, then cover the canvas.
						const naturalW = sceneW / bgCover.scale;
						const naturalH = sceneH / bgCover.scale;
						const cover = Math.max(cs.width / naturalW, cs.height / naturalH);
						if (Number.isFinite(cover) && cover > 0.01 && cover < 20) {
							bgCover.scale = cover;
						}
						// Recentre the scene on the canvas. `o` is the scene centre in
						// screen px at the current offset, so the correction is cumulative
						// (converges to centred over the sampled re-measures).
						if (Number.isFinite(o.x) && Number.isFinite(o.y)) {
							bgCover.offsetX += cs.width / 2 - o.x;
							bgCover.offsetY += cs.height / 2 - o.y;
						}
					}
				}

				const bone = sk.findBone('bone_board');
				const slot = sk.findSlot('SlotArea');
				const att: any = slot?.getAttachment?.();
				if (!bone || !att) return;
				const halfW = (att.width ?? 507) * (att.scaleX ?? 1) * 0.5;
				const halfH = (att.height ?? 507) * (att.scaleY ?? 1) * 0.5;
				const toG = (lx: number, ly: number) =>
					spine.toGlobal({
						x: bone.a * lx + bone.b * ly + bone.worldX,
						y: bone.c * lx + bone.d * ly + bone.worldY,
					} as any);
				const o = toG(0, 0);
				const ex = toG(halfW, 0);
				const ey = toG(0, halfH);
				const wellW = 2 * Math.hypot(ex.x - o.x, ex.y - o.y);
				const wellH = 2 * Math.hypot(ey.x - o.x, ey.y - o.y);
				const ml = context.stateLayoutDerived.mainLayout();
				if (!ml.scale || !wellW || !wellH) return;
				const scale = (wellW / (BOARD_SIZES.width * ml.scale)) * BOARD_FIT_FACTOR;
				const offsetX = (o.x - cs.width / 2) / ml.scale;
				const offsetY = (o.y - cs.height / 2) / ml.scale;
				if (Number.isFinite(scale) && scale > 0.1 && scale < 5) {
					boardCalibration.scale = scale;
					boardCalibration.offsetX = offsetX;
					boardCalibration.offsetY = offsetY;
				}
			} catch {
				// transient (skeleton mid-update) — next sample will catch it
			}
		};

		const timers = [80, 250, 600, 1200].map((d) => setTimeout(measure, d));
		return () => timers.forEach(clearTimeout);
	});

	function clamp01(v: number): number {
		return v < 0 ? 0 : v > 1 ? 1 : v;
	}

	// Tween per skill — fill width (0..1) for the fill bone.
	const fillScale: Record<SkillKey, Tween<number>> = {
		L1: new Tween(0, { duration: 280, easing: cubicOut }),
		L2: new Tween(0, { duration: 280, easing: cubicOut }),
		L3: new Tween(0, { duration: 280, easing: cubicOut }),
		L4: new Tween(0, { duration: 280, easing: cubicOut }),
	};

	// Tween per skill — uniform pulse multiplier (1.0 idle, 1.0 ↔ 1.08 when full).
	const pulseScale: Record<SkillKey, Tween<number>> = {
		L1: new Tween(1, { duration: 220, easing: cubicOut }),
		L2: new Tween(1, { duration: 220, easing: cubicOut }),
		L3: new Tween(1, { duration: 220, easing: cubicOut }),
		L4: new Tween(1, { duration: 220, easing: cubicOut }),
	};

	// Effect 1 — drive tween targets from state.
	$effect(() => {
		const meters = context.stateGame.skillMeters;
		const thresholds = config.skillThresholds;
		const cancellers: Array<() => void> = [];

		for (const key of SKILL_KEYS) {
			const meter = meters[key];
			const threshold = thresholds[key];
			if (typeof meter !== 'number' || typeof threshold !== 'number' || threshold <= 0) {
				continue;
			}

			const ratio = clamp01(meter / threshold);

			// Fill bar always tweens to the current ratio (handles both accumulation
			// and drain after activation).
			fillScale[key].set(ratio, { duration: 280, easing: cubicOut });

			if (ratio >= 1) {
				// Start the ready-pulse loop on the parent bone.
				const signal = { cancelled: false };
				(async () => {
					await pulseScale[key].set(1, { duration: 220, easing: cubicOut });
					while (!signal.cancelled) {
						await pulseScale[key].set(1.08, { duration: 350, easing: backOut });
						if (signal.cancelled) break;
						await pulseScale[key].set(1, { duration: 450, easing: cubicIn });
					}
				})();
				cancellers.push(() => {
					signal.cancelled = true;
				});
			} else {
				// Settle pulse back to 1 so the bar isn't stuck at an enlarged size.
				pulseScale[key].set(1, { duration: 180, easing: cubicOut });
			}
		}

		return () => {
			for (const fn of cancellers) fn();
		};
	});

	// Effect 2 — apply tween values to skeleton bones each reactive tick.
	$effect(() => {
		if (!spine?.skeleton) return;
		for (const key of SKILL_KEYS) {
			const fillBone = spine.skeleton.findBone(FILL_BONES[key]);
			if (fillBone) fillBone.scaleX = fillScale[key].current;

			const parentBone = spine.skeleton.findBone(PARENT_BONES[key]);
			if (parentBone) {
				const p = pulseScale[key].current;
				parentBone.scaleX = p;
				parentBone.scaleY = p;
			}
		}
	});
</script>
