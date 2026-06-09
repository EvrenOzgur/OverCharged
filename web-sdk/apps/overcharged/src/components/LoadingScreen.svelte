<script lang="ts">
	import { SpineProvider, SpineTrack, SpineBone, Container } from 'pixi-svelte';
	import { FadeContainer } from 'components-pixi';
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

	// Full-screen loading spine (OverChargedAssets/loadingScreen). Self-contained:
	// background + logo + loading bar baked into one skeleton, with landscape /
	// portrait skins (no `default` skin → a skin MUST be set or nothing renders).
	const LOADER_SIZE = { width: 1200, height: 819 }; // skeleton bounds
	const LOADING_BAR_DURATION = 3.333333; // `loadingBar` anim length (seconds)
	// Overall size of the loading screen relative to a FIT (contain) of the main
	// layout. 1 = whole design (background) just fits; <1 shrinks everything.
	const LOADER_SCALE = 1;
	// Shrink ONLY the logo + loading bar (not the background). The skin's
	// transform constraints drive bone_logo / bone_loadingBar from these target
	// bones (mixScale = 1), so scaling the targets scales the logo/bar while the
	// background (bone_bg → target_*BG) is untouched. Multipliers below are the
	// targets' setup scales × this factor.
	const LOGO_BAR_SCALE = 0.5;
	const TARGET_SETUP = {
		landscapeLogo: 1,
		landscapeLoadingBar: 0.725,
		portraitLogo: 0.618,
		portraitLoadingBar: 0.453,
	};

	const loaderSkin = $derived(
		context.stateLayoutDerived.layoutType() === 'portrait' ? 'portrait' : 'landscape',
	);
	// Uniform scale: FIT the spine inside the main layout (whole design visible,
	// no overflow), then apply LOADER_SCALE.
	const loaderWidth = $derived(
		LOADER_SIZE.width *
			Math.min(
				context.stateLayoutDerived.mainLayout().width / LOADER_SIZE.width,
				context.stateLayoutDerived.mainLayout().height / LOADER_SIZE.height,
			) *
			LOADER_SCALE,
	);
	// Scrub the loading-bar fill to the real asset-load progress (0..100).
	const loaderBarTime = $derived(
		Math.min(context.stateApp.loadingProgress / 100, 1) * LOADING_BAR_DURATION,
	);

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
			bypassed = true;
			props.onloaded();
		}
	});
</script>

<!-- full-screen loading screen: background + logo + progress bar (all in spine) -->
<FadeContainer show={loadingType === 'start'}>
	<MainContainer>
		<Container
			x={context.stateLayoutDerived.mainLayout().width * 0.5}
			y={context.stateLayoutDerived.mainLayout().height * 0.5}
		>
			<SpineProvider asset="loader" skin={loaderSkin} width={loaderWidth}>
				<!-- timeScale 0 + trackTime: freeze the bar and scrub it to the
				     real load progress so it fills as assets load. -->
				<SpineTrack
					trackIndex={0}
					animationName="loadingBar"
					loop={false}
					timeScale={0}
					trackTime={loaderBarTime}
				/>
				<!-- Shrink only the logo + bar (background stays full-size). -->
				{#if loaderSkin === 'portrait'}
					<SpineBone
						boneName="target_portraitLogo"
						scaleX={TARGET_SETUP.portraitLogo * LOGO_BAR_SCALE}
						scaleY={TARGET_SETUP.portraitLogo * LOGO_BAR_SCALE}
					/>
					<SpineBone
						boneName="target_portraitLoadingBar"
						scaleX={TARGET_SETUP.portraitLoadingBar * LOGO_BAR_SCALE}
						scaleY={TARGET_SETUP.portraitLoadingBar * LOGO_BAR_SCALE}
					/>
				{:else}
					<SpineBone
						boneName="target_landscapeLogo"
						scaleX={TARGET_SETUP.landscapeLogo * LOGO_BAR_SCALE}
						scaleY={TARGET_SETUP.landscapeLogo * LOGO_BAR_SCALE}
					/>
					<SpineBone
						boneName="target_landscapeLoadingBar"
						scaleX={TARGET_SETUP.landscapeLoadingBar * LOGO_BAR_SCALE}
						scaleY={TARGET_SETUP.landscapeLoadingBar * LOGO_BAR_SCALE}
					/>
				{/if}
			</SpineProvider>
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
