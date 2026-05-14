import { locales } from 'config-lingui';
import { page } from '$app/state';

export type Language = (typeof locales)[number];

export type Key =
	| 'sessionID'
	| 'rgs_url'
	| 'lang'
	| 'currency'
	| 'device'
	| 'social'
	| 'demo'
	| 'force'
	// Bet replay (Stake compliance — required for new game approval)
	| 'replay'
	| 'game'
	| 'version'
	| 'mode'
	| 'event'
	| 'amount'
;

const getUrlSearchParam = (key: Key) => page.url.searchParams.get(key);

const lang = () =>
	getUrlSearchParam('lang') === 'br' ? 'pt' : (getUrlSearchParam('lang') as Language) || 'en';
const sessionID = () => getUrlSearchParam('sessionID') || '';
const rgsUrl = () => getUrlSearchParam('rgs_url') || '';
const force = () => getUrlSearchParam('force') === 'true';
const social = () => getUrlSearchParam('social') === 'true';
const demo = () => getUrlSearchParam('demo') === 'true';
const currency = () => getUrlSearchParam('currency') || '';
const device = () => (getUrlSearchParam('device') as 'desktop' | 'mobile' | null) || null;

// ── Bet Replay helpers ────────────────────────────────────────────
// Stake docs (Bet Replay section) require:
//   replay=true & game=&version=&mode=&event= → enable replay mode
//   currency=&amount= → optional UI display only (no real bet)
const replay = () => getUrlSearchParam('replay') === 'true';
const replayGame = () => getUrlSearchParam('game') || '';
const replayVersion = () => getUrlSearchParam('version') || '';
const replayMode = () => getUrlSearchParam('mode') || '';
const replayEvent = () => getUrlSearchParam('event') || '';
const replayAmount = () => {
	const v = getUrlSearchParam('amount');
	return v ? Number(v) : 0;
};

/**
 * True when all required replay query params are present and `replay=true`.
 * Used to gate auth bypass and switch the UI into replay mode.
 */
const isReplayMode = () =>
	replay() && !!replayGame() && !!replayVersion() && !!replayMode() && !!replayEvent();

/**
 * Returns the bundle of replay params needed by `requestReplay`. Only
 * meaningful when `isReplayMode()` is true.
 */
const replayParams = () => ({
	game: replayGame(),
	version: replayVersion(),
	mode: replayMode(),
	event: replayEvent(),
	amount: replayAmount(),
	currency: currency(),
});

export const stateUrlDerived = {
	lang,
	sessionID,
	rgsUrl,
	force,
	social,
	demo,
	currency,
	device,
	// replay
	replay,
	isReplayMode,
	replayParams,
	replayGame,
	replayVersion,
	replayMode,
	replayEvent,
	replayAmount,
};
