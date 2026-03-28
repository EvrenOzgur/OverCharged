<script lang="ts">
	import { Rectangle, SpineProvider, SpineTrack } from 'pixi-svelte';
	import { SECOND } from 'constants-shared/time';

	import { getContext } from '../game/context';

	const context = getContext();
	const backgroundProps = $derived(
		context.stateLayoutDerived.normalBackgroundLayout({ scale: 0.5 }),
	);
	const showBaseBackground = $derived(context.stateGame.gameType === 'basegame');
</script>

<Rectangle {...context.stateLayoutDerived.canvasSizes()} backgroundColor={0x000000} zIndex={-3} />

<SpineProvider asset="bgCharacters" {...backgroundProps} zIndex={-2}>
	<SpineTrack trackIndex={0} animationName={'bg_idle'} loop />
	{#if showBaseBackground}
		<SpineTrack trackIndex={1} animationName={'normal_idle'} loop />
	{:else}
		<SpineTrack trackIndex={1} animationName={'hulk_idle'} loop />
	{/if}
</SpineProvider>
