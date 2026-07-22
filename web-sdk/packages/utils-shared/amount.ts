import { stateI18n } from 'state-shared';

import { BOOK_AMOUNT_MULTIPLIER } from 'constants-shared/bet';
import { stateBet } from 'state-shared';

const NO_LOCALISATION_CURRENCY_MAP: Record<string, string> = {
	XGC: 'GC',
	XSC: 'SC',
};

// bookEventAmount: is the amount or win numbers in the events of books, e.g. the amount in setTotalWin bookEvent
// {
// 	"index": 3,
// 	"type": "setTotalWin",
// 	"amount": 100
// },
// if betting on $1,   100 bookEventAmount equals to $1.    betAmountMultiplier is (100 / BOOK_AMOUNT_MULTIPLIER =) 1
// if betting on $1,    50 bookEventAmount equals to $0.5.  betAmountMultiplier is ( 50 / BOOK_AMOUNT_MULTIPLIER =) 0.5
// if betting on $0.5, 100 bookEventAmount equals to $0.5.  betAmountMultiplier is (100 / BOOK_AMOUNT_MULTIPLIER =) 1
// if betting on $0.5,  50 bookEventAmount equals to $0.25. betAmountMultiplier is ( 50 / BOOK_AMOUNT_MULTIPLIER =) 0.5

export const bookEventAmountToBetAmountMultiplier = (bookEventAmount: number) =>
	bookEventAmount / BOOK_AMOUNT_MULTIPLIER;

export const bookEventAmountToNormalisedAmount = (bookEventAmount: number) => {
	const betAmountMultiplier = bookEventAmountToBetAmountMultiplier(bookEventAmount);
	return stateBet.wageredBetAmount * betAmountMultiplier;
};

export const numberToFloat = (value: number) => Number.parseFloat(`${value}`);

export const numberToCurrencyString = (value: number) => {
	if (stateBet.currency in NO_LOCALISATION_CURRENCY_MAP) {
		return `${NO_LOCALISATION_CURRENCY_MAP[stateBet.currency]} ${numberToFloat(value).toFixed(2)}`;
	}

	return stateI18n.i18n.number(value, {
		minimumFractionDigits: 2,
		maximumFractionDigits: 2,
		style: 'currency',
		currency: stateBet.currency,
		// numberingSystem: 'latn',
	});
};

export const bookEventAmountToCurrencyString = (bookEventAmount: number) => {
	const normalisedAmount = bookEventAmountToNormalisedAmount(bookEventAmount);
	return numberToCurrencyString(normalisedAmount);
};

// Win-specific formatting: Stake lowered the min bet to $0.01, so a small win
// (e.g. a low multiplier on a $0.01 bet) can be worth a fraction of a cent —
// fixed 2-decimal formatting rounds those down to "$0.00" even though the
// win is nonzero. Win displays (round win, spin win, tumble win, total win,
// replay playback) need up to 4 decimals, extending only as far as needed
// (no forced trailing zeros beyond 2). Balance and bet amount stay 2-decimal
// via numberToCurrencyString/bookEventAmountToCurrencyString above — do not
// use these for anything other than a win amount.
const NO_LOCALISATION_WIN_DECIMALS = (value: number): number => {
	const rounded4 = Math.round(value * 10000) / 10000;
	for (let decimals = 2; decimals < 4; decimals++) {
		const scale = 10 ** decimals;
		if (Math.round(rounded4 * scale) / scale === rounded4) return decimals;
	}
	return 4;
};

export const numberToWinCurrencyString = (value: number) => {
	if (stateBet.currency in NO_LOCALISATION_CURRENCY_MAP) {
		const decimals = NO_LOCALISATION_WIN_DECIMALS(numberToFloat(value));
		return `${NO_LOCALISATION_CURRENCY_MAP[stateBet.currency]} ${numberToFloat(value).toFixed(decimals)}`;
	}

	return stateI18n.i18n.number(value, {
		minimumFractionDigits: 2,
		maximumFractionDigits: 4,
		style: 'currency',
		currency: stateBet.currency,
		// numberingSystem: 'latn',
	});
};

export const bookEventAmountToWinCurrencyString = (bookEventAmount: number) => {
	const normalisedAmount = bookEventAmountToNormalisedAmount(bookEventAmount);
	return numberToWinCurrencyString(normalisedAmount);
};
