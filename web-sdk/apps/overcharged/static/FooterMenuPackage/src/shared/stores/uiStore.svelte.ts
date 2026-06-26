import { RESOLUTION_PRESETS, type ResolutionPreset } from '../utils/resolutions';
import { soundManager } from '../audio/SoundManager';

export class UIStore {
    currentResolution = $state<ResolutionPreset>(RESOLUTION_PRESETS[0]); // Default: Desktop
    isManualResolution = $state(false);
    showDebug = $state(false);

    sfxVolume = $state(100);
    bgmVolume = $state(5);
    turboLevel = $state(0);
    soundEnabled = $state(true);
    isMockScatter = $state(false);
    isSpecialBonusActive = $state(false);
    activeBackgroundMode = $state<'base' | 'bonus' | 'multi'>('base');
    specialBonusMultipliers = $state<number[]>([1, 1, 1]);

    // Tornado Spin Mode States
    isTornadoModeActive = $state(true);
    isSubsequentTornadoSpin = $state(false);
    tornadoColumns = $state<number[]>([0]);
    tornadoMultipliers = $state<number[]>([1024]);

    get tornadoColumn(): number | null {
        return this.tornadoColumns.length > 0 ? this.tornadoColumns[0] : null;
    }
    set tornadoColumn(val: number | null) {
        if (val === null) {
            this.tornadoColumns = [];
        } else {
            this.tornadoColumns = [val];
        }
    }

    get tornadoMultiplier(): number | null {
        return this.tornadoMultipliers.length > 0 ? this.tornadoMultipliers[0] : null;
    }
    set tornadoMultiplier(val: number | null) {
        if (val === null) {
            this.tornadoMultipliers = [];
        } else {
            this.tornadoMultipliers = [val];
        }
    }
    
    // Test amaçlı
    debugMultiSpin = $state(false);
    debugMultiValues = $state<number[]>([10, 50, 100]);
    debugSymbolScale = $state(1.15);
    debugShowBorders = $state(false);
    debugReelMaskPaddingX = $state(0);
    debugReelMaskPaddingY = $state(0);
    debugGlobalMaskPaddingX = $state(20);
    debugGlobalMaskPaddingY = $state(0);
    debugContentScale = $state(1.0);
    debugBgScale = $state(1.0);

    setResolution(preset: ResolutionPreset, manual = false) {
        this.currentResolution = preset;
        this.isManualResolution = manual;
        this.updateDebugScalesForResolution(preset.value);
    }

    setResolutionByName(name: string, manual = false) {
        const found = RESOLUTION_PRESETS.find(p => p.name.includes(name) || p.value === name);
        if (found) {
            this.currentResolution = found;
            this.isManualResolution = manual;
            this.updateDebugScalesForResolution(found.value);
        }
    }

    toggleTurbo() {
        this.turboLevel = (this.turboLevel + 1) % 2;
    }

    toggleSound() {
        this.soundEnabled = !this.soundEnabled;
        soundManager.mute(!this.soundEnabled);
    }

    toggleMockScatter() {
        this.isMockScatter = !this.isMockScatter;
    }

    private updateDebugScalesForResolution(resValue: string) {
        if (resValue === 'mobileL' || resValue === 'mobileM' || resValue === 'mobileS') {
            this.debugBgScale = 1.62;
            this.debugContentScale = 1.90;
        } else {
            this.debugBgScale = 1.0;
            this.debugContentScale = 1.0;
        }
    }

    setSfxVolume(vol: number) {
        this.sfxVolume = vol;
        soundManager.setCategoryVolume('sfx', vol / 100);
        soundManager.setCategoryVolume('ui', vol / 100);
    }

    setBgmVolume(vol: number) {
        this.bgmVolume = vol;
        soundManager.setCategoryVolume('bgm', vol / 100);
    }

    toggleDebug() {
        this.showDebug = !this.showDebug;
    }
}

export const uiStore = new UIStore();
