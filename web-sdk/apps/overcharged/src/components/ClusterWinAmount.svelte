<script lang="ts" module>
	export type RawWin = {
		win: number;
		mult: number;
		result: number;
		reel: number; // 0 | 1 | 2 | 3 | 4 | 5;
		row: number; // 1 | 2 | 3 | 4 | 5; // excluding the off top row and the off bottom row
	};
	export type Win = RawWin & { oncomplete: () => void; collisionOffset?: number };
</script>

<script lang="ts">
	import { onMount } from 'svelte';
	import { Tween } from 'svelte/motion';

	import { BitmapText } from 'pixi-svelte';
	import { stateBetDerived } from 'state-shared';
	import { FadeContainer } from 'components-pixi';
	import { waitForTimeout } from 'utils-shared/wait';
	import { bookEventAmountToCurrencyString } from 'utils-shared/amount';

	import { SYMBOL_SIZE } from '../game/constants';
	import { getContext } from '../game/context';
	import { timingConfig } from '../game/timingConfig.svelte';

	type Props = { win: Win };

	const props: Props = $props();
	const context = getContext();
	const y = new Tween(0);
	const scale = new Tween(1);
	let show = $state(true);

	let showMultiplier = $state(props.win.mult > 1);

	// Combine sequence: hold the "WIN X mult" badge, punch-shrink, swap the
	// text to the final combined amount exactly at the punch's low point (so
	// the sound + the number change land on the same beat), then punch back.
	// Single coordinated timeline — previously this was two independent
	// onMount timers racing each other, which only looked right at 1x speed
	// because both delays happened to be the same length; under turbo the
	// un-scaled one drifted, decoupling the sound/scale-punch from the text
	// swap it was supposed to land on.
	onMount(async () => {
		if (showMultiplier) {
			await waitForTimeout(timingConfig.clusterWinAmount.multiplierBadgeHoldMs / stateBetDerived.timeScale());
			await scale.set(0.1, { duration: timingConfig.clusterWinAmount.combineScaleDownMs / stateBetDerived.timeScale() });
			context.eventEmitter.broadcast({ type: 'soundOnce', name: 'sfx_multiplier_combine_a' });
			showMultiplier = false;
			await scale.set(1, { duration: timingConfig.clusterWinAmount.combineScaleUpMs / stateBetDerived.timeScale() });
		}
	});

	// update y
	onMount(async () => {
		await y.set(-SYMBOL_SIZE, { duration: timingConfig.clusterWinAmount.floatUpDurationMs / stateBetDerived.timeScale() });
		show = false;
	});
</script>

<FadeContainer
	{show}
	oncomplete={() => {
		if (!show) props.win.oncomplete();
	}}
>
	<BitmapText
		x={SYMBOL_SIZE * (props.win.reel + 0.5)}
		y={SYMBOL_SIZE * (props.win.row - 0.5) +
			y.current -
			(props.win.collisionOffset ?? 0) * SYMBOL_SIZE * 0.55}
		scale={scale.current}
		text={showMultiplier
			? `${bookEventAmountToCurrencyString(props.win.win)} X ${props.win.mult}`
			: bookEventAmountToCurrencyString(props.win.result)}
		anchor={0.5}
		style={{
			fontFamily: 'gold',
			fontSize: SYMBOL_SIZE * 0.5,
		}}
	/>
</FadeContainer>
