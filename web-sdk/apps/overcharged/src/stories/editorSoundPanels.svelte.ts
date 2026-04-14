/** Per-panel visibility state for the Sound Editor. */

export type SoundPanelId = 'library' | 'inspector' | 'timeline' | 'sequencer' | 'eventMapper';

export const soundPanels = $state<Record<SoundPanelId, boolean>>({
	library: true,
	inspector: true,
	timeline: true,
	sequencer: false,
	eventMapper: false,
});

export function toggleSoundPanel(id: SoundPanelId) {
	soundPanels[id] = !soundPanels[id];
}

export function showAllSoundPanels() {
	for (const key of Object.keys(soundPanels) as SoundPanelId[]) {
		soundPanels[key] = true;
	}
}

export function hideAllSoundPanels() {
	for (const key of Object.keys(soundPanels) as SoundPanelId[]) {
		soundPanels[key] = false;
	}
}

export function areAllPanelsHidden(): boolean {
	return Object.values(soundPanels).every((v) => !v);
}
