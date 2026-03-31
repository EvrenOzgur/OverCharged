<script lang="ts">
	import { stateUi } from 'state-shared';
	import { BLACK } from 'constants-shared/colors';
	import { MainContainer } from 'components-layout';
	import { Container, Rectangle, anchorToPivot } from 'pixi-svelte';

	import { LANDSCAPE_BASE_SIZE, LANDSCAPE_BACKGROUND_WIDTH_LIST } from 'components-ui-pixi/src/constants';
	import type { LayoutUiProps } from 'components-ui-pixi/src/types';
	import { getContext } from 'components-ui-pixi/src/context';

	const props: LayoutUiProps = $props();
	const context = getContext();
</script>

<MainContainer alignVertical="top">
	<Container x={20} y={15}>
		{@render props.gameName()}
	</Container>

	<Container x={context.stateLayoutDerived.canvasSizes().width - 20} y={15}>
		{@render props.logo()}
	</Container>
</MainContainer>

<MainContainer standard alignVertical="bottom">
	<Container
		x={context.stateLayoutDerived.mainLayoutStandard().width * 0.5}
		y={context.stateLayoutDerived.mainLayoutStandard().height - LANDSCAPE_BASE_SIZE - 20}
		pivot={anchorToPivot({
			anchor: { x: 0.5, y: 0 },
			sizes: {
				height: LANDSCAPE_BASE_SIZE,
				width: LANDSCAPE_BACKGROUND_WIDTH_LIST.reduce((sum, width) => sum + width, 0),
			},
		})}
	>
		<!-- Center Cluster: Win Amount -->
		<Container y={LANDSCAPE_BASE_SIZE * 0.5 + 20} x={960} scale={0.9}>
			{@render props.amountWin({ stacked: true })}
		</Container>

		<!-- Left Cluster: Menu & Buy Bonus (Stacked Centered) -->
		<Container y={LANDSCAPE_BASE_SIZE * 0.5} x={100} scale={0.7}>
			<Container y={-80}>
				{@render props.buttonBuyBonus({ anchor: 0.5 })}
			</Container>

			<Container y={80}>
				{@render props.buttonMenu({ anchor: 0.5 })}
			</Container>
		</Container>

		<!-- Right Cluster: Balance & Betting (Precise Rows) -->
		<Container y={LANDSCAPE_BASE_SIZE * 0.5} x={context.stateLayoutDerived.mainLayoutStandard().width - 320} scale={0.75}>
			<!-- Row 1: Balance (Top) -->
			<Container x={0} y={-140}>
				{@render props.amountBalance({ stacked: false })}
			</Container>

			<!-- Row 2: Bet Amount & +/- Buttons -->
			<Container x={0} y={-20}>
				<Container x={-200} scale={0.55}>
					{@render props.buttonDecrease({ anchor: 0.5 })}
				</Container>
				<Container x={0} scale={0.8}>
					{@render props.amountBet({ stacked: false })}
				</Container>
				<Container x={200} scale={0.55}>
					{@render props.buttonIncrease({ anchor: 0.5 })}
				</Container>
			</Container>

			<!-- Row 3: Action Buttons (Bottom) -->
			<Container x={0} y={110}>
				<Container x={-180} scale={0.85}>
					{@render props.buttonAutoSpin({ anchor: 0.5 })}
				</Container>
				<Container x={0} scale={1.1}>
					{@render props.buttonBet({ anchor: 0.5 })}
				</Container>
				<Container x={180} scale={0.85}>
					{@render props.buttonTurbo({ anchor: 0.5 })}
				</Container>
			</Container>
		</Container>
	</Container>
</MainContainer>

{#if stateUi.menuOpen}
	<Rectangle
		eventMode="static"
		cursor="pointer"
		alpha={0.5}
		anchor={0.5}
		backgroundColor={BLACK}
		width={context.stateLayoutDerived.canvasSizes().width}
		height={context.stateLayoutDerived.canvasSizes().height}
		x={context.stateLayoutDerived.canvasSizes().width * 0.5}
		y={context.stateLayoutDerived.canvasSizes().height * 0.5}
		onpointerup={() => (stateUi.menuOpen = false)}
	/>

	<MainContainer standard alignVertical="bottom">
		<Container
			x={165}
			y={context.stateLayoutDerived.mainLayoutStandard().height - LANDSCAPE_BASE_SIZE - 130}
		>
			<Container scale={0.8} y={LANDSCAPE_BASE_SIZE * 0.5 - 150 - 170 * 3}>
				{@render props.buttonPayTable({ anchor: 0.5 })}
			</Container>

			<Container scale={0.8} y={LANDSCAPE_BASE_SIZE * 0.5 - 150 - 170 * 2}>
				{@render props.buttonGameRules({ anchor: 0.5 })}
			</Container>

			<Container scale={0.8} y={LANDSCAPE_BASE_SIZE * 0.5 - 150 - 170 * 1}>
				{@render props.buttonSettings({ anchor: 0.5 })}
			</Container>

			<Container scale={0.8} y={LANDSCAPE_BASE_SIZE * 0.5 - 150}>
				{@render props.buttonSoundSwitch({ anchor: 0.5 })}
			</Container>

			<Container scale={0.8} y={LANDSCAPE_BASE_SIZE * 0.5}>
				{@render props.buttonMenuClose({ anchor: 0.5 })}
			</Container>
		</Container>
	</MainContainer>
{/if}
