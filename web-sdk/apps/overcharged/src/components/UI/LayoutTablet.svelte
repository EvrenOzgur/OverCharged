<script lang="ts">
	import { stateUi } from 'state-shared';
	import { BLACK } from 'constants-shared/colors';
	import { MainContainer } from 'components-layout';
	import { Container, Rectangle, anchorToPivot } from 'pixi-svelte';

	import { getContext } from 'components-ui-pixi/src/context';
	import type { LayoutUiProps } from 'components-ui-pixi/src/types';
	import LabelFreeSpinCounter from './LabelFreeSpinCounter.svelte';
	import { DESKTOP_BASE_SIZE, DESKTOP_BACKGROUND_WIDTH_LIST } from 'components-ui-pixi/src/constants';
	import { getActiveVariantConfig } from '../../game/uiLayoutConfig.svelte';
	import DraggableInEditor from './DraggableInEditor.svelte';

	const props: LayoutUiProps = $props();
	const context = getContext();
	const cfg = $derived(getActiveVariantConfig());
</script>

<DraggableInEditor id="gameName" transform={cfg.gameName} ancestorScale={1}>
	{#snippet children()}
		{@render props.gameName()}
	{/snippet}
</DraggableInEditor>

<Container x={context.stateLayoutDerived.canvasSizes().width - 20}>
	{@render props.logo()}
</Container>

<MainContainer standard alignVertical="bottom">
	<Container
		x={context.stateLayoutDerived.mainLayoutStandard().width * 0.5}
		y={context.stateLayoutDerived.mainLayoutStandard().height - DESKTOP_BASE_SIZE - 30}
		pivot={anchorToPivot({
			anchor: { x: 0.5, y: 0 },
			sizes: {
				height: DESKTOP_BASE_SIZE,
				width: DESKTOP_BACKGROUND_WIDTH_LIST.reduce((sum, width) => sum + width, 0),
			},
		})}
	>
		<DraggableInEditor id="amountBalance" transform={cfg.amountBalance} ancestorScale={1}>
			{#snippet children()}
				<Container y={DESKTOP_BASE_SIZE * 0.5 - 220} x={880 - 640}>
					{@render props.amountBalance({ stacked: true })}
				</Container>
			{/snippet}
		</DraggableInEditor>

		<DraggableInEditor id="amountWin" transform={cfg.amountWin} ancestorScale={1}>
			{#snippet children()}
				<Container y={DESKTOP_BASE_SIZE * 0.5 - 220} x={880}>
					{@render props.amountWin({ stacked: true })}
				</Container>
			{/snippet}
		</DraggableInEditor>

		<DraggableInEditor id="amountBet" transform={cfg.amountBet} ancestorScale={1}>
			{#snippet children()}
				<Container y={DESKTOP_BASE_SIZE * 0.5 - 220} x={880 + 640}>
					{@render props.amountBet({ stacked: true })}
				</Container>
			{/snippet}
		</DraggableInEditor>

		<DraggableInEditor id="buttonMenu" transform={cfg.buttonMenu} ancestorScale={1}>
			{#snippet children()}
				{@render props.buttonMenu({ anchor: 0.5 })}
			{/snippet}
		</DraggableInEditor>

		<DraggableInEditor id="buttonBuyBonus" transform={cfg.buttonBuyBonus} ancestorScale={1}>
			{#snippet children()}
				{@render props.buttonBuyBonus({ anchor: 0.5 })}
			{/snippet}
		</DraggableInEditor>

		<DraggableInEditor id="buttonAutoSpin" transform={cfg.buttonAutoSpin} ancestorScale={1}>
			{#snippet children()}
				{@render props.buttonAutoSpin({ anchor: 0.5 })}
			{/snippet}
		</DraggableInEditor>

		<DraggableInEditor id="buttonBet" transform={cfg.buttonBet} ancestorScale={1}>
			{#snippet children()}
				{@render props.buttonBet({ anchor: 0.5 })}
			{/snippet}
		</DraggableInEditor>

		<DraggableInEditor id="buttonTurbo" transform={cfg.buttonTurbo} ancestorScale={1}>
			{#snippet children()}
				{@render props.buttonTurbo({ anchor: 0.5 })}
			{/snippet}
		</DraggableInEditor>

		<DraggableInEditor id="buttonDecrease" transform={cfg.buttonDecrease} ancestorScale={1}>
			{#snippet children()}
				{@render props.buttonDecrease({ anchor: 0.5 })}
			{/snippet}
		</DraggableInEditor>

		<DraggableInEditor id="buttonIncrease" transform={cfg.buttonIncrease} ancestorScale={1}>
			{#snippet children()}
				{@render props.buttonIncrease({ anchor: 0.5 })}
			{/snippet}
		</DraggableInEditor>

		{#if stateUi.freeSpinCounterShow}
			<Container y={DESKTOP_BASE_SIZE * 0.5 - 320} x={668}>
				<LabelFreeSpinCounter />
			</Container>
		{/if}
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
			x={100}
			y={context.stateLayoutDerived.mainLayoutStandard().height - DESKTOP_BASE_SIZE - 30}
		>
			<Container y={DESKTOP_BASE_SIZE * 0.5 - 185 - 210 * 3}>{@render props.buttonPayTable({ anchor: 0.5 })}</Container>
			<Container y={DESKTOP_BASE_SIZE * 0.5 - 185 - 210 * 2}>{@render props.buttonGameRules({ anchor: 0.5 })}</Container>
			<Container y={DESKTOP_BASE_SIZE * 0.5 - 185 - 210 * 1}>{@render props.buttonSettings({ anchor: 0.5 })}</Container>
			<Container y={DESKTOP_BASE_SIZE * 0.5 - 185}>{@render props.buttonSoundSwitch({ anchor: 0.5 })}</Container>
			<Container y={DESKTOP_BASE_SIZE * 0.5}>{@render props.buttonMenuClose({ anchor: 0.5 })}</Container>
		</Container>
	</MainContainer>
{/if}
