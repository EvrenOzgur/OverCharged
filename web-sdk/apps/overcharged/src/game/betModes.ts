import { stateMeta, type BetModeMeta } from 'state-shared';
import { s } from '../shared/utils/social';

// OverCharged ships five bet modes: the default base game, a persistent
// "OVERCHARGED MODE" ante-bet toggle (math bet mode "ante"), and three Bonus
// Buy tiers — standard FREE SPINS, SUPER FREE SPINS (more scatters + L1
// meter pre-filled), and MULTIPLIER FREE SPINS (session starts at 5x global
// multiplier) — see mathConfig.json `betModes`. The shared
// DEFAULT_BET_MODE_META registry carries the Stake template's demo cards
// (DOUBLE BOOST / SUPER BOOST / SAMURAI SPIN / BONUS / SUPER BONUS) which do
// not exist in this game, so we override the registry here with only the modes
// OverCharged actually supports. BonusBuyMenu.svelte renders the three "buy"
// type modes as a tab-selectable multi-tier menu (see its own header comment).
const OVERCHARGED_BET_MODE_META: BetModeMeta = {
	BASE: {
		mode: 'BASE',
		costMultiplier: 1.0,
		type: 'default',
		parent: '',
		children: '',
		assets: {
			icon: '',
			dialogImage: '',
			dialogVolatility: '',
			volatility: '',
			button: '',
		},
		text: {
			title: '',
			dialog: '',
			button: '',
			betAmountLabel: '',
			tickerIdle: '',
			tickerSpin: '',
			bannerText: '',
		},
		maxWin: 5000,
	},
	ANTE: {
		mode: 'ANTE',
		costMultiplier: 1.25,
		type: 'activate',
		parent: '',
		children: '',
		assets: {
			icon: '',
			dialogImage: '',
			dialogVolatility: '',
			volatility: '',
			button: '',
		},
		text: {
			title: 'OVERCHARGED MODE',
			get dialog() {
				return s(
					'Roughly doubles the chance to trigger the FREE SPINS feature naturally, for 1.25x the player bet amount. OVERCHARGED MODE remains active until disabled by the player.',
					'Roughly doubles the chance to trigger the FREE SPINS feature naturally, for 1.25x the player play amount. OVERCHARGED MODE remains active until disabled by the player.',
				);
			},
			get description() {
				return s(
					'Greatly increase your chance of triggering Free Spins each spin.',
					'Greatly increase your chance of triggering Free Spins each spin.',
				);
			},
			button: 'ACTIVATE',
			betAmountLabel: 'OVERCHARGED',
			tickerIdle: 'OVERCHARGED MODE IS ACTIVE',
			tickerSpin: 'OVERCHARGED',
			bannerText: '',
		},
	},
	BONUS: {
		mode: 'BONUS',
		costMultiplier: 100,
		type: 'buy',
		parent: '',
		children: '',
		assets: {
			icon: 'https://test-fart-cdn-bucket.s3.ap-southeast-2.amazonaws.com/1_9_97/betModes/icon_bonusbuy.webp',
			dialogImage:
				'https://test-fart-cdn-bucket.s3.ap-southeast-2.amazonaws.com/1_9_97/betModes/bonus_image.webp',
			dialogVolatility:
				'https://test-fart-cdn-bucket.s3.ap-southeast-2.amazonaws.com/1_9_97/betModes/volatility/volatility_03.webp',
			volatility:
				'https://test-fart-cdn-bucket.s3.ap-southeast-2.amazonaws.com/1_9_97/betModes/volatility/volatility_white_03.webp',
			button:
				'https://test-fart-cdn-bucket.s3.ap-southeast-2.amazonaws.com/1_8_97/betModes/button_buy.webp',
		},
		text: {
			title: 'BONUS',
			// Not currently rendered by OverCharged's own UI (BonusBuyMenu.svelte
			// uses its own hardcoded card copy), but kept jurisdiction-compliant
			// via getters — evaluated lazily on read, after stateConfig.jurisdiction
			// is populated from /wallet/authenticate, in case anything reads these.
			get dialog() {
				return s(
					'Triggers FREE SPINS feature when activated for 100x the player bet amount.',
					'Triggers FREE SPINS feature when activated for 100x the player play amount.',
				);
			},
			get description() {
				return s(
					'Buy FREE SPINS and jump straight into the bonus round.',
					'Play FREE SPINS and jump straight into the bonus round.',
				);
			},
			get button() {
				return s('BUY', 'PLAY');
			},
			get tickerIdle() {
				return s('PLACE YOUR BET', 'COME AND PLAY');
			},
			get tickerSpin() {
				return s('BONUS BUY ACTIVATED', 'BONUS ACTIVATED');
			},
			bannerText: '',
		},
	},
	SUPER: {
		mode: 'SUPER',
		costMultiplier: 300,
		type: 'buy',
		parent: '',
		children: '',
		assets: {
			icon: '',
			dialogImage: '',
			dialogVolatility: '',
			volatility: '',
			button: '',
		},
		text: {
			title: 'SUPER FREE SPINS',
			get dialog() {
				return s(
					'Guarantees a longer FREE SPINS session (5-7 Scatters) and starts it with the Yellow skill meter half-filled, for 300x the player bet amount.',
					'Guarantees a longer FREE SPINS session (5-7 Scatters) and starts it with the Yellow skill meter half-filled, for 300x the player play amount.',
				);
			},
			get description() {
				return s(
					'A longer bonus round with a head start on the Yellow skill.',
					'A longer bonus round with a head start on the Yellow skill.',
				);
			},
			get button() {
				return s('BUY', 'PLAY');
			},
			get tickerIdle() {
				return s('PLACE YOUR BET', 'COME AND PLAY');
			},
			get tickerSpin() {
				return s('SUPER FREE SPINS ACTIVATED', 'SUPER FREE SPINS ACTIVATED');
			},
			bannerText: '',
		},
	},
	MULTIPLIER: {
		mode: 'MULTIPLIER',
		costMultiplier: 500,
		type: 'buy',
		parent: '',
		children: '',
		assets: {
			icon: '',
			dialogImage: '',
			dialogVolatility: '',
			volatility: '',
			button: '',
		},
		text: {
			title: 'MULTIPLIER FREE SPINS',
			get dialog() {
				return s(
					'Starts FREE SPINS with the Global Multiplier already at 5x instead of 1x, for 500x the player bet amount.',
					'Starts FREE SPINS with the Global Multiplier already at 5x instead of 1x, for 500x the player play amount.',
				);
			},
			get description() {
				return s(
					'Jump into the bonus round with the multiplier already charged up.',
					'Jump into the bonus round with the multiplier already charged up.',
				);
			},
			get button() {
				return s('BUY', 'PLAY');
			},
			get tickerIdle() {
				return s('PLACE YOUR BET', 'COME AND PLAY');
			},
			get tickerSpin() {
				return s('MULTIPLIER FREE SPINS ACTIVATED', 'MULTIPLIER FREE SPINS ACTIVATED');
			},
			bannerText: '',
		},
	},
};

/**
 * Replace the shared default bet-mode registry with OverCharged's own modes.
 * Called once from `setContext()` so both the live app and Storybook render the
 * same single-bonus buy menu.
 */
export const setupBetModes = () => {
	stateMeta.betModeMeta = OVERCHARGED_BET_MODE_META;
};
