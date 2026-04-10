<script lang="ts">
	import { stateUi } from 'state-shared';
	import { BLACK } from 'constants-shared/colors';
	import { MainContainer } from 'components-layout';
	import { Container, Rectangle, anchorToPivot } from 'pixi-svelte';

	import { DESKTOP_BASE_SIZE, DESKTOP_BACKGROUND_WIDTH_LIST } from 'components-ui-pixi/src/constants';
	import { getContext } from 'components-ui-pixi/src/context';
	import type { LayoutUiProps } from 'components-ui-pixi/src/types';

	import { uiLayoutConfig } from '../../game/uiLayoutConfig.svelte';
	import DraggableInEditor from './DraggableInEditor.svelte';

	// Cluster ancestor scales — the parent Container the element lives inside.
	const TOP_BAR_SCALE = 1;
	const BOTTOM_ROOT_SCALE = 1;
	const LEFT_CLUSTER_SCALE = 0.7;
	const RIGHT_CLUSTER_SCALE = 0.75;

	const props: LayoutUiProps = $props();
	const context = getContext();
	const desktopCfg = $derived(uiLayoutConfig.desktop);
</script>

<MainContainer alignVertical="top">
	<DraggableInEditor id="gameName" transform={desktopCfg.gameName} ancestorScale={TOP_BAR_SCALE}>
		{#snippet children()}
			{@render props.gameName()}
		{/snippet}
	</DraggableInEditor>

	<!-- Logo: position depends on canvas width, kept non-editable for now. -->
	<Container x={context.stateLayoutDerived.canvasSizes().width - 20} y={15}>
		{@render props.logo()}
	</Container>
</MainContainer>

<MainContainer standard alignVertical="bottom">
	<Container
		x={context.stateLayoutDerived.mainLayoutStandard().width * 0.5}
		y={context.stateLayoutDerived.mainLayoutStandard().height - DESKTOP_BASE_SIZE - 20}
		pivot={anchorToPivot({
			anchor: { x: 0.5, y: 0 },
			sizes: {
				height: DESKTOP_BASE_SIZE,
				width: DESKTOP_BACKGROUND_WIDTH_LIST.reduce((sum, width) => sum + width, 0),
			},
		})}
	>
		<DraggableInEditor id="amountWin" transform={desktopCfg.amountWin} ancestorScale={BOTTOM_ROOT_SCALE}>
			{#snippet children()}
				{@render props.amountWin({ stacked: true })}
			{/snippet}
		</DraggableInEditor>

		<!-- Left Cluster (scale 0.7) -->
		<Container y={DESKTOP_BASE_SIZE * 0.5} x={100} scale={LEFT_CLUSTER_SCALE}>
			<DraggableInEditor id="buttonBuyBonus" transform={desktopCfg.buttonBuyBonus} ancestorScale={LEFT_CLUSTER_SCALE}>
				{#snippet children()}
					{@render props.buttonBuyBonus({ anchor: 0.5 })}
				{/snippet}
			</DraggableInEditor>

			<DraggableInEditor id="buttonMenu" transform={desktopCfg.buttonMenu} ancestorScale={LEFT_CLUSTER_SCALE}>
				{#snippet children()}
					{@render props.buttonMenu({ anchor: 0.5 })}
				{/snippet}
			</DraggableInEditor>
		</Container>

		<!-- Right Cluster (scale 0.75) -->
		<Container y={DESKTOP_BASE_SIZE * 0.5} x={context.stateLayoutDerived.mainLayoutStandard().width - 320} scale={RIGHT_CLUSTER_SCALE}>
			<DraggableInEditor id="amountBalance" transform={desktopCfg.amountBalance} ancestorScale={RIGHT_CLUSTER_SCALE}>
				{#snippet children()}
					{@render props.amountBalance({ stacked: false })}
				{/snippet}
			</DraggableInEditor>

			<DraggableInEditor id="buttonDecrease" transform={desktopCfg.buttonDecrease} ancestorScale={RIGHT_CLUSTER_SCALE}>
				{#snippet children()}
					{@render props.buttonDecrease({ anchor: 0.5 })}
				{/snippet}
			</DraggableInEditor>

			<DraggableInEditor id="amountBet" transform={desktopCfg.amountBet} ancestorScale={RIGHT_CLUSTER_SCALE}>
				{#snippet children()}
					{@render props.amountBet({ stacked: false })}
				{/snippet}
			</DraggableInEditor>

			<DraggableInEditor id="buttonIncrease" transform={desktopCfg.buttonIncrease} ancestorScale={RIGHT_CLUSTER_SCALE}>
				{#snippet children()}
					{@render props.buttonIncrease({ anchor: 0.5 })}
				{/snippet}
			</DraggableInEditor>

			<DraggableInEditor id="buttonAutoSpin" transform={desktopCfg.buttonAutoSpin} ancestorScale={RIGHT_CLUSTER_SCALE}>
				{#snippet children()}
					{@render props.buttonAutoSpin({ anchor: 0.5 })}
				{/snippet}
			</DraggableInEditor>

			<DraggableInEditor id="buttonBet" transform={desktopCfg.buttonBet} ancestorScale={RIGHT_CLUSTER_SCALE}>
				{#snippet children()}
					{@render props.buttonBet({ anchor: 0.5 })}
				{/snippet}
			</DraggableInEditor>

			<DraggableInEditor id="buttonTurbo" transform={desktopCfg.buttonTurbo} ancestorScale={RIGHT_CLUSTER_SCALE}>
				{#snippet children()}
					{@render props.buttonTurbo({ anchor: 0.5 })}
				{/snippet}
			</DraggableInEditor>
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
			x={298}
			y={context.stateLayoutDerived.mainLayoutStandard().height - DESKTOP_BASE_SIZE - 10}
		>
			<Container scale={0.8} y={DESKTOP_BASE_SIZE * 0.5 - 150 - 170 * 3}>
				{@render props.buttonPayTable({ anchor: 0.5 })}
			</Container>

			<Container scale={0.8} y={DESKTOP_BASE_SIZE * 0.5 - 150 - 170 * 2}>
				{@render props.buttonGameRules({ anchor: 0.5 })}
			</Container>

			<Container scale={0.8} y={DESKTOP_BASE_SIZE * 0.5 - 150 - 170 * 1}>
				{@render props.buttonSettings({ anchor: 0.5 })}
			</Container>

			<Container scale={0.8} y={DESKTOP_BASE_SIZE * 0.5 - 150}>
				{@render props.buttonSoundSwitch({ anchor: 0.5 })}
			</Container>

			<Container scale={0.8} y={DESKTOP_BASE_SIZE * 0.5}>
				{@render props.buttonMenuClose({ anchor: 0.5 })}
			</Container>
		</Container>
	</MainContainer>
{/if}
