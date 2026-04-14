<script lang="ts" module>
	import { sound, type MusicName, type SoundEffectName, type SoundName } from '../game/sound';

	export type EmitterEventSound =
		| { type: 'soundMusic'; name: MusicName }
		| { type: 'soundOnce'; name: SoundEffectName; forcePlay?: boolean }
		| { type: 'soundLoop'; name: SoundEffectName }
		| { type: 'soundStop'; name: SoundName }
		| { type: 'soundFade'; name: SoundName; from: number; to: number; duration: number }
		| { type: 'soundScatterCounterIncrease' }
		| { type: 'soundScatterCounterClear' };
</script>

<script lang="ts">
	import { onMount } from 'svelte';

	import { waitForTimeout } from 'utils-shared/wait';
	import { SECOND } from 'constants-shared/time';
	import { stateBet } from 'state-shared';

	import { getContext } from '../game/context';
	import { soundConfig, type SoundItemConfig, type EventSoundMapping } from '../game/soundConfig.svelte';

	const context = getContext();

	/** Play all sounds mapped to a game event via eventMappings config. */
	function playEventMappings(eventName: string) {
		const mappings = soundConfig.eventMappings[eventName];
		if (!mappings || mappings.length === 0) return;
		for (const mapping of mappings) {
			playWithConfig(() => {
				if (mapping.playType === 'music') {
					sound.players.music.play({ name: mapping.soundName as any });
				} else if (mapping.playType === 'loop') {
					sound.players.loop.play({ name: mapping.soundName as any });
				} else {
					sound.players.once.play({ name: mapping.soundName as any, forcePlay: mapping.forcePlay });
				}
			}, mapping.soundName);
		}
	}

	/** Get the sound config for a given name, applying group masterVolume. */
	function getSoundCfg(name: string): SoundItemConfig | undefined {
		return soundConfig.sounds[name];
	}

	/** Check if a sound is enabled in the editor config. */
	function isSoundEnabled(name: string): boolean {
		const cfg = getSoundCfg(name);
		return cfg ? cfg.enabled : true;
	}

	/** Apply soundConfig volume & rate after playing a sound. */
	function applyConfigToSound(name: string) {
		const cfg = getSoundCfg(name);
		if (!cfg) return;

		// Apply rate from config
		if (cfg.rate !== 1) {
			sound.rate({ name: name as any, rate: cfg.rate });
		}

		// Apply fadeIn from config
		if (cfg.fadeIn > 0) {
			const groupVol = soundConfig.groups[cfg.group]?.masterVolume ?? 1;
			sound.fade({ name: name as any, from: 0, to: cfg.volume * groupVol, duration: cfg.fadeIn });
		}
	}

	/** Play a sound with optional delay from config. */
	async function playWithConfig(
		playFn: () => void,
		name: string,
	) {
		if (!isSoundEnabled(name)) return;
		const cfg = getSoundCfg(name);
		if (cfg?.delay && cfg.delay > 0) {
			await waitForTimeout(cfg.delay);
		}
		playFn();
		applyConfigToSound(name);
	}

	context.eventEmitter.subscribeOnMount({
		// ui
		soundBetMode: async ({ betModeKey }) => {
			if (betModeKey === 'SUPERSPIN') {
				await playWithConfig(
					() => sound.players.once.play({ name: 'sfx_winlevel_end' }),
					'sfx_winlevel_end',
				);
				await waitForTimeout(SECOND);
				await playWithConfig(
					() => sound.players.music.play({ name: 'bgm_freespin' }),
					'bgm_freespin',
				);
			} else {
				await playWithConfig(
					() => sound.players.music.play({ name: 'bgm_main' }),
					'bgm_main',
				);
			}
		},
		soundPressGeneral: () => playWithConfig(
			() => sound.players.once.play({ name: 'sfx_btn_general' }),
			'sfx_btn_general',
		),
		soundPressBet: () => playWithConfig(
			() => sound.players.once.play({ name: 'sfx_btn_spin' }),
			'sfx_btn_spin',
		),
		// scatterCounter
		soundScatterCounterIncrease: () => (context.stateGame.scatterCounter = context.stateGame.scatterCounter + 1), // prettier-ignore
		soundScatterCounterClear: () => (context.stateGame.scatterCounter = 0),
		// game
		soundMusic: ({ name }) => playWithConfig(
			() => sound.players.music.play({ name }),
			name,
		),
		soundLoop: ({ name }) => playWithConfig(
			() => sound.players.loop.play({ name }),
			name,
		),
		soundOnce: ({ name, forcePlay }) => playWithConfig(
			() => sound.players.once.play({ name, forcePlay }),
			name,
		),
		soundStop: ({ name }) => sound.stop({ name }),
		soundFade: async ({ name, duration, from, to }) => await sound.fade({ name, duration, from, to }), // prettier-ignore
		// Game events → play mapped sounds from soundConfig.eventMappings
		boardSettle: () => playEventMappings('boardSettle'),
		boardShow: () => playEventMappings('boardShow'),
		boardHide: () => playEventMappings('boardHide'),
		boardSymbolsReset: () => playEventMappings('boardSymbolsReset'),
		boardWithAnimateSymbols: () => playEventMappings('boardWithAnimateSymbols'),
		boardFrameGlowShow: () => playEventMappings('boardFrameGlowShow'),
		boardFrameGlowHide: () => playEventMappings('boardFrameGlowHide'),
		tumbleBoardShow: () => playEventMappings('tumbleBoardShow'),
		tumbleBoardHide: () => playEventMappings('tumbleBoardHide'),
		tumbleBoardInit: () => playEventMappings('tumbleBoardInit'),
		tumbleBoardReset: () => playEventMappings('tumbleBoardReset'),
		tumbleBoardRemoveExploded: () => playEventMappings('tumbleBoardRemoveExploded'),
		tumbleBoardSlideDown: () => playEventMappings('tumbleBoardSlideDown'),
		tumbleWinAmountShow: () => playEventMappings('tumbleWinAmountShow'),
		tumbleWinAmountHide: () => playEventMappings('tumbleWinAmountHide'),
		tumbleWinAmountUpdate: () => playEventMappings('tumbleWinAmountUpdate'),
		showClusterWinAmounts: () => playEventMappings('showClusterWinAmounts'),
		winShow: () => playEventMappings('winShow'),
		winHide: () => playEventMappings('winHide'),
		winUpdate: () => playEventMappings('winUpdate'),
		freeSpinIntroShow: () => playEventMappings('freeSpinIntroShow'),
		freeSpinIntroHide: () => playEventMappings('freeSpinIntroHide'),
		freeSpinIntroUpdate: () => playEventMappings('freeSpinIntroUpdate'),
		freeSpinCounterShow: () => playEventMappings('freeSpinCounterShow'),
		freeSpinCounterHide: () => playEventMappings('freeSpinCounterHide'),
		freeSpinCounterUpdate: () => playEventMappings('freeSpinCounterUpdate'),
		freeSpinOutroShow: () => playEventMappings('freeSpinOutroShow'),
		freeSpinOutroHide: () => playEventMappings('freeSpinOutroHide'),
		freeSpinOutroCountUp: () => playEventMappings('freeSpinOutroCountUp'),
		globalMultiplierShow: () => playEventMappings('globalMultiplierShow'),
		globalMultiplierHide: () => playEventMappings('globalMultiplierHide'),
		globalMultiplierUpdate: () => playEventMappings('globalMultiplierUpdate'),
		transition: () => playEventMappings('transition'),
		uiShow: () => playEventMappings('uiShow'),
		uiHide: () => playEventMappings('uiHide'),
		bet: () => playEventMappings('bet'),
		resumeBet: () => playEventMappings('resumeBet'),
		stopButtonClick: () => playEventMappings('stopButtonClick'),
		hotKeySpace: () => playEventMappings('hotKeySpace'),
		drawerUnfold: () => playEventMappings('drawerUnfold'),
		drawerFold: () => playEventMappings('drawerFold'),
	});

	onMount(() => {
		if (stateBet.activeBetModeKey === 'SUPERSPIN') {
			playWithConfig(
				() => sound.players.music.play({ name: 'bgm_freespin' }),
				'bgm_freespin',
			);
		} else {
			playWithConfig(
				() => sound.players.music.play({ name: 'bgm_main' }),
				'bgm_main',
			);
		}
	});
</script>
