<script lang="ts" module>
	import type { WinLevelData } from '../game/winLevelMap';

	export type EmitterEventFreeSpinOutro =
		| { type: 'freeSpinOutroShow' }
		| { type: 'freeSpinOutroHide' }
		| { type: 'freeSpinOutroCountUp'; amount: number; winLevelData: WinLevelData };
</script>

<script lang="ts">
	import { Sprite, Container } from 'pixi-svelte';
	import { FadeContainer, WinCountUpProvider, ResponsiveBitmapText } from 'components-pixi';
	import { bookEventAmountToCurrencyString } from 'utils-shared/amount';
	import { waitForResolve } from 'utils-shared/wait';
	import { CanvasSizeRectangle } from 'components-layout';
	import { OnMount } from 'components-shared';
	import { stateUrlDerived } from 'state-shared';

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
						{#if isBigWin}
							<Sprite
								anchor={{ x: 0.5, y: 1.2 }}
								width={500 * 2.2}
								height={156 * 2.2}
								key="freespins_{stateUrlDerived.lang()}.png"
							/>
						{:else}
							<Sprite
								anchor={{ x: 0.5, y: 1.2 }}
								width={500 * 4.5}
								height={80 * 4.5}
								key="winsmall_{stateUrlDerived.lang()}.png"
							/>
						{/if}

						<!-- Eski fsOutroNumber spine'ı (sayı çerçevesi) yeni fsIntro
						     export'unda kaldırıldı. Toplam kazancı doğrudan gösteriyoruz.
						     Konum (y) / boyut gerekirse buradan ayarlanır. -->
						<Container y={0}>
							<ResponsiveBitmapText
								anchor={{ x: 0.5, y: 0.5 }}
								style={{
									fontFamily: 'gold',
									fontSize: sizes.width * 0.15,
								}}
								text={bookEventAmountToCurrencyString(countUpAmount)}
								maxWidth={sizes.width}
							/>
						</Container>

						<Sprite
							y={0}
							anchor={{ x: 0.5, y: isBigWin ? -3.2 : -2 }}
							width={177 * (isBigWin ? 2.2 : 3)}
							height={42 * (isBigWin ? 2.2 : 3)}
							key="totalwin.png"
						/>
					{/snippet}
				</FreeSpinAnimation>

				<WinCoins emit={!countUpCompleted} levelAlias={winLevelData?.alias} />

				<PressToContinue onpress={() => (countUpCompleted ? oncomplete() : finishCountUp())} />
			{/snippet}
		</WinCountUpProvider>
	{/if}
</FadeContainer>
