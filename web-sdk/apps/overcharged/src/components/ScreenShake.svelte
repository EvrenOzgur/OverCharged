<!--
	Wraps its children in a Pixi Container whose position oscillates on
	'screenShake' events. Decays linearly over `duration` so the shake
	settles back to (0, 0) without an abrupt cut. Intensity is the peak
	pixel offset; typical: 3-5 small, 7-10 medium, 12-15 big-win.

	Place this around the gameplay MainContainers in Game.svelte but
	OUTSIDE the UI chrome so buttons stay stable while the board shakes.
-->
<script lang="ts" module>
	export type EmitterEventScreenShake = {
		type: 'screenShake';
		intensity?: number;
		duration?: number;
	};
</script>

<script lang="ts">
	import type { Snippet } from 'svelte';
	import { Container } from 'pixi-svelte';

	import { getContext } from '../game/context';

	const context = getContext();

	type Props = { children: Snippet };
	const props: Props = $props();

	let offsetX = $state(0);
	let offsetY = $state(0);

	context.eventEmitter.subscribeOnMount({
		screenShake: ({ intensity = 4, duration = 200 }) => {
			const start = performance.now();
			const tick = (now: number) => {
				const t = Math.min((now - start) / duration, 1);
				if (t >= 1) {
					offsetX = 0;
					offsetY = 0;
					return;
				}
				// Linear decay multiplier so the shake feels tactile then settles.
				const decay = 1 - t;
				offsetX = (Math.random() - 0.5) * 2 * intensity * decay;
				offsetY = (Math.random() - 0.5) * 2 * intensity * decay;
				requestAnimationFrame(tick);
			};
			requestAnimationFrame(tick);
		},
	});
</script>

<Container x={offsetX} y={offsetY}>
	{@render props.children()}
</Container>
