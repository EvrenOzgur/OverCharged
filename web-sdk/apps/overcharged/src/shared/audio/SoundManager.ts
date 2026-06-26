// Bridge shim for the FooterMenuPackage's `uiStore`, which imports a
// `soundManager` with `mute()` and `setCategoryVolume()`. We map these onto the
// SDK's `stateSound` volume model (0-100 per category).
import { stateSound } from 'state-shared';

class SoundManagerBridge {
	private prevMaster = 50;

	mute(muted: boolean) {
		if (muted) {
			this.prevMaster = stateSound.volumeValueMaster || 50;
			stateSound.volumeValueMaster = 0;
		} else {
			stateSound.volumeValueMaster = this.prevMaster || 50;
		}
	}

	// `vol01` is a normalised 0-1 value (the package passes `percent / 100`).
	setCategoryVolume(category: 'sfx' | 'ui' | 'bgm' | string, vol01: number) {
		const v = Math.round((vol01 ?? 0) * 100);
		if (category === 'bgm') {
			stateSound.volumeValueMusic = v;
		} else {
			// 'sfx' and 'ui' both map to the SDK's sound-effect channel.
			stateSound.volumeValueSoundEffect = v;
		}
	}
}

export const soundManager = new SoundManagerBridge();
