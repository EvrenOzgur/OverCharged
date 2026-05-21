import { stateI18nDerived, stateUrlDerived } from 'state-shared';

// Stake.US (social casino) compliance: certain words are restricted in the
// social variant — notably "bet". Helpers below switch wording based on the
// ?social=true URL param. Keep the underlying translate() keys unchanged so
// the catalogue stays stable; only the surface text differs.
export const i18nDerived = {
	bet: () =>
		stateUrlDerived.social()
			? stateI18nDerived.translate('SPIN')
			: stateI18nDerived.translate('BET'),
	max: () => stateI18nDerived.translate('MAX'),
	betMenu: () =>
		stateUrlDerived.social()
			? stateI18nDerived.translate('STAKE MENU')
			: stateI18nDerived.translate('BET MENU'),
	selectYourBet: () =>
		stateUrlDerived.social()
			? stateI18nDerived.translate('SELECT YOUR STAKE')
			: stateI18nDerived.translate('SELECT YOUR BET'),
	confirm: () => stateI18nDerived.translate('CONFIRM'),
	masterVolume: () => stateI18nDerived.translate('MASTER VOLUME'),
	musicVolume: () => stateI18nDerived.translate('MUSIC VOLUME'),
	soundEffectVolume: () => stateI18nDerived.translate('SOUND EFFECT VOLUME'),
	autoSpins: () => stateI18nDerived.translate('AUTO SPINS'),
	numberOfRounds: () => stateI18nDerived.translate('NUMBER OF ROUNDS'),
	advanced: () => stateI18nDerived.translate('ADVANCED'),
	singleWinLimit: () => stateI18nDerived.translate('SINGLE WIN LIMIT'),
	lossLimit: () => stateI18nDerived.translate('LOSS LIMIT'),
	startAutoplay: () => stateI18nDerived.translate('START AUTOPLAY'),
	notification: () => stateI18nDerived.translate('NOTIFICATION'),
	autoSpinsStopInfo: () => stateI18nDerived.translate('AUTO PLAY HAS STOPPED DUE TO'),
	insufficientFunds: () =>
		stateUrlDerived.social()
			? stateI18nDerived.translate(
					'INSUFFICIENT BALANCE FOR THIS SPIN. PLEASE TOP UP OR LOWER YOUR STAKE.',
			  )
			: stateI18nDerived.translate(
					'INSUFFICIENT FUNDS TO PLACE THIS BET. PLEASE ADD FUNDS TO YOUR ACCOUNT OR LOWER THE BET LEVEL.',
			  ),
	lossLimitReached: () => stateI18nDerived.translate('LOSS LIMIT REACHED'),
	singleWinLimitReached: () => stateI18nDerived.translate('SINGLE WIN LIMIT REACHED'),
	settings: () => stateI18nDerived.translate('SETTINGS'),
};
