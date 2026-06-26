// Bridge shim for the FooterMenuPackage's `bettingState`.
// The package's footer/menus read a `bettingState` object; we back every member
// with the SDK's real bet state (`state-shared`) so the DOM footer stays in sync
// with the live game.
import { stateBet, stateBetDerived, stateConfig } from 'state-shared';

class BettingStateBridge {
	private get options() {
		return [...stateConfig.betAmountOptions].sort((a, b) => a - b);
	}

	get displayedBalance() {
		return stateBet.balanceAmount;
	}

	// Footer "BET" shows the total cost of a spin (bet × active mode multiplier).
	get currentBet() {
		return stateBetDerived.betCost();
	}

	get currentBetIndex() {
		return this.options.indexOf(stateBet.betAmount);
	}

	// Highest selectable bet index — used by the footer to grey out "+".
	get maxBet() {
		return Math.max(0, this.options.length - 1);
	}

	// OverCharged only ships BASE/BONUS modes (no ante features), so this never
	// matches the package's ante ids (double_chance/extra_chance/etc.) and the
	// bonus button stays in its default state. Kept for API-compatibility.
	get activeFeatureId() {
		return (stateBet.activeBetModeKey || '').toLowerCase();
	}

	increaseBet() {
		const next = this.options.find((o) => o > stateBet.betAmount);
		stateBetDerived.setBetAmount(next ?? this.options[this.options.length - 1]);
	}

	decreaseBet() {
		const smaller = [...this.options].reverse().find((o) => o < stateBet.betAmount);
		stateBetDerived.setBetAmount(smaller ?? this.options[0]);
	}
}

export const bettingState = new BettingStateBridge();
