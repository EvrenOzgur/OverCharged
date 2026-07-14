import { stateMeta, type BetModeMeta } from 'state-shared';
import { s } from '../shared/utils/social';

// OverCharged only ships two bet modes: the default base game and a single
// FREE SPINS bonus buy (see mathConfig.json `betModes`). The shared
// DEFAULT_BET_MODE_META registry carries the Stake template's five demo cards
// (DOUBLE BOOST / SUPER BOOST / SAMURAI SPIN / BONUS / SUPER BONUS) which do
// not exist in this game, so we override the registry here with only the modes
// OverCharged actually supports. This keeps the buy-bonus modal to a single
// "BONUS" buy card and leaves the shared package untouched for the other apps.
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
};

/**
 * Replace the shared default bet-mode registry with OverCharged's own modes.
 * Called once from `setContext()` so both the live app and Storybook render the
 * same single-bonus buy menu.
 */
export const setupBetModes = () => {
	stateMeta.betModeMeta = OVERCHARGED_BET_MODE_META;
};
