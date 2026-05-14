<!--
	Reusable hover-driven punch animation for Pixi UI buttons.

	Behavior:
	  • On hover-in: starts a looping punch sequence
	      1.00 → hoverScale  (fast, backOut overshoot → "pop")
	      hoverScale → 1.00  (slower, cubicIn → "settle")
	      short hold
	      repeat
	  • On hover-out: cancels the running loop and tweens scale back to 1.0.
	  • Disabled buttons get the same loop but at half amplitude, so the user
	    still feels the cursor target is alive without implying it's actionable.

	The component tracks hover both via a `hovered` prop (passed in from a
	parent <Button>'s snippet) AND via its own Pixi pointer listeners — this
	is intentional: the wrapping <Button> may suppress its `hovered` prop
	while `disabled=true`, but the user still wants visual feedback on those.

	When the Spine animation arrives, drop a SpineTrack into the children and
	flip its animationName based on `isHovering` — the punch wrapper keeps the
	subtle ambient bump as a baseline layer.
-->
<script lang="ts">
	import type { Snippet } from 'svelte';
	import { Tween } from 'svelte/motion';
	import { cubicIn, cubicOut, backOut } from 'svelte/easing';
	import { Container } from 'pixi-svelte';

	type Props = {
		hovered?: boolean;
		disabled?: boolean;
		x?: number;
		y?: number;
		anchor?: number | { x: number; y: number };
		/** Peak scale at the top of each punch (e.g. 1.08 = +8%) */
		hoverScale?: number;
		/** Pop duration (small → snappier) */
		popMs?: number;
		/** Settle duration (large → softer return) */
		settleMs?: number;
		/** Hold between punches */
		holdMs?: number;
		children: Snippet;
	};

	const props: Props = $props();

	const hoverScale = $derived(props.hoverScale ?? 1.1);
	const popMs = $derived(props.popMs ?? 140);
	const settleMs = $derived(props.settleMs ?? 280);
	const holdMs = $derived(props.holdMs ?? 220);

	// Disabled buttons use half the amplitude so feedback feels muted.
	const effectivePeak = $derived(
		props.disabled ? 1 + (hoverScale - 1) * 0.5 : hoverScale,
	);

	let localHover = $state(false);
	const isHovering = $derived(localHover || !!props.hovered);

	const scale = new Tween(1, { duration: 200, easing: cubicOut });

	$effect(() => {
		// Read reactives so this effect re-runs when they change.
		const active = isHovering;
		const peak = effectivePeak;
		const pop = popMs;
		const settle = settleMs;
		const hold = holdMs;

		if (!active) {
			// Hover ended → smoothly return to rest.
			scale.set(1, { duration: 180, easing: cubicOut });
			return;
		}

		let cancelled = false;

		(async () => {
			while (!cancelled) {
				await scale.set(peak, { duration: pop, easing: backOut });
				if (cancelled) break;
				await scale.set(1, { duration: settle, easing: cubicIn });
				if (cancelled) break;
				await sleep(hold);
			}
		})();

		return () => {
			cancelled = true;
		};
	});

	function sleep(ms: number): Promise<void> {
		return new Promise((resolve) => setTimeout(resolve, ms));
	}
</script>

<Container
	x={props.x}
	y={props.y}
	anchor={props.anchor}
	scale={{ x: scale.current, y: scale.current }}
	eventMode="static"
	onpointerover={() => (localHover = true)}
	onpointerout={() => (localHover = false)}
>
	{@render props.children()}
</Container>
