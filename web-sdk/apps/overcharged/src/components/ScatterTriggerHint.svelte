<!--
	When the 3rd scatter lands during the reveal/anticipation phase, ALL
	visible scatters play their `win` Spine animation ONCE — a quick
	"freespin coming" confirmation that fires immediately on the trigger
	threshold, before the freeSpinTrigger event itself arrives.

	After the win plays, scatters transition to `static` (NOT `postWinStatic`)
	so they don't freeze on the win end-frame AND so that the next reveal —
	which overwrites the cell's rawSymbol but does NOT reset symbolState —
	does not leave a non-scatter symbol stuck in `postWinStatic`, which
	would otherwise activate Symbol.svelte's `showWinFrame` payframe glow
	and produce a leftover "win frame" on a random symbol in the next spin.

	Note: the freeSpinTrigger event handler later re-animates the same
	scatters. That's a slight redundancy we can tighten later if needed —
	for now it just chains into the trigger animation naturally.
-->
<script lang="ts">
	import { getContext } from '../game/context';

	const FREESPIN_THRESHOLD = 3; // matches game_config.freespin_triggers smallest key

	const context = getContext();

	// Latches when we fire the preview, so we don't re-trigger on every
	// subsequent board mutation. Reset when the board state moves below
	// the threshold (e.g. new spin starts and reels begin spinning).
	let fired = $state(false);

	$effect(() => {
		const stoppedScatters: { reel: number; row: number }[] = [];

		context.stateGame.board.forEach((reel, reelIdx) => {
			if (reel.reelState.motion === 'stopped') {
				reel.reelState.symbols.forEach((sym, rowIdx) => {
					if (sym.rawSymbol?.name === 'S') {
						stoppedScatters.push({ reel: reelIdx, row: rowIdx });
					}
				});
			}
		});

		// Reset latch when scatters drop below threshold (new spin in progress).
		if (stoppedScatters.length < FREESPIN_THRESHOLD) {
			fired = false;
			return;
		}

		if (fired) return;
		fired = true;

		// All scatters animate `win` simultaneously, then auto-transition to
		// `postWinStatic` via the oncomplete chain so they don't freeze.
		for (const { reel, row } of stoppedScatters) {
			const sym = context.stateGame.board[reel]?.reelState.symbols[row];
			if (!sym) continue;
			if (sym.symbolState === 'win' || sym.symbolState === 'postWinStatic') continue;
			sym.oncomplete = () => {
				sym.symbolState = 'static';
			};
			sym.symbolState = 'win';
		}
	});

	context.eventEmitter.subscribeOnMount({
		// Snap any scatter currently mid-win-animation back to static so the
		// freespin-trigger reveal can proceed without waiting it out.
		skipAnimation: () => {
			for (const reel of context.stateGame.board) {
				for (const sym of reel.reelState.symbols) {
					if (sym.rawSymbol?.name === 'S' && sym.symbolState === 'win') {
						sym.symbolState = 'static';
					}
				}
			}
		},
	});
</script>
