<script lang="ts">
	import { onMount, type Snippet } from 'svelte';

	import { requestAuthenticate, requestReplay } from 'rgs-requests';
	import { stateUrlDerived, stateBet, stateConfig, stateModal } from 'state-shared';
	import { API_AMOUNT_MULTIPLIER, MOST_USED_BET_INDEXES } from 'constants-shared/bet';

	type Props = { children: Snippet };

	const props: Props = $props();

	let authenticated = $state(false);

	/**
	 * Replay mode bootstrap (Stake Bet Replay compliance).
	 *
	 * When `?replay=true&game=&version=&mode=&event=&...` is on the URL,
	 * skip /wallet/authenticate (no session, no balance debit) and load
	 * the historical round via the auth-free /bet/replay endpoint.
	 *
	 * The optional `currency` and `amount` params let the UI render the
	 * intended bet display without a real wager.
	 */
	const bootstrapReplay = async () => {
		const params = stateUrlDerived.replayParams();
		console.log('[REPLAY-DEBUG] bootstrapReplay START', {
			rgsUrl: stateUrlDerived.rgsUrl(),
			params,
			fullEndpoint: `https://${stateUrlDerived.rgsUrl()}/bet/replay/${params.game}/${params.version}/${params.mode}/${params.event}`,
		});
		try {
			const data = await requestReplay({
				rgsUrl: stateUrlDerived.rgsUrl(),
				game: params.game,
				version: params.version,
				mode: params.mode,
				event: params.event,
			});
			console.log('[REPLAY-DEBUG] requestReplay RESPONSE', {
				dataKeys: data ? Object.keys(data) : null,
				stateLength: (data as any)?.state?.length,
				stateFirstEvent: (data as any)?.state?.[0],
				payoutMultiplier: (data as any)?.payoutMultiplier,
				costMultiplier: (data as any)?.costMultiplier,
				rawData: data,
			});

			// Stake docs: optional currency/amount are display-only. Default
			// social→XSC, non-social→USD; default amount = 1 (= 1_000_000 micro).
			const currency = params.currency || (stateUrlDerived.social() ? 'XSC' : 'USD');
			const amount = params.amount > 0 ? params.amount / API_AMOUNT_MULTIPLIER : 1;

			stateBet.currency = currency;
			stateBet.balanceAmount = 0;
			stateBet.betAmount = amount;
			stateBet.wageredBetAmount = amount;
			// Math SDK BetMode names are lowercase ("base"/"bonus"), but the
			// default betModeMeta registry keys are uppercase. activeBetMode()
			// already does case-insensitive lookup, but storing the canonical
			// uppercase form keeps downstream comparators (e.g. `mode === 'BONUS'`)
			// working unchanged.
			stateBet.activeBetModeKey = (params.mode || 'BASE').toUpperCase();
			// Replay has no /wallet/authenticate, so minBet/maxBet stay at their
			// schema defaults. Set sane bounds derived from the display amount
			// so any UI that clamps against them does not zero the bet out.
			stateConfig.minBet = 0;
			stateConfig.maxBet = Infinity;

			// Inject the replay round so the existing `playBookEvents` plumbing
			// can render it identically to a live round. `active: false` is
			// CRITICAL — when true, the gameActor primary machine auto-detects
			// an active round on RENDERED and triggers onPlayGame(lastBet)
			// without any UI interaction, causing the replay events to fire
			// automatically (sometimes twice, once via auto-resume and once
			// via the ReplayOverlay's Start Replay button). With active=false,
			// the actor takes the `onResumeGameInactive` branch (just settles
			// the last board) and waits for the user to click Start Replay.
			stateBet.lastBet = {
				betID: 0,
				amount: amount * API_AMOUNT_MULTIPLIER,
				payout: data.payoutMultiplier * amount * API_AMOUNT_MULTIPLIER,
				payoutMultiplier: data.payoutMultiplier,
				active: false,
				state: data.state,
				mode: (params.mode || 'BASE').toUpperCase(),
				event: null,
			} as any;
			console.log('[REPLAY-DEBUG] stateBet.lastBet AFTER inject', {
				lastBet: $state.snapshot?.(stateBet.lastBet) ?? stateBet.lastBet,
				stateLength: stateBet.lastBet?.state?.length,
			});
		} catch (error) {
			console.error('[REPLAY-DEBUG] replay fetch FAILED', error);
			stateModal.modal = { name: 'error', error };
		}
	};

	const authenticate = async () => {
		try {
			const authenticateData = await requestAuthenticate({
				rgsUrl: stateUrlDerived.rgsUrl(),
				sessionID: stateUrlDerived.sessionID(),
				language: stateUrlDerived.lang(),
			});

			// error
			if (authenticateData?.error) throw authenticateData;

			// balance
			if (authenticateData?.balance) {
				// Example of authenticateData.balance
				// {
				// 		"amount": 10000000000000000,
				// 		"currency": "USD"
				// },
				stateBet.currency = authenticateData.balance.currency;
				stateBet.balanceAmount = authenticateData.balance.amount / API_AMOUNT_MULTIPLIER;
			}

			// config
			if (authenticateData?.config) {
				// Example of authenticateData.config
				// {
				// 	"gameID": "37_test-lines",
				// 	"minBet": 100000,
				// 	"maxBet": 1000000000,
				// 	"stepBet": 10000,
				// 	"defaultBetLevel": 1000000,
				// 	"betLevels": [100000, 200000, ..., 1000000000],
				// 	"betModes": {},
				// 	"jurisdiction": {
				// 			"socialCasino": false,
				// 			"disabledFullscreen": false,
				// 			"disabledTurbo": false,
				// 			"disabledSuperTurbo": false,
				// 			"disabledAutoplay": false,
				// 			"disabledSlamstop": false,
				// 			"disabledSpacebar": false,
				// 			"disabledBuyFeature": false,
				// 			"displayNetPosition": false,
				// 			"displayRTP": false,
				// 			"displaySessionTimer": false,
				// 			"minimumRoundDuration": 0
				// 	}
				// }
				stateConfig.jurisdiction = authenticateData?.config?.jurisdiction;
				if (typeof authenticateData.config?.minBet === 'number') {
					stateConfig.minBet = authenticateData.config.minBet / API_AMOUNT_MULTIPLIER;
				}
				if (typeof authenticateData.config?.maxBet === 'number') {
					stateConfig.maxBet = authenticateData.config.maxBet / API_AMOUNT_MULTIPLIER;
				}
				stateConfig.betAmountOptions = (authenticateData.config?.betLevels || []).map(
					(level) => level / API_AMOUNT_MULTIPLIER,
				);
				stateConfig.betMenuOptions = stateConfig.betAmountOptions.filter((_, index) =>
					MOST_USED_BET_INDEXES.includes(index),
				);
			}

			// round
			if (authenticateData?.round) {
				// Example of authenticateData.round 
				// {
				// 	"betID": 62277967,
				// 	"amount": 1000000,
				// 	"payout": 33400000,
				// 	"payoutMultiplier": 33.4,
				// 	"active": true,
				// 	"state": [...],
				// 	"mode": "BONUS",
				// 	"event": null
				// }

				if(authenticateData.round?.state) {
					// @ts-ignore
					stateBet.lastBet =  authenticateData.round;
				}

				if(authenticateData.round?.amount) {
					const betAmountValue =
						authenticateData.round.amount > 0
							? authenticateData.round.amount / API_AMOUNT_MULTIPLIER
							: 0;
					stateBet.betAmount = betAmountValue;
					stateBet.wageredBetAmount = betAmountValue;
				}

				if (authenticateData.round?.mode) {
					stateBet.activeBetModeKey = authenticateData.round.mode;
				};
			}
		} catch (error) {
			console.error(error);
			stateModal.modal = { name: 'error', error };
		}
	};

	onMount(async () => {
		const replayDetected = stateUrlDerived.isReplayMode();
		console.log('[REPLAY-DEBUG] Authenticate onMount', {
			isReplayMode: replayDetected,
			rgsUrl: stateUrlDerived.rgsUrl(),
			replayParams: stateUrlDerived.replayParams(),
			rawSearch: typeof window !== 'undefined' ? window.location.search : '(no window)',
		});
		if (replayDetected) {
			await bootstrapReplay();
		} else {
			await authenticate();
		}
		authenticated = true;
	});
</script>

{#if authenticated}
	{@render props.children()}
{/if}
