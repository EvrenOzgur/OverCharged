<script lang="ts">
	import { soundEditorState, debouncedSoundSave } from '../game/soundConfig.svelte';
	import { soundUndo, soundRedo, canSoundUndo, canSoundRedo } from './editorSoundHistory.svelte';
	import { copySoundSelected, pasteSoundToSelected, resetSoundSelected, soundClipboardState } from './editorSoundClipboard.svelte';
	import { soundPanels, toggleSoundPanel, showAllSoundPanels, hideAllSoundPanels, areAllPanelsHidden, type SoundPanelId } from './editorSoundPanels.svelte';

	let saveStatus = $state<'idle' | 'saving' | 'ok' | 'err'>('idle');

	function save() {
		saveStatus = 'saving';
		debouncedSoundSave((ok) => {
			saveStatus = ok ? 'ok' : 'err';
			setTimeout(() => (saveStatus = 'idle'), 1500);
		});
	}

	function toggleAll() {
		if (areAllPanelsHidden()) {
			showAllSoundPanels();
		} else {
			hideAllSoundPanels();
		}
	}

	const panelDefs: { id: SoundPanelId; label: string; shortcut: string }[] = [
		{ id: 'library', label: 'Lib', shortcut: 'Sound Library' },
		{ id: 'inspector', label: 'Ins', shortcut: 'Inspector' },
		{ id: 'timeline', label: 'TL', shortcut: 'Timeline' },
		{ id: 'sequencer', label: 'Seq', shortcut: 'Sequencer' },
		{ id: 'eventMapper', label: 'Evt', shortcut: 'Event Mapper' },
	];
</script>

<div class="toolbar">
	<!-- Toggle all -->
	<button class="toggle-all-btn" onclick={toggleAll} title="Toggle all (Tab)">
		{areAllPanelsHidden() ? '☰' : '✕'}
	</button>

	<!-- Panel toggles -->
	<div class="panel-toggles">
		{#each panelDefs as p}
			<button
				class="panel-btn"
				class:active={soundPanels[p.id]}
				onclick={() => toggleSoundPanel(p.id)}
				title={p.shortcut}
			>{p.label}</button>
		{/each}
	</div>

	<div class="separator"></div>

	<!-- Undo / Redo -->
	<button class="tool-btn undo" onclick={soundUndo} disabled={!canSoundUndo()} title="Undo (Ctrl+Z)">&#8630;</button>
	<button class="tool-btn undo" onclick={soundRedo} disabled={!canSoundRedo()} title="Redo (Ctrl+Shift+Z)">&#8631;</button>

	<div class="separator"></div>

	<!-- Clipboard -->
	<button class="tool-btn" onclick={copySoundSelected} disabled={!soundEditorState.selected} title="Copy (Ctrl+C)">Copy</button>
	<button class="tool-btn" onclick={pasteSoundToSelected} disabled={!soundClipboardState.hasData || !soundEditorState.selected} title="Paste (Ctrl+V)">Paste</button>
	<button class="tool-btn" onclick={resetSoundSelected} disabled={!soundEditorState.selected} title="Reset (Del)">Reset</button>

	<div class="separator"></div>

	<!-- Save -->
	<button class="save-btn" onclick={save} disabled={saveStatus === 'saving'}>
		{#if saveStatus === 'saving'}Saving…
		{:else if saveStatus === 'ok'}Saved
		{:else if saveStatus === 'err'}Save failed
		{:else}Save
		{/if}
	</button>

	<!-- Selected indicator -->
	{#if soundEditorState.selected}
		<span class="selected-label">{soundEditorState.selected}</span>
	{/if}
</div>

<style>
	.toolbar {
		position: fixed;
		top: 8px;
		left: 50%;
		transform: translateX(-50%);
		z-index: 10001;
		display: flex;
		align-items: center;
		gap: 4px;
		background: rgba(20, 20, 24, 0.95);
		border: 1px solid #ff9f14;
		border-radius: 6px;
		padding: 4px 8px;
		box-shadow: 0 4px 16px rgba(0, 0, 0, 0.5);
		font-family: -apple-system, system-ui, sans-serif;
	}

	.toggle-all-btn {
		background: transparent;
		color: #ff9f14;
		border: 1px solid #ff9f14;
		padding: 4px 10px;
		border-radius: 4px;
		font-size: 12px;
		font-weight: 700;
		cursor: pointer;
		transition: all 0.15s;
	}
	.toggle-all-btn:hover {
		background: #ff9f14;
		color: #111;
	}

	.panel-toggles {
		display: flex;
		gap: 2px;
	}
	.panel-btn {
		background: #1a1a1e;
		color: #555;
		border: 1px solid #333;
		padding: 3px 7px;
		border-radius: 3px;
		font-size: 10px;
		font-weight: 700;
		cursor: pointer;
		transition: all 0.15s;
	}
	.panel-btn.active {
		background: #2a2a2e;
		color: #ff9f14;
		border-color: #ff9f14;
	}
	.panel-btn:hover:not(.active) {
		color: #aaa;
		border-color: #555;
	}

	.separator {
		width: 1px;
		height: 20px;
		background: #333;
		margin: 0 2px;
	}

	.tool-btn {
		background: #2a2a2e;
		color: #ccc;
		border: 1px solid #444;
		padding: 4px 8px;
		font-size: 11px;
		border-radius: 3px;
		cursor: pointer;
		transition: all 0.1s;
		white-space: nowrap;
	}
	.tool-btn.undo {
		font-size: 16px;
		line-height: 1;
		padding: 2px 6px;
	}
	.tool-btn:disabled {
		opacity: 0.3;
		cursor: default;
	}
	.tool-btn:hover:not(:disabled) {
		background: #ff9f14;
		color: #111;
		border-color: #ff9f14;
	}

	.save-btn {
		background: #ff9f14;
		color: #111;
		border: 0;
		padding: 5px 12px;
		font-weight: 700;
		cursor: pointer;
		border-radius: 4px;
		font-size: 11px;
		white-space: nowrap;
		transition: all 0.15s;
	}
	.save-btn:hover {
		background: #ffb94e;
	}
	.save-btn:disabled {
		opacity: 0.6;
		cursor: default;
	}

	.selected-label {
		color: #ff9f14;
		font-size: 10px;
		font-family: monospace;
		font-weight: 700;
		max-width: 160px;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}
</style>
