<script lang="ts" module>
	import type { RawSymbol, Position, SymbolState } from '../game/types';

	export type EmitterEventBoard =
		| { type: 'boardSettle'; board: RawSymbol[][] }
		| { type: 'boardShow' }
		| { type: 'boardHide' }
		| {
				type: 'boardWithAnimateSymbols';
				symbolPositions: (Position & { multiplier?: number })[];
				state?: SymbolState;
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
		boardWithAnimateSymbols: async ({ symbolPositions, state = 'win' }) => {
			const getPromises = () => {
				const uniquePositions = _.uniqBy(symbolPositions, (p) => `${p.reel}_${p.row}`);
				return uniquePositions.map(async (position) => {
					const symbolIndex = position.row;
					const reel = context.stateGame.board[position.reel];
					if (reel && reel.reelState.symbols[symbolIndex]) {
						const reelSymbol = reel.reelState.symbols[symbolIndex];
						console.log(`[DEBUG] Animating ${state} for Reel ${position.reel} Row ${position.row} (Index ${symbolIndex}) - Symbol: ${reelSymbol.rawSymbol.name}`);

						if (position.multiplier !== undefined) {
							reelSymbol.rawSymbol.multiplier = position.multiplier;
						}

						reelSymbol.symbolState = state;
						
						// Safety timeout: 2000ms max wait for animation complete
						await Promise.race([
							waitForResolve((resolve) => (reelSymbol.oncomplete = resolve)),
							new Promise((resolve) => setTimeout(resolve, 2000))
						]);
						
						if (state === 'win') {
							reelSymbol.symbolState = 'postWinStatic';
						}
					} else {
						console.warn(`[DEBUG] MISSING symbol for Board anim: Reel ${position.reel}, Row ${position.row} (Index ${symbolIndex})`);
					}
				});
			};

			await Promise.all(getPromises());
			console.log(`[DEBUG] boardWithAnimateSymbols finished all promises`);
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
