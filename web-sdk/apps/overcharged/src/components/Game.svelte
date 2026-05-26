<script lang="ts">
	import { onMount } from 'svelte';

	import { EnablePixiExtension } from 'components-pixi';
	import { EnableHotkey } from 'components-shared';
	import { MainContainer } from 'components-layout';
	import { App, Text, REM } from 'pixi-svelte';
	import { stateModal } from 'state-shared';

	import { UI, UiGameName } from 'components-ui-pixi';
	import { GameVersion, Modals } from 'components-ui-html';

	import { getContext } from '../game/context';
	import { SYMBOL_SIZE } from '../game/constants';
	import config from '../game/config';
	import EnableSound from './EnableSound.svelte';
	import EnableGameActor from './EnableGameActor.svelte';
	import ResumeBet from './ResumeBet.svelte';
	import Sound from './Sound.svelte';
	import Background from './Background.svelte';
	import LoadingScreen from './LoadingScreen.svelte';
	import BoardFrame from './BoardFrame.svelte';
	import BoardContainer from './BoardContainer.svelte';
	import OverchargedUI from './UI/OverchargedUI.svelte';
	import Board from './Board.svelte';
	import Anticipations from './Anticipations.svelte';
	import ScatterTriggerHint from './ScatterTriggerHint.svelte';
	import ClusterWinAmounts from './ClusterWinAmounts.svelte';
	import SkillMeter from './SkillMeter.svelte';
	import TumbleBoard from './TumbleBoard.svelte';
	import TumbleWinAmount from './TumbleWinAmount.svelte';
	import GlobalMultiplier from './GlobalMultiplier.svelte';
	import Win from './Win.svelte';
	import FreeSpinIntro from './FreeSpinIntro.svelte';
	import FreeSpinCounter from './FreeSpinCounter.svelte';
	import FreeSpinOutro from './FreeSpinOutro.svelte';
	import Transition from './Transition.svelte';
	import I18nTest from './I18nTest.svelte';
	import SkillActivatedOverlay from './SkillActivatedOverlay.svelte';
	import SkillVFX from './SkillVFX.svelte';
	import ScreenShake from './ScreenShake.svelte';
	import SkillPreHighlight from './SkillPreHighlight.svelte';
	import type { BookEventSkillActivated } from '../game/typesBookEvent';
	import { SKILL_DATA, type SkillKey } from '../game/skillData';
	import { stateUrlDerived } from 'state-shared';

	const context = getContext();
	const isReplayMode = $derived(stateUrlDerived.isReplayMode());
	// In replay mode skip the LoadingScreen gate, but only AFTER assets are
	// ready — otherwise Pixi children mount before their atlases are loaded
	// and the canvas stays black. When `stateApp.loaded` flips to `true` the
	// Pixi tree mounts in the same frame. (Live mode keeps the original gate.)
	const shouldShowLoadingScreen = $derived(
		isReplayMode
			? !context.stateApp.loaded
			: context.stateLayout.showLoadingScreen,
	);

	async function handleSkillActivated(event: BookEventSkillActivated) {
		const { skillType, skillMeters, positions: visiblePositions } = event;
		const eventAny = event as any;

		// Math output uses two row frames inconsistently:
		//   - winInfo / tumbleBoard: padded frame   (row 0 = top padding, row 1 = first visible)
		//   - skillActivated:        visible frame  (row 0 = first visible)
		// Frontend conventions:
		//   - symbols[i] array        → padded frame (i=0 is padding, i=1 is first visible)
		//   - getSymbolY(row)         → visible frame (row=0 returns center of first visible)
		// So skill positions need +1 ONLY when used to index into symbols[] or when
		// broadcast to boardWithAnimateSymbols (Board.svelte's handler indexes
		// symbols[position.row]). preHighlight uses getSymbolY directly → visible frame.
		// TODO: Fix at math side by emitting skill positions in padded frame (add +1
		// in game_events.py:emit_skill_activated_event like win_info_event does).
		// When that lands, drop this workaround and pass visiblePositions everywhere.
		const paddedPositions = visiblePositions?.map((p) => ({ ...p, row: p.row + 1 }));

		// Meterleri güncelle.
		//
		// Math, aktive olan skill için sıfırlanmış değer DEĞİL, bu tumble'ın
		// katkısını gönderiyor (ör. skillType=L1 → skillMeters.L1=1). Bunu
		// doğrudan set edersek SkillMeter'ın fillTween'i FULL → %10 yönünde
		// tween eder ve "boşalma" deneyimi kaybolur. Bunun yerine:
		//   1. Aktive olan skill'i anında 0'a yazıyoruz → fillTween cubicOut
		//      280ms ile FULL → 0 drain animasyonu oynar (skill banner ile
		//      paralel, akış bloklanmıyor).
		//   2. Drain tween süresi geçtikten sonra math'in verdiği gerçek
		//      değere geri set ediyoruz (genelde 0 veya 1 — sonraki spin'in
		//      başlangıç değeri). Bu da bir mini tween ile yumuşak yükselir.
		// SkillMeter.svelte:120 — fillTween duration 280ms cubicOut.
		if (skillMeters) {
			const isActivation = skillType && skillType !== 'UPDATE';
			const activatedKey = isActivation
				? (skillType as 'L1' | 'L2' | 'L3' | 'L4')
				: null;
			for (const k of ['L1', 'L2', 'L3', 'L4'] as const) {
				context.stateGame.skillMeters[k] =
					k === activatedKey ? 0 : skillMeters[k];
			}
			if (activatedKey) {
				const realValue = skillMeters[activatedKey];
				// 320ms ≈ fillTween duration (280ms) + safety margin. Don't
				// await — keep skill activation animation pipeline unblocked.
				setTimeout(() => {
					context.stateGame.skillMeters[activatedKey] = realValue;
				}, 320);
			}
		}

		if (!skillType || skillType === 'UPDATE') return;

		// Skill drama orkestrasyonu (asset-free):
		//   1. Pre-highlight  →  300ms cells preview in skill color (visible frame)
		//   2. Activated banner + screen shake (paralel, banner async devam eder)
		//   3. Actual on-board animation (padded frame for symbols[] access)
		const meta = SKILL_DATA[skillType as SkillKey];

		if (visiblePositions?.length && meta) {
			await context.eventEmitter.broadcastAsync({
				type: 'skillPreHighlight',
				positions: visiblePositions.map((p) => ({ reel: p.reel, row: p.row })),
				color: meta.color,
				holdMs: 250,
			});
		}

		if (meta) {
			context.eventEmitter.broadcast({
				type: 'skillActivatedDisplay',
				skillKey: skillType as SkillKey,
			});
			// L4 has the biggest visual impact → heaviest shake.
			const shakeIntensity = skillType === 'L4' ? 10 : skillType === 'L2' ? 7 : 5;
			context.eventEmitter.broadcast({
				type: 'screenShake',
				intensity: shakeIntensity,
				duration: 280,
			});
		}

		if (skillType === 'L1') {
			// Verilen pozisyonlardaki sembolleri Wild yap, ardından parlama animasyonu
			if (paddedPositions?.length) {
				paddedPositions.forEach((pos) => {
					const reel = context.stateGame.board[pos.reel];
					if (reel?.reelState.symbols[pos.row]) {
						reel.reelState.symbols[pos.row].rawSymbol = { name: 'W' };
					}
				});
				await context.eventEmitter.broadcastAsync({
					type: 'boardWithAnimateSymbols',
					symbolPositions: paddedPositions.map((p) => ({ reel: p.reel, row: p.row })),
					state: 'win',
				});
			}
		} else if (skillType === 'L2') {
			// Tüm patlayacak low-tier sembollerde patlama animasyonu
			if (paddedPositions?.length) {
				await context.eventEmitter.broadcastAsync({
					type: 'boardWithAnimateSymbols',
					symbolPositions: paddedPositions.map((p) => ({ reel: p.reel, row: p.row })),
					state: 'explosion',
				});
			}
		} else if (skillType === 'L3') {
			// Global çarpanı mathdan gelen değerle güncelle.
			// `source: 'skill'` bayrağı GlobalMultiplier'ın L3 branch'ini
			// çalıştırır; M sembol aktivasyonu default branch'i kullanır.
			const newMult = eventAny.newGlobalMultiplier;
			if (newMult !== undefined) {
				context.stateGame.globalMultiplier = newMult;
				context.eventEmitter.broadcast({ type: 'globalMultiplierShow' });
				await context.eventEmitter.broadcastAsync({
					type: 'globalMultiplierUpdate',
					multiplier: newMult,
					source: 'skill',
				});
			}
		} else if (skillType === 'L4') {
			// 3×3 bloktaki sembolleri Wild yap, ardından parlama animasyonu
			if (paddedPositions?.length) {
				paddedPositions.forEach((pos) => {
					const reel = context.stateGame.board[pos.reel];
					if (reel?.reelState.symbols[pos.row]) {
						reel.reelState.symbols[pos.row].rawSymbol = { name: 'W' };
					}
				});
				await context.eventEmitter.broadcastAsync({
					type: 'boardWithAnimateSymbols',
					symbolPositions: paddedPositions.map((p) => ({ reel: p.reel, row: p.row })),
					state: 'win',
				});
			}
		}
	}

	context.eventEmitter.subscribeOnMount({
		buyBonusConfirm: () => {
			stateModal.modal = { name: 'buyBonusConfirm' };
		},
		skillActivated: async (event) => {
			await handleSkillActivated(event as BookEventSkillActivated);
		},
		skillMetersUpdate: (event) => {
			context.stateGame.skillMeters = { ...event.skillMeters };
		},
	});
</script>

<App>
	<EnableSound />
	<EnableHotkey />
	<EnableGameActor />
	<EnablePixiExtension />

	<Background />

	{#if shouldShowLoadingScreen}
		<LoadingScreen onloaded={() => (context.stateLayout.showLoadingScreen = false)} />
	{:else}
		<ResumeBet />
		<!--
			The reason why <Sound /> is rendered after clicking the loading screen:
			"Autoplay with sound is allowed if: The user has interacted with the domain (click, tap, etc.)."
			Ref: https://developer.chrome.com/blog/autoplay
		-->
		<Sound />

		<!--
			Game-area MainContainers are wrapped in ScreenShake so big-win /
			skill-activation events can rattle the board without moving the
			OverchargedUI chrome (buttons stay stable for clean input).
		-->
		<ScreenShake>
			<MainContainer>
				<BoardFrame />
			</MainContainer>

			<MainContainer>
				<Board />
				<Anticipations />
				<!-- Fires a one-shot win animation on all scatters when the
				     3rd lands during reveal — "freespin coming" confirmation. -->
				<ScatterTriggerHint />
				<TumbleWinAmount />
				<GlobalMultiplier />
			</MainContainer>

			<MainContainer>
				<TumbleBoard />
				<ClusterWinAmounts />
				<!-- Pre-highlight overlay sits over the board, under SkillMeter. -->
				<SkillPreHighlight />
				<BoardContainer>
					<SkillMeter
						x={-SYMBOL_SIZE * 5}
						y={SYMBOL_SIZE * 1}
						meterName="L1"
						currentValue={context.stateGame.skillMeters.L1}
						targetValue={config.skillThresholds.L1}
						colorId={SKILL_DATA.L1.color}
					/>
					<SkillMeter
						x={-SYMBOL_SIZE * 5}
						y={SYMBOL_SIZE * 2}
						meterName="L2"
						currentValue={context.stateGame.skillMeters.L2}
						targetValue={config.skillThresholds.L2}
						colorId={SKILL_DATA.L2.color}
					/>
					<SkillMeter
						x={-SYMBOL_SIZE * 5}
						y={SYMBOL_SIZE * 3}
						meterName="L3"
						currentValue={context.stateGame.skillMeters.L3}
						targetValue={config.skillThresholds.L3}
						colorId={SKILL_DATA.L3.color}
					/>
					<SkillMeter
						x={-SYMBOL_SIZE * 5}
						y={SYMBOL_SIZE * 4}
						meterName="L4"
						currentValue={context.stateGame.skillMeters.L4}
						targetValue={config.skillThresholds.L4}
						colorId={SKILL_DATA.L4.color}
					/>
				</BoardContainer>
			</MainContainer>
		</ScreenShake>

		<OverchargedUI>
			{#snippet gameName()}
				<UiGameName name={config.gameName} />
			{/snippet}
			{#snippet logo()}
				<Text
					anchor={{ x: 1, y: 0 }}
					text="ADD YOUR LOGO"
					style={{
						fontFamily: 'proxima-nova',
						fontSize: REM * 1.5,
						fontWeight: '600',
						lineHeight: REM * 2,
						fill: 0xffffff,
					}}
				/>
			{/snippet}
		</OverchargedUI>
		<Win />
		<FreeSpinIntro />
		{#if ['desktop', 'landscape'].includes(context.stateLayoutDerived.layoutType())}
			<FreeSpinCounter />
		{/if}
		<FreeSpinOutro />
		<!--
			SkillVFX renders BENEATH the banner so radial bursts, bolt rain
			etc. fill the play area while the banner stays readable on top.
		-->
		<SkillVFX />
		<!--
			SkillActivatedOverlay mounts AFTER UI so its fullscreen banner draws
			on top of every other layer (buttons, win text, etc.) during the
			~1.5s drama window.
		-->
		<SkillActivatedOverlay />
		<Transition />

	{/if}
</App>

<Modals>
	{#snippet version()}
		<GameVersion version="0.1.0" />
	{/snippet}
</Modals>
