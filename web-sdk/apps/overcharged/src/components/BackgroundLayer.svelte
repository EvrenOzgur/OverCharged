<script lang="ts">
	import { onDestroy } from 'svelte';
	import { Rectangle, Sprite, SpineProvider, SpineTrack } from 'pixi-svelte';

	import { getContext } from '../game/context';
	import { hexToPixi, type BgLayer } from '../game/uiLayoutConfig.svelte';

	type Props = {
		layer: BgLayer;
		zIndex: number;
	};
	const { layer, zIndex }: Props = $props();
	const context = getContext();

	const canvasSizes = $derived(context.stateLayoutDerived.canvasSizes());

	function responsiveProps(l: BgLayer) {
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

	function gameTypeOverride(): TrackState | null {
		const gt = context.stateGame.gameType as 'basegame' | 'freegame';
		const anim = layer.gameTypeAnimations?.[gt];
		if (!anim) return null;
		return { animationName: anim, loop: true };
	}

	function resolveBaseline(trackIndex: number): TrackState {
		// gameType override takes precedence on track 0
		if (trackIndex === 0) {
			const gt = gameTypeOverride();
			if (gt) return gt;
		}
		const def = defaultsByTrack().get(trackIndex);
		if (def) return def;
		// Final fallback: layer.idleAnimation on track 0
		if (trackIndex === 0 && layer.idleAnimation) {
			return { animationName: layer.idleAnimation, loop: true };
		}
		return { animationName: '', loop: false };
	}

	// Per-track current animation state. Initialize from baselines.
	let trackStates = $state<Map<number, TrackState>>(new Map());

	function syncBaselines() {
		const next = new Map<number, TrackState>();
		const seenTracks = new Set<number>();
		for (const a of layer.spineAnims ?? []) seenTracks.add(a.trackIndex);
		// Always have at least track 0
		seenTracks.add(0);
		for (const ti of seenTracks) {
			next.set(ti, resolveBaseline(ti));
		}
		trackStates = next;
	}
	syncBaselines();

	// React to gameType changes — re-resolve baselines
	$effect(() => {
		// Read gameType to subscribe to it
		void context.stateGame.gameType;
		syncBaselines();
	});

	// ── Trigger event subscriptions ─────────────────────────────────────────
	// For each registered trigger key, subscribe to the matching base event
	// and override the track when the predicate matches.
	const subs: Array<() => void> = [];

	function applyTrigger(trackIndex: number, animationName: string, loop: boolean) {
		const next = new Map(trackStates);
		next.set(trackIndex, { animationName, loop });
		trackStates = next;
	}

	function returnTrackToBaseline(trackIndex: number) {
		const next = new Map(trackStates);
		next.set(trackIndex, resolveBaseline(trackIndex));
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
					applyTrigger(trackIndex, cfg.animation, cfg.loop ?? false);
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
		{...responsiveProps(layer)}
		scale={{ x: layer.scaleX, y: layer.scaleY }}
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
	</SpineProvider>
{/if}
