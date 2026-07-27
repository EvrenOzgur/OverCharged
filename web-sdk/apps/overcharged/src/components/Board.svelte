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
		  }
		| { type: 'boardSymbolsReset' };
</script>

<script lang="ts">
	import _ from 'lodash';
	import { waitForResolve } from 'utils-shared/wait';

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
		boardSymbolsReset: () => {
			context.stateGame.board.forEach((reel) => {
				reel.reelState.symbols.forEach((symbol) => {
					symbol.symbolState = 'static';
					symbol.oncomplete = () => {};
				});
			});
		},
		boardWithAnimateSymbols: async ({ symbolPositions, state = 'win' }) => {
			// MODE / skipExplosions: bypass the green L2 explosion burst (state==='explosion').
			// We don't even flip the symbols to 'explosion' — they're overwritten by the
			// following tumbleBoard/boardSettle anyway, so skipping the state-set avoids a
			// one-frame explosion flash. Win animations (state==='win') are untouched.
			const skipExplosion = context.stateGame.skipExplosions && state === 'explosion';
			if (skipExplosion) return;

			const getPromises = () => {
				const uniquePositions = _.uniqBy(symbolPositions, (p) => `${p.reel}_${p.row}`);
				return uniquePositions.map(async (position) => {
					const symbolIndex = position.row;
					const reel = context.stateGame.board[position.reel];
					if (reel && reel.reelState.symbols[symbolIndex]) {
						const reelSymbol = reel.reelState.symbols[symbolIndex];

						if (position.multiplier !== undefined) {
							reelSymbol.rawSymbol.multiplier = position.multiplier;
						}

						reelSymbol.symbolState = state;

						// Safety net in case the spine 'complete' event doesn't fire (e.g. track
						// interrupted). Longest declared symbol animation is 'win' at 1.333s, so
						// 1700ms gives ~28% headroom without adding a needless extra ~700ms wait
						// on every winning tumble step (the old 2000ms cap always won the race
						// against 'win' in practice, turning its 1.333s animation into a de facto
						// 2s wait).
						await Promise.race([
							waitForResolve((resolve) => (reelSymbol.oncomplete = resolve)),
							new Promise((resolve) => setTimeout(resolve, 1700)),
						]);

						if (state === 'win') {
							reelSymbol.symbolState = 'postWinStatic';
						}
					}
				});
			};

			await Promise.all(getPromises());
		},
		skipAnimation: () => {
			// Reel'lerin interruptible bekleyişlerini kes — özellikle anticipation
			// (scatter bekleme) reel'inin uzun `waitToStartFallingIn`'ini kısaltıp
			// sütunun hemen yerleşmesini sağlar. Turbo'ya DOKUNMAZ (stop butonundan
			// farklı olarak isTurbo'yu açmaz). reel'ler spinmiyorsa no-op.
			context.stateGameDerived.enhancedBoard.stop();
			// Resolve every in-flight symbol oncomplete so the cluster-win
			// boardWithAnimateSymbols Promise.all completes immediately.
			for (const reel of context.stateGame.board) {
				for (const sym of reel.reelState.symbols) {
					if (sym.oncomplete) sym.oncomplete();
				}
			}
		},
	});

	context.stateGameDerived.enhancedBoard.readyToSpinEffect();
</script>

<!-- Always mounted; `visible` toggles Pixi-level rendering only. This used to
     be `{#if show}` (full conditional mount) — unmounting/remounting the
     whole board on every boardHide/boardShow (once per tumble step, right
     as boardSettle swaps in the new settled symbols) destroyed and recreated
     EVERY symbol's Spine instance, which flashes back to its setup pose for
     an instant on remount — a whole-board flicker, not just the symbols that
     actually dropped. Keeping it mounted and only hiding it preserves each
     Spine instance's state across the hide/show, so only symbols whose state
     genuinely changes (the falling ones) show any visual transition. -->
<BoardContainer visible={show}>
	<BoardMask />
	<BoardBase />
</BoardContainer>
