<script lang="ts" module>
	import type { WinLevelData } from '../game/winLevelMap';

	export type EmitterEventFreeSpinOutro =
		| { type: 'freeSpinOutroShow' }
		| { type: 'freeSpinOutroHide' }
		| { type: 'freeSpinOutroCountUp'; amount: number; winLevelData: WinLevelData };
</script>

<script lang="ts">
	import { Text, BitmapText, Container } from 'pixi-svelte';
	import { FadeContainer, WinCountUpProvider, ResponsiveBitmapText } from 'components-pixi';
	import { bookEventAmountToCurrencyString } from 'utils-shared/amount';
	import { waitForResolve } from 'utils-shared/wait';
	import { CanvasSizeRectangle } from 'components-layout';
	import { OnMount } from 'components-shared';
	import { stateI18nDerived } from 'state-shared';

	import { getContext } from '../game/context';
	import FreeSpinAnimation from './FreeSpinAnimation.svelte';
	import PressToContinue from './PressToContinue.svelte';
	import WinCoins from './WinCoins.svelte';

	const context = getContext();

	let show = $state(true);
	let amount = $state(0);
	let winLevelData = $state<WinLevelData>();
	let oncomplete = $state(() => {});
	let onCountUpComplete = $state(() => {});

	context.eventEmitter.subscribeOnMount({
		freeSpinOutroShow: () => (show = true),
		freeSpinOutroHide: async () => (show = false),
		freeSpinOutroCountUp: async (emitterEvent) => {
			amount = emitterEvent.amount;
			winLevelData = emitterEvent.winLevelData;
			await waitForResolve((resolve) => (oncomplete = resolve));
		},
		skipAnimation: () => {
			// While the outro is up, advance the flow (same as PressToContinue
			// firing). Skips both the count-up wait and the dismissal wait in
			// one go; subsequent skips on the same screen are no-ops.
			if (show) oncomplete();
		},
	});
</script>

<FadeContainer {show}>
	{#if winLevelData}
		{@const duration = winLevelData.presentDuration}
		{@const isBigWin = winLevelData.type === 'big'}
		<WinCountUpProvider {amount} {duration} oncomplete={() => onCountUpComplete()}>
			{#snippet children({ countUpAmount, startCountUp, finishCountUp, countUpCompleted })}
				<OnMount onmount={() => startCountUp()} />

				<CanvasSizeRectangle backgroundColor={0x000000} backgroundAlpha={0.5} />

				<FreeSpinAnimation>
					{#snippet children({ sizes })}
						<!-- Header — FreeSpinIntro ile aynı düzen: büyük kazançta altın
						     "CONGRATULATIONS!" + beyaz "YOU WON"; küçük kazançta beyaz "WIN". -->
						{#if isBigWin}
							<Container y={-sizes.width * 0.66}>
								<BitmapText
									anchor={{ x: 0.5, y: 0.5 }}
									text={stateI18nDerived.translate('CONGRATULATIONS!')}
									style={{
										fontFamily: 'gold',
										fontSize: sizes.width * 0.2,
										fontWeight: 'bold',
									}}
								/>
							</Container>
							<Container y={-sizes.width * 0.38}>
								<Text
									anchor={{ x: 0.5, y: 0.5 }}
									text={stateI18nDerived.translate('YOU WON')}
									style={{
										fontFamily: 'ranchers',
										fontSize: sizes.width * 0.14,
										fill: 0xffffff,
										stroke: { color: 0x000000, width: 5 },
										align: 'center',
									}}
								/>
							</Container>
						{:else}
							<Container y={-sizes.width * 0.5}>
								<Text
									anchor={{ x: 0.5, y: 0.5 }}
									text={stateI18nDerived.translate('WIN')}
									style={{
										fontFamily: 'ranchers',
										fontSize: sizes.width * 0.2,
										fill: 0xffffff,
										stroke: { color: 0x000000, width: 6 },
										align: 'center',
									}}
								/>
							</Container>
						{/if}

						<!-- Toplam kazanç tutarı (gold = Ranchers bitmap) -->
						<Container y={0}>
							<ResponsiveBitmapText
								anchor={{ x: 0.5, y: 0.5 }}
								style={{
									fontFamily: 'gold',
									fontSize: sizes.width * 0.22,
								}}
								text={bookEventAmountToCurrencyString(countUpAmount)}
								maxWidth={sizes.width}
							/>
						</Container>

						<!-- "TOTAL WIN" — Ranchers font-text (eski totalwin.png yerine) -->
						<Container y={sizes.width * 0.52}>
							<Text
								anchor={{ x: 0.5, y: 0.5 }}
								text={stateI18nDerived.translate('TOTAL WIN')}
								style={{
									fontFamily: 'ranchers',
									fontSize: sizes.width * 0.2,
									fill: 0xffffff,
									stroke: { color: 0x000000, width: 6 },
									align: 'center',
								}}
							/>
						</Container>
					{/snippet}
				</FreeSpinAnimation>

				<WinCoins emit={!countUpCompleted} levelAlias={winLevelData?.alias} />

				<PressToContinue onpress={() => (countUpCompleted ? oncomplete() : finishCountUp())} />
			{/snippet}
		</WinCountUpProvider>
	{/if}
</FadeContainer>
