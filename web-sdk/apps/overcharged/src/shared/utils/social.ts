// Bridge shim for the FooterMenuPackage's `s()` helper.
// `s(realText, socialText)` swaps wording for social-casino (stake.us) builds,
// per Stake's jurisdiction requirements (restricted gambling terms like
// "bet"/"buy"/"wager" must not appear when the RGS reports socialCasino).
// stateConfig.jurisdiction is populated from /wallet/authenticate before the
// game UI mounts (see Authenticate.svelte), so this is safe to read eagerly.
import { stateConfig } from 'state-shared';

export function s(realText: string, socialText?: string): string {
	return stateConfig.jurisdiction?.socialCasino ? (socialText ?? realText) : realText;
}
