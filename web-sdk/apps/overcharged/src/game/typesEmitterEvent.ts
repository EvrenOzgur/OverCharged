// @ts-nocheck
import type { EmitterEventBoard } from '../components/Board.svelte';
import type { EmitterEventClusterWinAmounts } from '../components/ClusterWinAmounts.svelte';
import type { EmitterEventTumbleBoard } from '../components/TumbleBoard.svelte';
import type { EmitterEventTumbleWinAmount } from '../components/TumbleWinAmount.svelte';
import type { EmitterEventGlobalMultiplier } from '../components/GlobalMultiplier.svelte';
import type { EmitterEventFreeSpinIntro } from '../components/FreeSpinIntro.svelte';
import type { EmitterEventFreeSpinCounter } from '../components/FreeSpinCounter.svelte';
import type { EmitterEventFreeSpinOutro } from '../components/FreeSpinOutro.svelte';
import type { EmitterEventWin } from '../components/Win.svelte';
import type { EmitterEventSound } from '../components/Sound.svelte';
import type { EmitterEventMultiplierGrid } from '../components/MultiplierGrid.svelte';
import type { EmitterEventTransition } from '../components/Transition.svelte';
import type { EmitterEventSkillMetersUpdate } from '../components/SkillMeter.svelte';
import type { EmitterEventSkillActivatedDisplay } from '../components/SkillActivatedOverlay.svelte';
import type { EmitterEventScreenShake } from '../components/ScreenShake.svelte';
import type { EmitterEventSkillPreHighlight } from '../components/SkillPreHighlight.svelte';
import type { BookEventSkillActivated } from './typesBookEvent';

/**
 * Generic "skip current animation" event. Broadcast by ButtonBetProvider
 * when the user presses Space (or clicks the stop button) during an active
 * animation. Listeners (skill banner, freespin intro, win animations, etc.)
 * should fast-forward their tweens to completion — does NOT switch the game
 * into persistent turbo mode (that's still `stopButtonClick` for ButtonTurbo).
 */
export type EmitterEventSkipAnimation = { type: 'skipAnimation' };

export type EmitterEventGame =
	| EmitterEventBoard
	| EmitterEventSkipAnimation
	| EmitterEventClusterWinAmounts
	| EmitterEventTumbleBoard
	| EmitterEventTumbleWinAmount
	| EmitterEventGlobalMultiplier
	| EmitterEventWin
	| EmitterEventFreeSpinIntro
	| EmitterEventFreeSpinCounter
	| EmitterEventFreeSpinOutro
	| EmitterEventSound
	| EmitterEventMultiplierGrid
	| EmitterEventTransition
	| EmitterEventSkillMetersUpdate
	| EmitterEventSkillActivatedDisplay
	| EmitterEventScreenShake
	| EmitterEventSkillPreHighlight
	| BookEventSkillActivated;
