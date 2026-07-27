<script lang="ts" module>
	export type EmitterEventFreeSpinCounter =
		| { type: 'freeSpinCounterShow' }
		| { type: 'freeSpinCounterHide' }
		| { type: 'freeSpinCounterUpdate'; current?: number; total?: number };
</script>

<script lang="ts">
	import { MainContainer } from 'components-layout';
	import { FadeContainer } from 'components-pixi';

	import { getContext } from '../game/context';
	import { SYMBOL_SIZE } from '../game/constants';
	import { anchorToPivot, BitmapText, Container, Sprite, type Sizes } from 'pixi-svelte';

	const context = getContext();
	const PANEL_KEY_DESKTOP = 'Frame_FSCounter.png';
	const PANEL_RATIO_DESKTOP = 824 / 622;
	const panelKey = PANEL_KEY_DESKTOP;
	const panelWidth = $derived(SYMBOL_SIZE * 2);
	const panelSizes = $derived({
		width: panelWidth,
		height: panelWidth / PANEL_RATIO_DESKTOP,
	});
	const scale = 1;
	// Portrait: the board spans ~the full canvas width (no side gutter like
	// landscape has), so the desktop/landscape formula below — parking the
	// panel OUTSIDE the board's left edge — pushes it off-canvas entirely
	// (this is why it was gated off for portrait in Game.svelte). Instead,
	// park it INSIDE the board's top-right corner, lifted above the grid into
	// the character banner zone (mirrors the mana-bar cluster on the left).
	const position = $derived(
		context.stateLayoutDerived.layoutType() === 'portrait'
			? {
					x:
						context.stateGameDerived.boardLayout().x +
						context.stateGameDerived.boardLayout().width * 0.5 -
						panelSizes.width -
						SYMBOL_SIZE * 0.3,
					y:
						context.stateGameDerived.boardLayout().y -
						context.stateGameDerived.boardLayout().height * 0.5 -
						panelSizes.height -
						SYMBOL_SIZE * 0.5,
				}
			: {
					x:
						context.stateGameDerived.boardLayout().x -
						context.stateGameDerived.boardLayout().width * 0.5 -
						panelSizes.width -
						SYMBOL_SIZE * 0.7,
					y:
						context.stateGameDerived.boardLayout().y -
						context.stateGameDerived.boardLayout().height * 0.5,
				},
	);

	const fontSize = SYMBOL_SIZE * 0.275;

	let show = $state(false);
	let current = $state(0);
	let total = $state(0);
	let titleSizes: Sizes = $state({ width: 0, height: 0 });
	let counterSizes: Sizes = $state({ width: 0, height: 0 });

	const textContainerSizes = $derived({
		width: titleSizes.width,
		height: titleSizes.height + counterSizes.height,
	});
	const counterPosition = $derived({ x: titleSizes.width / 2, y: titleSizes.height });

	context.eventEmitter.subscribeOnMount({
		freeSpinCounterShow: () => (show = true),
		freeSpinCounterHide: () => (show = false),
		freeSpinCounterUpdate: (emitterEvent) => {
			if (emitterEvent.current !== undefined) current = emitterEvent.current;
			if (emitterEvent.total !== undefined) total = emitterEvent.total;
		},
	});
</script>

<MainContainer>
	<FadeContainer {show} {...position} {scale}>
		<Sprite key={panelKey} {...panelSizes} />
		<Container
			x={panelSizes.width * 0.5}
			y={panelSizes.height * 0.48}
			pivot={anchorToPivot({
				sizes: textContainerSizes,
				anchor: { x: 0.5, y: 0.5 },
			})}
		>
			<BitmapText
				text={'FREE SPIN'}
				style={{
					fontFamily: 'gold',
					fontSize,
					wordWrap: false,
				}}
				onresize={(sizes) => (titleSizes = sizes)}
			/>
			<BitmapText
				text={`${current} OF ${total}`}
				{...counterPosition}
				anchor={{ x: 0.5, y: 0 }}
				style={{
					fontFamily: 'gold',
					fontSize,
				}}
				onresize={(sizes) => (counterSizes = sizes)}
			/>
		</Container>
	</FadeContainer>
</MainContainer>
