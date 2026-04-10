<script lang="ts">
	import {
		uiLayoutConfig,
		addBgLayer,
		removeBgLayer,
		moveBgLayer,
		debouncedSave,
		type BgLayer,
		type BgLayerType,
		type SpineAnimTrack,
	} from '../game/uiLayoutConfig.svelte';
	import { pushSnapshot, pushSnapshotDebounced } from './editorHistory.svelte';
	import assets from '../game/assets';

	const spriteAssetKeys = Object.entries(assets)
		.filter(([_, v]) => v.type === 'sprite' || v.type === 'sprites' || v.type === 'spriteSheet')
		.map(([k]) => k);
	const spineAssetKeys = Object.entries(assets)
		.filter(([_, v]) => v.type === 'spine')
		.map(([k]) => k);

	let selectedLayerId = $state<string | null>(null);
	let saveStatus = $state<'idle' | 'saving' | 'ok' | 'err'>('idle');

	const layers = $derived(uiLayoutConfig.bgLayers);
	const selectedLayer = $derived(selectedLayerId ? layers.find((l) => l.id === selectedLayerId) : null);

	function save() {
		saveStatus = 'saving';
		debouncedSave((ok) => {
			saveStatus = ok ? 'ok' : 'err';
			setTimeout(() => (saveStatus = 'idle'), 1500);
		});
	}

	function onValueChange() {
		pushSnapshotDebounced('bg layer change');
	}

	function handleAdd() {
		pushSnapshot('add bg layer');
		const layer = addBgLayer('color');
		selectedLayerId = layer.id;
	}

	function handleRemove(id: string) {
		pushSnapshot('remove bg layer');
		if (selectedLayerId === id) selectedLayerId = null;
		removeBgLayer(id);
	}

	function handleAddAnim(layer: BgLayer) {
		const nextTrack = layer.spineAnims.length;
		layer.spineAnims.push({ trackIndex: nextTrack, animationName: '', loop: true });
		// trigger reactivity
		layer.spineAnims = [...layer.spineAnims];
	}

	function handleRemoveAnim(layer: BgLayer, idx: number) {
		layer.spineAnims.splice(idx, 1);
		layer.spineAnims = [...layer.spineAnims];
	}

	function typeLabel(t: BgLayerType): string {
		if (t === 'color') return 'COL';
		if (t === 'sprite') return 'SPR';
		return 'SPN';
	}
</script>

<div class="bg-editor">
	<header>
		<span class="title">Background Layers</span>
		<div class="header-actions">
			<button class="save-btn" onclick={save} disabled={saveStatus === 'saving'}>
				{#if saveStatus === 'saving'}Saving…
				{:else if saveStatus === 'ok'}Saved
				{:else if saveStatus === 'err'}Failed
				{:else}Save
				{/if}
			</button>
			<button class="add-btn" onclick={handleAdd} aria-label="Add layer">+</button>
		</div>
	</header>

	<!-- Layer list -->
	<div class="layer-list">
		{#each layers as layer, i (layer.id)}
			<div
				class="layer-item"
				class:selected={selectedLayerId === layer.id}
				onclick={() => selectedLayerId = layer.id}
			>
				<div class="layer-controls">
					<button
						class="move-btn"
						disabled={i === 0}
						onclick={(e) => { e.stopPropagation(); moveBgLayer(layer.id, -1); }}
						aria-label="Move up"
					>&uarr;</button>
					<button
						class="move-btn"
						disabled={i === layers.length - 1}
						onclick={(e) => { e.stopPropagation(); moveBgLayer(layer.id, 1); }}
						aria-label="Move down"
					>&darr;</button>
				</div>
				<span class="layer-badge">{typeLabel(layer.type)}</span>
				<span class="layer-name">{layer.name}</span>
				<div class="layer-actions">
					<button
						class="vis-btn"
						class:off={!layer.visible}
						onclick={(e) => { e.stopPropagation(); layer.visible = !layer.visible; }}
						aria-label="Toggle visibility"
					>{layer.visible ? '&#128065;' : '&#128064;'}</button>
					<button
						class="del-btn"
						onclick={(e) => { e.stopPropagation(); handleRemove(layer.id); }}
						aria-label="Remove layer"
					>&times;</button>
				</div>
			</div>
		{/each}
		{#if layers.length === 0}
			<div class="empty">No layers. Click + to add one.</div>
		{/if}
	</div>

	<!-- Selected layer editor -->
	{#if selectedLayer}
		<!-- svelte-ignore a11y_no_static_element_interactions -->
		<div class="layer-editor" onchange={onValueChange} oninput={onValueChange}>
			<div class="section-title">General</div>
			<div class="field">
				<label>Name</label>
				<input type="text" bind:value={selectedLayer.name} class="text-input" />
			</div>
			<div class="field">
				<label>Type</label>
				<select
					value={selectedLayer.type}
					onchange={(e) => { selectedLayer.type = (e.currentTarget as HTMLSelectElement).value as BgLayerType; }}
				>
					<option value="color">Solid Color</option>
					<option value="sprite">Sprite / Image</option>
					<option value="spine">Spine Animation</option>
				</select>
			</div>

			<!-- Type-specific controls -->
			{#if selectedLayer.type === 'color'}
				<div class="color-field">
					<label>Color</label>
					<input type="color" bind:value={selectedLayer.color} />
					<input type="text" bind:value={selectedLayer.color} class="hex-input" />
				</div>
			{/if}

			{#if selectedLayer.type === 'sprite'}
				<div class="section-title">Sprite Asset</div>
				<div class="field">
					<label>Key</label>
					<input
						type="text"
						bind:value={selectedLayer.spriteKey}
						list="bg-sprite-keys"
						placeholder="asset key..."
						class="text-input"
					/>
					<datalist id="bg-sprite-keys">
						{#each spriteAssetKeys as key}
							<option value={key}></option>
						{/each}
					</datalist>
				</div>
			{/if}

			{#if selectedLayer.type === 'spine'}
				<div class="section-title">Spine Asset</div>
				<div class="field">
					<label>Key</label>
					<input
						type="text"
						bind:value={selectedLayer.spineKey}
						list="bg-spine-keys"
						placeholder="asset key..."
						class="text-input"
					/>
					<datalist id="bg-spine-keys">
						{#each spineAssetKeys as key}
							<option value={key}></option>
						{/each}
					</datalist>
				</div>
				<div class="section-title">
					Animation Tracks
					<button class="add-btn-sm" onclick={() => handleAddAnim(selectedLayer)}>+</button>
				</div>
				{#each selectedLayer.spineAnims as anim, ai}
					<div class="anim-row">
						<span class="track-badge">T{anim.trackIndex}</span>
						<input
							type="text"
							bind:value={anim.animationName}
							placeholder="anim name..."
							class="text-input anim-input"
						/>
						<label class="loop-label">
							<input type="checkbox" bind:checked={anim.loop} />
							L
						</label>
						<button class="del-btn-sm" onclick={() => handleRemoveAnim(selectedLayer, ai)}>&times;</button>
					</div>
				{/each}
			{/if}

			<!-- Transform -->
			<div class="section-title">Transform</div>
			<div class="field">
				<label>X</label>
				<input type="number" bind:value={selectedLayer.x} step="1" />
			</div>
			<div class="field">
				<label>Y</label>
				<input type="number" bind:value={selectedLayer.y} step="1" />
			</div>
			<div class="field">
				<label>Scale X</label>
				<input type="number" bind:value={selectedLayer.scaleX} step="0.05" min="0.01" max="5" />
			</div>
			<div class="field">
				<label>Scale Y</label>
				<input type="number" bind:value={selectedLayer.scaleY} step="0.05" min="0.01" max="5" />
			</div>
			<div class="field">
				<label>Alpha</label>
				<input type="number" bind:value={selectedLayer.alpha} step="0.05" min="0" max="1" />
				<input type="range" min="0" max="1" step="0.05" bind:value={selectedLayer.alpha} />
			</div>

			<!-- Responsive layout -->
			<div class="section-title">Responsive</div>
			<div class="toggle-field">
				<label>Auto Layout</label>
				<input type="checkbox" bind:checked={selectedLayer.useResponsiveLayout} />
			</div>
			{#if selectedLayer.useResponsiveLayout}
				<div class="field">
					<label>Resp. Scale</label>
					<input type="number" bind:value={selectedLayer.responsiveScale} step="0.05" min="0.05" max="3" />
				</div>
			{/if}
		</div>
	{/if}
</div>

<style>
	.bg-editor {
		position: fixed;
		top: 60px;
		left: 8px;
		width: 280px;
		max-height: calc(100vh - 80px);
		overflow-y: auto;
		background: rgba(20, 20, 24, 0.96);
		color: #fff;
		border: 1px solid #ff9f14;
		border-radius: 6px;
		padding: 10px;
		z-index: 9999;
		font-family: -apple-system, system-ui, sans-serif;
		font-size: 11px;
		box-shadow: 0 4px 16px rgba(0, 0, 0, 0.5);
	}
	header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 8px;
		padding-bottom: 6px;
		border-bottom: 1px solid #333;
	}
	.title {
		color: #ff9f14;
		font-weight: 700;
		font-size: 12px;
	}
	.header-actions {
		display: flex;
		gap: 4px;
	}
	.save-btn {
		background: #ff9f14;
		color: #111;
		border: 0;
		padding: 3px 8px;
		font-weight: 700;
		cursor: pointer;
		border-radius: 3px;
		font-size: 10px;
	}
	.add-btn {
		background: #333;
		color: #ff9f14;
		border: 1px solid #ff9f14;
		width: 22px;
		height: 22px;
		font-size: 14px;
		line-height: 1;
		cursor: pointer;
		border-radius: 3px;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	/* Layer list */
	.layer-list {
		display: flex;
		flex-direction: column;
		gap: 2px;
		margin-bottom: 8px;
	}
	.layer-item {
		display: flex;
		align-items: center;
		gap: 4px;
		padding: 4px 6px;
		background: #1a1a1e;
		border: 1px solid #2a2a2e;
		border-radius: 3px;
		cursor: pointer;
		transition: all 0.1s;
	}
	.layer-item:hover {
		border-color: #555;
	}
	.layer-item.selected {
		border-color: #ff9f14;
		background: #2a2420;
	}
	.layer-controls {
		display: flex;
		flex-direction: column;
		gap: 1px;
	}
	.move-btn {
		background: transparent;
		border: 0;
		color: #666;
		font-size: 9px;
		cursor: pointer;
		padding: 0 2px;
		line-height: 1;
	}
	.move-btn:hover:not(:disabled) { color: #fff; }
	.move-btn:disabled { opacity: 0.2; cursor: default; }
	.layer-badge {
		background: #333;
		color: #ff9f14;
		padding: 1px 4px;
		border-radius: 2px;
		font-size: 9px;
		font-weight: 700;
		font-family: monospace;
	}
	.layer-name {
		flex: 1;
		color: #ccc;
		font-size: 11px;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}
	.layer-actions {
		display: flex;
		gap: 2px;
	}
	.vis-btn {
		background: transparent;
		border: 0;
		font-size: 12px;
		cursor: pointer;
		padding: 0 2px;
	}
	.vis-btn.off { opacity: 0.3; }
	.del-btn {
		background: transparent;
		border: 0;
		color: #f44;
		font-size: 14px;
		cursor: pointer;
		padding: 0 2px;
		line-height: 1;
	}
	.empty {
		color: #555;
		text-align: center;
		padding: 12px;
		font-style: italic;
	}

	/* Layer editor */
	.layer-editor {
		border-top: 1px solid #333;
		padding-top: 8px;
		display: flex;
		flex-direction: column;
		gap: 5px;
	}
	.section-title {
		color: #ff9f14;
		font-size: 10px;
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.5px;
		margin-top: 4px;
		padding-bottom: 2px;
		border-bottom: 1px solid #2a2a2e;
		display: flex;
		align-items: center;
		gap: 6px;
	}
	.add-btn-sm {
		background: #333;
		color: #ff9f14;
		border: 1px solid #555;
		width: 16px;
		height: 16px;
		font-size: 11px;
		line-height: 1;
		cursor: pointer;
		border-radius: 2px;
		display: flex;
		align-items: center;
		justify-content: center;
	}
	.field {
		display: grid;
		grid-template-columns: 65px 1fr;
		gap: 6px;
		align-items: center;
	}
	.field label {
		color: #aaa;
		font-size: 10px;
	}
	.field input[type='number'] {
		background: #111;
		border: 1px solid #333;
		color: #fff;
		padding: 3px 5px;
		border-radius: 3px;
		font-size: 11px;
		width: 100%;
	}
	.field input[type='range'] {
		width: 100%;
		grid-column: 2;
	}
	.field select {
		background: #111;
		border: 1px solid #333;
		color: #fff;
		padding: 3px 5px;
		border-radius: 3px;
		font-size: 11px;
		cursor: pointer;
		width: 100%;
	}
	.text-input {
		background: #111;
		border: 1px solid #333;
		color: #fff;
		padding: 3px 5px;
		border-radius: 3px;
		font-size: 11px;
		font-family: monospace;
		width: 100%;
	}
	.color-field {
		display: grid;
		grid-template-columns: 65px 28px 1fr;
		gap: 6px;
		align-items: center;
	}
	.color-field label {
		color: #aaa;
		font-size: 10px;
	}
	.color-field input[type='color'] {
		width: 28px;
		height: 22px;
		border: 1px solid #333;
		border-radius: 3px;
		padding: 0;
		cursor: pointer;
		background: transparent;
	}
	.hex-input {
		background: #111;
		border: 1px solid #333;
		color: #fff;
		padding: 3px 5px;
		border-radius: 3px;
		font-size: 11px;
		font-family: monospace;
		width: 100%;
	}
	.toggle-field {
		display: grid;
		grid-template-columns: 65px 1fr;
		gap: 6px;
		align-items: center;
	}
	.toggle-field label {
		color: #aaa;
		font-size: 10px;
	}
	.toggle-field input[type='checkbox'] {
		width: 14px;
		height: 14px;
		cursor: pointer;
		accent-color: #ff9f14;
	}

	/* Spine anim tracks */
	.anim-row {
		display: flex;
		align-items: center;
		gap: 4px;
		padding: 2px 0;
	}
	.track-badge {
		background: #2a2a2e;
		color: #888;
		padding: 1px 4px;
		border-radius: 2px;
		font-size: 9px;
		font-family: monospace;
		font-weight: 700;
		flex-shrink: 0;
	}
	.anim-input {
		flex: 1;
		min-width: 0;
	}
	.loop-label {
		display: flex;
		align-items: center;
		gap: 2px;
		color: #888;
		font-size: 9px;
		flex-shrink: 0;
		cursor: pointer;
	}
	.loop-label input {
		width: 12px;
		height: 12px;
		accent-color: #ff9f14;
	}
	.del-btn-sm {
		background: transparent;
		border: 0;
		color: #f44;
		font-size: 12px;
		cursor: pointer;
		padding: 0 2px;
		line-height: 1;
		flex-shrink: 0;
	}
</style>
