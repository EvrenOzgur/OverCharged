<script lang="ts" module>
	import type { MultiplierUpdateSource } from '../game/skillAssets';

	export type EmitterEventGlobalMultiplier =
		| { type: 'globalMultiplierShow' }
		| { type: 'globalMultiplierHide' }
		| {
				type: 'globalMultiplierUpdate';
				multiplier: number;
				// Optional origin tag so the UI can render skill-triggered
				// multiplier changes differently from M-symbol activations.
				// Unset = default symbol path.
				source?: MultiplierUpdateSource;
		  };
</script>

<script lang="ts">
	import { Tween } from 'svelte/motion';

	import {
		BitmapText,
		Container,
		Sprite,
		SpineEventEmitterProvider,
		SpineProvider,
		SpineSlot,
		SpineTrack,
	} from 'pixi-svelte';
	import { FadeContainer } from 'components-pixi';
	import { stateBetDerived } from 'state-shared';
	import { waitForResolve, waitForTimeout } from 'utils-shared/wait';

	import BoardContainer from './BoardContainer.svelte';
	import HideSpineSlot from './HideSpineSlot.svelte';
	import { getContext } from '../game/context';
	import { getBoardConfig, editorState } from '../game/uiLayoutConfig.svelte';
	import { SYMBOL_SIZE } from '../game/constants';
	import { SKILL_L3_ASSETS } from '../game/skillAssets';

	type AnimationName = 'static' | 'win' | 'reset' | 'increment';

	const PANEL_WIDTH = SYMBOL_SIZE * 0.641;
	const context = getContext();
	// Editable backing-plate offset/size (UI layout editor → Board Config).
	const boardCfg = $derived(getBoardConfig());
	const scale = $derived(context.stateLayoutDerived.isStacked() ? 1.28 : 1);
	const desktopPosition = $derived({
		x: context.stateGameDerived.boardLayout().width - PANEL_WIDTH * 0.5,
		y: -SYMBOL_SIZE * 0.47,
	});
	const portraitPosition = $derived({
		x: context.stateGameDerived.boardLayout().width - PANEL_WIDTH * 0.5,
		y: -SYMBOL_SIZE * 0.55,
	});
	const position = $derived(
		context.stateLayoutDerived.isStacked() ? portraitPosition : desktopPosition,
	);

	let show = $state(false);
	let animationName = $state<AnimationName>('static');
	let multiplier = $derived(context.stateGame.globalMultiplier);
	let previousMultiplierValue = $state(1);
	let previousMultiplier = new Tween(1);
	let oncomplete = $state(() => {});

	context.eventEmitter.subscribeOnMount({
		globalMultiplierShow: () => (show = true),
		globalMultiplierHide: () => {
			show = false;
			// Reset internal animation state so the panel doesn't flash the
			// previous spin's multiplier when re-shown. Without this the next
			// `globalMultiplierShow` would render `previousMultiplier` (a Tween
			// stuck at the prior value) before the reset animation kicks in,
			// making the player think a stale 2×/3× multiplier is still active.
			previousMultiplierValue = 1;
			previousMultiplier.set(1, { duration: 0 });
			animationName = 'static';
		},
		globalMultiplierUpdate: async (emitterEvent) => {
			if (emitterEvent.multiplier === 1 && previousMultiplierValue !== 1) {
				animationName = 'reset';
				await waitForTimeout(300);
				context.eventEmitter.broadcast({ type: 'soundOnce', name: 'sfx_multiplier_reset' });
				previousMultiplier.set(1);
				previousMultiplierValue = 1;
			}

			if (emitterEvent.multiplier > previousMultiplierValue) {
				if (emitterEvent.source === 'skill') {
					// L3 skill path — reuses the default assets today but is
					// a dedicated branch so `skillAssets.ts` can retarget it
					// without affecting the M-symbol activation path.
					animationName = SKILL_L3_ASSETS.multiplierAnimation;
				} else {
					context.eventEmitter.broadcast({ type: 'soundOnce', name: 'sfx_multiplier_update' });
					animationName = 'increment';
				}
			}

			if (animationName !== 'static') {
				// Safety timeout: 3000ms max wait for animation completion
				await Promise.race([
					waitForResolve((resolve) => (oncomplete = resolve)),
					waitForTimeout(3000)
				]);
				animationName = 'static';
				previousMultiplierValue = emitterEvent.multiplier;
				previousMultiplier.set(previousMultiplierValue, { duration: 0 });
			}
		},
		skipAnimation: () => {
			// Resolve the pending spine-complete promise so the multiplier
			// jumps to its final value without waiting out the animation.
			if (animationName !== 'static') {
				oncomplete();
			}
		},
	});

	$effect(() => {
		// Always show in the UI layout editor so the backing-plate position/size
		// can be tuned live; otherwise only during free spins.
		if (context.stateGame.gameType === 'freegame' || editorState.enabled) {
			show = true;
		}
	});
</script>

<FadeContainer {show}>
	<BoardContainer>
		<Container
			x={position.x + boardCfg.multiplierBgX}
			y={position.y + boardCfg.multiplierBgY}
			{scale}
		>
			<SpineProvider asset="globalMultiplier" width={PANEL_WIDTH}>
				<SpineTrack
					trackIndex={0}
					{animationName}
					timeScale={stateBetDerived.timeScale()}
					listener={{
						complete: () => {
							oncomplete();
						},
					}}
				/>
				<!-- Drop the legacy wooden frame art entirely (both layers). -->
				<HideSpineSlot slotNames={['Frame_Multiplier', 'Frame_Multiplier2']} />
				<!-- Custom backing plate injected into `Frame_Multiplier` at the
				     original frame's 725×450 setup size; addSlotObject renders it
				     as the slot's object (independent of the now-null attachment),
				     under the number, while sparkles / win-glow / increment-flash
				     keep playing. Kept OUTSIDE SpineEventEmitterProvider so its
				     SpineSlot `show` isn't gated on the (nulled) attachment.
				     Uses Frame_Multiplier (idle alpha 1), not Frame_Multiplier2
				     (driven to alpha 0 by the `static` anim). -->
				<SpineSlot slotName="Frame_Multiplier">
					<Sprite
						key="boardMultiplierPart"
						anchor={0.5}
						width={boardCfg.multiplierBgWidth}
						height={boardCfg.multiplierBgHeight}
					/>
				</SpineSlot>
				<SpineEventEmitterProvider>
					<SpineSlot slotName="slot_multi">
						<BitmapText
							anchor={0.5}
							text={`${Math.round(previousMultiplier.current)}×`}
							style={{
								fontFamily: 'gold',
								fontSize: SYMBOL_SIZE * 5.2,
							}}
						/>
					</SpineSlot>
					<SpineSlot slotName="slot_multi_next">
						<BitmapText
							anchor={0.5}
							text={`${multiplier}×`}
							style={{
								fontFamily: 'gold',
								fontSize: SYMBOL_SIZE * 5.2,
							}}
						/>
					</SpineSlot>
				</SpineEventEmitterProvider>
			</SpineProvider>
		</Container>
	</BoardContainer>
</FadeContainer>
