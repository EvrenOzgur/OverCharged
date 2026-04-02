<script lang="ts">
	import type { Snippet } from 'svelte';

	import { SpineProvider, SpineTrack, SpineSlot } from 'pixi-svelte';

	import { getContext } from '../game/context';

	type AnimationState = 'intro' | 'idle' | 'outro';
	type AnimationName = string;

	type Props = {
		spineKey?: string;
		animationMap: {
			intro: AnimationName;
			idle: AnimationName;
			outro: AnimationName;
		};
		children: Snippet;
	};

	const { spineKey = 'bigwin', animationMap, children }: Props = $props();
	const context = getContext();

	let oncomplete = $state(() => {});
	let animationState = $state<AnimationState>('intro');
</script>

<SpineProvider width={context.stateGameDerived.boardLayout().width} key={spineKey}>
	<SpineTrack
		trackIndex={0}
		animationName={animationMap[animationState]}
		loop={animationState === 'idle'}
		listener={{
			complete: () => {
				if (animationState === 'intro') animationState = 'idle';
				if (animationState === 'outro') oncomplete();
			},
		}}
	/>
	<SpineSlot slotName="slot_win_count">
		{@render children()}
	</SpineSlot>
</SpineProvider>
