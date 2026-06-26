// Bridge shim for the FooterMenuPackage's `uiState`.
// Backs the package's bonus/free-spin readouts with the SDK's real state.
import { stateUi, stateBet } from 'state-shared';
import { bookEventAmountToNormalisedAmount } from 'utils-shared/amount';

class UIStateBridge {
	// The free-spin counter is shown while the bonus round is active.
	get isBonusActive() {
		return stateUi.freeSpinCounterShow;
	}

	get bonusFreeSpinsCount() {
		return stateUi.freeSpinCounterCurrent;
	}

	get bonusTotalFreeSpins() {
		return stateUi.freeSpinCounterTotal;
	}

	// Win amount is tracked in "book event" units by the engine; convert to a
	// plain currency number for display (FormatWinAmount expects a number).
	get bonusTotalWin() {
		return bookEventAmountToNormalisedAmount(stateBet.winBookEventAmount);
	}
}

export const uiState = new UIStateBridge();
