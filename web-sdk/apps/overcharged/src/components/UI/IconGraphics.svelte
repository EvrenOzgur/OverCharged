<script lang="ts" module>
	import type * as PIXI from 'pixi.js';

	export type IconType =
		| 'play'
		| 'stop'
		| 'pause'
		| 'arrows'
		| 'autoSpin'
		| 'turbo'
		| 'menu'
		| 'menuExit'
		| 'settings'
		| 'payTable'
		| 'info'
		| 'soundOn'
		| 'soundOff'
		| 'increase'
		| 'decrease'
		| 'buyBonus';
</script>

<script lang="ts">
	import { Graphics } from 'pixi-svelte';

	type Props = {
		iconType: IconType;
		size: number;
		color?: number;
		x?: number;
		y?: number;
		alpha?: number;
	};

	const { iconType, size, color = 0xffffff, x = 0, y = 0, alpha = 1 }: Props = $props();

	const drawKey = $derived(`${iconType}-${size}-${color}`);

	function drawPlay(g: PIXI.Graphics) {
		// Equilateral triangle pointing right, optically centered.
		const r = size * 0.42;
		const h = r * Math.sqrt(3);
		// Shift slightly left so the visual centroid sits at (0,0)
		const cx = -r * 0.15;
		g.poly([
			cx + r, 0,
			cx - r / 2, -h / 2,
			cx - r / 2, h / 2,
		]).fill({ color, alpha: 1 });
	}

	function drawStop(g: PIXI.Graphics) {
		const s = size * 0.55;
		const r = s * 0.18;
		g.roundRect(-s / 2, -s / 2, s, s, r).fill({ color, alpha: 1 });
	}

	function drawPause(g: PIXI.Graphics) {
		const barW = size * 0.16;
		const barH = size * 0.55;
		const gap = size * 0.12;
		const r = barW * 0.4;
		g.roundRect(-gap / 2 - barW, -barH / 2, barW, barH, r);
		g.roundRect(gap / 2, -barH / 2, barW, barH, r);
		g.fill({ color, alpha: 1 });
	}

	/**
	 * Material-Design / Pragmatic-style "refresh" arrow — single chunky
	 * circular arrow forming ~240° of a circle with a triangular arrowhead
	 * at the tip. Universally recognised as "spin / reload".
	 *
	 * Coordinate notes (Pixi/Canvas, y-down):
	 *   angle 0          = 3 o'clock
	 *   angle π/2        = 6 o'clock
	 *   angle π          = 9 o'clock
	 *   angle 3π/2/-π/2  = 12 o'clock
	 *   Default arc direction (counterclockwise=false) = visually CLOCKWISE
	 *   because increasing angle moves through (right → down → left → up).
	 */
	function drawArrows(g: PIXI.Graphics) {
		const r = size * 0.38;
		const thickness = size * 0.13;

		// Arc runs from 5 o'clock clockwise through 6, 9, 12, ending at 1
		// o'clock — leaves a 120° gap on the right side that the arrowhead
		// "leaps" into.
		const startA = Math.PI / 3; // 5 o'clock
		const endA = (5 * Math.PI) / 3; // 1 o'clock (reached by sweeping CW)

		// Main arc stroke
		g.moveTo(r * Math.cos(startA), r * Math.sin(startA));
		g.arc(0, 0, r, startA, endA);
		g.stroke({ width: thickness, color, alpha: 1 });

		// Rounded cap at the start of the arc (5 o'clock)
		g.circle(r * Math.cos(startA), r * Math.sin(startA), thickness / 2).fill({ color, alpha: 1 });

		// Arrowhead at the end (1 o'clock), pointing along the CW tangent.
		// Tangent vector for increasing-angle direction at θ = (-sinθ, cosθ).
		const tipBaseX = r * Math.cos(endA);
		const tipBaseY = r * Math.sin(endA);
		const tangX = -Math.sin(endA);
		const tangY = Math.cos(endA);
		const radX = Math.cos(endA);
		const radY = Math.sin(endA);

		const arrowLen = thickness * 1.9;
		const arrowHalfW = thickness * 1.5;

		const tipX = tipBaseX + tangX * arrowLen;
		const tipY = tipBaseY + tangY * arrowLen;
		const outerX = tipBaseX + radX * arrowHalfW;
		const outerY = tipBaseY + radY * arrowHalfW;
		const innerX = tipBaseX - radX * arrowHalfW;
		const innerY = tipBaseY - radY * arrowHalfW;

		g.poly([tipX, tipY, outerX, outerY, innerX, innerY]).fill({ color, alpha: 1 });
	}

	function drawIcon(g: PIXI.Graphics) {
		g.clear();
		switch (iconType) {
			case 'play':
				drawPlay(g);
				break;
			case 'stop':
				drawStop(g);
				break;
			case 'pause':
				drawPause(g);
				break;
			case 'arrows':
				drawArrows(g);
				break;
			// Other icon types reserved for future implementation.
			default:
				drawArrows(g);
		}
	}
</script>

{#key drawKey}
	<Graphics {x} {y} {alpha} draw={drawIcon} />
{/key}
