/**
 * Live-editable sound configuration.
 *
 * Initial values are loaded from ./soundConfig.json (single source of truth,
 * git-tracked). The Storybook sound editor mutates this $state in-memory and
 * the "Save" button POSTs the current state back to that JSON via a Vite
 * middleware (see .storybook/main.ts), so the next reload picks it up.
 */

import initial from './soundConfig.json';

// ── Types ────────────────────────────────────────────────────────

export type SoundGroupId = 'music' | 'ui' | 'reel' | 'win' | 'multiplier' | 'anticipation';

export type SoundItemConfig = {
	volume: number;
	rate: number;
	fadeIn: number;
	fadeOut: number;
	delay: number;
	group: SoundGroupId;
	enabled: boolean;
};

export type SoundGroupConfig = {
	label: string;
	masterVolume: number;
};

export type SoundSequenceStep = {
	sound: string;
	delay: number;
	fadeIn?: number;
};

export type SoundSequence = {
	steps: SoundSequenceStep[];
};

export type SoundPlayType = 'once' | 'music' | 'loop';

export type EventSoundMapping = {
	soundName: string;
	playType: SoundPlayType;
	/** Whether to force-play even if already playing (once only) */
	forcePlay?: boolean;
};

export type SoundEditorConfig = {
	sounds: Record<string, SoundItemConfig>;
	groups: Record<SoundGroupId, SoundGroupConfig>;
	sequences: Record<string, SoundSequence>;
	/** Maps game event names to sound(s) that should play */
	eventMappings: Record<string, EventSoundMapping[]>;
};

// ── Defaults ─────────────────────────────────────────────────────

export const SOUND_ITEM_DEFAULTS: SoundItemConfig = {
	volume: 1,
	rate: 1,
	fadeIn: 0,
	fadeOut: 0,
	delay: 0,
	group: 'ui',
	enabled: true,
};

export const SOUND_GROUPS: SoundGroupId[] = ['music', 'ui', 'reel', 'win', 'multiplier', 'anticipation'];

// ── Init ─────────────────────────────────────────────────────────

function initConfig(raw: typeof initial): SoundEditorConfig {
	const config: SoundEditorConfig = {
		sounds: {},
		groups: {} as Record<SoundGroupId, SoundGroupConfig>,
		sequences: {},
		eventMappings: {},
	};

	// Sounds
	for (const [id, v] of Object.entries(raw.sounds)) {
		config.sounds[id] = {
			volume: v.volume ?? 1,
			rate: v.rate ?? 1,
			fadeIn: v.fadeIn ?? 0,
			fadeOut: v.fadeOut ?? 0,
			delay: v.delay ?? 0,
			group: (v.group as SoundGroupId) ?? 'ui',
			enabled: v.enabled ?? true,
		};
	}

	// Groups
	for (const [id, v] of Object.entries(raw.groups)) {
		config.groups[id as SoundGroupId] = {
			label: v.label,
			masterVolume: v.masterVolume ?? 1,
		};
	}

	// Sequences
	if (raw.sequences) {
		for (const [id, v] of Object.entries(raw.sequences)) {
			config.sequences[id] = v as SoundSequence;
		}
	}

	// Event mappings
	if ((raw as any).eventMappings) {
		for (const [id, v] of Object.entries((raw as any).eventMappings)) {
			config.eventMappings[id] = v as EventSoundMapping[];
		}
	}

	return config;
}

export const soundConfig = $state<SoundEditorConfig>(initConfig(initial));

// ── Editor state ─────────────────────────────────────────────────

export const soundEditorState = $state({
	enabled: false,
	selected: null as string | null,
	filterText: '',
	filterGroup: null as SoundGroupId | null,
});

// ── Helpers ──────────────────────────────────────────────────────

/** Get the config for a specific sound. */
export function getSoundItemConfig(name: string): SoundItemConfig | undefined {
	return soundConfig.sounds[name];
}

/** Get all sound names. */
export function getAllSoundNames(): string[] {
	return Object.keys(soundConfig.sounds);
}

/** Get sound names filtered by group. */
export function getSoundNamesByGroup(group: SoundGroupId): string[] {
	return Object.entries(soundConfig.sounds)
		.filter(([_, cfg]) => cfg.group === group)
		.map(([name]) => name);
}

/** Get filtered sound names (search + group). */
export function getFilteredSoundNames(): string[] {
	let names = getAllSoundNames();
	if (soundEditorState.filterGroup) {
		names = names.filter((n) => soundConfig.sounds[n]?.group === soundEditorState.filterGroup);
	}
	if (soundEditorState.filterText) {
		const q = soundEditorState.filterText.toLowerCase();
		names = names.filter((n) => n.toLowerCase().includes(q));
	}
	return names;
}

/** Get grouped sound names as { groupId: string[] }. */
export function getSoundsGrouped(): Record<SoundGroupId, string[]> {
	const result = {} as Record<SoundGroupId, string[]>;
	for (const g of SOUND_GROUPS) result[g] = [];
	for (const [name, cfg] of Object.entries(soundConfig.sounds)) {
		if (result[cfg.group]) result[cfg.group].push(name);
	}
	return result;
}

// ── Save ─────────────────────────────────────────────────────────

let saveTimer: ReturnType<typeof setTimeout> | null = null;
let saveInFlight = false;
let saveQueued = false;

export function exportSoundConfig(): string {
	return JSON.stringify(soundConfig, null, 2);
}

async function doSave(): Promise<boolean> {
	saveInFlight = true;
	try {
		return await saveSoundConfig();
	} finally {
		saveInFlight = false;
		if (saveQueued) {
			saveQueued = false;
			doSave();
		}
	}
}

export function debouncedSoundSave(callback?: (ok: boolean) => void) {
	if (saveTimer) clearTimeout(saveTimer);
	saveTimer = setTimeout(async () => {
		saveTimer = null;
		if (saveInFlight) {
			saveQueued = true;
			return;
		}
		const ok = await doSave();
		callback?.(ok);
	}, 300);
}

export async function saveSoundConfig(): Promise<boolean> {
	try {
		const res = await fetch('/__sound-config-save', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: exportSoundConfig(),
		});
		return res.ok;
	} catch (err) {
		console.error('[soundConfig] save failed', err);
		return false;
	}
}

// ── Sound add/remove helpers ─────────────────────────────────────

/** Add a new sound to the config with defaults. */
export function addSound(name: string, group: SoundGroupId = 'ui') {
	if (soundConfig.sounds[name]) return; // already exists
	soundConfig.sounds[name] = { ...SOUND_ITEM_DEFAULTS, group };
}

/** Remove a sound from the config. */
export function removeSound(name: string) {
	delete soundConfig.sounds[name];
	// Clean up event mappings referencing this sound
	for (const [event, mappings] of Object.entries(soundConfig.eventMappings)) {
		soundConfig.eventMappings[event] = mappings.filter((m) => m.soundName !== name);
		if (soundConfig.eventMappings[event].length === 0) {
			delete soundConfig.eventMappings[event];
		}
	}
}

// ── Game event definitions (for the event mapper UI) ─────────────

export type GameEventDef = {
	name: string;
	label: string;
	category: 'board' | 'tumble' | 'win' | 'freespin' | 'multiplier' | 'ui' | 'sound';
};

export const GAME_EVENTS: GameEventDef[] = [
	// Board
	{ name: 'boardSettle', label: 'Board Settle', category: 'board' },
	{ name: 'boardShow', label: 'Board Show', category: 'board' },
	{ name: 'boardHide', label: 'Board Hide', category: 'board' },
	{ name: 'boardSymbolsReset', label: 'Symbols Reset', category: 'board' },
	{ name: 'boardWithAnimateSymbols', label: 'Animate Symbols', category: 'board' },
	// Tumble
	{ name: 'tumbleBoardShow', label: 'Tumble Show', category: 'tumble' },
	{ name: 'tumbleBoardHide', label: 'Tumble Hide', category: 'tumble' },
	{ name: 'tumbleBoardInit', label: 'Tumble Init', category: 'tumble' },
	{ name: 'tumbleBoardReset', label: 'Tumble Reset', category: 'tumble' },
	{ name: 'tumbleBoardRemoveExploded', label: 'Tumble Remove Exploded', category: 'tumble' },
	{ name: 'tumbleBoardSlideDown', label: 'Tumble Slide Down', category: 'tumble' },
	{ name: 'tumbleWinAmountShow', label: 'Tumble Win Show', category: 'tumble' },
	{ name: 'tumbleWinAmountHide', label: 'Tumble Win Hide', category: 'tumble' },
	{ name: 'tumbleWinAmountUpdate', label: 'Tumble Win Update', category: 'tumble' },
	{ name: 'showClusterWinAmounts', label: 'Cluster Win Show', category: 'tumble' },
	// Win
	{ name: 'winShow', label: 'Win Show', category: 'win' },
	{ name: 'winHide', label: 'Win Hide', category: 'win' },
	{ name: 'winUpdate', label: 'Win Update', category: 'win' },
	// FreeSpin
	{ name: 'freeSpinIntroShow', label: 'FS Intro Show', category: 'freespin' },
	{ name: 'freeSpinIntroHide', label: 'FS Intro Hide', category: 'freespin' },
	{ name: 'freeSpinIntroUpdate', label: 'FS Intro Update', category: 'freespin' },
	{ name: 'freeSpinCounterShow', label: 'FS Counter Show', category: 'freespin' },
	{ name: 'freeSpinCounterHide', label: 'FS Counter Hide', category: 'freespin' },
	{ name: 'freeSpinCounterUpdate', label: 'FS Counter Update', category: 'freespin' },
	{ name: 'freeSpinOutroShow', label: 'FS Outro Show', category: 'freespin' },
	{ name: 'freeSpinOutroHide', label: 'FS Outro Hide', category: 'freespin' },
	{ name: 'freeSpinOutroCountUp', label: 'FS Outro Count Up', category: 'freespin' },
	// Multiplier
	{ name: 'globalMultiplierShow', label: 'Multiplier Show', category: 'multiplier' },
	{ name: 'globalMultiplierHide', label: 'Multiplier Hide', category: 'multiplier' },
	{ name: 'globalMultiplierUpdate', label: 'Multiplier Update', category: 'multiplier' },
	// UI
	{ name: 'hotKeySpace', label: 'HotKey Space', category: 'ui' },
	{ name: 'stopButtonClick', label: 'Stop Button Click', category: 'ui' },
	{ name: 'uiShow', label: 'UI Show', category: 'ui' },
	{ name: 'uiHide', label: 'UI Hide', category: 'ui' },
	{ name: 'drawerUnfold', label: 'Drawer Unfold', category: 'ui' },
	{ name: 'drawerFold', label: 'Drawer Fold', category: 'ui' },
	{ name: 'bet', label: 'Bet', category: 'ui' },
	{ name: 'resumeBet', label: 'Resume Bet', category: 'ui' },
	{ name: 'transition', label: 'Transition', category: 'ui' },
	// Sound (built-in sound events for mapping override)
	{ name: 'soundPressGeneral', label: 'Button Press', category: 'sound' },
	{ name: 'soundPressBet', label: 'Spin Press', category: 'sound' },
	{ name: 'soundScatterCounterIncrease', label: 'Scatter Counter +', category: 'sound' },
	{ name: 'soundScatterCounterClear', label: 'Scatter Counter Clear', category: 'sound' },
];

export const EVENT_CATEGORIES = ['board', 'tumble', 'win', 'freespin', 'multiplier', 'ui', 'sound'] as const;

// ── Event mapping helpers ────────────────────────────────────────

export function addEventMapping(eventName: string, soundName: string, playType: SoundPlayType = 'once') {
	if (!soundConfig.eventMappings[eventName]) {
		soundConfig.eventMappings[eventName] = [];
	}
	// Avoid duplicates
	if (soundConfig.eventMappings[eventName].some((m) => m.soundName === soundName)) return;
	soundConfig.eventMappings[eventName].push({ soundName, playType });
}

export function removeEventMapping(eventName: string, soundName: string) {
	const mappings = soundConfig.eventMappings[eventName];
	if (!mappings) return;
	soundConfig.eventMappings[eventName] = mappings.filter((m) => m.soundName !== soundName);
	if (soundConfig.eventMappings[eventName].length === 0) {
		delete soundConfig.eventMappings[eventName];
	}
}

export function getEventMappings(eventName: string): EventSoundMapping[] {
	return soundConfig.eventMappings[eventName] ?? [];
}

// ── Sequence helpers ─────────────────────────────────────────────

export function addSequence(name: string): SoundSequence {
	const seq: SoundSequence = { steps: [] };
	soundConfig.sequences[name] = seq;
	return seq;
}

export function removeSequence(name: string) {
	delete soundConfig.sequences[name];
}

export function addSequenceStep(seqName: string, soundName: string) {
	const seq = soundConfig.sequences[seqName];
	if (!seq) return;
	seq.steps.push({ sound: soundName, delay: 0 });
}

export function removeSequenceStep(seqName: string, index: number) {
	const seq = soundConfig.sequences[seqName];
	if (!seq) return;
	seq.steps.splice(index, 1);
}

// ── Export/Import ────────────────────────────────────────────────

export function downloadSoundConfigAsJson() {
	const data = exportSoundConfig();
	const blob = new Blob([data], { type: 'application/json' });
	const url = URL.createObjectURL(blob);
	const a = document.createElement('a');
	a.href = url;
	a.download = `soundConfig_${new Date().toISOString().slice(0, 10)}.json`;
	a.click();
	URL.revokeObjectURL(url);
}

export function importSoundConfig(jsonStr: string): { ok: boolean; error?: string } {
	try {
		const data = JSON.parse(jsonStr);
		if (!data?.sounds || typeof data.sounds !== 'object') {
			return { ok: false, error: 'Missing "sounds" key' };
		}
		if (!data?.groups || typeof data.groups !== 'object') {
			return { ok: false, error: 'Missing "groups" key' };
		}

		// Apply sounds
		for (const key of Object.keys(soundConfig.sounds)) {
			if (!(key in data.sounds)) delete soundConfig.sounds[key];
		}
		for (const [key, val] of Object.entries(data.sounds)) {
			const v = val as any;
			soundConfig.sounds[key] = {
				...SOUND_ITEM_DEFAULTS,
				...v,
			};
		}

		// Apply groups
		for (const [key, val] of Object.entries(data.groups)) {
			soundConfig.groups[key as SoundGroupId] = val as SoundGroupConfig;
		}

		// Apply sequences
		if (data.sequences && typeof data.sequences === 'object') {
			for (const key of Object.keys(soundConfig.sequences)) {
				if (!(key in data.sequences)) delete soundConfig.sequences[key];
			}
			for (const [key, val] of Object.entries(data.sequences)) {
				soundConfig.sequences[key] = val as SoundSequence;
			}
		}

		// Apply event mappings
		if (data.eventMappings && typeof data.eventMappings === 'object') {
			for (const key of Object.keys(soundConfig.eventMappings)) {
				if (!(key in data.eventMappings)) delete soundConfig.eventMappings[key];
			}
			for (const [key, val] of Object.entries(data.eventMappings)) {
				soundConfig.eventMappings[key] = val as EventSoundMapping[];
			}
		}

		return { ok: true };
	} catch (e) {
		return { ok: false, error: String(e) };
	}
}
