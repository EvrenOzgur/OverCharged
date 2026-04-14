<script lang="ts">
	import { onMount } from 'svelte';

	import type { LoadedAudio } from 'pixi-svelte';

	import { getContext } from '../game/context';
	import { sound, type SoundName } from '../game/sound';
	import { soundConfig } from '../game/soundConfig.svelte';

	const context = getContext();

	onMount(() => {
		const loadedAudio = $state.snapshot(
			context.stateApp.loadedAssets['sound'],
		) as LoadedAudio<SoundName>;

		// Apply soundConfig.json volume overrides to loadedAudio.config
		for (const [name, cfg] of Object.entries(soundConfig.sounds)) {
			if (loadedAudio.config[name as SoundName]) {
				const groupVol = soundConfig.groups[cfg.group]?.masterVolume ?? 1;
				loadedAudio.config[name as SoundName].volume = cfg.volume * groupVol;
			}
		}

		const { destroy } = sound.load(loadedAudio);

		return () => {
			// Equivalent to onDestroy(); Leave this comment for searching.
			destroy();
		};
	});

	sound.enableEffect();
	sound.volumeEffect();
</script>
