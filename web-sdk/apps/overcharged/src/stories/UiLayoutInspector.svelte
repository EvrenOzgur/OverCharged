<script lang="ts">
	import { editorState, getElementStyle, debouncedSave, getEditableElement, getAllSelectedIds, uiLayoutConfig, type BgType } from '../game/uiLayoutConfig.svelte';
	import { pushSnapshotDebounced, pushSnapshot, undo, redo, canUndo, canRedo } from './editorHistory.svelte';
	import { alignElements, distributeElements } from './editorGrid.svelte';
	import assets from '../game/assets';

	// Only show asset keys that work as direct Sprite keys (type='sprite' only).
	// 'sprites' type = spritesheet (dict of textures, not a single key).
	const spriteAssetKeys = Object.entries(assets)
		.filter(([_, v]) => v.type === 'sprite')
		.map(([k]) => k);
	const spineAssetKeys = Object.entries(assets)
		.filter(([_, v]) => v.type === 'spine')
		.map(([k]) => k);

	const multiCount = $derived(editorState.multiSelected.length);
	const allSelectedIds = $derived(getAllSelectedIds());

	function batchSet(prop: string, value: any) {
		pushSnapshot('batch ' + prop);
		for (const id of allSelectedIds) {
			const s = getElementStyle(id);
			if (s && prop in s) (s as any)[prop] = value;
			const t = getEditableElement(id);
			if (t && prop in t) (t as any)[prop] = value;
		}
	}

	let saveStatus = $state<'idle' | 'saving' | 'ok' | 'err'>('idle');
	let activeTab = $state<'transform' | 'text' | 'appearance' | 'background'>('transform');

	function save() {
		saveStatus = 'saving';
		debouncedSave((ok) => {
			saveStatus = ok ? 'ok' : 'err';
			setTimeout(() => (saveStatus = 'idle'), 1500);
		});
	}

	/** Track inspector value changes for undo. */
	function onValueChange() {
		pushSnapshotDebounced('inspector change');
	}

	const transform = $derived(editorState.selected ? getEditableElement(editorState.selected) : undefined);
	const style = $derived(editorState.selected ? getElementStyle(editorState.selected) : undefined);

	// Local degrees mirror of transform.rotation (radians).
	const rotationDeg = $derived(transform ? +(transform.rotation * 180 / Math.PI).toFixed(2) : 0);

	function setRotationDeg(deg: number) {
		if (!transform) return;
		transform.rotation = (deg * Math.PI) / 180;
	}

	function close() {
		editorState.selected = null;
	}

</script>

<div class="export-bar">
	<button class="undo-btn" onclick={undo} disabled={!canUndo()} aria-label="Undo" title="Undo (Ctrl+Z)">&#8630;</button>
	<button class="undo-btn" onclick={redo} disabled={!canRedo()} aria-label="Redo" title="Redo (Ctrl+Shift+Z)">&#8631;</button>
	<button onclick={save} disabled={saveStatus === 'saving'}>
		{#if saveStatus === 'saving'}Saving…
		{:else if saveStatus === 'ok'}Saved
		{:else if saveStatus === 'err'}Save failed
		{:else}Save to uiLayout.json
		{/if}
	</button>
</div>

{#if transform && style && editorState.selected}
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<div class="inspector" onchange={onValueChange} oninput={onValueChange}>
		<header>
			<span class="title">{editorState.selected}</span>
			<button class="close" onclick={close} aria-label="Close">&times;</button>
		</header>

		<!-- Tab bar -->
		<div class="tab-bar">
			<button class="tab" class:active={activeTab === 'transform'} onclick={() => activeTab = 'transform'}>Transform</button>
			<button class="tab" class:active={activeTab === 'text'} onclick={() => activeTab = 'text'}>Text</button>
			<button class="tab" class:active={activeTab === 'appearance'} onclick={() => activeTab = 'appearance'}>Appearance</button>
			<button class="tab" class:active={activeTab === 'background'} onclick={() => activeTab = 'background'}>BG</button>
		</div>

		<!-- Transform Tab -->
		{#if activeTab === 'transform'}
			<div class="tab-content">
				<div class="row">
					<label>X</label>
					<input type="number" bind:value={transform.x} step="1" />
					<input type="range" min="-600" max="600" step="1" bind:value={transform.x} />
				</div>
				<div class="row">
					<label>Y</label>
					<input type="number" bind:value={transform.y} step="1" />
					<input type="range" min="-600" max="600" step="1" bind:value={transform.y} />
				</div>
				<div class="row">
					<label>Scale</label>
					<input type="number" bind:value={transform.scale} step="0.05" />
					<input type="range" min="0.1" max="3" step="0.05" bind:value={transform.scale} />
				</div>
				<div class="row">
					<label>Rotation</label>
					<input
						type="number"
						value={rotationDeg}
						step="1"
						oninput={(e) => setRotationDeg(+(e.currentTarget as HTMLInputElement).value)}
					/>
					<input
						type="range"
						min="-180"
						max="180"
						step="1"
						value={rotationDeg}
						oninput={(e) => setRotationDeg(+(e.currentTarget as HTMLInputElement).value)}
					/>
				</div>
			</div>
		{/if}

		<!-- Text Tab -->
		{#if activeTab === 'text'}
			<div class="tab-content">
				<div class="text-override-row">
					<label>Text</label>
					<input type="text" bind:value={style.textOverride} placeholder="(default)" class="text-override-input" />
				</div>
				<div class="row">
					<label>Size</label>
					<input type="number" bind:value={style.fontSize} step="0.05" min="0.3" max="3" />
					<input type="range" min="0.3" max="3" step="0.05" bind:value={style.fontSize} />
				</div>
				<div class="color-row">
					<label>Font Color</label>
					<input type="color" bind:value={style.fontColor} />
					<input type="text" bind:value={style.fontColor} class="hex-input" />
				</div>
				<div class="color-row">
					<label>Value Color</label>
					<input type="color" bind:value={style.valueColor} />
					<input type="text" bind:value={style.valueColor} class="hex-input" />
				</div>
			</div>
		{/if}

		<!-- Appearance Tab -->
		{#if activeTab === 'appearance'}
			<div class="tab-content">
				<div class="color-row">
					<label>Background</label>
					<input type="color" bind:value={style.backgroundColor} />
					<input type="text" bind:value={style.backgroundColor} class="hex-input" />
				</div>
				<div class="color-row">
					<label>Border</label>
					<input type="color" bind:value={style.borderColor} />
					<input type="text" bind:value={style.borderColor} class="hex-input" />
				</div>
				<div class="color-row">
					<label>Active</label>
					<input type="color" bind:value={style.activeColor} />
					<input type="text" bind:value={style.activeColor} class="hex-input" />
				</div>
				<div class="row">
					<label>Alpha</label>
					<input type="number" bind:value={style.alpha} step="0.05" min="0" max="1" />
					<input type="range" min="0" max="1" step="0.05" bind:value={style.alpha} />
				</div>
				<div class="toggle-row">
					<label>Visible</label>
					<input type="checkbox" bind:checked={style.visible} />
				</div>
			</div>
		{/if}

		<!-- Background Tab -->
		{#if activeTab === 'background'}
			<div class="tab-content">
				<div class="section-title">Background Type</div>
				<div class="select-row">
					<label>Type</label>
					<select
						value={style.bgType}
						onchange={(e) => { style.bgType = (e.currentTarget as HTMLSelectElement).value as BgType; }}
					>
						<option value="color">Solid Color</option>
						<option value="sprite">Sprite / Image</option>
						<option value="spine">Spine Animation</option>
					</select>
				</div>

				{#if style.bgType === 'sprite'}
					<div class="section-title">Sprite Asset</div>
					<div class="select-row">
						<label>Key</label>
						<input
							type="text"
							bind:value={style.bgSpriteKey}
							list="sprite-keys"
							placeholder="asset key..."
							class="key-input"
						/>
						<datalist id="sprite-keys">
							{#each spriteAssetKeys as key}
								<option value={key}></option>
							{/each}
						</datalist>
					</div>
					<div class="hint">Sprite: {spriteAssetKeys.length ? spriteAssetKeys.join(', ') : '(no single-sprite assets)'}</div>
				{/if}

				{#if style.bgType === 'spine'}
					<div class="section-title">Spine Asset</div>
					<div class="select-row">
						<label>Key</label>
						<input
							type="text"
							bind:value={style.bgSpineKey}
							list="spine-keys"
							placeholder="asset key..."
							class="key-input"
						/>
						<datalist id="spine-keys">
							{#each spineAssetKeys as key}
								<option value={key}></option>
							{/each}
						</datalist>
					</div>
					<div class="select-row">
						<label>Animation</label>
						<input
							type="text"
							bind:value={style.bgSpineAnim}
							placeholder="animation name..."
							class="key-input"
						/>
					</div>
					<div class="toggle-row">
						<label>Loop</label>
						<input type="checkbox" bind:checked={style.bgSpineLoop} />
					</div>
					<div class="hint">Spine: {spineAssetKeys.join(', ')}</div>
				{/if}
			</div>
		{/if}
	</div>
{/if}

<!-- Multi-select batch editor -->
{#if multiCount >= 2}
	{@const firstT = getEditableElement(allSelectedIds[0])}
	{@const firstS = getElementStyle(allSelectedIds[0])}
	<div class="batch-editor">
		<header>
			<span class="title">{allSelectedIds.length} elements selected</span>
		</header>

		<div class="section-title">Batch Edit</div>
		<div class="row">
			<label>Scale</label>
			<input type="number" step="0.05" value={firstT?.scale ?? 1}
				onchange={(e) => batchSet('scale', +(e.currentTarget as HTMLInputElement).value)} />
			<span></span>
		</div>
		<div class="row">
			<label>Alpha</label>
			<input type="number" step="0.05" min="0" max="1" value={firstS?.alpha ?? 1}
				onchange={(e) => batchSet('alpha', +(e.currentTarget as HTMLInputElement).value)} />
			<span></span>
		</div>
		<div class="row">
			<label>Font Size</label>
			<input type="number" step="0.05" min="0.3" max="3" value={firstS?.fontSize ?? 1}
				onchange={(e) => batchSet('fontSize', +(e.currentTarget as HTMLInputElement).value)} />
			<span></span>
		</div>

		<div class="section-title">Align</div>
		<div class="align-row">
			<button class="align-btn" onclick={() => { pushSnapshot('align'); alignElements(allSelectedIds, 'left'); }} title="Align Left">&#8676;</button>
			<button class="align-btn" onclick={() => { pushSnapshot('align'); alignElements(allSelectedIds, 'centerH'); }} title="Center H">&#8596;</button>
			<button class="align-btn" onclick={() => { pushSnapshot('align'); alignElements(allSelectedIds, 'right'); }} title="Align Right">&#8677;</button>
			<button class="align-btn" onclick={() => { pushSnapshot('align'); alignElements(allSelectedIds, 'top'); }} title="Align Top">&#8673;</button>
			<button class="align-btn" onclick={() => { pushSnapshot('align'); alignElements(allSelectedIds, 'centerV'); }} title="Center V">&#8597;</button>
			<button class="align-btn" onclick={() => { pushSnapshot('align'); alignElements(allSelectedIds, 'bottom'); }} title="Align Bottom">&#8675;</button>
		</div>
		<div class="section-title">Distribute</div>
		<div class="align-row">
			<button class="align-btn" onclick={() => { pushSnapshot('distribute'); distributeElements(allSelectedIds, 'horizontal'); }} title="Distribute H">&#9776; H</button>
			<button class="align-btn" onclick={() => { pushSnapshot('distribute'); distributeElements(allSelectedIds, 'vertical'); }} title="Distribute V">&#9776; V</button>
		</div>
	</div>
{/if}

<!-- Board Config (shown when nothing selected) -->
{#if !editorState.selected && multiCount < 2}
	{@const bc = uiLayoutConfig.boardConfig!}
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<div class="inspector" onchange={onValueChange} oninput={onValueChange}>
		<header>
			<span class="title">Board Config</span>
		</header>
		<div class="tab-content">
			<div class="color-row">
				<label>Glow Color</label>
				<input type="color" bind:value={bc.glowColor} />
				<input type="text" bind:value={bc.glowColor} class="hex-input" />
			</div>
			<div class="color-row">
				<label>Frame Tint</label>
				<input type="color" bind:value={bc.frameTint} />
				<input type="text" bind:value={bc.frameTint} class="hex-input" />
			</div>
			<div class="row">
				<label>Symbol Size</label>
				<input type="number" bind:value={bc.symbolSize} step="1" min="20" max="200" />
				<input type="range" min="20" max="200" step="1" bind:value={bc.symbolSize} />
			</div>
			<div class="row">
				<label>Gap X</label>
				<input type="number" bind:value={bc.gridGapX} step="1" min="0" max="20" />
				<input type="range" min="0" max="20" step="1" bind:value={bc.gridGapX} />
			</div>
			<div class="row">
				<label>Gap Y</label>
				<input type="number" bind:value={bc.gridGapY} step="1" min="0" max="20" />
				<input type="range" min="0" max="20" step="1" bind:value={bc.gridGapY} />
			</div>
			<div class="row">
				<label>Padding X</label>
				<input type="number" bind:value={bc.boardPaddingX} step="1" min="0" max="50" />
				<input type="range" min="0" max="50" step="1" bind:value={bc.boardPaddingX} />
			</div>
			<div class="row">
				<label>Padding Y</label>
				<input type="number" bind:value={bc.boardPaddingY} step="1" min="0" max="50" />
				<input type="range" min="0" max="50" step="1" bind:value={bc.boardPaddingY} />
			</div>
		</div>
	</div>
{/if}

<style>
	.export-bar {
		position: fixed;
		top: 8px;
		right: 8px;
		z-index: 10000;
	}
	.export-bar button {
		background: #39ff14;
		color: #111;
		border: 0;
		padding: 8px 14px;
		font-weight: 700;
		cursor: pointer;
		border-radius: 4px;
	}
	.undo-btn {
		background: #333 !important;
		color: #ccc !important;
		padding: 6px 8px !important;
		font-size: 16px !important;
		line-height: 1 !important;
	}
	.undo-btn:disabled {
		opacity: 0.3;
		cursor: default !important;
	}

	.inspector {
		position: fixed;
		top: 60px;
		right: 8px;
		width: 300px;
		background: rgba(20, 20, 24, 0.96);
		color: #fff;
		border: 1px solid #39ff14;
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
		color: #39ff14;
		font-weight: 700;
		font-size: 13px;
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
		color: #39ff14;
		border-color: #39ff14;
		border-bottom-color: transparent;
	}
	.tab:hover:not(.active) {
		color: #ccc;
		background: #222;
	}

	/* Tab content */
	.tab-content {
		display: flex;
		flex-direction: column;
		gap: 6px;
	}

	/* Number + range row */
	.row {
		display: grid;
		grid-template-columns: 70px 65px 1fr;
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

	/* Color picker row */
	.color-row {
		display: grid;
		grid-template-columns: 70px 32px 1fr;
		gap: 8px;
		align-items: center;
	}
	.color-row label {
		color: #aaa;
		font-size: 11px;
	}
	.color-row input[type='color'] {
		width: 32px;
		height: 24px;
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
		padding: 3px 6px;
		border-radius: 3px;
		font-size: 11px;
		font-family: monospace;
		width: 100%;
	}

	/* Toggle row */
	.toggle-row {
		display: grid;
		grid-template-columns: 70px 1fr;
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
		accent-color: #39ff14;
	}

	/* Select row */
	.select-row {
		display: grid;
		grid-template-columns: 70px 1fr;
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
	.key-input {
		background: #111;
		border: 1px solid #333;
		color: #fff;
		padding: 4px 6px;
		border-radius: 3px;
		font-size: 11px;
		font-family: monospace;
		width: 100%;
	}
	.section-title {
		color: #39ff14;
		font-size: 10px;
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.5px;
		margin-top: 4px;
		padding-bottom: 3px;
		border-bottom: 1px solid #2a2a2e;
	}
	.hint {
		color: #555;
		font-size: 9px;
		word-break: break-all;
		line-height: 1.3;
		margin-top: 2px;
	}
	/* Text override row */
	.text-override-row {
		display: grid;
		grid-template-columns: 70px 1fr;
		gap: 8px;
		align-items: center;
		margin-bottom: 4px;
	}
	.text-override-row label {
		color: #aaa;
		font-size: 11px;
	}
	.text-override-input {
		background: #111;
		border: 1px solid #333;
		color: #fff;
		padding: 4px 6px;
		border-radius: 3px;
		font-size: 11px;
		width: 100%;
	}
	.text-override-input::placeholder {
		color: #555;
		font-style: italic;
	}

	/* Batch editor */
	.batch-editor {
		position: fixed;
		top: 60px;
		right: 8px;
		width: 300px;
		background: rgba(20, 20, 24, 0.96);
		color: #fff;
		border: 1px solid #14aaff;
		border-radius: 6px;
		padding: 12px;
		z-index: 9985;
		font-family: -apple-system, system-ui, sans-serif;
		font-size: 12px;
		box-shadow: 0 4px 16px rgba(0, 0, 0, 0.5);
	}
	.batch-editor header {
		margin-bottom: 8px;
		padding-bottom: 8px;
		border-bottom: 1px solid #333;
	}
	.batch-editor .title {
		color: #14aaff;
	}
	.align-row {
		display: flex;
		gap: 4px;
		flex-wrap: wrap;
	}
	.align-btn {
		background: #2a2a2e;
		color: #ccc;
		border: 1px solid #444;
		padding: 4px 8px;
		border-radius: 3px;
		font-size: 12px;
		cursor: pointer;
		transition: all 0.1s;
	}
	.align-btn:hover {
		background: #14aaff;
		color: #111;
		border-color: #14aaff;
	}
</style>
