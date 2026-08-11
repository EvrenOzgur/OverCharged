<!--
	Reusable Stake-style FX layer for slot UI buttons.

	Renders (in z order):
	  1. Multi-ring concentric-circle "glow halo" (alpha tweened on state)
	  2. Outer ring stroke (optional pulse + continuous rotation for spinning state)
	  3. Diagonal shine sweep masked to the button shape (one-shot per hover, loops while held)

	No external filter dependency — all effects use pixi-svelte Graphics so the
	bundle stays the same and per-frame cost is bounded.
-->
<script lang="ts" module>
	import type * as PIXI from 'pixi.js';

	export type ButtonFxState = 'idle' | 'hover' | 'pressed' | 'active' | 'disabled';
	export type ButtonFxEffects = {
		glow?: boolean;
		ring?: boolean;
		rotateRing?: boolean;
		shine?: boolean;
		ringPulse?: boolean;
	};
</script>

<script lang="ts">
	import { Container, Graphics } from 'pixi-svelte';
	import { Tween } from 'svelte/motion';
	import { cubicIn, cubicOut, sineInOut } from 'svelte/easing';

	type Props = {
		width: number;
		height: number;
		/** Corner radius for outer ring + shine mask (default: pill shape) */
		borderRadius?: number;
		state: ButtonFxState;
		effects?: ButtonFxEffects;
		glowColor?: number;
		ringColor?: number;
		ringWidth?: number;
		/** Alpha for the glow halo while hovering (0..1) */
		hoverGlowIntensity?: number;
		/** Alpha for the glow halo while active (spinning, 0..1) */
		activeGlowIntensity?: number;
	};

	const {
		width,
		height,
		borderRadius,
		state,
		effects = {},
		glowColor = 0x39ff14,
		ringColor = 0x39ff14,
		ringWidth = 3,
		hoverGlowIntensity = 0.6,
		activeGlowIntensity = 0.8,
	}: Props = $props();

	const radius = $derived(borderRadius ?? Math.min(width, height) * 0.5);

	// ── State helpers ────────────────────────────────────────────────
	const isHovering = $derived(state === 'hover' || state === 'pressed');
	const isActive = $derived(state === 'active');

	// ── Glow intensity tween ─────────────────────────────────────────
	const targetGlow = $derived.by(() => {
		if (!effects.glow || state === 'disabled') return 0;
		if (state === 'pressed') return Math.min(1, activeGlowIntensity + 0.3);
		if (state === 'active') return activeGlowIntensity;
		if (state === 'hover') return hoverGlowIntensity;
		return 0;
	});

	const glowAlpha = new Tween(0, { duration: 220, easing: cubicOut });
	$effect(() => {
		const t = targetGlow;
		const rising = t > glowAlpha.current;
		glowAlpha.set(t, {
			duration: rising ? 180 : 280,
			easing: rising ? cubicOut : cubicIn,
		});
	});

	// ── Outer ring rotation (continuous while active) ────────────────
	const rotateActive = $derived(effects.rotateRing === true && isActive);
	const ringRot = new Tween(0, { duration: 0 });
	$effect(() => {
		const active = rotateActive;
		if (!active) {
			ringRot.set(0, { duration: 400, easing: cubicOut });
			return;
		}
		let cancelled = false;
		(async () => {
			while (!cancelled) {
				ringRot.set(0, { duration: 0 });
				await ringRot.set(Math.PI * 2, { duration: 8000 });
				if (cancelled) break;
			}
		})();
		return () => {
			cancelled = true;
		};
	});

	// ── Ring breathing pulse (gentle scale while hover/active) ───────
	const ringPulseActive = $derived(
		effects.ring === true && effects.ringPulse !== false && (isHovering || isActive),
	);
	const ringScale = new Tween(1, { duration: 220, easing: cubicOut });
	$effect(() => {
		const active = ringPulseActive;
		if (!active) {
			ringScale.set(1, { duration: 220, easing: cubicOut });
			return;
		}
		let cancelled = false;
		(async () => {
			while (!cancelled) {
				await ringScale.set(1.03, { duration: 600, easing: sineInOut });
				if (cancelled) break;
				await ringScale.set(1, { duration: 600, easing: sineInOut });
				if (cancelled) break;
			}
		})();
		return () => {
			cancelled = true;
		};
	});

	// ── Shine sweep position tween (0..1 normalised; -1 = off-screen left) ──
	const shineActive = $derived(effects.shine === true && isHovering && state !== 'disabled');
	const shineX = new Tween(-1, { duration: 0 });
	$effect(() => {
		const active = shineActive;
		if (!active) {
			shineX.set(-1, { duration: 0 });
			return;
		}
		let cancelled = false;
		// One-shot sweep: reset to off-screen-left, then run a single sweep on
		// hover entry. Matches the one-shot scale punch in HoverAnimContainer.
		(async () => {
			shineX.set(-1, { duration: 0 });
			await shineX.set(1, { duration: 460, easing: cubicOut });
		})();
		return () => {
			cancelled = true;
		};
	});

	function sleep(ms: number): Promise<void> {
		return new Promise((resolve) => setTimeout(resolve, ms));
	}

	// ── Drawers (re-keyed when dimensions/colors change) ─────────────
	const glowKey = $derived(`g-${width}-${height}-${glowColor}`);
	const ringKey = $derived(`r-${width}-${height}-${radius}-${ringColor}-${ringWidth}`);
	const shineMaskKey = $derived(`sm-${width}-${height}-${radius}`);
	const shineKey = $derived(`s-${width}-${height}`);

	function drawGlow(g: PIXI.Graphics) {
		g.clear();
		const baseR = Math.max(width, height) * 0.55;
		const rings: Array<{ r: number; alpha: number }> = [
			{ r: baseR * 1.7, alpha: 0.05 },
			{ r: baseR * 1.45, alpha: 0.09 },
			{ r: baseR * 1.2, alpha: 0.16 },
			{ r: baseR * 1.0, alpha: 0.26 },
			{ r: baseR * 0.85, alpha: 0.36 },
		];
		for (const ring of rings) {
			g.circle(0, 0, ring.r).fill({ color: glowColor, alpha: ring.alpha });
		}
	}

	function drawRing(g: PIXI.Graphics) {
		g.clear();
		const padding = 6;
		const w = width + padding * 2;
		const h = height + padding * 2;
		const r = radius + padding;
		g.roundRect(-w / 2, -h / 2, w, h, r).stroke({ width: ringWidth, color: ringColor, alpha: 1 });
	}

	function drawShineMask(g: PIXI.Graphics) {
		g.clear();
		g.roundRect(-width / 2, -height / 2, width, height, radius).fill({ color: 0xffffff, alpha: 1 });
	}

	function drawShine(g: PIXI.Graphics) {
		g.clear();
		const stripeW = width * 0.22;
		const overshoot = height * 0.35;
		const hHalf = height / 2 + overshoot;
		const skew = stripeW * 0.5;
		g.poly([
			-stripeW / 2 - skew, -hHalf,
			stripeW / 2 - skew, -hHalf,
			stripeW / 2 + skew, hHalf,
			-stripeW / 2 + skew, hHalf,
		]).fill({ color: 0xffffff, alpha: 1 });
	}

	const shinePosX = $derived(shineX.current * (width * 0.8));
</script>

<!-- Layer 1: Glow halo -->
{#if effects.glow}
	{#key glowKey}
		<Graphics draw={drawGlow} alpha={glowAlpha.current} />
	{/key}
{/if}

<!-- Layer 2: Outer ring (rotation + breathing pulse) -->
{#if effects.ring}
	<Container
		scale={{ x: ringScale.current, y: ringScale.current }}
		rotation={ringRot.current}
	>
		{#key ringKey}
			<Graphics draw={drawRing} />
		{/key}
	</Container>
{/if}

<!-- Layer 3: Shine sweep (masked to button shape) -->
{#if effects.shine && shineActive}
	<Container alpha={0.32}>
		{#key shineMaskKey}
			<Graphics draw={drawShineMask} isMask={true} />
		{/key}
		{#key shineKey}
			<Graphics draw={drawShine} x={shinePosX} />
		{/key}
	</Container>
{/if}
