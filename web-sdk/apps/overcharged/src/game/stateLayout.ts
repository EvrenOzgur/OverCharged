import { createLayout } from 'utils-layout';
import { editorState, getActivePreset } from './uiLayoutConfig.svelte';

export const { stateLayout, stateLayoutDerived } = createLayout({
	backgroundRatio: {
		normal: 2039 / 1000,
		portrait: 1242 / 2208,
	},
	mainSizesMap: {
		desktop: { width: 1422, height: 800 },
		tablet: { width: 1000, height: 1000 },
		landscape: { width: 1600, height: 900 },
		portrait: { width: 800, height: 1422 },
	},
	sizeOverride: () => {
		if (!editorState.enabled) return null;
		const preset = getActivePreset();
		return preset ? { width: preset.width, height: preset.height } : null;
	},
});
