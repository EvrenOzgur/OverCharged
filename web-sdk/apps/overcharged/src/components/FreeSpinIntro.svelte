<script lang="ts" module>
	export type EmitterEventFreeSpinIntro =
		| { type: 'freeSpinIntroShow' }
		| { type: 'freeSpinIntroHide' }
		| { type: 'freeSpinIntroUpdate'; totalFreeSpins: number; addedFs: number; isRetrigger: boolean };
</script>

<script lang="ts">
	import { CanvasSizeRectangle } from 'components-layout';
	import { stateI18nDerived } from 'state-shared';
	import { FadeContainer } from 'components-pixi';
	import { waitForResolve } from 'utils-shared/wait';
	import { BitmapText, Container, Text } from 'pixi-svelte';

	import { getContext } from '../game/context';
	import PressToContinue from './PressToContinue.svelte';
	import FreeSpinAnimation from './FreeSpinAnimation.svelte';

	const context = getContext();

	let show = $state(false);
	let freeSpinsFromEvent = $state(0);
	let addedFsFromEvent = $state(0);
	let isUpdate = $state(false);
	let oncomplete = $state(() => {});

	context.eventEmitter.subscribeOnMount({
		freeSpinIntroShow: () => {
			show = true;
			isUpdate = false;
		},
		freeSpinIntroHide: () => (show = false),
		freeSpinIntroUpdate: async (emitterEvent) => {
			// if (emitterEvent.extraSpins) {
			// 	context.eventEmitter.broadcast({ type: 'soundOnce', name: 'sfx_fs_respins' });
			// }
			// freeSpinsFromEvent = emitterEvent.extraSpins ?? emitterEvent.totalFreeSpins;
			freeSpinsFromEvent = emitterEvent.totalFreeSpins;
			addedFsFromEvent = emitterEvent.addedFs;
			isUpdate = emitterEvent.isRetrigger;
			await waitForResolve((resolve) => (oncomplete = resolve));
		},
		skipAnimation: () => {
			// While the intro is up, Space (bet-button hotkey) also broadcasts
			// skipAnimation — resolve the pending oncomplete so the flow advances
			// even if PressToContinue's own hotkey missed the press.
			if (show) oncomplete();
		},
	});
</script>

<FadeContainer {show}>
	<CanvasSizeRectangle backgroundColor={0x000000} backgroundAlpha={0.5} />

	<FreeSpinAnimation>
		{#snippet children({ sizes })}
			<!-- "CONGRATULATIONS!" (gold = Ranchers bitmap, büyük) + "YOU WON" (beyaz) —
			     iki ayrı satır. Boyut/konum buradan ayarlanır. -->
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

			<!-- Kazanılan FS sayısı (gold = Ranchers bitmap) -->
			<Container y={0}>
				<BitmapText
					anchor={{ x: 0.5, y: 0.5 }}
					text={isUpdate ? `+${addedFsFromEvent}` : addedFsFromEvent}
					style={{
						fontFamily: 'gold',
						fontSize: sizes.width * 0.36,
						fontWeight: 'bold',
					}}
				/>
			</Container>

			<!-- "FREE SPINS" — Ranchers font-text (eski freespins.png yerine) -->
			<Container y={sizes.width * 0.52}>
				<Text
					anchor={{ x: 0.5, y: 0.5 }}
					text={stateI18nDerived.translate('FREE SPINS')}
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

	<PressToContinue onpress={() => oncomplete()} />
</FadeContainer>
