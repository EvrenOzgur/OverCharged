<script lang="ts" module>
	export type EmitterEventFreeSpinIntro =
		| { type: 'freeSpinIntroShow' }
		| { type: 'freeSpinIntroHide' }
		| { type: 'freeSpinIntroUpdate'; totalFreeSpins: number; addedFs: number; isRetrigger: boolean };
</script>

<script lang="ts">
	import { CanvasSizeRectangle } from 'components-layout';
	import { stateUrlDerived } from 'state-shared';
	import { FadeContainer } from 'components-pixi';
	import { waitForResolve } from 'utils-shared/wait';
	import { BitmapText, Container, Sprite } from 'pixi-svelte';

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
			<Sprite
				anchor={{ x: 0.5, y: 1.2 }}
				width={500 * 2.2}
				height={156 * 2.2}
				key="freespins_{stateUrlDerived.lang()}.png"
			/>

			<!-- Eski fsIntroNumber spine'ı (sayı çerçevesi) yeni fsIntro export'unda
			     kaldırıldı (atlas'ta region'ları yok). Sayıyı doğrudan gösteriyoruz.
			     Konum (y) / boyut (fontSize) gerekirse buradan ayarlanır. -->
			<Container y={0}>
				<BitmapText
					anchor={{ x: 0.5, y: 0.5 }}
					text={isUpdate ? `+${addedFsFromEvent}` : addedFsFromEvent}
					style={{
						fontFamily: 'gold',
						fontSize: sizes.width * 0.28,
						fontWeight: 'bold',
					}}
				/>
			</Container>

			<Sprite anchor={{ x: 0.5, y: -2.2 }} width={183 * 2.2} height={42 * 2.2} key="freespins.png" />
		{/snippet}
	</FreeSpinAnimation>

	<PressToContinue onpress={() => oncomplete()} />
</FadeContainer>
