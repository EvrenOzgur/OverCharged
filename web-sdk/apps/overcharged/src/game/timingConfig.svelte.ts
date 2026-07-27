/**
 * Live-editable tumble-flow timing configuration.
 *
 * Initial values are loaded from ./timingConfig.json (single source of truth,
 * git-tracked). The Storybook Timing Editor mutates this $state in-memory and
 * its "Save" button POSTs the current state back to that JSON via a Vite
 * middleware (see .storybook/main.ts), so the next reload picks it up.
 *
 * Scope: these are the JS-driven wait/tween durations that pace the tumble
 * cascade (explosion → slide down → settle → win amounts → multiplier
 * apply). Per-symbol explosion/land Spine animations aren't editable here
 * (that requires touching the asset), but their *playback speed* is — see
 * `symbolAnimationSpeed`, a timeScale multiplier applied on top of the
 * existing turbo timeScale in SymbolSpineMain.svelte.
 */

import initial from './timingConfig.json';

// ── Types ────────────────────────────────────────────────────────

export type TimingConfig = {
	tumble: {
		/** Per-symbol bounce-down tween duration when a tumble slides the board down. */
		slideDownBounceDurationMs: number;
		/** Minimum time the settled board stays visible before the next tumble's explosion starts. */
		minTumbleViewMs: number;
	};
	symbolAnimationSpeed: {
		/** Spine timeScale multiplier for the 'win' flash state (declared duration 1.333s). */
		win: number;
		/** Spine timeScale multiplier for the 'explosion' state (declared duration 0.9s). */
		explosion: number;
	};
	clusterWinAmount: {
		/** How long a per-cluster win's multiplier badge stays up before the combine punch. */
		multiplierBadgeHoldMs: number;
		/** Scale-punch shrink duration (part 1 of the combine punch) — the sound and text swap land here. */
		combineScaleDownMs: number;
		/** Scale-punch grow-back duration (part 2 of the combine punch). */
		combineScaleUpMs: number;
		/** Duration of the win amount label floating upward before it's removed. */
		floatUpDurationMs: number;
	};
	globalMultiplier: {
		/** Delay between the reset animation starting and its sound firing. */
		resetSoundDelayMs: number;
	};
	finalMultiplier: {
		/** Skippable hold after the final multiplied win amount is shown. */
		postWinHoldMs: number;
	};
};

// ── Init ─────────────────────────────────────────────────────────

function cloneInitial(raw: typeof initial): TimingConfig {
	return JSON.parse(JSON.stringify(raw));
}

export const timingConfig = $state<TimingConfig>(cloneInitial(initial));

export const TIMING_DEFAULTS: TimingConfig = cloneInitial(initial);

export function resetTimingConfig() {
	const defaults = cloneInitial(TIMING_DEFAULTS);
	for (const section of Object.keys(defaults) as (keyof TimingConfig)[]) {
		Object.assign(timingConfig[section], defaults[section]);
	}
}

// ── Editor state ─────────────────────────────────────────────────

export const timingEditorState = $state({
	enabled: false,
});

// ── Save ─────────────────────────────────────────────────────────

let saveTimer: ReturnType<typeof setTimeout> | null = null;
let saveInFlight = false;
let saveQueued = false;

export function exportTimingConfig(): string {
	return JSON.stringify(timingConfig, null, 2);
}

async function doSave(): Promise<boolean> {
	saveInFlight = true;
	try {
		return await saveTimingConfig();
	} finally {
		saveInFlight = false;
		if (saveQueued) {
			saveQueued = false;
			doSave();
		}
	}
}

export function debouncedTimingSave(callback?: (ok: boolean) => void) {
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

export async function saveTimingConfig(): Promise<boolean> {
	try {
		const res = await fetch('/__timing-config-save', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: exportTimingConfig(),
		});
		return res.ok;
	} catch {
		return false;
	}
}
