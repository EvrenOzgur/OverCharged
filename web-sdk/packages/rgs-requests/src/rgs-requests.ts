import { API_AMOUNT_MULTIPLIER } from 'constants-shared/bet';
import { fetcher } from 'utils-fetcher';
import { rgsFetcher } from 'rgs-fetcher';

export * from './types';

export const requestAuthenticate = async (options: {
	sessionID: string;
	rgsUrl: string;
	language: string;
}) => {
	const data = await rgsFetcher.post({
		rgsUrl: options.rgsUrl,
		url: '/wallet/authenticate',
		variables: {
			sessionID: options.sessionID,
			language: options.language,
		},
	});

	return data;
};

export const requestEndRound = async (options: {
	sessionID: string;
	rgsUrl: string;
}) => {
	const data = await rgsFetcher.post({
		rgsUrl: options.rgsUrl,
		url: '/wallet/end-round',
		variables: {
			sessionID: options.sessionID,
		},
	});

	return data;
};

export const requestEndEvent = async (options: {
	sessionID: string;
	eventIndex: number;
	rgsUrl: string;
}) => {
	const data = await rgsFetcher.post({
		rgsUrl: options.rgsUrl,
		url: '/bet/event',
		variables: {
			sessionID: options.sessionID,
			event: `${options.eventIndex}`,
		},
	});

	return data;
};

export const requestForceResult = async (options: {
	mode: string;
	search: {
		bookID?: number;
		kind?: number;
		symbol?: string;
		hasWild?: boolean;
		wildMult?: number;
		gameType?: string;
	};
	rgsUrl: string;
}) => {
	const data = await rgsFetcher.post({
		rgsUrl: options.rgsUrl,
		url: '/game/search',
		variables: {
			mode: options.mode,
			search: options.search,
		},
	});

	return data;
};

/**
 * Bet Replay (Stake compliance — required for new game approval).
 *
 * Calls the auth-free `GET {rgs_url}/bet/replay/{game}/{version}/{mode}/{event}`
 * endpoint and returns the historical round payload (payoutMultiplier,
 * costMultiplier, state[]). No sessionID/auth needed — works in iframes
 * without an active player session.
 *
 * See `stateUrlDerived.isReplayMode()` and `stateUrlDerived.replayParams()`
 * for the canonical way to gate this in an app.
 */
export type ReplayResponse = {
	payoutMultiplier: number;
	costMultiplier: number;
	state: any[]; // book events stream — typed by the consumer (e.g. BookEvent[])
};

export const requestReplay = async (options: {
	rgsUrl: string;
	game: string;
	version: string;
	mode: string;
	event: string;
}): Promise<ReplayResponse> => {
	const endpoint = `https://${options.rgsUrl}/bet/replay/${options.game}/${options.version}/${options.mode}/${options.event}`;
	const response = await fetcher({ method: 'GET', endpoint });
	if (response.status !== 200) {
		console.error('[requestReplay] non-200', response.status, endpoint);
	}
	const data = await response.json();
	return data as ReplayResponse;
};

export const requestBet = async (options: {
	sessionID: string;
	currency: string;
	amount: number;
	mode: string;
	rgsUrl: string;
}) => {
	const data = await rgsFetcher.post({
		rgsUrl: options.rgsUrl,
		url: '/wallet/play',
		variables: {
			mode: options.mode,
			currency: options.currency,
			sessionID: options.sessionID,
			amount: options.amount * API_AMOUNT_MULTIPLIER,
		},
	});

	return data;
};
