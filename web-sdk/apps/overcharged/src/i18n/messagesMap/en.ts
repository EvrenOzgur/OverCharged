// Identity translations for every key referenced by:
//   - components-ui-pixi/src/i18n/i18nDerived.ts
//   - components-ui-html/src/i18n/i18nDerived.ts
//   - utils-shared/i18n.ts
// Listing them here removes the runtime `i18n._()` warnings — Lingui only
// warns when a queried key has no entry in the active catalog.
export default {
	HOME: 'HOME',

	// pixi UI
	AUDIO: 'AUDIO',
	BALANCE: 'BALANCE',
	WIN: 'WIN',
	BET: 'BET',
	STOP: 'STOP',
	'BUY BONUS': 'BUY BONUS',
	DISABLE: 'DISABLE',
	'FREE SPINS': 'FREE SPINS',
	'-': '-',
	'+': '+',
	MENU: 'MENU',
	TURBO: 'TURBO',
	'AUTO SPIN': 'AUTO SPIN',
	PAYTABLE: 'PAYTABLE',
	INFO: 'INFO',
	SETTINGS: 'SETTINGS',
	'SOUND ON': 'SOUND ON',
	'SOUND OFF': 'SOUND OFF',
	EXIT: 'EXIT',

	// html UI / autoplay / settings
	MAX: 'MAX',
	'BET MENU': 'BET MENU',
	'SELECT YOUR BET': 'SELECT YOUR BET',
	CONFIRM: 'CONFIRM',
	'MASTER VOLUME': 'MASTER VOLUME',
	'MUSIC VOLUME': 'MUSIC VOLUME',
	'SOUND EFFECT VOLUME': 'SOUND EFFECT VOLUME',
	'AUTO SPINS': 'AUTO SPINS',
	'NUMBER OF ROUNDS': 'NUMBER OF ROUNDS',
	ADVANCED: 'ADVANCED',
	'SINGLE WIN LIMIT': 'SINGLE WIN LIMIT',
	'LOSS LIMIT': 'LOSS LIMIT',
	'START AUTOPLAY': 'START AUTOPLAY',
	NOTIFICATION: 'NOTIFICATION',
	'AUTO PLAY HAS STOPPED DUE TO': 'AUTO PLAY HAS STOPPED DUE TO',
	'INSUFFICIENT FUNDS TO PLACE THIS BET. PLEASE ADD FUNDS TO YOUR ACCOUNT OR LOWER THE BET LEVEL.':
		'INSUFFICIENT FUNDS TO PLACE THIS BET. PLEASE ADD FUNDS TO YOUR ACCOUNT OR LOWER THE BET LEVEL.',
	// Social-casino variant (Stake.US) — used when ?social=true. Avoids the
	// restricted words "bet" and "fund" in their wagering sense.
	'INSUFFICIENT BALANCE FOR THIS SPIN. PLEASE TOP UP OR LOWER YOUR STAKE.':
		'INSUFFICIENT BALANCE FOR THIS SPIN. PLEASE TOP UP OR LOWER YOUR STAKE.',
	SPIN: 'SPIN',
	'STAKE MENU': 'STAKE MENU',
	'SELECT YOUR STAKE': 'SELECT YOUR STAKE',
	'LOSS LIMIT REACHED': 'LOSS LIMIT REACHED',
	'SINGLE WIN LIMIT REACHED': 'SINGLE WIN LIMIT REACHED',

	// game-specific
	'NOT TRANSLATED': 'NOT TRANSLATED',

	// Eski sprite-text görselleri yerine font-text (Ranchers) olarak kullanılan
	// metinler (PressToContinue / FreeSpinIntro / FreeSpinOutro).
	'PRESS ANYWHERE TO CONTINUE': 'PRESS ANYWHERE TO CONTINUE',
	'CONGRATULATIONS! YOU WON': 'CONGRATULATIONS! YOU WON',
	'CONGRATULATIONS!': 'CONGRATULATIONS!',
	'YOU WON': 'YOU WON',
	'TOTAL WIN': 'TOTAL WIN',
};
