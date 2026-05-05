<script lang="ts">
	import type { Snippet } from 'svelte';

	import { Container } from 'pixi-svelte';
	import { getContextBoard } from 'components-shared';

	import { SYMBOL_SIZE, BOARD_DIMENSIONS } from '../game/constants';

	type Props = {
		x: number;
		y: number;
		animating: boolean;
		children: Snippet;
	};

	const props: Props = $props();
	const boardContext = getContextBoard();
	const show = $derived(
		(boardContext.animate && props.animating) || (!boardContext.animate && !props.animating),
	);
	// Allow one row of margin on top + bottom so symbols entering/leaving
	// the visible area aren't mounted/unmounted as their tween crosses the
	// boundary — that mount/unmount caused a per-symbol flicker. The
	// BoardMask Rectangle clips anything outside the visible board so the
	// margin is only a render-list optimisation, not visible.
	const top = -SYMBOL_SIZE;
	const bottom = SYMBOL_SIZE * (BOARD_DIMENSIONS.y + 1);
	const inFrame = $derived(props.y >= top && props.y <= bottom);
</script>

{#if show && inFrame}
	<Container x={props.x} y={props.y}>
		{@render props.children()}
	</Container>
{/if}
