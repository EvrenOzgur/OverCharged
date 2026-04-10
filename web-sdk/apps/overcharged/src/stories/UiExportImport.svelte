<script lang="ts">
	import { downloadConfigAsJson, importConfig } from '../game/uiLayoutConfig.svelte';
	import { pushSnapshot } from './editorHistory.svelte';
	import { resetClipboard } from './editorClipboard.svelte';

	let importStatus = $state<'idle' | 'ok' | 'err'>('idle');
	let importError = $state('');

	function handleExport() {
		downloadConfigAsJson();
	}

	function handleImport(e: Event) {
		const input = e.currentTarget as HTMLInputElement;
		const file = input.files?.[0];
		if (!file) return;

		const reader = new FileReader();
		reader.onload = () => {
			pushSnapshot('before import');
			const result = importConfig(reader.result as string);
			if (result.ok) {
				resetClipboard();
				importStatus = 'ok';
				setTimeout(() => (importStatus = 'idle'), 2000);
			} else {
				importStatus = 'err';
				importError = result.error ?? 'Unknown error';
				setTimeout(() => (importStatus = 'idle'), 3000);
			}
		};
		reader.readAsText(file);
		input.value = '';
	}
</script>

<div class="export-import">
	<button class="ei-btn export" onclick={handleExport} title="Download current config as JSON">Export JSON</button>
	<label class="ei-btn import" title="Import config from JSON file">
		Import JSON
		<input type="file" accept=".json" onchange={handleImport} hidden />
	</label>
	{#if importStatus === 'ok'}
		<span class="feedback ok">Imported!</span>
	{:else if importStatus === 'err'}
		<span class="feedback err" title={importError}>Failed</span>
	{/if}
</div>

<style>
	.export-import {
		display: flex;
		align-items: center;
		gap: 4px;
	}
	.ei-btn {
		background: #2a2a2e;
		color: #ccc;
		border: 1px solid #444;
		padding: 3px 8px;
		border-radius: 3px;
		font-size: 10px;
		cursor: pointer;
		font-weight: 600;
		font-family: -apple-system, system-ui, sans-serif;
		transition: all 0.1s;
	}
	.ei-btn:hover {
		background: #555;
		color: #fff;
	}
	.ei-btn.export:hover { background: #39ff14; color: #111; border-color: #39ff14; }
	.ei-btn.import:hover { background: #14aaff; color: #111; border-color: #14aaff; }
	.feedback { font-size: 10px; font-weight: 700; }
	.feedback.ok { color: #39ff14; }
	.feedback.err { color: #f44; cursor: help; }
</style>
