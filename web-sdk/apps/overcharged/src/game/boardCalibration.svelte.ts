// Live alignment of the symbol board onto the bgCharacters spine's embedded
// board well (SlotArea). The well is placed/scaled by per-orientation skin
// transform constraints (landscape/portrait TC_board), so its screen rect is
// NOT a fixed function of the board's own mainLayout sizing — a single
// SYMBOL_SIZE can't match it across orientations/aspect ratios.
//
// BoardWellSync (mounted inside the bg spine) measures the well's screen rect
// each layout change and writes the correction here, expressed in the board's
// mainLayout coordinate space:
//   • scale    — multiplier applied to BoardContainer so the 8×8 grid fills
//                the well (1 = board already matches).
//   • offsetX/Y — shift (mainLayout px) from canvas centre to the well centre.
//
// boardLayout() reads these; BoardContainer applies `scale`. Defaults are the
// identity (board centred at canvas centre, unscaled) so the board renders
// sanely before the first measurement settles.
export const boardCalibration = $state({
	scale: 1,
	offsetX: 0,
	offsetY: 0,
});
