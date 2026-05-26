<!--
	Pragmatic-style 3D embossed circular button background.

	Layered structure (drawn bottom-up; each fill covers everything below
	it inside its radius, so the VISIBLE part of each ring is the annulus
	between its radius and the next-smaller one).

	`bgAlpha` < 1 enables an AlphaFilter on the wrapping Container so the
	whole button renders to an offscreen texture before being composited
	at the requested alpha — the game background shows through UNIFORMLY,
	not just at the outer edge (Container.alpha would compound per layer).
-->
<script lang="ts" module>
	import type * as PIXI from 'pixi.js';
</script>

<script lang="ts">
	import { Container, Graphics } from 'pixi-svelte';
	import { AlphaFilter } from 'pixi.js';

	type Props = {
		/** Button diameter in pixels */
		size: number;
		/** Driving color — rim base + halo + accents derive from this */
		baseColor: number;
		/** Override the inner well fill color (default = derived from baseColor) */
		fillColor?: number;
		/** Overall alpha multiplier applied to the bg via AlphaFilter (0..1).
		 *  When < 1 the game background bleeds through uniformly. */
		bgAlpha?: number;
		/** Disabled-state dimmer (multiplied on top of bgAlpha) */
		alpha?: number;
		x?: number;
		y?: number;
	};

	const {
		size,
		baseColor,
		fillColor,
		bgAlpha = 0.8,
		alpha = 1,
		x = 0,
		y = 0,
	}: Props = $props();

	// Lighter inner well + softened shadows so the button reads as "translucent
	// amber pane" rather than "deep dark well".
	const resolvedFillColor = $derived(fillColor ?? darken(baseColor, 0.4));
	const drawKey = $derived(`cbg-${size}-${baseColor}-${resolvedFillColor}`);

	// Single AlphaFilter instance per component, alpha is mutated reactively to
	// avoid recreating the filter (and its render-texture) every frame.
	// `resolution` is set to 2× the device pixel ratio so the filter's internal
	// render-texture supersamples the bevel rings — without this even native DPR
	// produced visibly soft circle edges after the filter composite.
	const dpr =
		typeof window !== 'undefined' && window.devicePixelRatio ? window.devicePixelRatio : 1;
	const alphaFilter = new AlphaFilter({ alpha: bgAlpha, resolution: dpr * 2 });
	alphaFilter.padding = 2;
	$effect(() => {
		alphaFilter.alpha = bgAlpha * alpha;
	});
	const filters = $derived(bgAlpha < 1 || alpha < 1 ? [alphaFilter] : null);

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

	function drawBg(g: PIXI.Graphics) {
		g.clear();
		const R = size / 2;

		// Color derivations
		const outlineColor = darken(baseColor, 0.85); // crisp outer outline
		const innerEdge = darken(baseColor, 0.55); // soft rim→well transition
		const darkBase = darken(baseColor, 0.45);
		const brightTop = lighten(baseColor, 0.45);
		const wellFill = resolvedFillColor;

		// ─── Step 1: Concentric beveled rim bands ────────────────────
		const rings: Array<{ ratio: number; color: number }> = [
			{ ratio: 1.0, color: outlineColor },
			{ ratio: 0.975, color: baseColor },
			{ ratio: 0.955, color: brightTop },
			{ ratio: 0.91, color: baseColor },
			{ ratio: 0.86, color: darkBase },
			{ ratio: 0.82, color: innerEdge },
			{ ratio: 0.79, color: wellFill },
		];
		for (const ring of rings) {
			g.beginFill(ring.color, 1);
			g.drawCircle(0, 0, R * ring.ratio);
			g.endFill();
		}

		const wellR = R * 0.79;

		// ─── Step 2: Rim bottom-shadow ellipse (softer) ──────────────
		g.beginFill(0x000000, 0.15);
		g.drawEllipse(0, R * 0.55, R * 0.98, R * 0.45);
		g.endFill();

		// ─── Step 3: Inner-well TOP inset shadow (much softer) ───────
		g.beginFill(0x000000, 0.18);
		g.drawEllipse(0, -wellR * 0.62, wellR * 0.95, wellR * 0.26);
		g.endFill();

		// ─── Step 4: Bottom bounce light ─────────────────────────────
		g.beginFill(baseColor, 0.18);
		g.drawEllipse(0, wellR * 0.45, wellR * 0.75, wellR * 0.3);
		g.endFill();

		// ─── Step 5: Icon-area halo glow ─────────────────────────────
		const haloR = wellR * 0.85;
		const haloRings: Array<{ r: number; alpha: number }> = [
			{ r: haloR * 1.0, alpha: 0.05 },
			{ r: haloR * 0.85, alpha: 0.08 },
			{ r: haloR * 0.7, alpha: 0.13 },
			{ r: haloR * 0.55, alpha: 0.2 },
			{ r: haloR * 0.4, alpha: 0.26 },
		];
		for (const halo of haloRings) {
			g.beginFill(baseColor, halo.alpha);
			g.drawCircle(0, 0, halo.r);
			g.endFill();
		}

		// ─── Step 6: Top rim specular ────────────────────────────────
		g.beginFill(0xffffff, 0.55);
		g.drawEllipse(0, -R * 0.78, R * 0.55, R * 0.13);
		g.endFill();

		// ─── Step 7: Secondary tight specular ────────────────────────
		g.beginFill(0xffffff, 0.75);
		g.drawEllipse(0, -R * 0.84, R * 0.25, R * 0.05);
		g.endFill();
	}
</script>

<Container {x} {y} {filters}>
	{#key drawKey}
		<Graphics draw={drawBg} />
	{/key}
</Container>
