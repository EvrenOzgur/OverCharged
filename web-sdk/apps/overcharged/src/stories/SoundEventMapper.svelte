<script lang="ts">
	import {
		soundConfig,
		getAllSoundNames,
		GAME_EVENTS,
		EVENT_CATEGORIES,
		addEventMapping,
		removeEventMapping,
		type SoundPlayType,
		type GameEventDef,
	} from '../game/soundConfig.svelte';
	import { pushSoundSnapshot } from './editorSoundHistory.svelte';
	import { sound } from '../game/sound';

	let filterCategory = $state<string | null>(null);
	let filterText = $state('');
	let expandedEvent = $state<string | null>(null);
	let addingForEvent = $state<string | null>(null);
	let addSoundName = $state('');
	let addPlayType = $state<SoundPlayType>('once');

	const allSounds = $derived(getAllSoundNames());

	const filteredEvents = $derived(() => {
		let events = GAME_EVENTS;
		if (filterCategory) {
			events = events.filter((e) => e.category === filterCategory);
		}
		if (filterText) {
			const q = filterText.toLowerCase();
			events = events.filter((e) => e.name.toLowerCase().includes(q) || e.label.toLowerCase().includes(q));
		}
		return events;
	});

	function getMappingCount(eventName: string): number {
		return soundConfig.eventMappings[eventName]?.length ?? 0;
	}

	function handleAddMapping(eventName: string) {
		if (!addSoundName) return;
		pushSoundSnapshot('map ' + addSoundName + ' → ' + eventName);
		addEventMapping(eventName, addSoundName, addPlayType);
		addSoundName = '';
		addingForEvent = null;
	}

	function handleRemoveMapping(eventName: string, soundName: string) {
		pushSoundSnapshot('unmap ' + soundName + ' from ' + eventName);
		removeEventMapping(eventName, soundName);
	}

	function handlePlayTypeChange(eventName: string, soundName: string, newType: SoundPlayType) {
		pushSoundSnapshot('change play type');
		const mappings = soundConfig.eventMappings[eventName];
		if (!mappings) return;
		const mapping = mappings.find((m) => m.soundName === soundName);
		if (mapping) mapping.playType = newType;
	}

	function previewSound(soundName: string) {
		sound.players.once.play({ name: soundName as any, forcePlay: true });
	}

	function getCategoryLabel(cat: string): string {
		const labels: Record<string, string> = {
			board: 'Board',
			tumble: 'Tumble',
			win: 'Win',
			freespin: 'Free Spin',
			multiplier: 'Multiplier',
			ui: 'UI',
			sound: 'Sound',
		};
		return labels[cat] ?? cat;
	}

	function getCategoryColor(cat: string): string {
		const colors: Record<string, string> = {
			board: '#14aaff',
			tumble: '#ff6b6b',
			win: '#39ff14',
			freespin: '#ff9f14',
			multiplier: '#c77dff',
			ui: '#888',
			sound: '#ffdd57',
		};
		return colors[cat] ?? '#888';
	}
</script>

<div class="event-mapper">
	<header>
		<span class="title">Event → Sound Mapping</span>
	</header>

	<!-- Search -->
	<div class="search-row">
		<input
			type="text"
			placeholder="Search events..."
			bind:value={filterText}
			class="search-input"
		/>
	</div>

	<!-- Category filter -->
	<div class="category-filter">
		<button
			class="cat-btn"
			class:active={!filterCategory}
			onclick={() => filterCategory = null}
		>All</button>
		{#each EVENT_CATEGORIES as cat}
			<button
				class="cat-btn"
				class:active={filterCategory === cat}
				style="--cat-color: {getCategoryColor(cat)}"
				onclick={() => filterCategory = filterCategory === cat ? null : cat}
			>{getCategoryLabel(cat)}</button>
		{/each}
	</div>

	<!-- Events list -->
	<div class="events-list">
		{#each filteredEvents() as event}
			{@const mappings = soundConfig.eventMappings[event.name] ?? []}
			{@const isExpanded = expandedEvent === event.name}
			<div class="event-item" class:expanded={isExpanded}>
				<!-- svelte-ignore a11y_click_events_have_key_events a11y_no_static_element_interactions -->
				<div class="event-header" onclick={() => expandedEvent = isExpanded ? null : event.name}>
					<span class="event-dot" style="background: {getCategoryColor(event.category)}"></span>
					<span class="event-name">{event.label}</span>
					<span class="event-id">{event.name}</span>
					{#if mappings.length > 0}
						<span class="mapping-badge">{mappings.length}</span>
					{/if}
					<span class="expand-arrow">{isExpanded ? '▾' : '▸'}</span>
				</div>

				{#if isExpanded}
					<div class="event-detail">
						<!-- Current mappings -->
						{#if mappings.length > 0}
							<div class="mappings-list">
								{#each mappings as mapping}
									<div class="mapping-row">
										<button class="preview-btn" onclick={() => previewSound(mapping.soundName)} title="Preview">▶</button>
										<span class="mapping-name">{mapping.soundName}</span>
										<select
											class="type-select"
											value={mapping.playType}
											onchange={(e) => handlePlayTypeChange(event.name, mapping.soundName, (e.currentTarget as HTMLSelectElement).value as SoundPlayType)}
										>
											<option value="once">Once</option>
											<option value="music">Music</option>
											<option value="loop">Loop</option>
										</select>
										<button class="remove-map-btn" onclick={() => handleRemoveMapping(event.name, mapping.soundName)} title="Remove">x</button>
									</div>
								{/each}
							</div>
						{:else}
							<div class="no-mappings">No sounds mapped</div>
						{/if}

						<!-- Add mapping -->
						{#if addingForEvent === event.name}
							<div class="add-mapping-row">
								<select class="sound-select" bind:value={addSoundName}>
									<option value="">Select sound...</option>
									{#each allSounds as s}
										{#if !mappings.some((m) => m.soundName === s)}
											<option value={s}>{s}</option>
										{/if}
									{/each}
								</select>
								<select class="type-select" bind:value={addPlayType}>
									<option value="once">Once</option>
									<option value="music">Music</option>
									<option value="loop">Loop</option>
								</select>
								<button class="confirm-btn" onclick={() => handleAddMapping(event.name)} disabled={!addSoundName}>+</button>
								<button class="cancel-btn" onclick={() => addingForEvent = null}>x</button>
							</div>
						{:else}
							<button class="add-mapping-btn" onclick={() => { addingForEvent = event.name; addSoundName = ''; addPlayType = 'once'; }}>
								+ Map Sound
							</button>
						{/if}
					</div>
				{/if}
			</div>
		{/each}
	</div>
</div>

<style>
	.event-mapper {
		position: fixed;
		top: 60px;
		left: 296px;
		width: 340px;
		max-height: calc(100vh - 70px);
		background: rgba(20, 20, 24, 0.96);
		color: #fff;
		border: 1px solid #ff9f14;
		border-radius: 6px;
		padding: 12px;
		z-index: 9989;
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
	.search-input::placeholder { color: #555; }

	.category-filter {
		display: flex;
		flex-wrap: wrap;
		gap: 3px;
		margin-bottom: 8px;
	}
	.cat-btn {
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
	.cat-btn.active {
		background: #2a2a2e;
		color: var(--cat-color, #ff9f14);
		border-color: var(--cat-color, #ff9f14);
	}
	.cat-btn:hover:not(.active) { color: #ccc; }

	.events-list {
		overflow-y: auto;
		flex: 1;
		display: flex;
		flex-direction: column;
		gap: 2px;
	}

	.event-item {
		border: 1px solid #2a2a2e;
		border-radius: 4px;
		overflow: hidden;
	}
	.event-item.expanded {
		border-color: #444;
	}
	.event-header {
		display: flex;
		align-items: center;
		gap: 6px;
		padding: 5px 8px;
		cursor: pointer;
		transition: background 0.1s;
	}
	.event-header:hover {
		background: #1a1a1e;
	}
	.event-dot {
		width: 8px;
		height: 8px;
		border-radius: 50%;
		flex-shrink: 0;
	}
	.event-name {
		font-size: 11px;
		font-weight: 600;
		color: #ccc;
	}
	.event-id {
		font-size: 9px;
		color: #555;
		font-family: monospace;
		flex: 1;
		text-align: right;
	}
	.mapping-badge {
		background: #ff9f14;
		color: #111;
		font-size: 9px;
		font-weight: 700;
		padding: 1px 5px;
		border-radius: 8px;
		min-width: 16px;
		text-align: center;
	}
	.expand-arrow {
		color: #555;
		font-size: 10px;
		flex-shrink: 0;
	}

	.event-detail {
		padding: 6px 8px;
		border-top: 1px solid #2a2a2e;
		background: #111;
	}
	.no-mappings {
		color: #444;
		font-size: 10px;
		font-style: italic;
		padding: 4px 0;
	}

	.mappings-list {
		display: flex;
		flex-direction: column;
		gap: 3px;
		margin-bottom: 6px;
	}
	.mapping-row {
		display: flex;
		align-items: center;
		gap: 4px;
		padding: 2px 4px;
		background: #1a1a1e;
		border-radius: 3px;
	}
	.preview-btn {
		background: transparent;
		border: none;
		color: #ff9f14;
		cursor: pointer;
		font-size: 8px;
		padding: 2px 4px;
	}
	.preview-btn:hover { color: #ffb94e; }
	.mapping-name {
		flex: 1;
		font-family: monospace;
		font-size: 9px;
		color: #ccc;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}
	.type-select {
		background: #111;
		border: 1px solid #333;
		color: #aaa;
		padding: 1px 3px;
		border-radius: 2px;
		font-size: 9px;
		width: 55px;
	}
	.remove-map-btn {
		background: transparent;
		border: none;
		color: #555;
		cursor: pointer;
		font-size: 11px;
		padding: 0 3px;
	}
	.remove-map-btn:hover { color: #ff4444; }

	.add-mapping-row {
		display: flex;
		gap: 3px;
		align-items: center;
	}
	.sound-select {
		flex: 1;
		background: #111;
		border: 1px solid #333;
		color: #fff;
		padding: 3px 4px;
		border-radius: 3px;
		font-size: 9px;
		font-family: monospace;
	}
	.confirm-btn {
		background: #39ff14;
		color: #111;
		border: none;
		width: 22px;
		height: 22px;
		border-radius: 3px;
		font-size: 12px;
		font-weight: 700;
		cursor: pointer;
	}
	.confirm-btn:disabled { opacity: 0.3; cursor: default; }
	.cancel-btn {
		background: transparent;
		border: none;
		color: #666;
		cursor: pointer;
		font-size: 12px;
		padding: 0 4px;
	}
	.cancel-btn:hover { color: #ff4444; }

	.add-mapping-btn {
		width: 100%;
		background: transparent;
		border: 1px dashed #444;
		color: #666;
		padding: 4px;
		border-radius: 3px;
		font-size: 10px;
		cursor: pointer;
		transition: all 0.15s;
	}
	.add-mapping-btn:hover {
		border-color: #ff9f14;
		color: #ff9f14;
	}
</style>
