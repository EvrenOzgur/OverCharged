<script lang="ts">
	import { gridState } from './editorGrid.svelte';
	import { clipboardState, copySelected, pasteToSelected, resetSelected } from './editorClipboard.svelte';
	import { editorState, copyDesktopToVariant, uiLayoutConfig, RESOLUTION_PRESETS, getActivePreset, type LayoutVariant } from '../game/uiLayoutConfig.svelte';
	import { pushSnapshot } from './editorHistory.svelte';
	import UiExportImport from './UiExportImport.svelte';

	function selectPreset(idx: number) {
		editorState.activePreset = idx;
		if (idx >= 0) {
			const preset = RESOLUTION_PRESETS[idx];
			editorState.activeVariant = preset.layoutType;
			// Ensure variant config exists
			if (preset.layoutType !== 'desktop' && !uiLayoutConfig[preset.layoutType]) {
				pushSnapshot('copy to ' + preset.layoutType);
				copyDesktopToVariant(preset.layoutType);
			}
		} else {
			editorState.activeVariant = 'desktop';
		}
	}

	const activePreset = $derived(getActivePreset());

	const actionFeedback = $derived(
		clipboardState.lastAction && Date.now() - clipboardState.lastActionTime < 1200
			? clipboardState.lastAction
			: null,
	);
</script>

<div class="toolbar">
	<!-- Resolution preset selector -->
	<div class="toolbar-group">
		<span class="toolbar-label">Resolution</span>
		<select
			class="preset-select"
			value={editorState.activePreset}
			onchange={(e) => selectPreset(+(e.currentTarget as HTMLSelectElement).value)}
		>
			<option value="-1">Auto (Window)</option>
			{#each RESOLUTION_PRESETS as preset, i}
				<option value={i}>{preset.name} ({preset.width}x{preset.height})</option>
			{/each}
		</select>
		{#if activePreset}
			<span class="preset-info">{activePreset.layoutType}</span>
		{/if}
	</div>

	<div class="toolbar-sep"></div>

	<!-- Grid controls -->
	<div class="toolbar-group">
		<span class="toolbar-label">Grid</span>
		<select
			value={gridState.gridSize}
			onchange={(e) => { gridState.gridSize = +(e.currentTarget as HTMLSelectElement).value as 0|8|16|32; }}
		>
			<option value="0">Off</option>
			<option value="8">8px</option>
			<option value="16">16px</option>
			<option value="32">32px</option>
		</select>
		<label class="toggle-small">
			<input type="checkbox" bind:checked={gridState.showGrid} />
			Show
		</label>
	</div>

	<!-- Separator -->
	<div class="toolbar-sep"></div>

	<!-- Clipboard controls -->
	<div class="toolbar-group">
		<button
			class="tool-btn"
			onclick={copySelected}
			disabled={!editorState.selected}
			title="Copy (Ctrl+C)"
		>Copy</button>
		<button
			class="tool-btn"
			onclick={pasteToSelected}
			disabled={!editorState.selected || !clipboardState.hasData}
			title="Paste (Ctrl+V)"
		>Paste</button>
		<button
			class="tool-btn reset"
			onclick={resetSelected}
			disabled={!editorState.selected}
			title="Reset to defaults"
		>Reset</button>
		{#if actionFeedback}
			<span class="feedback">{actionFeedback === 'copy' ? 'Copied!' : actionFeedback === 'paste' ? 'Pasted!' : 'Reset!'}</span>
		{/if}
	</div>

	<!-- Separator -->
	<div class="toolbar-sep"></div>

	<!-- Export/Import -->
	<UiExportImport />
</div>

<style>
	.toolbar {
		position: fixed;
		bottom: 8px;
		left: 50%;
		transform: translateX(-50%);
		display: flex;
		align-items: center;
		gap: 6px;
		background: rgba(20, 20, 24, 0.95);
		border: 1px solid #555;
		border-radius: 6px;
		padding: 6px 12px;
		z-index: 9950;
		font-family: -apple-system, system-ui, sans-serif;
		font-size: 11px;
		color: #ccc;
		box-shadow: 0 -2px 12px rgba(0, 0, 0, 0.4);
	}
	.toolbar-group {
		display: flex;
		align-items: center;
		gap: 4px;
	}
	.toolbar-label {
		color: #888;
		font-size: 10px;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.5px;
	}
	.toolbar-sep {
		width: 1px;
		height: 20px;
		background: #444;
		margin: 0 4px;
	}
	select {
		background: #111;
		border: 1px solid #333;
		color: #fff;
		padding: 2px 4px;
		border-radius: 3px;
		font-size: 10px;
		cursor: pointer;
	}
	.toggle-small {
		display: flex;
		align-items: center;
		gap: 3px;
		font-size: 10px;
		color: #888;
		cursor: pointer;
	}
	.toggle-small input {
		width: 12px;
		height: 12px;
		accent-color: #39ff14;
	}
	.tool-btn {
		background: #2a2a2e;
		color: #ccc;
		border: 1px solid #444;
		padding: 3px 8px;
		border-radius: 3px;
		font-size: 10px;
		cursor: pointer;
		font-weight: 600;
		transition: all 0.1s;
	}
	.tool-btn:hover:not(:disabled) {
		background: #39ff14;
		color: #111;
		border-color: #39ff14;
	}
	.tool-btn:disabled {
		opacity: 0.3;
		cursor: default;
	}
	.tool-btn.reset:hover:not(:disabled) {
		background: #f44;
		border-color: #f44;
	}
	.preset-select {
		background: #111;
		border: 1px solid #333;
		color: #fff;
		padding: 3px 6px;
		border-radius: 3px;
		font-size: 10px;
		cursor: pointer;
		min-width: 160px;
	}
	.preset-info {
		background: #39ff14;
		color: #111;
		padding: 2px 6px;
		border-radius: 3px;
		font-size: 9px;
		font-weight: 700;
		text-transform: uppercase;
	}
	.feedback {
		color: #39ff14;
		font-size: 10px;
		font-weight: 700;
		animation: fadeIn 0.15s ease;
	}
	@keyframes fadeIn {
		from { opacity: 0; transform: translateY(2px); }
		to { opacity: 1; transform: translateY(0); }
	}
</style>
