<script lang="ts">
	import { onMount } from 'svelte';
	import {
		soundConfig,
		soundEditorState,
		getSoundsGrouped,
		addSound,
		removeSound,
		SOUND_GROUPS,
		SOUND_ITEM_DEFAULTS,
		type SoundGroupId,
	} from '../game/soundConfig.svelte';
	import { pushSoundSnapshot } from './editorSoundHistory.svelte';
	import { sound, type SoundName } from '../game/sound';

	const grouped = $derived(getSoundsGrouped());

	let collapsedGroups = $state<Record<string, boolean>>({});
	let playingSound = $state<string | null>(null);
	let showAddPanel = $state(false);
	let newSoundName = $state('');
	let newSoundGroup = $state<SoundGroupId>('ui');

	// Available sounds from audio sprite (loaded at runtime)
	let spriteSoundNames = $state<string[]>([]);

	onMount(async () => {
		try {
			const res = await fetch('./assets/audio/sounds.json');
			if (res.ok) {
				const data = await res.json();
				spriteSoundNames = Object.keys(data.sprite ?? {});
			}
		} catch { /* sounds.json not available */ }
	});

	/** Sounds in the sprite that are NOT yet in the config */
	const availableToAdd = $derived(
		spriteSoundNames.filter((n) => !soundConfig.sounds[n]),
	);

	/** Filtered available sounds for the add panel */
	const filteredAvailable = $derived(
		newSoundName
			? availableToAdd.filter((n) => n.toLowerCase().includes(newSoundName.toLowerCase()))
			: availableToAdd,
	);

	function handleAddSound(name: string) {
		pushSoundSnapshot('add sound ' + name);
		addSound(name, newSoundGroup);
		newSoundName = '';
	}

	function handleAddCustom() {
		const name = newSoundName.trim();
		if (!name || soundConfig.sounds[name]) return;
		pushSoundSnapshot('add custom sound ' + name);
		addSound(name, newSoundGroup);
		newSoundName = '';
	}

	function handleRemoveSound(name: string, e: MouseEvent) {
		e.stopPropagation();
		pushSoundSnapshot('remove sound ' + name);
		removeSound(name);
		if (soundEditorState.selected === name) soundEditorState.selected = null;
	}

	function toggleGroup(g: string) {
		collapsedGroups[g] = !collapsedGroups[g];
	}

	function selectSound(name: string) {
		soundEditorState.selected = name;
	}

	function playPreview(name: string, e: MouseEvent) {
		e.stopPropagation();
		if (playingSound === name) {
			sound.stop({ name: name as SoundName });
			playingSound = null;
		} else {
			if (playingSound) sound.stop({ name: playingSound as SoundName });
			sound.players.once.play({ name: name as any, forcePlay: true });
			playingSound = name;
			setTimeout(() => {
				if (playingSound === name) playingSound = null;
			}, 5000);
		}
	}

	function getGroupLabel(g: SoundGroupId): string {
		return soundConfig.groups[g]?.label ?? g;
	}
</script>

<div class="sound-library">
	<header>
		<span class="title">Sound Library</span>
		<button class="add-toggle" onclick={() => showAddPanel = !showAddPanel} title="Add sound">
			{showAddPanel ? '−' : '+'}
		</button>
	</header>

	<!-- Add Sound Panel -->
	{#if showAddPanel}
		<div class="add-panel">
			<div class="add-panel-header">Add Sound</div>
			<div class="add-row">
				<input
					type="text"
					placeholder="Sound name or search sprite..."
					bind:value={newSoundName}
					class="add-input"
					onkeydown={(e) => e.key === 'Enter' && handleAddCustom()}
				/>
				<select class="add-group-select" bind:value={newSoundGroup}>
					{#each SOUND_GROUPS as g}
						<option value={g}>{getGroupLabel(g)}</option>
					{/each}
				</select>
			</div>
			{#if filteredAvailable.length > 0}
				<div class="available-list">
					<div class="available-hint">{availableToAdd.length} sprite sound(s) not in config:</div>
					{#each filteredAvailable.slice(0, 15) as name}
						<button class="available-item" onclick={() => handleAddSound(name)}>
							<span class="avail-name">{name}</span>
							<span class="avail-add">+ add</span>
						</button>
					{/each}
					{#if filteredAvailable.length > 15}
						<div class="available-hint">...and {filteredAvailable.length - 15} more</div>
					{/if}
				</div>
			{/if}
			{#if newSoundName.trim() && !spriteSoundNames.includes(newSoundName.trim())}
				<button class="add-custom-btn" onclick={handleAddCustom}>
					+ Add custom "{newSoundName.trim()}"
				</button>
			{/if}
		</div>
	{/if}

	<!-- Search -->
	<div class="search-row">
		<input
			type="text"
			placeholder="Search sounds..."
			bind:value={soundEditorState.filterText}
			class="search-input"
		/>
	</div>

	<!-- Group filter -->
	<div class="group-filter">
		<button
			class="filter-btn"
			class:active={!soundEditorState.filterGroup}
			onclick={() => soundEditorState.filterGroup = null}
		>All</button>
		{#each SOUND_GROUPS as g}
			<button
				class="filter-btn"
				class:active={soundEditorState.filterGroup === g}
				onclick={() => soundEditorState.filterGroup = soundEditorState.filterGroup === g ? null : g}
			>{getGroupLabel(g)}</button>
		{/each}
	</div>

	<!-- Sound list by groups -->
	<div class="groups-container">
		{#each SOUND_GROUPS as g}
			{@const sounds = grouped[g]}
			{@const filteredSounds = soundEditorState.filterText
				? sounds.filter(n => n.toLowerCase().includes(soundEditorState.filterText.toLowerCase()))
				: sounds}
			{#if (!soundEditorState.filterGroup || soundEditorState.filterGroup === g) && filteredSounds.length > 0}
				<div class="group">
					<button class="group-header" onclick={() => toggleGroup(g)}>
						<span class="group-arrow">{collapsedGroups[g] ? '▸' : '▾'}</span>
						<span class="group-label">{getGroupLabel(g)}</span>
						<span class="group-count">{filteredSounds.length}</span>
						<span class="group-vol">Vol: {Math.round(soundConfig.groups[g].masterVolume * 100)}%</span>
					</button>

					{#if !collapsedGroups[g]}
						<div class="group-items">
							{#each filteredSounds as name}
								{@const cfg = soundConfig.sounds[name]}
								<!-- svelte-ignore a11y_click_events_have_key_events a11y_no_static_element_interactions -->
								<div
									class="sound-item"
									class:selected={soundEditorState.selected === name}
									class:disabled={!cfg.enabled}
									class:playing={playingSound === name}
									onclick={() => selectSound(name)}
								>
									<button
										class="play-btn"
										onclick={(e) => playPreview(name, e)}
										title={playingSound === name ? 'Stop' : 'Play'}
									>
										{playingSound === name ? '■' : '▶'}
									</button>
									<span class="sound-name">{name}</span>
									<span class="sound-vol">{Math.round(cfg.volume * 100)}%</span>
									<button
										class="remove-sound-btn"
										onclick={(e) => handleRemoveSound(name, e)}
										title="Remove sound"
									>x</button>
								</div>
							{/each}
						</div>
					{/if}
				</div>
			{/if}
		{/each}
	</div>
</div>

<style>
	.sound-library {
		position: fixed;
		top: 8px;
		left: 8px;
		width: 280px;
		max-height: calc(100vh - 16px);
		background: rgba(20, 20, 24, 0.96);
		color: #fff;
		border: 1px solid #ff9f14;
		border-radius: 6px;
		padding: 12px;
		z-index: 9990;
		font-family: -apple-system, system-ui, sans-serif;
		font-size: 12px;
		box-shadow: 0 4px 16px rgba(0, 0, 0, 0.5);
		display: flex;
		flex-direction: column;
		overflow: hidden;
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
	}

	.search-row {
		margin-bottom: 6px;
	}
	.search-input {
		width: 100%;
		background: #111;
		border: 1px solid #333;
		color: #fff;
		padding: 5px 8px;
		border-radius: 4px;
		font-size: 11px;
		box-sizing: border-box;
	}
	.search-input::placeholder {
		color: #555;
	}

	.group-filter {
		display: flex;
		flex-wrap: wrap;
		gap: 3px;
		margin-bottom: 8px;
	}
	.filter-btn {
		background: #1a1a1e;
		color: #888;
		border: 1px solid #333;
		border-radius: 3px;
		padding: 2px 6px;
		font-size: 9px;
		cursor: pointer;
		font-weight: 600;
		transition: all 0.15s;
	}
	.filter-btn.active {
		background: #2a2a2e;
		color: #ff9f14;
		border-color: #ff9f14;
	}
	.filter-btn:hover:not(.active) {
		color: #ccc;
	}

	.groups-container {
		overflow-y: auto;
		flex: 1;
	}

	.group {
		margin-bottom: 4px;
	}
	.group-header {
		display: flex;
		align-items: center;
		gap: 6px;
		width: 100%;
		background: #1a1a1e;
		border: 1px solid #2a2a2e;
		border-radius: 3px;
		padding: 5px 8px;
		cursor: pointer;
		color: #ccc;
		font-size: 11px;
		font-weight: 600;
		transition: all 0.1s;
	}
	.group-header:hover {
		background: #222;
		border-color: #444;
	}
	.group-arrow {
		color: #666;
		font-size: 10px;
		width: 10px;
	}
	.group-label {
		flex: 1;
		text-align: left;
	}
	.group-count {
		color: #555;
		font-size: 9px;
	}
	.group-vol {
		color: #555;
		font-size: 9px;
	}

	.group-items {
		display: flex;
		flex-direction: column;
		gap: 1px;
		padding: 2px 0 2px 12px;
	}
	.sound-item {
		display: flex;
		align-items: center;
		gap: 6px;
		padding: 3px 6px;
		border-radius: 3px;
		cursor: pointer;
		transition: all 0.1s;
		background: transparent;
		border: 1px solid transparent;
		color: #ccc;
		font-size: 11px;
		width: 100%;
		text-align: left;
	}
	.sound-item:hover {
		background: rgba(255, 159, 20, 0.08);
		border-color: rgba(255, 159, 20, 0.2);
	}
	.sound-item.selected {
		background: rgba(255, 159, 20, 0.15);
		border-color: #ff9f14;
	}
	.sound-item.disabled {
		opacity: 0.4;
	}
	.sound-item.playing {
		background: rgba(255, 159, 20, 0.2);
	}

	.play-btn {
		background: #2a2a2e;
		border: 1px solid #444;
		color: #ff9f14;
		width: 20px;
		height: 20px;
		border-radius: 50%;
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 8px;
		cursor: pointer;
		flex-shrink: 0;
		padding: 0;
		transition: all 0.1s;
	}
	.play-btn:hover {
		background: #ff9f14;
		color: #111;
	}

	.sound-name {
		flex: 1;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
		font-family: monospace;
		font-size: 10px;
	}
	.sound-vol {
		color: #666;
		font-size: 9px;
		flex-shrink: 0;
	}

	/* Add toggle button in header */
	.add-toggle {
		background: #2a2a2e;
		color: #ff9f14;
		border: 1px solid #ff9f14;
		width: 22px;
		height: 22px;
		border-radius: 50%;
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 14px;
		font-weight: 700;
		cursor: pointer;
		padding: 0;
		line-height: 1;
		transition: all 0.15s;
	}
	.add-toggle:hover {
		background: #ff9f14;
		color: #111;
	}

	/* Add panel */
	.add-panel {
		background: #1a1a1e;
		border: 1px solid #333;
		border-radius: 4px;
		padding: 8px;
		margin-bottom: 8px;
	}
	.add-panel-header {
		color: #ff9f14;
		font-size: 10px;
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.5px;
		margin-bottom: 6px;
	}
	.add-row {
		display: flex;
		gap: 4px;
		margin-bottom: 6px;
	}
	.add-input {
		flex: 1;
		background: #111;
		border: 1px solid #333;
		color: #fff;
		padding: 4px 6px;
		border-radius: 3px;
		font-size: 10px;
		font-family: monospace;
	}
	.add-input::placeholder {
		color: #555;
	}
	.add-group-select {
		background: #111;
		border: 1px solid #333;
		color: #fff;
		padding: 3px 4px;
		border-radius: 3px;
		font-size: 9px;
		width: 80px;
	}
	.available-list {
		max-height: 150px;
		overflow-y: auto;
		display: flex;
		flex-direction: column;
		gap: 1px;
	}
	.available-hint {
		color: #555;
		font-size: 9px;
		padding: 2px 0;
	}
	.available-item {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 3px 6px;
		background: transparent;
		border: 1px solid transparent;
		color: #aaa;
		border-radius: 3px;
		cursor: pointer;
		font-size: 10px;
		transition: all 0.1s;
		width: 100%;
		text-align: left;
	}
	.available-item:hover {
		background: rgba(57, 255, 20, 0.1);
		border-color: rgba(57, 255, 20, 0.3);
	}
	.avail-name {
		font-family: monospace;
		font-size: 9px;
	}
	.avail-add {
		color: #39ff14;
		font-size: 9px;
		font-weight: 700;
	}
	.add-custom-btn {
		width: 100%;
		background: #1a1a1e;
		border: 1px dashed #39ff14;
		color: #39ff14;
		padding: 5px;
		border-radius: 3px;
		font-size: 10px;
		cursor: pointer;
		margin-top: 4px;
		transition: all 0.15s;
	}
	.add-custom-btn:hover {
		background: rgba(57, 255, 20, 0.15);
	}

	/* Remove button */
	.remove-sound-btn {
		background: transparent;
		border: none;
		color: #444;
		cursor: pointer;
		font-size: 10px;
		padding: 0 3px;
		flex-shrink: 0;
		transition: color 0.1s;
		line-height: 1;
	}
	.remove-sound-btn:hover {
		color: #ff4444;
	}
</style>
