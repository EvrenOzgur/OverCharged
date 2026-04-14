<script lang="ts">
	import {
		soundConfig,
		soundEditorState,
		SOUND_GROUPS,
		type SoundGroupId,
	} from '../game/soundConfig.svelte';
	import { pushSoundSnapshotDebounced } from './editorSoundHistory.svelte';
	import { sound } from '../game/sound';

	let activeTab = $state<'general' | 'fade' | 'group'>('general');
	let playingPreview = $state(false);

	const cfg = $derived(soundEditorState.selected ? soundConfig.sounds[soundEditorState.selected] : undefined);

	function onValueChange() {
		pushSoundSnapshotDebounced('inspector change');
	}

	function close() {
		soundEditorState.selected = null;
	}

	function playPreview() {
		const name = soundEditorState.selected;
		if (!name) return;
		if (playingPreview) {
			sound.stop({ name: name as any });
			playingPreview = false;
		} else {
			sound.players.once.play({ name: name as any, forcePlay: true });
			playingPreview = true;
			setTimeout(() => { playingPreview = false; }, 5000);
		}
	}

	function getGroupLabel(g: SoundGroupId): string {
		return soundConfig.groups[g]?.label ?? g;
	}
</script>

{#if cfg && soundEditorState.selected}
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<div class="inspector" onchange={onValueChange} oninput={onValueChange}>
		<header>
			<span class="title">{soundEditorState.selected}</span>
			<div class="header-actions">
				<button class="preview-btn" onclick={playPreview} title="Preview">
					{playingPreview ? '■ Stop' : '▶ Play'}
				</button>
				<button class="close" onclick={close} aria-label="Close">&times;</button>
			</div>
		</header>

		<!-- Tab bar -->
		<div class="tab-bar">
			<button class="tab" class:active={activeTab === 'general'} onclick={() => activeTab = 'general'}>General</button>
			<button class="tab" class:active={activeTab === 'fade'} onclick={() => activeTab = 'fade'}>Fade & Timing</button>
			<button class="tab" class:active={activeTab === 'group'} onclick={() => activeTab = 'group'}>Group</button>
		</div>

		<!-- General Tab -->
		{#if activeTab === 'general'}
			<div class="tab-content">
				<div class="toggle-row">
					<label>Enabled</label>
					<input type="checkbox" bind:checked={cfg.enabled} />
				</div>
				<div class="row">
					<label>Volume</label>
					<input type="number" bind:value={cfg.volume} step="0.05" min="0" max="1" />
					<input type="range" min="0" max="1" step="0.05" bind:value={cfg.volume} />
				</div>
				<div class="value-display">{Math.round(cfg.volume * 100)}%</div>
				<div class="row">
					<label>Rate</label>
					<input type="number" bind:value={cfg.rate} step="0.05" min="0.25" max="4" />
					<input type="range" min="0.25" max="4" step="0.05" bind:value={cfg.rate} />
				</div>
				<div class="value-display">{cfg.rate.toFixed(2)}x</div>
			</div>
		{/if}

		<!-- Fade & Timing Tab -->
		{#if activeTab === 'fade'}
			<div class="tab-content">
				<div class="row">
					<label>Fade In</label>
					<input type="number" bind:value={cfg.fadeIn} step="50" min="0" max="5000" />
					<input type="range" min="0" max="5000" step="50" bind:value={cfg.fadeIn} />
				</div>
				<div class="value-display">{cfg.fadeIn}ms</div>
				<div class="row">
					<label>Fade Out</label>
					<input type="number" bind:value={cfg.fadeOut} step="50" min="0" max="5000" />
					<input type="range" min="0" max="5000" step="50" bind:value={cfg.fadeOut} />
				</div>
				<div class="value-display">{cfg.fadeOut}ms</div>
				<div class="row">
					<label>Delay</label>
					<input type="number" bind:value={cfg.delay} step="50" min="0" max="5000" />
					<input type="range" min="0" max="5000" step="50" bind:value={cfg.delay} />
				</div>
				<div class="value-display">{cfg.delay}ms</div>
			</div>
		{/if}

		<!-- Group Tab -->
		{#if activeTab === 'group'}
			<div class="tab-content">
				<div class="select-row">
					<label>Group</label>
					<select
						value={cfg.group}
						onchange={(e) => { cfg.group = (e.currentTarget as HTMLSelectElement).value as SoundGroupId; }}
					>
						{#each SOUND_GROUPS as g}
							<option value={g}>{getGroupLabel(g)}</option>
						{/each}
					</select>
				</div>

				<div class="section-title">Group Master Volume</div>
				{#each SOUND_GROUPS as g}
					{@const group = soundConfig.groups[g]}
					<div class="row">
						<label>{group.label}</label>
						<input type="number" bind:value={group.masterVolume} step="0.05" min="0" max="1" />
						<input type="range" min="0" max="1" step="0.05" bind:value={group.masterVolume} />
					</div>
				{/each}
			</div>
		{/if}
	</div>
{/if}

<!-- No selection: show group volumes overview -->
{#if !soundEditorState.selected}
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<div class="inspector" onchange={onValueChange} oninput={onValueChange}>
		<header>
			<span class="title">Group Volumes</span>
		</header>
		<div class="tab-content">
			{#each SOUND_GROUPS as g}
				{@const group = soundConfig.groups[g]}
				<div class="row">
					<label>{group.label}</label>
					<input type="number" bind:value={group.masterVolume} step="0.05" min="0" max="1" />
					<input type="range" min="0" max="1" step="0.05" bind:value={group.masterVolume} />
				</div>
			{/each}
		</div>
	</div>
{/if}

<style>
	.inspector {
		position: fixed;
		top: 60px;
		right: 8px;
		width: 320px;
		background: rgba(20, 20, 24, 0.96);
		color: #fff;
		border: 1px solid #ff9f14;
		border-radius: 6px;
		padding: 12px;
		z-index: 9990;
		font-family: -apple-system, system-ui, sans-serif;
		font-size: 12px;
		box-shadow: 0 4px 16px rgba(0, 0, 0, 0.5);
	}
	header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 8px;
		padding-bottom: 8px;
		border-bottom: 1px solid #333;
	}
	.title {
		color: #ff9f14;
		font-weight: 700;
		font-size: 13px;
		font-family: monospace;
	}
	.header-actions {
		display: flex;
		gap: 6px;
		align-items: center;
	}
	.preview-btn {
		background: #2a2a2e;
		color: #ff9f14;
		border: 1px solid #ff9f14;
		padding: 3px 10px;
		border-radius: 3px;
		font-size: 10px;
		font-weight: 700;
		cursor: pointer;
		transition: all 0.15s;
	}
	.preview-btn:hover {
		background: #ff9f14;
		color: #111;
	}
	.close {
		background: transparent;
		color: #fff;
		border: 0;
		font-size: 20px;
		line-height: 1;
		cursor: pointer;
		padding: 0 4px;
	}

	/* Tab bar */
	.tab-bar {
		display: flex;
		gap: 2px;
		margin-bottom: 10px;
		border-bottom: 1px solid #333;
		padding-bottom: 6px;
	}
	.tab {
		flex: 1;
		background: #1a1a1e;
		color: #888;
		border: 1px solid #333;
		border-radius: 4px 4px 0 0;
		padding: 5px 4px;
		font-size: 11px;
		cursor: pointer;
		font-weight: 600;
		transition: all 0.15s;
	}
	.tab.active {
		background: #2a2a2e;
		color: #ff9f14;
		border-color: #ff9f14;
		border-bottom-color: transparent;
	}
	.tab:hover:not(.active) {
		color: #ccc;
		background: #222;
	}

	.tab-content {
		display: flex;
		flex-direction: column;
		gap: 6px;
	}

	.row {
		display: grid;
		grid-template-columns: 80px 65px 1fr;
		gap: 8px;
		align-items: center;
	}
	.row label {
		color: #aaa;
		font-size: 11px;
	}
	.row input[type='number'] {
		background: #111;
		border: 1px solid #333;
		color: #fff;
		padding: 3px 6px;
		border-radius: 3px;
		width: 100%;
		font-size: 11px;
	}
	.row input[type='range'] {
		width: 100%;
	}

	.value-display {
		text-align: right;
		color: #666;
		font-size: 9px;
		margin-top: -4px;
		margin-bottom: 2px;
	}

	.toggle-row {
		display: grid;
		grid-template-columns: 80px 1fr;
		gap: 8px;
		align-items: center;
	}
	.toggle-row label {
		color: #aaa;
		font-size: 11px;
	}
	.toggle-row input[type='checkbox'] {
		width: 16px;
		height: 16px;
		cursor: pointer;
		accent-color: #ff9f14;
	}

	.select-row {
		display: grid;
		grid-template-columns: 80px 1fr;
		gap: 8px;
		align-items: center;
	}
	.select-row label {
		color: #aaa;
		font-size: 11px;
	}
	.select-row select {
		background: #111;
		border: 1px solid #333;
		color: #fff;
		padding: 4px 6px;
		border-radius: 3px;
		font-size: 11px;
		cursor: pointer;
		width: 100%;
	}

	.section-title {
		color: #ff9f14;
		font-size: 10px;
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.5px;
		margin-top: 8px;
		padding-bottom: 3px;
		border-bottom: 1px solid #2a2a2e;
	}
</style>
