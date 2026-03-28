<script lang="ts" module>
	import type { RawSymbol, Position } from '../game/types';

	export type EmitterEventBoard =
		| { type: 'boardSettle'; board: RawSymbol[][] }
		| { type: 'boardShow' }
		| { type: 'boardHide' }
		| {
				type: 'boardWithAnimateSymbols';
				symbolPositions: Position[];
		  };
</script>

<script lang="ts">
	import _ from 'lodash';
	import { waitForResolve } from 'utils-shared/wait';
	import { BoardContext } from 'components-shared';

	import { getContext } from '../game/context';
	import BoardContainer from './BoardContainer.svelte';
	import BoardMask from './BoardMask.svelte';
	import BoardBase from './BoardBase.svelte';

	const context = getContext();

	let show = $state(true);

	context.eventEmitter.subscribeOnMount({
		stopButtonClick: () => context.stateGameDerived.enhancedBoard.stop(),
		boardSettle: ({ board }) => context.stateGameDerived.enhancedBoard.settle(board),
		boardShow: () => (show = true),
		boardHide: () => (show = false),
		boardWithAnimateSymbols: async ({ symbolPositions }) => {
			const getPromises = () => {
				const uniquePositions = _.uniqBy(symbolPositions, (p) => `${p.reel}_${p.row}`);
				return uniquePositions.map(async (position) => {
					const symbolIndex = position.row;
					const reel = context.stateGame.board[position.reel];
					if (reel && reel.reelState.symbols[symbolIndex]) {
						const reelSymbol = reel.reelState.symbols[symbolIndex];
						console.log(`[DEBUG] Animating win for Row ${position.row} (Index ${symbolIndex}) - Symbol: ${reelSymbol.rawSymbol.name} at Y: ${reelSymbol.symbolY.current}`);
						reelSymbol.symbolState = 'win';
						await waitForResolve((resolve) => (reelSymbol.oncomplete = resolve));
						reelSymbol.symbolState = 'postWinStatic';
					} else {
						console.warn(`[DEBUG] MISSING symbol for Board anim: Reel ${position.reel}, Row ${position.row} (Index ${symbolIndex})`);
					}
				});
			};

			await Promise.all(getPromises());
		},
	});

	context.stateGameDerived.enhancedBoard.readyToSpinEffect();
</script>

{#if show}
	<BoardContext animate={false}>
		<BoardContainer>
			<BoardMask />
			<BoardBase />
		</BoardContainer>
	</BoardContext>

	<BoardContext animate={true}>
		<BoardContainer>
			<BoardBase />
		</BoardContainer>
	</BoardContext>
{/if}
