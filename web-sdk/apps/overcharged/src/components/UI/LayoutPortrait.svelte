<script lang="ts">
	import { Tween } from 'svelte/motion';
	import { cubicInOut } from 'svelte/easing';

	import { stateUi } from 'state-shared';
	import { BLACK } from 'constants-shared/colors';
	import { FadeContainer } from 'components-pixi';
	import { MainContainer } from 'components-layout';
	import { Container, Rectangle } from 'pixi-svelte';
	import { waitForResolve } from 'utils-shared/wait';

	import LabelFreeSpinCounter from './LabelFreeSpinCounter.svelte';
	import ButtonDrawer from './ButtonDrawer.svelte';
	import type { LayoutUiProps } from 'components-ui-pixi/src/types';
	import { getContext } from 'components-ui-pixi/src/context';
	import { getActiveVariantConfig } from '../../game/uiLayoutConfig.svelte';
	import DraggableInEditor from './DraggableInEditor.svelte';

	const props: LayoutUiProps = $props();
	const context = getContext();
	const cfg = $derived(getActiveVariantConfig());

	const DRAWER_Y = { unfold: 0, fold: 550 };
	const drawerTween = new Tween(stateUi.drawerFold ? DRAWER_Y.fold : DRAWER_Y.unfold, { easing: cubicInOut });

	const DRAWER_BUTTON_Y = { unfold: 0, fold: 50 };
	const drawerButtonTween = new Tween(stateUi.drawerFold ? DRAWER_BUTTON_Y.fold : DRAWER_BUTTON_Y.unfold, { easing: cubicInOut });

	let drawerButtonFadeComplete = $state(() => {});

	context.eventEmitter.subscribeOnMount({
		drawerButtonShow: async () => {
			if (!stateUi.drawerButtonShow) {
				stateUi.drawerButtonShow = true;
				await waitForResolve((resolve) => (drawerButtonFadeComplete = resolve));
			}
		},
		drawerButtonHide: async () => {
			if (stateUi.drawerButtonShow) {
				stateUi.drawerButtonShow = false;
				await waitForResolve((resolve) => (drawerButtonFadeComplete = resolve));
			}
		},
		drawerUnfold: async () => {
			if (stateUi.drawerFold) {
				drawerButtonTween.set(DRAWER_BUTTON_Y.unfold);
				await drawerTween.set(DRAWER_Y.unfold);
			}
		},
		drawerFold: async () => {
			if (!stateUi.drawerFold) {
				drawerButtonTween.set(DRAWER_BUTTON_Y.fold);
				await drawerTween.set(DRAWER_Y.fold);
			}
		},
	});

	const LEFT_SCALE = 0.7;
	const RIGHT_SCALE = 0.7;
</script>

<MainContainer alignVertical="top">
	<DraggableInEditor id="gameName" transform={cfg.gameName} ancestorScale={1}>
		{#snippet children()}
			{@render props.gameName()}
		{/snippet}
	</DraggableInEditor>

	<Container x={context.stateLayoutDerived.canvasSizes().width - 20} y={20}>
		{@render props.logo()}
	</Container>
</MainContainer>

<MainContainer standard alignVertical="bottom">
	<!-- Left Cluster: Menu & Buy Bonus -->
	<Container y={drawerTween.current} x={100} scale={LEFT_SCALE}>
		<Container y={context.stateLayoutDerived.mainLayoutStandard().height - 200}>
			<DraggableInEditor id="buttonBuyBonus" transform={cfg.buttonBuyBonus} ancestorScale={LEFT_SCALE}>
				{#snippet children()}
					{@render props.buttonBuyBonus({ anchor: 0.5 })}
				{/snippet}
			</DraggableInEditor>
		</Container>
		<Container y={context.stateLayoutDerived.mainLayoutStandard().height - 50}>
			<DraggableInEditor id="buttonMenu" transform={cfg.buttonMenu} ancestorScale={LEFT_SCALE}>
				{#snippet children()}
					{@render props.buttonMenu({ anchor: 0.5 })}
				{/snippet}
			</DraggableInEditor>
		</Container>
	</Container>

	<!-- Center: Win Amount -->
	<Container y={Math.min(drawerTween.current, 100)}>
		<Container
			x={context.stateLayoutDerived.mainLayoutStandard().width * 0.5}
			y={context.stateLayoutDerived.mainLayoutStandard().height - 350}
		>
			<DraggableInEditor id="amountWin" transform={cfg.amountWin} ancestorScale={1}>
				{#snippet children()}
					{@render props.amountWin({ stacked: true })}
				{/snippet}
			</DraggableInEditor>
		</Container>
	</Container>

	<!-- Right Cluster: Balance & Betting -->
	<Container y={drawerTween.current} x={context.stateLayoutDerived.mainLayoutStandard().width - 320} scale={RIGHT_SCALE}>
		<Container y={context.stateLayoutDerived.mainLayoutStandard().height - 320} x={0} scale={0.9}>
			<DraggableInEditor id="amountBalance" transform={cfg.amountBalance} ancestorScale={RIGHT_SCALE * 0.9}>
				{#snippet children()}
					{@render props.amountBalance({ stacked: false })}
				{/snippet}
			</DraggableInEditor>
		</Container>

		<Container y={context.stateLayoutDerived.mainLayoutStandard().height - 180} x={0}>
			<DraggableInEditor id="buttonDecrease" transform={cfg.buttonDecrease} ancestorScale={RIGHT_SCALE}>
				{#snippet children()}
					<Container x={-180} scale={0.55}>
						{@render props.buttonDecrease({ anchor: 0.5 })}
					</Container>
				{/snippet}
			</DraggableInEditor>
			<DraggableInEditor id="amountBet" transform={cfg.amountBet} ancestorScale={RIGHT_SCALE}>
				{#snippet children()}
					<Container scale={0.8}>
						{@render props.amountBet({ stacked: false })}
					</Container>
				{/snippet}
			</DraggableInEditor>
			<DraggableInEditor id="buttonIncrease" transform={cfg.buttonIncrease} ancestorScale={RIGHT_SCALE}>
				{#snippet children()}
					<Container x={180} scale={0.55}>
						{@render props.buttonIncrease({ anchor: 0.5 })}
					</Container>
				{/snippet}
			</DraggableInEditor>
		</Container>

		<Container y={context.stateLayoutDerived.mainLayoutStandard().height - 50} x={0}>
			<DraggableInEditor id="buttonAutoSpin" transform={cfg.buttonAutoSpin} ancestorScale={RIGHT_SCALE}>
				{#snippet children()}
					<Container x={-140} scale={0.8}>
						{@render props.buttonAutoSpin({ anchor: 0.5 })}
					</Container>
				{/snippet}
			</DraggableInEditor>
			<DraggableInEditor id="buttonBet" transform={cfg.buttonBet} ancestorScale={RIGHT_SCALE}>
				{#snippet children()}
					<Container scale={1.1}>
						{@render props.buttonBet({ anchor: 0.5 })}
					</Container>
				{/snippet}
			</DraggableInEditor>
			<DraggableInEditor id="buttonTurbo" transform={cfg.buttonTurbo} ancestorScale={RIGHT_SCALE}>
				{#snippet children()}
					<Container x={140} scale={0.8}>
						{@render props.buttonTurbo({ anchor: 0.5 })}
					</Container>
				{/snippet}
			</DraggableInEditor>
		</Container>
	</Container>
</MainContainer>

<MainContainer standard alignVertical="bottom">
	{#if stateUi.freeSpinCounterShow}
		<Container
			x={context.stateLayoutDerived.mainLayoutStandard().width * 0.5}
			y={context.stateLayoutDerived.mainLayoutStandard().height - 130}
		>
			<LabelFreeSpinCounter stacked />
		</Container>
	{/if}

	<FadeContainer
		persistent
		show={stateUi.drawerButtonShow}
		oncomplete={drawerButtonFadeComplete}
		y={drawerButtonTween.current}
	>
		<Container
			x={context.stateLayoutDerived.mainLayoutStandard().width * 0.5 + 440}
			y={context.stateLayoutDerived.mainLayoutStandard().height - 105}
		>
			<ButtonDrawer disabled={!stateUi.drawerButtonShow} anchor={0.5} />
		</Container>
	</FadeContainer>
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
			x={context.stateLayoutDerived.mainLayoutStandard().width * 0.5 - 440}
			y={context.stateLayoutDerived.mainLayoutStandard().height - 400}
		>
			<Container y={-190 - 210 * 3}>{@render props.buttonPayTable({ anchor: 0.5 })}</Container>
			<Container y={-190 - 210 * 2}>{@render props.buttonGameRules({ anchor: 0.5 })}</Container>
			<Container y={-190 - 210 * 1}>{@render props.buttonSettings({ anchor: 0.5 })}</Container>
			<Container y={-190}>{@render props.buttonSoundSwitch({ anchor: 0.5 })}</Container>
			<Container>{@render props.buttonMenuClose({ anchor: 0.5 })}</Container>
		</Container>
	</MainContainer>
{/if}
