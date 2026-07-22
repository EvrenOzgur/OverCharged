// Bridge shim for the FooterMenuPackage.
// The package expects a `FormatWinAmount(amount, currency)` helper. We back it
// with the SDK's currency formatter (which reads currency/locale from config),
// so the `currency` argument is accepted for API-compatibility but ignored.
import { numberToCurrencyString, numberToWinCurrencyString } from 'utils-shared/amount';

export function FormatWinAmount(amount: number, _currency?: string): string {
	const value = amount ?? 0;
	// numberToCurrencyString relies on the lingui i18n locale + stateBet.currency.
	// If either isn't ready yet (e.g. a render before i18n activates) lingui throws
	// "Invalid language tag" — guard so the footer never crashes the app.
	try {
		return numberToCurrencyString(value);
	} catch {
		return value.toFixed(2);
	}
}

// Win-amount variant (LAST WIN / TOTAL WIN readouts) — shows up to 4 decimals
// so a sub-cent win on a $0.01 bet doesn't display as "$0.00" (Stake's min-bet
// change). Balance/BET readouts must keep FormatWinAmount's fixed 2 decimals.
export function FormatWinAmountPrecise(amount: number, _currency?: string): string {
	const value = amount ?? 0;
	try {
		return numberToWinCurrencyString(value);
	} catch {
		return value.toFixed(2);
	}
}
