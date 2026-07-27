import _ from 'lodash';

import { recordBookEvent, checkIsMultipleRevealEvents, type BookEventHandlerMap } from 'utils-book';
import { stateBet, stateBetDerived, stateUi } from 'state-shared';

import { eventEmitter } from './eventEmitter';
import { playBookEvent } from './utils';
import { winLevelMap, type WinLevel, type WinLevelData } from './winLevelMap';
import { stateGame, stateGameDerived } from './stateGame.svelte';
import { SKILL_L3_ASSETS } from './skillAssets';
import { timingConfig } from './timingConfig.svelte';
import type { BookEvent, BookEventOfType, BookEventContext } from './typesBookEvent';
import type { Position, SymbolState } from './types';

// ─── skipAnimation-interruptible timeout ──────────────────────────────
// `setTimeout` waits used in this handler map can now be short-circuited
// by a global `skipAnimation` broadcast (Space key). We keep a list of
// pending resolvers; on each skipAnimation broadcast they all fire and
// the awaiting `await` returns immediately.
const skipResolvers: Array<() => void> = [];

eventEmitter.subscribe({
	skipAnimation: () => {
		// Snapshot + clear so newly registered waits (e.g. chained after the
		// resolved one) don't get accidentally cancelled by this same broadcast.
		const drained = skipResolvers.splice(0, skipResolvers.length);
		for (const resolve of drained) resolve();
	},
});

function waitForSkipOrTimeout(ms: number): Promise<void> {
	return new Promise<void>((resolve) => {
		const timer = setTimeout(() => {
			const idx = skipResolvers.indexOf(skipResolve);
			if (idx >= 0) skipResolvers.splice(idx, 1);
			resolve();
		}, ms);
		const skipResolve = () => {
			clearTimeout(timer);
			resolve();
		};
		skipResolvers.push(skipResolve);
	});
}

// Minimum time the settled board must stay visible after a tumble, before the
// next tumble's explosion starts. Deliberately NOT skip-aware (unlike every
// other wait above) — under continuous Space/turbo skip, `skipAnimation`
// fires every animation frame and would otherwise let two consecutive
// tumbles resolve back-to-back with no visible gap between them.
// Value lives in timingConfig.tumble.minTumbleViewMs (see game/timingConfig.svelte.ts),
// scaled by turbo's timeScale so the floor shrinks proportionally like every
// other tumble wait instead of becoming relatively longer under turbo.
function waitMinTumbleView(): Promise<void> {
	return new Promise<void>((resolve) =>
		setTimeout(resolve, timingConfig.tumble.minTumbleViewMs / stateBetDerived.timeScale()),
	);
}

// Wait one rendered frame (used by `tumbleBoard` to let freshly-mounted Spine
// instances settle off-screen before reveal — see its handler below). Bounded
// with a timeout fallback: if requestAnimationFrame never fires (tab/iframe
// loses visibility, gets throttled, etc.) this must not hang the whole tumble
// sequence forever — the exact same failure class every other wait in this
// file is already guarded against (see waitForResolve/Promise.race usage in
// TumbleBoard.svelte and the "Svelte Tween skip orphan hang" precedent).
function waitFrame(): Promise<void> {
	return new Promise<void>((resolve) => {
		let done = false;
		const finish = () => {
			if (done) return;
			done = true;
			resolve();
		};
		requestAnimationFrame(finish);
		setTimeout(finish, 250);
	});
}

// ─── Deferred global-multiplier tick-up ────────────────────────────────
// Math emits `multiplierSymbolActivated` (+ a redundant `updateGlobalMult`
// echo) right after that tumble step's `winInfo`, but BEFORE the matching
// `tumbleBoard` event that actually explodes/collects that same win — see
// game_executables.py's `activate_pending_multipliers` docstring: this
// ordering is deliberate on the math side (the coin's own visual "collect"
// flip is deferred all the way to `finalMultiplierApplied`, at the very end
// of the whole tumble sequence, once nothing is left to explode).
// But the top-right multiplier BADGE ticking up mid-flash, before that
// win's symbols have even exploded, reads as premature. We keep the math
// event order untouched (it's already correct/gated on total_win > 0) and
// instead defer just the front-end's visual tick-up animation to land at
// the end of THIS tumble step — i.e. once its own `tumbleBoard` explosion +
// slide-down has settled — rather than the moment the event arrives.
let pendingGlobalMultiplierUpdate: number | null = null;

async function flushPendingGlobalMultiplierUpdate() {
	if (pendingGlobalMultiplierUpdate === null) return;
	const multiplier = pendingGlobalMultiplierUpdate;
	pendingGlobalMultiplierUpdate = null;
	eventEmitter.broadcast({ type: 'globalMultiplierShow' });
	await eventEmitter.broadcastAsync({ type: 'globalMultiplierUpdate', multiplier });
}

const winLevelSoundsPlay = ({ winLevelData }: { winLevelData: WinLevelData }) => {
	if (winLevelData?.alias === 'max') eventEmitter.broadcastAsync({ type: 'uiHide' });
	if (winLevelData?.sound?.sfx) {
		eventEmitter.broadcast({ type: 'soundOnce', name: winLevelData.sound.sfx });
	}
	if (winLevelData?.sound?.bgm) {
		eventEmitter.broadcast({ type: 'soundMusic', name: winLevelData.sound.bgm });
	}
	// sfx_bigwin_coinloop used to loop here for every big-win-type screen, but it
	// overlapped with sfx_coincount_loop (Win.svelte's count-up loop, wired for
	// the same screens) — coincount now owns that role, timed to the actual
	// count-up instead of the whole win presentation.
};

const winLevelSoundsStop = ({
	winLevelData,
	skipEndSound = false,
}: {
	winLevelData: WinLevelData;
	// freeSpinEnd (bonus-end Congratulations screen) plays sfx_winlevel_end
	// itself when the screen APPEARS instead — skip it here or it fires a
	// second time when that same screen tears down.
	skipEndSound?: boolean;
}) => {
	// Closing sting for the big-win-and-above presentation (big/superwin/
	// mega/epic/max — winLevelMap's `type: 'big'`), right as its screen
	// tears down.
	if (winLevelData?.type === 'big' && !skipEndSound) {
		eventEmitter.broadcast({ type: 'soundOnce', name: 'sfx_winlevel_end' });
	}
	if (stateBet.activeBetModeKey === 'SUPERSPIN' || stateGame.gameType === 'freegame') {
		// check if SUPERSPIN, when finishing a bet.
		eventEmitter.broadcast({ type: 'soundMusic', name: 'bgm_freespin' });
	} else {
		eventEmitter.broadcast({ type: 'soundMusic', name: 'bgm_main' });
	}
	eventEmitter.broadcastAsync({ type: 'uiShow' });
};

const animateSymbols = async ({
	positions,
	state = 'win',
}: {
	positions: (Position & { multiplier?: number })[];
	state?: SymbolState;
}) => {
	eventEmitter.broadcast({ type: 'boardShow' });
	await eventEmitter.broadcastAsync({
		type: 'boardWithAnimateSymbols',
		symbolPositions: positions,
		state,
	});
};

export const bookEventHandlerMap: BookEventHandlerMap<BookEvent, BookEventContext> = {
	reveal: async (bookEvent: BookEventOfType<'reveal'>, { bookEvents }: BookEventContext) => {
		eventEmitter.broadcast({ type: 'tumbleWinAmountReset' });

		// Immediate reset of meters and multiplier for base game spins to improve UX
		if (bookEvent.gameType === 'basegame') {
			stateGame.skillMeters = { L1: 0, L2: 0, L3: 0, L4: 0 };
			stateGame.globalMultiplier = 1;
		}

		const isBonusGame = checkIsMultipleRevealEvents({ bookEvents });
		if (isBonusGame) {
			eventEmitter.broadcast({ type: 'stopButtonEnable' });
			try {
				const res = recordBookEvent({ bookEvent }) as any;
				if (res && typeof res.catch === 'function') {
					res.catch(() => {});
				}
			} catch {}
		}

		stateGame.gameType = bookEvent.gameType;

		// Lookahead: Pre-populate multipliers on the board so they show "on landing"
		bookEvent.board.forEach((reel, reelIdx) => {
			reel.forEach((symbol, rowIdx) => {
				if (symbol.name === 'M') {
					const activation = bookEvents.find(
						(e) =>
							e.type === 'multiplierSymbolActivated' &&
							e.symbols.some((s) => s.reel === reelIdx && s.row === rowIdx),
					) as BookEventOfType<'multiplierSymbolActivated'> | undefined;

					if (activation) {
						const symbolData = activation.symbols.find((s) => s.reel === reelIdx && s.row === rowIdx);
						if (symbolData) {
							symbol.multiplier = symbolData.value;
						}
					}
				}
			});
		});

		await stateGameDerived.enhancedBoard.spin({ revealEvent: bookEvent });
		eventEmitter.broadcast({ type: 'soundScatterCounterClear' });
	},
	winInfo: async (bookEvent: BookEventOfType<'winInfo'>) => {
		// The floating win-amount labels (cluster win numbers combining with the
		// multiplier, drifting up, fading out) are a separate visual layer from
		// the board — they don't need to finish before the next tumble starts.
		// Only the win-state symbol flash (promise1) gates progression, since
		// tumbleBoard hides that same board layer right after. Not awaiting
		// promise2 lets win labels keep floating away WHILE the next cascade's
		// explosion already begins underneath — this is what makes back-to-back
		// tumbles feel continuous instead of gated by a multi-second win popup.
		eventEmitter.broadcast({ type: 'soundOnce', name: 'sfx_winlevel_small' });
		eventEmitter.broadcast({
			type: 'showClusterWinAmounts',
			wins: bookEvent.wins.map((win) => {
				return {
					win: win.meta.winWithoutMult,
					mult: win.meta.globalMult,
					result: win.meta.winWithoutMult * win.meta.globalMult,
					reel: win.meta.overlay.reel,
					row: win.meta.overlay.row,
				};
			}),
		});
		await animateSymbols({ positions: _.flatten(bookEvent.wins.map((win) => win.positions)) });
	},
	updateTumbleWin: async (bookEvent: BookEventOfType<'updateTumbleWin'>) => {
		if (bookEvent.amount > 0) {
			eventEmitter.broadcast({ type: 'tumbleWinAmountShow' });
			eventEmitter.broadcast({
				type: 'tumbleWinAmountUpdate',
				amount: bookEvent.amount,
				animate: false,
			});
		}
	},
	setTotalWin: async (bookEvent: BookEventOfType<'setTotalWin'>) => {
		stateBet.winBookEventAmount = bookEvent.amount;
	},
	freeSpinTrigger: async (bookEvent: BookEventOfType<'freeSpinTrigger'>) => {
		// animate scatters
		eventEmitter.broadcast({ type: 'soundOnce', name: 'sfx_scatter_win_v2' });
		await animateSymbols({ positions: bookEvent.positions });
		// show free spin intro
		// sfx_superfreespin used to play here, back-to-back with jng_intro_fs
		// (transition1) a moment later — overlapping jingles. jng_intro_fs now
		// owns the whole "entering bonus" transition sound alone.
		await eventEmitter.broadcastAsync({ type: 'uiHide' });
		// EXPERIMENTAL: try sfx_winlevel_end during the base->bonus transition
		// animation, right as it starts.
		eventEmitter.broadcast({ type: 'soundOnce', name: 'sfx_winlevel_end' });
		await eventEmitter.broadcastAsync({ type: 'transition' });
		eventEmitter.broadcast({ type: 'freeSpinIntroShow' });
		eventEmitter.broadcast({ type: 'soundOnce', name: 'jng_intro_fs' });
		eventEmitter.broadcast({ type: 'soundMusic', name: 'bgm_freespin' });
		await eventEmitter.broadcastAsync({
			type: 'freeSpinIntroUpdate',
			totalFreeSpins: bookEvent.totalFs,
			addedFs: bookEvent.addedFs,
			isRetrigger: false,
		});
		stateGame.gameType = 'freegame';
		// Math resets skill meters in `reset_fs_spin` on FS entry; mirror that
		// here so the UI does not carry base-game meter values into the first
		// FS spin. Retriggers keep their meters (see `freeSpinRetrigger`).
		stateGame.skillMeters = { L1: 0, L2: 0, L3: 0, L4: 0 };
		eventEmitter.broadcast({ type: 'freeSpinIntroHide' });
		eventEmitter.broadcast({ type: 'globalMultiplierShow' });
		await eventEmitter.broadcastAsync({
			type: 'globalMultiplierUpdate',
			multiplier: 1, // resets when multiplier === 1
		});
		eventEmitter.broadcast({ type: 'freeSpinCounterShow' });
		eventEmitter.broadcast({
			type: 'freeSpinCounterUpdate',
			current: undefined,
			total: bookEvent.totalFs,
		});
		// Drives the footer HUD's bonus bar (TOTAL WIN / FREE SPINS N of M).
		stateUi.freeSpinCounterCurrent = 0;
		stateUi.freeSpinCounterTotal = bookEvent.totalFs;
		stateUi.freeSpinCounterShow = true;
		await eventEmitter.broadcastAsync({ type: 'uiShow' });
		await eventEmitter.broadcastAsync({ type: 'drawerButtonShow' });
		eventEmitter.broadcast({ type: 'drawerFold' });
	},
	freeSpinRetrigger: async (bookEvent: BookEventOfType<'freeSpinTrigger'>) => {
		// animate scatters
		eventEmitter.broadcast({ type: 'soundOnce', name: 'sfx_scatter_win_v2' });
		await animateSymbols({ positions: bookEvent.positions });
		// show free spin intro
		// sfx_superfreespin used to play here, back-to-back with jng_intro_fs
		// (transition1) a moment later — overlapping jingles. jng_intro_fs now
		// owns the whole "entering bonus" transition sound alone.
		await eventEmitter.broadcastAsync({ type: 'uiHide' });
		await eventEmitter.broadcastAsync({ type: 'transition' });
		eventEmitter.broadcast({ type: 'freeSpinIntroShow' });
		eventEmitter.broadcast({ type: 'soundOnce', name: 'jng_intro_fs' });
		eventEmitter.broadcast({ type: 'soundMusic', name: 'bgm_freespin' });
		await eventEmitter.broadcastAsync({
			type: 'freeSpinIntroUpdate',
			totalFreeSpins: bookEvent.totalFs,
			addedFs: bookEvent.addedFs,
			isRetrigger: true,
		});
		stateGame.gameType = 'freegame';
		eventEmitter.broadcast({ type: 'freeSpinIntroHide' });
		eventEmitter.broadcast({ type: 'globalMultiplierShow' });
		// Retrigger does NOT reset the math global multiplier — preserve the
		// current value so the display doesn't dip to 1× and snap back.
		// Multiplier within a free-spin session only stays the same or grows.
		await eventEmitter.broadcastAsync({
			type: 'globalMultiplierUpdate',
			multiplier: stateGame.globalMultiplier,
		});
		eventEmitter.broadcast({ type: 'freeSpinCounterShow' });
		eventEmitter.broadcast({
			type: 'freeSpinCounterUpdate',
			current: undefined,
			total: bookEvent.totalFs,
		});
		// Retrigger keeps progress — only the total grows, mirroring the math's
		// meter-retention behaviour above.
		stateUi.freeSpinCounterTotal = bookEvent.totalFs;
		stateUi.freeSpinCounterShow = true;
		await eventEmitter.broadcastAsync({ type: 'uiShow' });
	},
	updateFreeSpin: async (bookEvent: BookEventOfType<'updateFreeSpin'>) => {
		eventEmitter.broadcast({ type: 'freeSpinCounterShow' });
		eventEmitter.broadcast({
			type: 'freeSpinCounterUpdate',
			current: bookEvent.amount,
			total: bookEvent.total,
		});
		stateUi.freeSpinCounterCurrent = bookEvent.amount;
		stateUi.freeSpinCounterTotal = bookEvent.total;
		stateUi.freeSpinCounterShow = true;
	},
	updateGlobalMult: async (bookEvent: BookEventOfType<'updateGlobalMult'>) => {
		// Math always emits this right after multiplierSymbolActivated with the
		// identical value (a redundant sync) — that case is already stashed as
		// a pending tick-up (see flushPendingGlobalMultiplierUpdate above), so
		// skip re-processing it here to avoid firing the animation early.
		// Standalone calls (e.g. free-spin start, syncing a carried-over
		// multiplier) have no preceding tumble to defer to and still apply
		// immediately, same as before.
		if (pendingGlobalMultiplierUpdate !== null && bookEvent.globalMult === pendingGlobalMultiplierUpdate) {
			return;
		}
		eventEmitter.broadcast({ type: 'globalMultiplierShow' });
		if (bookEvent.globalMult === 1) {
			eventEmitter.broadcast({ type: 'tumbleWinAmountReset' });
		}
		stateGame.globalMultiplier = bookEvent.globalMult;
		await eventEmitter.broadcastAsync({
			type: 'globalMultiplierUpdate',
			multiplier: bookEvent.globalMult, // resets when multiplier === 1
		});
	},
	multiplierSymbolActivated: async (bookEvent: BookEventOfType<'multiplierSymbolActivated'>) => {
		// DON'T flip the coin here — the "collect" flip is deferred to the end of
		// the tumble (finalMultiplierApplied), once nothing is left to explode.
		// The coin stays frozen on its value (set via the reveal look-ahead).
		// The badge's own tick-up animation is ALSO deferred now — stash it and
		// let `tumbleBoard` flush it once this same tumble step's explosion +
		// slide-down has settled (see flushPendingGlobalMultiplierUpdate above).
		// Internal state updates immediately so any other math-driven reads of
		// stateGame.globalMultiplier stay correct in the meantime — only the
		// visible animation is delayed (slot_multi_next, which will show the
		// new value, isn't the visible layer until the increment animation
		// actually reveals it).
		stateGame.globalMultiplier = bookEvent.newGlobalMultiplier;
		pendingGlobalMultiplierUpdate = bookEvent.newGlobalMultiplier;
	},
	freeSpinEnd: async (bookEvent: BookEventOfType<'freeSpinEnd'>) => {
		const winLevelData = winLevelMap[bookEvent.winLevel as WinLevel];

		await eventEmitter.broadcastAsync({ type: 'uiHide' });
		stateGame.gameType = 'basegame';
		eventEmitter.broadcast({ type: 'globalMultiplierHide' });
		eventEmitter.broadcast({ type: 'freeSpinOutroShow' });
		eventEmitter.broadcast({ type: 'soundOnce', name: 'sfx_winlevel_end' });
		winLevelSoundsPlay({ winLevelData });
		await eventEmitter.broadcastAsync({
			type: 'freeSpinOutroCountUp',
			amount: bookEvent.amount,
			winLevelData,
		});
		winLevelSoundsStop({ winLevelData, skipEndSound: true });
		eventEmitter.broadcast({ type: 'freeSpinOutroHide' });
		eventEmitter.broadcast({ type: 'freeSpinCounterHide' });
		stateUi.freeSpinCounterShow = false;
		eventEmitter.broadcast({ type: 'globalMultiplierHide' });
		eventEmitter.broadcast({ type: 'tumbleWinAmountHide' });
		await eventEmitter.broadcastAsync({ type: 'transition' });
		await eventEmitter.broadcastAsync({ type: 'uiShow' });
		await eventEmitter.broadcastAsync({ type: 'drawerUnfold' });
		eventEmitter.broadcast({ type: 'drawerButtonHide' });
	},
	tumbleBoard: async (bookEvent: BookEventOfType<'tumbleBoard'>) => {
		// TumbleBoardBase rebuilds a fresh TumbleSymbol (fresh Tween, fresh
		// Spine mount) for EVERY symbol on tumbleBoardInit — not just the
		// exploding/falling ones — so every one of them briefly flashes to
		// its Spine setup pose the instant it first becomes visible (a
		// whole-board flicker, not just the falling symbols). TumbleBoard is
		// rendered ON TOP of Board (see Game.svelte), so hiding/showing Board
		// around this moment can't mask it — whatever paints on the TumbleBoard
		// layer is what the player sees regardless of Board's own visibility.
		// Instead: init the data while TumbleBoard is still invisible
		// (tumbleBoardInit no longer implies tumbleBoardShow), let its fresh
		// Spine instances settle for a couple of frames off-screen, THEN
		// reveal it — so the flash-to-setup-pose happens before anyone can
		// see it.
		eventEmitter.broadcast({ type: 'tumbleBoardInit', addingBoard: bookEvent.newSymbols });
		await waitFrame();
		await waitFrame();
		eventEmitter.broadcast({ type: 'tumbleBoardShow' });
		eventEmitter.broadcast({ type: 'boardHide' });
		eventEmitter.broadcast({ type: 'soundOnce', name: 'sfx_multiplier_explosion_b' });
		await eventEmitter.broadcastAsync({
			type: 'tumbleBoardExplode',
			explodingPositions: bookEvent.explodingSymbols,
		});
		eventEmitter.broadcast({ type: 'tumbleBoardRemoveExploded' });
		await eventEmitter.broadcastAsync({ type: 'tumbleBoardSlideDown' });
		eventEmitter.broadcast({
			type: 'boardSettle',
			board: stateGameDerived
				.tumbleBoardCombined()
				.map((tumbleReel) => tumbleReel.map((tumbleSymbol) => tumbleSymbol.rawSymbol)),
		});
		// Show static Board first, give it one frame to paint, then hide
		// the TumbleBoard so the layers overlap instead of leaving a gap.
		eventEmitter.broadcast({ type: 'boardShow' });
		await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
		// This tumble step has now visually settled — this is "the end of the
		// tumble" a multiplier symbol from this step should land on, so flush
		// any pending badge tick-up here (no-op if this step had none).
		await flushPendingGlobalMultiplierUpdate();
		// Let the settled board be visible for a beat before the next tumble
		// starts exploding — see waitMinTumbleView's comment.
		await waitMinTumbleView();
		eventEmitter.broadcast({ type: 'tumbleBoardHide' });
		eventEmitter.broadcast({ type: 'tumbleBoardReset' });
	},
	setWin: async (bookEvent: BookEventOfType<'setWin'>) => {
		const winLevelData = winLevelMap[bookEvent.winLevel as WinLevel];

		// Gate the Win overlay (count-up, big-win animation, PressToContinue,
		// coin shower) to wins at or above 10x base bet. Math writes amount as
		// bet-multiplier * 100, so 10x = 1000.
		const WIN_OVERLAY_MIN_AMOUNT = 1000;
		if (bookEvent.amount < WIN_OVERLAY_MIN_AMOUNT) return;

		eventEmitter.broadcast({ type: 'winShow' });
		winLevelSoundsPlay({ winLevelData });
		await eventEmitter.broadcastAsync({
			type: 'winUpdate',
			amount: bookEvent.amount,
			winLevelData,
		});
		winLevelSoundsStop({ winLevelData });
		eventEmitter.broadcast({ type: 'winHide' });
	},

	finalWin: async (bookEvent: BookEventOfType<'finalWin'>) => {
		eventEmitter.broadcast({ type: 'multiplierGridClear' });
		eventEmitter.broadcast({ type: 'multiplierGridHide' });
		eventEmitter.broadcast({ type: 'globalMultiplierHide' });
		eventEmitter.broadcast({ type: 'tumbleWinAmountHide' });
	},
	wincap: async (bookEvent: BookEventOfType<'wincap'>) => {
		// Wincap hit: math locks the payout at config.wincap and skips remaining
		// tumbles/free spins. Play the max-win presentation here.
		const winLevelData = winLevelMap[10 as WinLevel];

		eventEmitter.broadcast({ type: 'winShow' });
		winLevelSoundsPlay({ winLevelData });
		await eventEmitter.broadcastAsync({
			type: 'winUpdate',
			amount: bookEvent.amount,
			winLevelData,
		});
		winLevelSoundsStop({ winLevelData });
		eventEmitter.broadcast({ type: 'winHide' });
	},
	skillActivated: async (bookEvent: BookEventOfType<'skillActivated'>) => {
		// 1. Play sound
		const sfxMap: Record<string, string> = {
			L1: 'sfx_skill_activation',
			L2: 'sfx_skill_activation',
			// L3 uses the dedicated skill asset bucket — change the SFX in
			// `skillAssets.ts` to retarget just the L3 skill path without
			// affecting M-symbol multiplier activation sounds.
			L3: SKILL_L3_ASSETS.sfx,
			L4: 'sfx_skill_activation',
		};
		if (sfxMap[bookEvent.skillType]) {
			eventEmitter.broadcast({ type: 'soundOnce', name: sfxMap[bookEvent.skillType] });
		}

		// 2. Broadcast the event so Game.svelte can handle it (meters + animation)
		// If it's just an UPDATE, we don't need to wait for anything (no animation)
		if (bookEvent.skillType === 'UPDATE') {
			eventEmitter.broadcast(bookEvent);
			return;
		}

		// Otherwise, wait for animation with a safeguard. skipAnimation
		// (Space) short-circuits the 5s safeguard so the user doesn't sit
		// through it when the actual animation handler fast-forwards.
		await Promise.race([
			eventEmitter.broadcastAsync(bookEvent),
			waitForSkipOrTimeout(5000 / stateBetDerived.timeScale()),
		]);
	},
	finalMultiplierApplied: async (bookEvent: BookEventOfType<'finalMultiplierApplied'>) => {
		// Safety net: every multiplierSymbolActivated is normally flushed by its
		// own following tumbleBoard (see flushPendingGlobalMultiplierUpdate),
		// so this should already be null here — flush defensively in case an
		// edge case (e.g. a wincap short-circuit) skipped that step.
		await flushPendingGlobalMultiplierUpdate();
		// 0. Collect the multiplier coins now that the tumble has fully settled
		// (nothing left to explode): flip every M coin currently on the board
		// once. We scan the live board (not the activation positions) so cascaded
		// coins are flipped at their CURRENT cell. 'win' is the coin's only
		// non-frozen state (see SYMBOL_INFO_MAP.M) — safe for M (no win-frame;
		// explosions are triggered separately).
		const multiplierPositions: Position[] = [];
		stateGame.board.forEach((reel, reelIndex) => {
			reel.reelState.symbols.forEach((sym, row) => {
				if (sym.rawSymbol.name === 'M') multiplierPositions.push({ reel: reelIndex, row });
			});
		});
		if (multiplierPositions.length) {
			eventEmitter.broadcast({ type: 'soundOnce', name: 'sfx_multiplier_win' });
			await animateSymbols({ positions: multiplierPositions, state: 'win' });
		}

		// 1. Ensure Multiplier UI is visible
		eventEmitter.broadcast({ type: 'globalMultiplierShow' });

		// 2. Update global multiplier state
		stateGame.globalMultiplier = bookEvent.finalMultiplier;
		await eventEmitter.broadcastAsync({
			type: 'globalMultiplierUpdate',
			multiplier: bookEvent.finalMultiplier,
		});

		// 4. Animate the multiplication on the Tumble Win label
		// We use tumbleWinAmountUpdate with animate: true to show the jump
		eventEmitter.broadcast({ type: 'tumbleWinAmountShow' });
		await eventEmitter.broadcastAsync({
			type: 'tumbleWinAmountUpdate',
			amount: bookEvent.totalWin,
			animate: true,
		});

		// 5. Short wait for player to "feel" the win — skippable via Space,
		// and shortened under turbo so fast mode actually feels faster.
		// Value lives in timingConfig.finalMultiplier.postWinHoldMs.
		await waitForSkipOrTimeout(timingConfig.finalMultiplier.postWinHoldMs / stateBetDerived.timeScale());
	},
	// customised
	createBonusSnapshot: async (bookEvent: BookEventOfType<'createBonusSnapshot'>) => {
		const { bookEvents } = bookEvent;

		function findLastBookEvent<T>(type: T) {
			return _.findLast(bookEvents, (bookEvent) => bookEvent.type === type) as
				| BookEventOfType<T>
				| undefined;
		}

		const lastFreeSpinTriggerEvent = findLastBookEvent('freeSpinTrigger' as const);
		const lastUpdateFreeSpinEvent = findLastBookEvent('updateFreeSpin' as const);
		const lastSetTotalWinEvent = findLastBookEvent('setTotalWin' as const);
		const lastUpdateGlobalMultEvent = findLastBookEvent('updateGlobalMult' as const);

		if (lastFreeSpinTriggerEvent) await playBookEvent(lastFreeSpinTriggerEvent, { bookEvents });
		if (lastUpdateFreeSpinEvent) playBookEvent(lastUpdateFreeSpinEvent, { bookEvents });
		if (lastSetTotalWinEvent) playBookEvent(lastSetTotalWinEvent, { bookEvents });
		if (lastUpdateGlobalMultEvent) playBookEvent(lastUpdateGlobalMultEvent, { bookEvents });
	},
};
