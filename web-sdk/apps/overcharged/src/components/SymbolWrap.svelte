<script lang="ts">
	import type { Snippet } from 'svelte';

	import { Container } from 'pixi-svelte';

	import { SYMBOL_SIZE, BOARD_DIMENSIONS } from '../game/constants';

	type Props = {
		x: number;
		y: number;
		animating: boolean;
		children: Snippet;
	};

	const props: Props = $props();
	// Single-tree render. Z-order during animation is handled by the parent
	// BoardContainer's `sortableChildren=true` + zIndex below. When `animating`
	// flips, only zIndex changes (no mount/unmount), so the previous flicker
	// — caused by the symbol switching between two parallel trees — is gone.
	// Allow one row of margin on top + bottom so symbols entering/leaving
	// the visible area aren't mounted/unmounted as their tween crosses the
	// boundary. The BoardMask Rectangle clips anything outside the visible
	// board so the margin is only a render-list optimisation, not visible.
	const top = -SYMBOL_SIZE;
	const bottom = SYMBOL_SIZE * (BOARD_DIMENSIONS.y + 1);
	const inFrame = $derived(props.y >= top && props.y <= bottom);
</script>

{#if inFrame}
	<Container x={props.x} y={props.y} zIndex={props.animating ? 1 : 0}>
		{@render props.children()}
	</Container>
{/if}
