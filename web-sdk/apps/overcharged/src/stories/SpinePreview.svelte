<script lang="ts">
	import { getContext } from 'components-ui-pixi/src/context';

	type Props = {
		spineKey: string;
	};

	const { spineKey }: Props = $props();
	let currentAnim = $state('');
	let looping = $state(true);
	let animList = $state<string[]>([]);

	const context = getContext();

	// Extract animation list from skeleton data
	$effect(() => {
		if (!spineKey) { animList = []; return; }
		const data = context.stateApp.loadedAssets?.[spineKey] as any;
		if (data?.animations) {
			animList = data.animations.map((a: any) => a.name);
			if (animList.length > 0 && !animList.includes(currentAnim)) {
				currentAnim = animList[0];
			}
		} else {
			animList = [];
		}
	});
</script>

<div class="spine-preview">
	<div class="preview-header">Spine Preview: <span class="key">{spineKey}</span></div>

	{#if animList.length > 0}
		<div class="preview-controls">
			<select bind:value={currentAnim}>
				{#each animList as anim}
					<option value={anim}>{anim}</option>
				{/each}
			</select>
			<label class="loop-toggle">
				<input type="checkbox" bind:checked={looping} /> Loop
			</label>
		</div>
		<div class="anim-list">
			{#each animList as anim}
				<button
					class="anim-btn"
					class:active={currentAnim === anim}
					onclick={() => currentAnim = anim}
				>{anim}</button>
			{/each}
		</div>
	{:else}
		<div class="no-anims">No animations found or asset not loaded</div>
	{/if}
</div>

<style>
	.spine-preview {
		margin-top: 8px;
		border-top: 1px solid #333;
		padding-top: 8px;
	}
	.preview-header {
		color: #888;
		font-size: 10px;
		font-weight: 600;
		text-transform: uppercase;
		margin-bottom: 6px;
	}
	.key {
		color: #39ff14;
		font-family: monospace;
		text-transform: none;
	}
	.preview-controls {
		display: flex;
		align-items: center;
		gap: 6px;
		margin-bottom: 6px;
	}
	.preview-controls select {
		background: #111;
		border: 1px solid #333;
		color: #fff;
		padding: 2px 4px;
		border-radius: 3px;
		font-size: 10px;
		flex: 1;
	}
	.loop-toggle {
		display: flex;
		align-items: center;
		gap: 3px;
		font-size: 9px;
		color: #888;
		cursor: pointer;
		flex-shrink: 0;
	}
	.loop-toggle input {
		width: 12px;
		height: 12px;
		accent-color: #39ff14;
	}
	.anim-list {
		display: flex;
		flex-wrap: wrap;
		gap: 3px;
		max-height: 100px;
		overflow-y: auto;
	}
	.anim-btn {
		background: #1a1a1e;
		color: #aaa;
		border: 1px solid #333;
		padding: 2px 6px;
		border-radius: 2px;
		font-size: 9px;
		font-family: monospace;
		cursor: pointer;
		transition: all 0.1s;
	}
	.anim-btn:hover { color: #fff; border-color: #555; }
	.anim-btn.active {
		color: #39ff14;
		border-color: #39ff14;
		background: #1a2a1e;
	}
	.no-anims {
		color: #555;
		font-size: 10px;
		font-style: italic;
	}
</style>
