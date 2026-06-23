<script lang="ts">
	import { SpineProvider, SpineTrack, SpineBone, Container, Rectangle } from 'pixi-svelte';
	import { FadeContainer } from 'components-pixi';
	import { MainContainer, OnPressFullScreen } from 'components-layout';
	import { OnHotkey } from 'components-shared';
	import { stateUrlDerived } from 'state-shared';

	import { getContext } from '../game/context';
	import TransitionAnimation from './TransitionAnimation.svelte';

	type Props = {
		onloaded: () => void;
	};

	const props: Props = $props();
	const context = getContext();

	// Loading flow phases:
	//   'bar'        → `loaderBar` spine: a fill bar scrubbed to real load progress.
	//   'start'      → `loader` spine: the FirstScreen (logo + animated panels +
	//                  baked "press anywhere to continue").
	//   'transition' → TransitionAnimation → game.
	// Starts on 'bar'; auto-advances to 'start' once assets finish loading.
	let loadingType = $state<'bar' | 'start' | 'transition'>('bar');

	// Both loading spines share the same 1200×819 layout + landscape/portrait
	// skins (no `default` skin → a skin MUST be set or nothing renders). The
	// `loader` (FirstScreen) has a looping idle animation per orientation; the
	// `loaderBar` has a `loadingBar` fill animation we scrub to load progress.
	const LOADER_SIZE = { width: 1200, height: 819 }; // skeleton bounds
	const LOADING_BAR_DURATION = 3.333333; // `loadingBar` anim length (seconds)

	const loaderSkin = $derived(
		context.stateLayoutDerived.layoutType() === 'portrait' ? 'portrait' : 'landscape',
	);
	// Overall size of the loading composition relative to a FIT (contain) of the
	// main layout. In portrait the spine is fit-by-WIDTH, so its full design
	// (logo + panels + text) only fills a short vertical band in the middle and
	// reads as tiny. We scale the WHOLE composition up in portrait so everything
	// grows together — proportionally, so nothing overlaps — and spreads to use
	// the tall screen. Landscape stays at a plain fit (1). The background is
	// covered separately (see bgCover), so growing this doesn't leave gaps.
	const LOADER_SCALE = $derived(loaderSkin === 'portrait' ? 2 : 1);
	// Orientation-specific looping idle animation. Plays continuously while the
	// loading screen is up (decorative frames/circles).
	const firstScreenAnim = $derived(
		loaderSkin === 'portrait' ? 'portraitFirstScreen' : 'landscapeFirstScreen',
	);
	// Uniform scale: FIT (contain) the spine inside the main layout, then apply
	// LOADER_SCALE. The background is covered separately (see bgCover).
	const spineScaleFactor = $derived(
		Math.min(
			context.stateLayoutDerived.mainLayout().width / LOADER_SIZE.width,
			context.stateLayoutDerived.mainLayout().height / LOADER_SIZE.height,
		),
	);
	const loaderWidth = $derived(LOADER_SIZE.width * spineScaleFactor * LOADER_SCALE);
	// Background COVER (both orientations). The loading spine is FIT (contain) to
	// the main layout, so at any aspect ratio the background would leave gaps on
	// the black base. We grow ONLY the background bone by scaling its target bone
	// (bone_bg ← target_*BG; the TC_*BG transform constraints copy the target's
	// scale onto bone_bg, scale-mix defaults to 1). The logo / frames / text keep
	// their fit size/position. At the fit scale the bg spans
	// `mainLayout.scale × spineScaleFactor × LOADER_SIZE × LOADER_SCALE` px;
	// bgCover scales it up to cover the canvas, centred on bone_bg (canvas centre).
	const bgCover = $derived.by(() => {
		const ml = context.stateLayoutDerived.mainLayout();
		const cs = context.stateLayoutDerived.canvasSizes();
		const bgW = ml.scale * spineScaleFactor * LOADER_SCALE * LOADER_SIZE.width;
		const bgH = ml.scale * spineScaleFactor * LOADER_SCALE * LOADER_SIZE.height;
		if (bgW <= 0 || bgH <= 0) return 1;
		return Math.max(1, cs.width / bgW, cs.height / bgH);
	});

	// Scrub the loading-bar fill to the real asset-load progress (0..100).
	// timeScale 0 + trackTime (below) freezes the anim and seeks it to this time.
	const loaderBarTime = $derived(
		Math.min(context.stateApp.loadingProgress / 100, 1) * LOADING_BAR_DURATION,
	);

	// The bar is scrubbed to load progress, so it's full exactly when assets
	// finish loading → switch straight to the FirstScreen at that moment (no
	// extra wait). (Replay mode bypasses this entirely via the effect below.)
	$effect(() => {
		if (loadingType === 'bar' && context.stateApp.loaded) {
			loadingType = 'start';
		}
	});

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

<!-- Opaque black backdrop, OUTSIDE any FadeContainer so it never fades. It
     renders the whole time the loading screen is mounted (start + transition),
     covering the game `Background` (always mounted behind) so the game area
     never flashes through — neither in the first frames before the loader
     spine loads, nor during the FadeContainer's fade-in. Once the loader art
     loads it sits on top of this; once the game mounts the loading screen
     unmounts and this disappears with it. -->
<Rectangle
	x={0}
	y={0}
	width={context.stateLayoutDerived.canvasSizes().width}
	height={context.stateLayoutDerived.canvasSizes().height}
	backgroundColor={0x000000}
/>

<!-- Phase 1 — loading bar: shown first, fills with real load progress. Same
     bg/logo layout as the FirstScreen so the swap is seamless; bg covered. -->
<FadeContainer show={loadingType === 'bar'}>
	<MainContainer>
		<Container
			x={context.stateLayoutDerived.mainLayout().width * 0.5}
			y={context.stateLayoutDerived.mainLayout().height * 0.5}
		>
			<SpineProvider asset="loaderBar" skin={loaderSkin} width={loaderWidth}>
				<!-- timeScale 0 + trackTime: freeze the bar and scrub it to the
				     real load progress so it fills as assets load. -->
				<SpineTrack
					trackIndex={0}
					animationName="loadingBar"
					loop={false}
					timeScale={0}
					trackTime={loaderBarTime}
				/>
				{#if loaderSkin === 'portrait'}
					<SpineBone boneName="target_portraitBG" scaleX={bgCover} scaleY={bgCover} />
				{:else}
					<SpineBone boneName="target_landscapeBG" scaleX={bgCover} scaleY={bgCover} />
				{/if}
			</SpineProvider>
		</Container>
	</MainContainer>
</FadeContainer>

<!-- Phase 2 — FirstScreen: background + logo + animated frames/circles +
     baked "press anywhere to continue" text (all in the spine) -->
<FadeContainer show={loadingType === 'start'}>
	<MainContainer>
		<Container
			x={context.stateLayoutDerived.mainLayout().width * 0.5}
			y={context.stateLayoutDerived.mainLayout().height * 0.5}
		>
			<SpineProvider asset="loader" skin={loaderSkin} width={loaderWidth}>
				<SpineTrack trackIndex={0} animationName={firstScreenAnim} loop />
				<!-- COVER the whole canvas with the background. We scale the
				     target_*BG bone (NOT bone_bg directly): the TC_*BG transform
				     constraints copy the target's scale onto bone_bg (scale-mix
				     defaults to 1), so a scale set on bone_bg itself is overwritten
				     by the constraint — the target bone is the real lever. -->
				{#if loaderSkin === 'portrait'}
					<SpineBone boneName="target_portraitBG" scaleX={bgCover} scaleY={bgCover} />
				{:else}
					<SpineBone boneName="target_landscapeBG" scaleX={bgCover} scaleY={bgCover} />
				{/if}
			</SpineProvider>
		</Container>
	</MainContainer>
</FadeContainer>

<!-- Press anywhere / Space to continue — interaction only (the visible text is
     baked into the loading spine's `ContinueText` slot). Gated on `loaded` so
     the player can't advance before assets are ready. -->
{#if loadingType === 'start' && context.stateApp.loaded}
	<OnHotkey hotkey="Space" onpress={() => (loadingType = 'transition')} />
	<OnPressFullScreen onpress={() => (loadingType = 'transition')} />
{/if}

<!-- transition between the loading screen and the game -->
<FadeContainer show={loadingType === 'transition'}>
	<TransitionAnimation oncomplete={props.onloaded} />
</FadeContainer>
