<script lang="ts">
	import { stateUi } from 'state-shared';
	import { BLACK } from 'constants-shared/colors';
	import { MainContainer } from 'components-layout';
	import { Container, Rectangle, anchorToPivot } from 'pixi-svelte';

	import { LANDSCAPE_BASE_SIZE, LANDSCAPE_BACKGROUND_WIDTH_LIST } from 'components-ui-pixi/src/constants';
	import type { LayoutUiProps } from 'components-ui-pixi/src/types';
	import { getContext } from 'components-ui-pixi/src/context';
	import { getActiveVariantConfig } from '../../game/uiLayoutConfig.svelte';
	import DraggableInEditor from './DraggableInEditor.svelte';

	const props: LayoutUiProps = $props();
	const context = getContext();
	// Pass the live window size so the running game auto-selects the matching
	// resolution preset config (and re-selects reactively on resize).
	const liveLayout = $derived({
		width: context.stateLayoutDerived.canvasSizes().width,
		height: context.stateLayoutDerived.canvasSizes().height,
		layoutType: context.stateLayoutDerived.layoutType(),
	});
	const cfg = $derived(getActiveVariantConfig(liveLayout));

	const LEFT_SCALE = 0.7;
	const RIGHT_SCALE = 0.75;
</script>

<MainContainer alignVertical="top">
	<DraggableInEditor id="gameName" transform={cfg.gameName} ancestorScale={1}>
		{#snippet children()}
			{@render props.gameName()}
		{/snippet}
	</DraggableInEditor>

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
		<DraggableInEditor id="amountWin" transform={cfg.amountWin} ancestorScale={1}>
			{#snippet children()}
				<Container y={LANDSCAPE_BASE_SIZE * 0.5 + 20} x={960} scale={0.9}>
					{@render props.amountWin({ stacked: true })}
				</Container>
			{/snippet}
		</DraggableInEditor>

		<!-- Left Cluster -->
		<Container y={LANDSCAPE_BASE_SIZE * 0.5} x={100} scale={LEFT_SCALE}>
			<DraggableInEditor id="buttonBuyBonus" transform={cfg.buttonBuyBonus} ancestorScale={LEFT_SCALE}>
				{#snippet children()}
					{@render props.buttonBuyBonus({ anchor: 0.5 })}
				{/snippet}
			</DraggableInEditor>

			<DraggableInEditor id="buttonMenu" transform={cfg.buttonMenu} ancestorScale={LEFT_SCALE}>
				{#snippet children()}
					{@render props.buttonMenu({ anchor: 0.5 })}
				{/snippet}
			</DraggableInEditor>
		</Container>

		<!-- Right Cluster -->
		<Container y={LANDSCAPE_BASE_SIZE * 0.5} x={context.stateLayoutDerived.mainLayoutStandard().width - 320} scale={RIGHT_SCALE}>
			<DraggableInEditor id="amountBalance" transform={cfg.amountBalance} ancestorScale={RIGHT_SCALE}>
				{#snippet children()}
					{@render props.amountBalance({ stacked: false })}
				{/snippet}
			</DraggableInEditor>

			<DraggableInEditor id="buttonDecrease" transform={cfg.buttonDecrease} ancestorScale={RIGHT_SCALE}>
				{#snippet children()}
					{@render props.buttonDecrease({ anchor: 0.5 })}
				{/snippet}
			</DraggableInEditor>

			<DraggableInEditor id="amountBet" transform={cfg.amountBet} ancestorScale={RIGHT_SCALE}>
				{#snippet children()}
					{@render props.amountBet({ stacked: false })}
				{/snippet}
			</DraggableInEditor>

			<DraggableInEditor id="buttonIncrease" transform={cfg.buttonIncrease} ancestorScale={RIGHT_SCALE}>
				{#snippet children()}
					{@render props.buttonIncrease({ anchor: 0.5 })}
				{/snippet}
			</DraggableInEditor>

			<DraggableInEditor id="buttonAutoSpin" transform={cfg.buttonAutoSpin} ancestorScale={RIGHT_SCALE}>
				{#snippet children()}
					{@render props.buttonAutoSpin({ anchor: 0.5 })}
				{/snippet}
			</DraggableInEditor>

			<DraggableInEditor id="buttonBet" transform={cfg.buttonBet} ancestorScale={RIGHT_SCALE}>
				{#snippet children()}
					{@render props.buttonBet({ anchor: 0.5 })}
				{/snippet}
			</DraggableInEditor>

			<DraggableInEditor id="buttonTurbo" transform={cfg.buttonTurbo} ancestorScale={RIGHT_SCALE}>
				{#snippet children()}
					{@render props.buttonTurbo({ anchor: 0.5 })}
				{/snippet}
			</DraggableInEditor>
		</Container>
	</Container>
</MainContainer>

{#if stateUi.menuOpen}
	<Rectangle
		eventMode="static" cursor="pointer" alpha={0.5} anchor={0.5}
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
			<Container scale={0.8} y={LANDSCAPE_BASE_SIZE * 0.5 - 150 - 170 * 3}>{@render props.buttonPayTable({ anchor: 0.5 })}</Container>
			<Container scale={0.8} y={LANDSCAPE_BASE_SIZE * 0.5 - 150 - 170 * 2}>{@render props.buttonGameRules({ anchor: 0.5 })}</Container>
			<Container scale={0.8} y={LANDSCAPE_BASE_SIZE * 0.5 - 150 - 170 * 1}>{@render props.buttonSettings({ anchor: 0.5 })}</Container>
			<Container scale={0.8} y={LANDSCAPE_BASE_SIZE * 0.5 - 150}>{@render props.buttonSoundSwitch({ anchor: 0.5 })}</Container>
			<Container scale={0.8} y={LANDSCAPE_BASE_SIZE * 0.5}>{@render props.buttonMenuClose({ anchor: 0.5 })}</Container>
		</Container>
	</MainContainer>
{/if}
