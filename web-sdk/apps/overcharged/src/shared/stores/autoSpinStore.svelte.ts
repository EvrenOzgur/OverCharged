// Bridge shim for the FooterMenuPackage's `autoSpinStore`.
// Backs the footer's autospin readout with the SDK's real counter
// (`stateBet.autoSpinsCounter`) so it reflects the live game. The engine owns
// decrementing; start() sets the counter the way the SDK's AutoSpinsStartButton
// does (the actual spin loop is kicked off by broadcasting 'autoBet' from the
// caller — see FooterMenuOverlay). The package menu sends -1 for "infinite",
// which the SDK represents as Infinity.
import { stateBet, stateBetDerived } from 'state-shared';

class AutoSpinStore {
	get isActive() {
		return stateBetDerived.hasAutoBetCounter();
	}

	get remaining() {
		return Number.isFinite(stateBet.autoSpinsCounter) ? stateBet.autoSpinsCounter : 0;
	}

	get isInfinite() {
		return !Number.isFinite(stateBet.autoSpinsCounter);
	}

	get stopOnBonus() {
		return true;
	}

	start(count: number, _stopOnBonus: boolean) {
		stateBet.autoSpinsCounter = count === -1 ? Infinity : count;
		// The package menu has no loss / single-win limit UI → run unlimited.
		stateBet.autoSpinsLossLimitAmount = Infinity;
		stateBet.autoSpinsSingleWinLimitAmount = Infinity;
	}

	stop() {
		stateBet.autoSpinsCounter = 0;
	}

	decrement() {
		// no-op: the engine decrements stateBet.autoSpinsCounter.
	}
}

export const autoSpinStore = new AutoSpinStore();
