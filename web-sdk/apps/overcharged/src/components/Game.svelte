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
	import type { BookEventSkillActivated } from '../game/typesBookEvent';

	const context = getContext();

	async function handleSkillActivated(event: BookEventSkillActivated) {
		const { skillType, skillMeters, positions } = event;
		const eventAny = event as any;

		// Meterleri her zaman güncelle
		if (skillMeters) {
			context.stateGame.skillMeters.L1 = skillMeters.L1;
			context.stateGame.skillMeters.L2 = skillMeters.L2;
			context.stateGame.skillMeters.L3 = skillMeters.L3;
			context.stateGame.skillMeters.L4 = skillMeters.L4;
		}

		if (!skillType || skillType === 'UPDATE') return;

		if (skillType === 'L1') {
			// Verilen pozisyonlardaki sembolleri Wild yap, ardından parlama animasyonu
			if (positions?.length) {
				positions.forEach((pos) => {
					const reel = context.stateGame.board[pos.reel];
					if (reel?.reelState.symbols[pos.row]) {
						reel.reelState.symbols[pos.row].rawSymbol = { name: 'W' };
					}
				});
				await context.eventEmitter.broadcastAsync({
					type: 'boardWithAnimateSymbols',
					symbolPositions: positions.map((p) => ({ reel: p.reel, row: p.row })),
					state: 'win',
				});
			}
		} else if (skillType === 'L2') {
			// Tüm patlayacak low-tier sembollerde patlama animasyonu
			if (positions?.length) {
				await context.eventEmitter.broadcastAsync({
					type: 'boardWithAnimateSymbols',
					symbolPositions: positions.map((p) => ({ reel: p.reel, row: p.row })),
					state: 'explosion',
				});
			}
		} else if (skillType === 'L3') {
			// Global çarpanı mathdan gelen değerle güncelle
			const newMult = eventAny.newGlobalMultiplier;
			if (newMult !== undefined) {
				context.stateGame.globalMultiplier = newMult;
				context.eventEmitter.broadcast({ type: 'globalMultiplierShow' });
				await context.eventEmitter.broadcastAsync({
					type: 'globalMultiplierUpdate',
					multiplier: newMult,
				});
			}
		} else if (skillType === 'L4') {
			// 3×3 bloktaki sembolleri Wild yap, ardından parlama animasyonu
			if (positions?.length) {
				positions.forEach((pos) => {
					const reel = context.stateGame.board[pos.reel];
					if (reel?.reelState.symbols[pos.row]) {
						reel.reelState.symbols[pos.row].rawSymbol = { name: 'W' };
					}
				});
				await context.eventEmitter.broadcastAsync({
					type: 'boardWithAnimateSymbols',
					symbolPositions: positions.map((p) => ({ reel: p.reel, row: p.row })),
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
			console.log('%c[DEBUG] Skill Meters Update in Game.svelte:', 'color: #00ff00; font-weight: bold', event.skillMeters);
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

	{#if context.stateLayout.showLoadingScreen}
		<LoadingScreen onloaded={() => (context.stateLayout.showLoadingScreen = false)} />
	{:else}
		<ResumeBet />
		<!--
			The reason why <Sound /> is rendered after clicking the loading screen:
			"Autoplay with sound is allowed if: The user has interacted with the domain (click, tap, etc.)."
			Ref: https://developer.chrome.com/blog/autoplay
		-->
		<Sound />

		<MainContainer>
			<BoardFrame />
		</MainContainer>



		<MainContainer>
			<Board />
			<Anticipations />
			<TumbleWinAmount />
			<GlobalMultiplier />
		</MainContainer>

		<MainContainer>
			<TumbleBoard />
			<ClusterWinAmounts />
			<BoardContainer>
				<SkillMeter
					x={-SYMBOL_SIZE * 5}
					y={SYMBOL_SIZE * 1}
					meterName="L1"
					currentValue={context.stateGame.skillMeters.L1}
					targetValue={10}
					colorId={0xffd700}
				/>
				<SkillMeter
					x={-SYMBOL_SIZE * 5}
					y={SYMBOL_SIZE * 2}
					meterName="L2"
					currentValue={context.stateGame.skillMeters.L2}
					targetValue={20}
					colorId={0x00ff00}
				/>
				<SkillMeter
					x={-SYMBOL_SIZE * 5}
					y={SYMBOL_SIZE * 3}
					meterName="L3"
					currentValue={context.stateGame.skillMeters.L3}
					targetValue={15}
					colorId={0x0000ff}
				/>
				<SkillMeter
					x={-SYMBOL_SIZE * 5}
					y={SYMBOL_SIZE * 4}
					meterName="L4"
					currentValue={context.stateGame.skillMeters.L4}
					targetValue={30}
					colorId={0xff0000}
				/>
			</BoardContainer>
		</MainContainer>

		<OverchargedUI>
			{#snippet gameName()}
				<UiGameName name="Mining Mayhem" />
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
		<Transition />

	{/if}
</App>

<Modals>
	{#snippet version()}
		<GameVersion version="0.0.0" />
	{/snippet}
</Modals>
