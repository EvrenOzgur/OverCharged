<script lang="ts">
	import { onDestroy, onMount } from 'svelte';
	import { Rectangle, Sprite, SpineProvider, SpineTrack, SpineBone } from 'pixi-svelte';

	import { getContext } from '../game/context';
	import { hexToPixi, type BgLayer } from '../game/uiLayoutConfig.svelte';
	import { bgCover } from '../game/boardCalibration.svelte';
	import {
		PORTRAIT_WELL_SHRINK,
		PORTRAIT_WELL_SETUP_SCALE,
		PORTRAIT_WELL_LIFT,
		LANDSCAPE_WELL_LIFT,
	} from '../game/constants';
	import { uiStore } from '../shared/stores/uiStore.svelte';
	import SkillMeterDriver from './SkillMeterDriver.svelte';

	type Props = {
		layer: BgLayer;
		zIndex: number;
	};
	const { layer, zIndex }: Props = $props();
	const context = getContext();

	const canvasSizes = $derived(context.stateLayoutDerived.canvasSizes());

	// bgCharacters cover: SkillMeterDriver measures the BG scene and writes the
	// uniform scale that fills the canvas (bgCover.scale) for the current
	// resolution / orientation. The spine renders at its native size × this scale.
	const spineScale = $derived(
		layer.coverCanvas
			? { x: layer.scaleX * bgCover.scale, y: layer.scaleY * bgCover.scale }
			: { x: layer.scaleX, y: layer.scaleY },
	);

	// Orientation-driven skin: the bgCharacters skeleton ships 'landscape' /
	// 'portrait' skins (no 'default'), so a skin MUST be set or nothing renders.
	// Reactive to layoutType so rotating the viewport re-skins via
	// BaseSpineProvider's setSkinByName effect.
	const skin = $derived(
		layer.orientationSkin
			? context.stateLayoutDerived.layoutType() === 'portrait'
				? 'portrait'
				: 'landscape'
			: undefined,
	);

	// Lift the landscape board WELL only in laptop/desktop; popout (also
	// landscape) keeps the well at its setup position (y=0). The symbol board
	// follows this lift via boardCalibration, so the bg well art and the symbols
	// move together. 0 when the bone shouldn't be lifted — never left "stuck"
	// because the SpineBone below stays mounted across all landscape modes and
	// just re-applies y reactively.
	const landscapeWellLift = $derived(
		uiStore.currentResolution.value === 'desktop' ||
			uiStore.currentResolution.value === 'laptop'
			? LANDSCAPE_WELL_LIFT
			: 0,
	);

	function responsiveProps(l: BgLayer) {
		// Full-canvas cover: just centre on the canvas (no width/height) — the
		// spine renders at its native size × spineScale (= bgCover.scale), which
		// SkillMeterDriver keeps sized to fill the canvas at any resolution.
		if (l.coverCanvas) {
			return {
				x: canvasSizes.width / 2 + bgCover.offsetX,
				y: canvasSizes.height / 2 + bgCover.offsetY,
			};
		}
		if (l.useResponsiveLayout) {
			return context.stateLayoutDerived.normalBackgroundLayout({
				scale: l.responsiveScale,
			});
		}
		return { x: l.x, y: l.y };
	}

	// ── Trigger / gameType animation state for spine layers ────────────────
	// Each track has an active animationName + loop. Triggers temporarily
	// override the track's animation, then `complete` listener returns to
	// the resolved baseline (gameType override > spineAnims default).
	type TrackState = { animationName: string; loop: boolean };

	function defaultsByTrack(): Map<number, TrackState> {
		const m = new Map<number, TrackState>();
		for (const a of layer.spineAnims ?? []) {
			m.set(a.trackIndex, { animationName: a.animationName, loop: a.loop });
		}
		return m;
	}

	// "Sustained" gameType override set by triggers with `sustainAsGameType`.
	// Cleared automatically when real gameType returns to 'basegame'.
	let sustainedGameType = $state<'basegame' | 'freegame' | null>(null);

	/** Effective gameType — sustained override takes precedence over real state. */
	function effectiveGameType(): 'basegame' | 'freegame' {
		return sustainedGameType ?? (context.stateGame.gameType as 'basegame' | 'freegame');
	}

	/** Per-track gameType-aware idle override. Falls back to track 0 logic
	 *  (which uses layer.gameTypeAnimations) for backwards compatibility. */
	function gameTypeOverrideForTrack(trackIndex: number): TrackState | null {
		const gt = effectiveGameType();
		if (trackIndex === 0) {
			const anim = layer.gameTypeAnimations?.[gt];
			if (anim) return { animationName: anim, loop: true };
		}
		const byTrack = layer.gameTypeAnimationsByTrack?.[String(trackIndex)];
		const anim = byTrack?.[gt];
		if (anim) return { animationName: anim, loop: true };
		return null;
	}

	function resolveBaseline(trackIndex: number): TrackState {
		const gtOverride = gameTypeOverrideForTrack(trackIndex);
		if (gtOverride) return gtOverride;
		const def = defaultsByTrack().get(trackIndex);
		if (def) return def;
		if (trackIndex === 0 && layer.idleAnimation) {
			return { animationName: layer.idleAnimation, loop: true };
		}
		return { animationName: '', loop: false };
	}

	// Per-track current animation state. Initialize from baselines.
	let trackStates = $state<Map<number, TrackState>>(new Map());

	// Tracks currently playing a non-looping trigger animation, keyed by track
	// index → the trigger's TrackState. syncBaselines() reads from THIS map
	// (NOT from trackStates) to preserve in-flight triggers across gameType
	// edges. Important: this is a plain JS Map (not $state) so reads here are
	// non-reactive — otherwise syncBaselines would form a feedback loop with
	// its own `trackStates = next` write and Svelte 5 trips its infinite-effect
	// guard.
	const activeTriggerTracks = new Map<number, TrackState>();

	function syncBaselines() {
		const next = new Map<number, TrackState>();
		const seenTracks = new Set<number>();
		for (const a of layer.spineAnims ?? []) seenTracks.add(a.trackIndex);
		// Always have at least track 0
		seenTracks.add(0);
		for (const ti of seenTracks) {
			const triggerState = activeTriggerTracks.get(ti);
			if (triggerState) {
				// Active trigger on this track — preserve it. onTrackComplete
				// will swap to the (now gameType-aware) baseline when the
				// transition animation finishes.
				next.set(ti, triggerState);
				continue;
			}
			next.set(ti, resolveBaseline(ti));
		}
		trackStates = next;
	}
	syncBaselines();

	// React to gameType changes — re-resolve baselines (skipping tracks with
	// an in-flight trigger; see activeTriggerTracks).
	$effect(() => {
		void context.stateGame.gameType;
		syncBaselines();
	});

	// ── Trigger event subscriptions ─────────────────────────────────────────
	// For each registered trigger key, subscribe to the matching base event
	// and override the track when the predicate matches.
	const subs: Array<() => void> = [];

	// [BG-ANIM-DEBUG] always-on logging for the character layer so transition
	// timing issues (normal_to_hulk skipping, retrigger re-firing, etc.) are
	// diagnosable in a Stake replay without a code change. Cheap — fires only
	// on track state mutations, not every frame.
	const dbgLayer = layer.id;
	const dbg = (msg: string, extra?: Record<string, unknown>) => {
		try {
			console.log(`[BG-ANIM-DEBUG ${dbgLayer}] ${msg}`, extra ?? '');
		} catch {
			// noop
		}
	};

	function applyTrigger(trackIndex: number, animationName: string, loop: boolean) {
		const prev = trackStates.get(trackIndex);
		dbg(`applyTrigger track=${trackIndex} anim=${animationName} loop=${loop}`, {
			prevAnim: prev?.animationName,
			effectiveGameType: effectiveGameType(),
			sustainedGameType,
		});
		const nextState: TrackState = { animationName, loop };
		// Mark this track as having an in-flight non-looping trigger so a
		// gameType edge during the animation does not stomp it via
		// syncBaselines(). Looping triggers (loop=true) don't need this guard
		// because they don't have a "complete" boundary to defend.
		if (!loop) activeTriggerTracks.set(trackIndex, nextState);
		const next = new Map(trackStates);
		next.set(trackIndex, nextState);
		trackStates = next;
	}

	function returnTrackToBaseline(trackIndex: number) {
		const baseline = resolveBaseline(trackIndex);
		dbg(`returnTrackToBaseline track=${trackIndex} → ${baseline.animationName}`, {
			loop: baseline.loop,
			effectiveGameType: effectiveGameType(),
		});
		activeTriggerTracks.delete(trackIndex);
		const next = new Map(trackStates);
		next.set(trackIndex, baseline);
		trackStates = next;
	}

	function triggerKeyMatches(
		triggerKey: string,
		event: { type: string; skillType?: string },
	): boolean {
		const [type, sub] = triggerKey.split('.');
		if (type !== event.type) return false;
		if (!sub) return true;
		// SubType currently only relevant for skillActivated.skillType
		if (event.type === 'skillActivated') return event.skillType === sub;
		return false;
	}

	if (layer.type === 'spine' && layer.triggers && context.eventEmitter) {
		// Group triggers by base eventType so we add one subscription per type.
		const byEventType = new Map<string, Array<{ key: string; cfg: NonNullable<BgLayer['triggers']>[string] }>>();
		for (const [key, cfg] of Object.entries(layer.triggers)) {
			const baseType = key.split('.')[0];
			if (!byEventType.has(baseType)) byEventType.set(baseType, []);
			byEventType.get(baseType)!.push({ key, cfg });
		}

		const subscription: Record<string, (e: any) => void> = {};
		for (const [baseType, entries] of byEventType) {
			subscription[baseType] = (event: any) => {
				for (const { key, cfg } of entries) {
					if (!triggerKeyMatches(key, { type: baseType, ...event })) continue;
					const trackIndex = cfg.trackIndex ?? 0;
					// Skip the trigger if it asserts a gameType we're already
					// effectively in. Treats `sustainAsGameType` as a transition
					// marker: "this trigger transitions to gameType X" — so if
					// effective gameType is already X, the transition is a
					// no-op. Prevents freeSpinIntroShow's normal_to_hulk from
					// re-firing during a retrigger (retrigger handler emits
					// the same intro event while we're already in hulk mode).
					if (
						cfg.sustainAsGameType &&
						cfg.sustainAsGameType === effectiveGameType()
					) {
						return;
					}
					// If this trigger asserts an effective gameType, set it
					// BEFORE picking the animation variant — so the variant
					// check below sees the new sustained value.
					if (cfg.sustainAsGameType) {
						sustainedGameType = cfg.sustainAsGameType;
					}
					// Pick freegame variant if effective gameType is freegame.
					// Lets a single trigger config map a skill to its hulk
					// animation during the bonus round.
					const gt = effectiveGameType();
					const anim =
						gt === 'freegame' && cfg.animationFreegame
							? cfg.animationFreegame
							: cfg.animation;
					// Empty animation = "no character animation for this gameType".
					// Used so a skill trigger can drive the hulk body in freegame
					// (animationFreegame) while leaving the basegame character's
					// idle untouched — base-game *_mana_work only keys the mana
					// fill bone (already driven by SkillMeterDriver) and keys NO
					// body slots, so playing it on track 1 would blank the
					// normal-skin body (every N-body slot is hidden in setup pose).
					if (!anim) return;
					applyTrigger(trackIndex, anim, cfg.loop ?? false);
					// If looping or non-returning, never auto-revert.
					// Otherwise the SpineTrack `complete` listener will restore baseline.
					return;
				}
			};
		}
		// subscribeOnMount returns void; rely on its lifecycle. We mirror its
		// teardown by collecting cleanup hooks.
		context.eventEmitter.subscribeOnMount?.(subscription as any);
	}

	// ── gameType edge detection ───────────────────────────────────────────────
	// Two responsibilities:
	//  1. Fire one-shot `gameTypeTransitions` animations on real gameType edges.
	//  2. Clear `sustainedGameType` when real gameType returns to 'basegame'.
	//     A sustained=freegame override stays in effect from a trigger like
	//     `freeSpinIntroShow` (which fires before the real gameType flip) all
	//     the way through the bonus round, until the round closes and the
	//     real gameType reverts — at which point we drop the override so any
	//     subsequent basegame skill animations resolve correctly.
	let lastGameType: string | null = null;
	$effect(() => {
		const gt = context.stateGame.gameType as 'basegame' | 'freegame';
		if (lastGameType === null) {
			lastGameType = gt; // initial mount — no transition, just record
			return;
		}
		if (gt === lastGameType) return;
		const prev = lastGameType;
		lastGameType = gt;

		// Clear sustained override on return to basegame.
		if (gt === 'basegame' && sustainedGameType) {
			sustainedGameType = null;
		}

		const transitions = layer.gameTypeTransitions;
		const transition =
			gt === 'freegame' ? transitions?.toFreegame : transitions?.toBasegame;
		if (!transition) return;
		// Skip the toFreegame transition if a trigger already played it via
		// sustainedGameType — otherwise normal_to_hulk would fire twice
		// (once via the freeSpinIntroShow trigger, once via this edge).
		if (gt === 'freegame' && prev === 'basegame' && sustainedGameType === 'freegame') {
			return;
		}
		applyTrigger(
			transition.trackIndex ?? 0,
			transition.animation,
			transition.loop ?? false,
		);
	});

	// ── Bootstrap triggers (run once on mount) ────────────────────────────────
	// Used to neutralise spine setup-pose visibility quirks. For the character
	// layer, setup pose shows BOTH normal-skin and hulk-skin slots; playing
	// hulk_to_normal once hides the hulk slots before normal_idle starts.
	onMount(() => {
		for (const t of layer.bootstrapTriggers ?? []) {
			applyTrigger(t.trackIndex ?? 0, t.animation, t.loop ?? false);
		}
	});

	function onTrackComplete(trackIndex: number) {
		const cur = trackStates.get(trackIndex);
		// If the track is currently playing a non-looped trigger, restore baseline.
		// We detect "trigger active" by comparing to baseline.
		const baseline = resolveBaseline(trackIndex);
		if (!cur) return;
		if (cur.animationName !== baseline.animationName || cur.loop !== baseline.loop) {
			// Was a trigger animation; revert to baseline.
			returnTrackToBaseline(trackIndex);
		}
	}

	onDestroy(() => {
		for (const off of subs) off();
	});
</script>

{#if !layer.visible}
	<!-- hidden layer: render nothing -->
{:else if layer.type === 'color'}
	<Rectangle
		width={canvasSizes.width}
		height={canvasSizes.height}
		backgroundColor={hexToPixi(layer.color)}
		alpha={layer.alpha}
		{zIndex}
	/>
{:else if layer.type === 'sprite' && layer.spriteKey}
	<Sprite
		key={layer.spriteKey}
		{...responsiveProps(layer)}
		scale={{ x: layer.scaleX, y: layer.scaleY }}
		alpha={layer.alpha}
		{zIndex}
	/>
{:else if layer.type === 'spine' && layer.spineKey}
	<SpineProvider
		asset={layer.spineKey}
		{skin}
		{...responsiveProps(layer)}
		scale={spineScale}
		alpha={layer.alpha}
		{zIndex}
	>
		{#each Array.from(trackStates.entries()) as [trackIndex, state] (trackIndex)}
			{#if state.animationName}
				<SpineTrack
					{trackIndex}
					animationName={state.animationName}
					loop={state.loop}
					listener={{ complete: () => onTrackComplete(trackIndex) }}
				/>
			{/if}
		{/each}
		<!-- Drives this spine's embedded mana fill bones from skillMeters.
		     Gracefully no-ops on layers whose skeleton doesn't define them. -->
		<SkillMeterDriver />
		{#if layer.coverCanvas && context.stateLayoutDerived.layoutType() === 'portrait'}
			<!-- Shrink the board WELL in portrait (the TC_board target the well is
			     constrained to) so the grid + the symbol board that follows it don't
			     fill the screen, leaving room for the bottom buttons. -->
			<SpineBone
				boneName="target_portrait_board"
				scaleX={PORTRAIT_WELL_SETUP_SCALE * PORTRAIT_WELL_SHRINK}
				scaleY={PORTRAIT_WELL_SETUP_SCALE * PORTRAIT_WELL_SHRINK}
				y={-PORTRAIT_WELL_LIFT}
			/>
		{:else if layer.coverCanvas}
			<!-- Landscape: lift the board WELL in laptop/desktop (y = lift) and keep
			     it at setup (y = 0) for popout. Stays mounted across all landscape
			     modes so y is always explicitly controlled (the bone has no cleanup,
			     so we must not leave it stuck at a lifted value). The symbol board
			     follows via boardCalibration. -->
			<SpineBone boneName="target_landscape_board" y={-landscapeWellLift} />
		{/if}
	</SpineProvider>
{/if}
