<script lang="ts">
	import type { Snippet } from 'svelte';

	import { Container } from 'pixi-svelte';

	import { getContext } from '../game/context';

	type Props = {
		children: Snippet;
		// Optional: toggle Pixi-level visibility without unmounting children.
		// Callers that used to conditionally mount this component (`{#if show}`)
		// should switch to always-mounting + passing `visible` instead — an
		// unmount/remount destroys and recreates every descendant Spine
		// instance, which briefly flashes each one back to its setup pose
		// (visible as a whole-board "flicker" the instant it remounts).
		// Toggling `visible` just skips rendering while keeping state intact.
		visible?: boolean;
	};

	const props: Props = $props();

	const context = getContext();
</script>

<Container
	x={context.stateGameDerived.boardLayout().x}
	y={context.stateGameDerived.boardLayout().y}
	pivot={context.stateGameDerived.boardLayout().pivot}
	scale={context.stateGameDerived.boardLayout().scale}
	sortableChildren={true}
	visible={props.visible ?? true}
>
	{@render props.children()}
</Container>
