<script lang="ts">
	import { SpineProvider, SpineTrack, Container, Sprite } from 'pixi-svelte';
	import { FadeContainer, LoadingProgress } from 'components-pixi';
	import { MainContainer } from 'components-layout';
	import { stateUrlDerived } from 'state-shared';

	import { getContext } from '../game/context';
	import TransitionAnimation from './TransitionAnimation.svelte';
	import PressToContinue from './PressToContinue.svelte';

	type Props = {
		onloaded: () => void;
	};

	const props: Props = $props();
	const context = getContext();

	let loadingType = $state<'start' | 'transition'>('start');

	// In replay mode, skip the "Press Anywhere to Continue" gate — the user
	// has already interacted by clicking "Start Replay" in the overlay; making
	// them click again would be an extra friction step. Once assets finish
	// loading, auto-advance to the transition state so the round can play out.
	// IMPORTANT: must be `$derived` (not a const) — Stake's iframe shell may
	// finish parsing URL params after the component mounts, so a one-shot
	// read at setup time can return false even though `?replay=true` is set.
	const isReplay = $derived(stateUrlDerived.isReplayMode());
	let bypassed = $state(false);
	$effect(() => {
		console.log('[REPLAY-DEBUG] LoadingScreen state', {
			isReplay,
			loaded: context.stateApp.loaded,
			loadingType,
			bypassed,
		});
		if (isReplay && context.stateApp.loaded && !bypassed) {
			// Replay mode: skip BOTH the "Press Anywhere" gate AND the
			// TransitionAnimation spine. The transition's `complete` event
			// can fail to fire under Stake's iframe shell (asset timing /
			// Spine eventListener edge cases), leaving showLoadingScreen
			// stuck at `true` so the Pixi Board never renders even though
			// the book events processed correctly behind the scenes.
			// Calling `onloaded()` directly hands control to the game
			// canvas immediately — the user already pressed "Start Replay"
			// in the overlay, so an extra fade is unnecessary.
			console.log('[REPLAY-DEBUG] LoadingScreen → direct onloaded() (replay bypass)');
			bypassed = true;
			props.onloaded();
		}
	});
</script>

<!-- logo and loading progress -->
<FadeContainer show={loadingType === 'start'}>
	<MainContainer>
		<Container
			x={context.stateLayoutDerived.mainLayout().width * 0.5}
			y={context.stateLayoutDerived.mainLayout().height * 0.5}
		>
			<SpineProvider asset="loader" width={300}>
				<SpineTrack trackIndex={0} animationName={'title_screen'} loop timeScale={3} />
			</SpineProvider>
			{#if !context.stateApp.loaded}
				<LoadingProgress y={250} width={1967 * 0.2} height={346 * 0.2}>
					{#snippet background(sizes)}
						<Sprite key="progressBarBackground.png" {...sizes} />
					{/snippet}
					{#snippet progress(sizes)}
						<Sprite key="progressBar.png" {...sizes} />
					{/snippet}
					{#snippet frame(sizes)}
						<Sprite key="progressBarFrame.png" {...sizes} />
					{/snippet}
				</LoadingProgress>
			{/if}
		</Container>
	</MainContainer>
</FadeContainer>

<!-- press to continue -->
<FadeContainer show={loadingType === 'start' && context.stateApp.loaded}>
	<PressToContinue onpress={() => (loadingType = 'transition')} />
</FadeContainer>

<!-- transition between the loading screen and the game -->
<FadeContainer show={loadingType === 'transition'}>
	<TransitionAnimation oncomplete={props.onloaded} />
</FadeContainer>
