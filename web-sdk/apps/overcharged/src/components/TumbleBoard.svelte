<script lang="ts" module>
	import type { RawSymbol, Position } from '../game/types';

	type AddingBoard = RawSymbol[][];
	type ExplodingPositions = Position[];

	export type EmitterEventTumbleBoard =
		| { type: 'tumbleBoardShow' }
		| { type: 'tumbleBoardHide' }
		| { type: 'tumbleBoardInit'; addingBoard: AddingBoard }
		| { type: 'tumbleBoardReset' }
		| { type: 'tumbleBoardExplode'; explodingPositions: ExplodingPositions }
		| { type: 'tumbleBoardRemoveExploded' }
		| { type: 'tumbleBoardSlideDown' };
</script>

<script lang="ts">
	import _ from 'lodash';
	import { Tween } from 'svelte/motion';
	import { quadOut } from 'svelte/easing';

	import { waitForResolve } from 'utils-shared/wait';

	import TumbleBoardBase from './TumbleBoardBase.svelte';
	import BoardContainer from './BoardContainer.svelte';
	import BoardMask from './BoardMask.svelte';
	import { getSymbolY } from '../game/utils';
	import { getContext } from '../game/context';

	const context = getContext();

	let show = $state(false);

	const createTumbleSymbol = ({ initY, rawSymbol }: { initY: number; rawSymbol: RawSymbol }) => {
		const symbolY = new Tween(initY);
		const oncomplete = () => {};

		const tumbleSymbol = $state({
			symbolY,
			rawSymbol,
			symbolState: 'static' as const,
			oncomplete,
		});

		return tumbleSymbol;
	};

	const initTumbleBoardAdding = ({ addingBoard }: { addingBoard: AddingBoard }) => {
		return context.stateGameDerived.boardRaw().map((_, reelIndex) => {
			const addingReel = addingBoard[reelIndex] ?? [];

			const tumbleReelAdding = addingReel.map((rawSymbol, symbolIndex) => {
				const initY = getSymbolY(symbolIndex - 1 - addingReel.length);
				return createTumbleSymbol({ initY, rawSymbol });
			});

			return tumbleReelAdding;
		});
	};

	const initTumbleBoardBase = () => {
		return context.stateGameDerived.boardRaw().map((rawSymbolReel) => {
			const tumbleReelBase = rawSymbolReel.map((rawSymbol, symbolIndex) => {
				const initY = getSymbolY(symbolIndex - 1);
				return createTumbleSymbol({ initY, rawSymbol });
			});

			return tumbleReelBase;
		});
	};

	context.eventEmitter.subscribeOnMount({
		tumbleBoardShow: () => (show = true),
		tumbleBoardHide: () => (show = false),
		tumbleBoardInit: ({ addingBoard }) => {
			context.stateGame.tumbleBoardAdding = initTumbleBoardAdding({ addingBoard });
			context.stateGame.tumbleBoardBase = initTumbleBoardBase();
		},
		tumbleBoardReset: () => {
			context.stateGame.tumbleBoardAdding = [];
			context.stateGame.tumbleBoardBase = [];
		},
		tumbleBoardExplode: async ({ explodingPositions }) => {
			const getPromises = () => {
				const uniquePositions = _.uniqBy(explodingPositions, (p) => `${p.reel}_${p.row}`);
				return uniquePositions.map(async (position) => {
					const symbolIndex = position.row;
					const reel = context.stateGame.tumbleBoardBase[position.reel];
					if (reel && reel[symbolIndex]) {
						const tumbleSymbol = reel[symbolIndex];
						tumbleSymbol.symbolState = 'explosion';

						// Safeguard: Timeout after 3 seconds if animation doesn't complete
						await Promise.race([
							waitForResolve((resolve) => (tumbleSymbol.oncomplete = resolve)),
							new Promise((resolve) => setTimeout(resolve, 3000))
						]);
					}
				});
			};

			await Promise.all(getPromises());
		},
		skipAnimation: () => {
			// 1. Resolve every in-flight symbol explosion so tumbleBoardExplode's
			//    Promise.all completes immediately.
			for (const reel of context.stateGame.tumbleBoardBase) {
				for (const sym of reel) {
					if (sym.symbolState === 'explosion' && sym.oncomplete) {
						sym.oncomplete();
					}
				}
			}
			// 2. Snap every in-flight slide-down tween to its target AND resolve its
			//    await via oncomplete. The set({duration:0}) below aborts the running
			//    200ms tween, but Svelte does NOT fulfil that aborted tween's promise,
			//    so we must call oncomplete() explicitly — otherwise tumbleBoardSlideDown
			//    hangs forever (the "rapid Space locks the flow" bug).
			for (const reel of context.stateGame.tumbleBoardBase) {
				for (const sym of reel) {
					if (sym.symbolY && typeof sym.symbolY.set === 'function') {
						sym.symbolY.set(sym.symbolY.target, { duration: 0 });
					}
					if (sym.oncomplete) sym.oncomplete();
				}
			}
			for (const reel of context.stateGame.tumbleBoardAdding) {
				for (const sym of reel) {
					if (sym.symbolY && typeof sym.symbolY.set === 'function') {
						sym.symbolY.set(sym.symbolY.target, { duration: 0 });
					}
					if (sym.oncomplete) sym.oncomplete();
				}
			}
		},
		tumbleBoardRemoveExploded: () => {
			context.stateGame.tumbleBoardBase.forEach((tumbleReel, reelIndex) => {
				context.stateGame.tumbleBoardBase[reelIndex] = tumbleReel.filter(
					(tumbleSymbol) => tumbleSymbol.symbolState !== 'explosion',
				);
			});
		},
		tumbleBoardSlideDown: async () => {
			const getPromises = () =>
				_.flatten(
					context.stateGameDerived.tumbleBoardCombined().map((tumbleReel) => {
						return tumbleReel.map((tumbleSymbol, symbolIndex) => {
							const targetY = getSymbolY(symbolIndex - 1); // Refer to initTumbleBoardBase
							if (targetY === tumbleSymbol.symbolY.current) return Promise.resolve();

							const bounceDuration = 200;

							// We await an `oncomplete` resolver, NOT the set-promise directly.
							// skipAnimation snaps the position with another set({duration:0}),
							// and Svelte's Tween aborts the in-flight (200ms) tween WITHOUT
							// fulfilling its promise (loop.abort() never calls fulfill). Awaiting
							// that orphaned promise would hang tumbleBoardSlideDown forever — the
							// exact "üst üste Space → akış kilitlenir" bug. The resolver is fired
							// by the tween's own .then OR by skip; a timeout is a final safety net.
							const done = Promise.race([
								waitForResolve((resolve) => (tumbleSymbol.oncomplete = resolve)),
								new Promise((resolve) => setTimeout(resolve, 1000)),
							]);

							tumbleSymbol.symbolY
								.set(targetY, {
									duration: bounceDuration,
									// quadOut decelerates toward target without overshooting.
									// backOut overshot bottom row past SymbolWrap's inFrame
									// limit, briefly unmounting the symbol → flicker.
									easing: quadOut,
								})
								.then(() => {
									if (symbolIndex > 0 && symbolIndex < tumbleReel.length - 1) {
										// Land animation disabled. The symbol is already in 'static'
										// state (default from createTumbleSymbol), so DON'T reassign —
										// any $state write triggers reactivity and re-mounts the Spine
										// instance, producing a per-symbol flicker as each tween settles.
										context.stateGameDerived.onSymbolLand({ rawSymbol: tumbleSymbol.rawSymbol });
									}
									tumbleSymbol.oncomplete();
								});

							return done;
						});
					}),
				);

			await Promise.all(getPromises());
		},
	});
</script>

{#if show}
	<BoardContainer>
		<BoardMask />
		<TumbleBoardBase />
	</BoardContainer>
{/if}
