<script lang="ts">
	import { timingConfig, resetTimingConfig, debouncedTimingSave } from '../game/timingConfig.svelte';

	let saveStatus = $state<'idle' | 'saving' | 'ok' | 'err'>('idle');

	function save() {
		saveStatus = 'saving';
		debouncedTimingSave((ok) => {
			saveStatus = ok ? 'ok' : 'err';
			setTimeout(() => (saveStatus = 'idle'), 1500);
		});
	}

	type Field = { label: string; key: string; get: () => number; set: (v: number) => void; hint?: string };

	const sections: { title: string; fields: Field[] }[] = [
		{
			title: 'Tumble cascade',
			fields: [
				{
					label: 'Slide-down bounce',
					key: 'slideDownBounceDurationMs',
					get: () => timingConfig.tumble.slideDownBounceDurationMs,
					set: (v) => (timingConfig.tumble.slideDownBounceDurationMs = v),
					hint: 'Per-symbol tween duration when the board drops after an explosion.',
				},
				{
					label: 'Min settle view',
					key: 'minTumbleViewMs',
					get: () => timingConfig.tumble.minTumbleViewMs,
					set: (v) => (timingConfig.tumble.minTumbleViewMs = v),
					hint: 'How long the settled board holds before the next tumble starts exploding.',
				},
			],
		},
		{
			title: 'Cluster win amount',
			fields: [
				{
					label: 'Multiplier badge hold',
					key: 'multiplierBadgeHoldMs',
					get: () => timingConfig.clusterWinAmount.multiplierBadgeHoldMs,
					set: (v) => (timingConfig.clusterWinAmount.multiplierBadgeHoldMs = v),
					hint: 'How long the badge shows "WIN X mult" before the combine punch (sound + text swap fire together at the punch).',
				},
				{
					label: 'Combine scale down',
					key: 'combineScaleDownMs',
					get: () => timingConfig.clusterWinAmount.combineScaleDownMs,
					set: (v) => (timingConfig.clusterWinAmount.combineScaleDownMs = v),
					hint: 'Shrink half of the combine punch.',
				},
				{
					label: 'Combine scale up',
					key: 'combineScaleUpMs',
					get: () => timingConfig.clusterWinAmount.combineScaleUpMs,
					set: (v) => (timingConfig.clusterWinAmount.combineScaleUpMs = v),
					hint: 'Grow-back half of the combine punch.',
				},
				{
					label: 'Float-up duration',
					key: 'floatUpDurationMs',
					get: () => timingConfig.clusterWinAmount.floatUpDurationMs,
					set: (v) => (timingConfig.clusterWinAmount.floatUpDurationMs = v),
					hint: 'How long the win amount label takes to float up and vanish.',
				},
			],
		},
		{
			title: 'Global multiplier',
			fields: [
				{
					label: 'Reset sound delay',
					key: 'resetSoundDelayMs',
					get: () => timingConfig.globalMultiplier.resetSoundDelayMs,
					set: (v) => (timingConfig.globalMultiplier.resetSoundDelayMs = v),
					hint: 'Delay between the reset animation starting and its sound firing.',
				},
			],
		},
		{
			title: 'Final multiplier apply',
			fields: [
				{
					label: 'Post-win hold',
					key: 'postWinHoldMs',
					get: () => timingConfig.finalMultiplier.postWinHoldMs,
					set: (v) => (timingConfig.finalMultiplier.postWinHoldMs = v),
					hint: 'Skippable pause after the final multiplied win amount is shown.',
				},
			],
		},
	];
</script>

<div class="timing-editor">
	<div class="te-header">
		<span class="te-title">TIMING EDITOR</span>
		<button class="te-btn" onclick={resetTimingConfig}>Reset defaults</button>
		<button class="te-btn te-save" onclick={save}>
			{#if saveStatus === 'saving'}Saving…{:else if saveStatus === 'ok'}Saved ✓{:else if saveStatus === 'err'}Failed ✗{:else}Save{/if}
		</button>
	</div>

	<div class="te-body">
		{#each sections as section}
			<div class="te-section">
				<div class="te-section-title">{section.title}</div>
				{#each section.fields as field}
					<div class="te-field" title={field.hint}>
						<label for={`te-${field.key}`}>{field.label}</label>
						<div class="te-row">
							<input
								id={`te-${field.key}`}
								type="range"
								min="0"
								max="4000"
								step="10"
								value={field.get()}
								oninput={(e) => field.set(Number((e.target as HTMLInputElement).value))}
							/>
							<input
								class="te-num"
								type="number"
								min="0"
								step="10"
								value={field.get()}
								oninput={(e) => field.set(Number((e.target as HTMLInputElement).value))}
							/>
						</div>
					</div>
				{/each}
			</div>
		{/each}
	</div>
</div>

<style>
	.timing-editor {
		position: fixed;
		top: 8px;
		left: 12px;
		z-index: 1000;
		width: 320px;
		max-height: 92vh;
		overflow-y: auto;
		background: rgba(20, 26, 36, 0.94);
		border: 1px solid #2a3547;
		border-radius: 8px;
		font-family: ui-monospace, monospace;
		color: #d6e2ee;
		font-size: 12px;
	}

	.te-header {
		position: sticky;
		top: 0;
		display: flex;
		align-items: center;
		gap: 6px;
		padding: 8px 10px;
		background: rgba(20, 26, 36, 0.98);
		border-bottom: 1px solid #2a3547;
	}

	.te-title {
		font-size: 10px;
		letter-spacing: 0.12em;
		color: #45d3e3;
		flex: 1;
	}

	.te-btn {
		font: inherit;
		font-size: 11px;
		cursor: pointer;
		border-radius: 6px;
		border: 1px solid #3a465c;
		background: #232d3d;
		color: #d6e2ee;
		padding: 4px 8px;
	}

	.te-save {
		background: #f4b23e;
		color: #1a1204;
		font-weight: 600;
		border-color: #f4b23e;
	}

	.te-body {
		padding: 8px 10px 12px;
	}

	.te-section {
		margin-bottom: 12px;
	}

	.te-section-title {
		font-size: 10px;
		letter-spacing: 0.08em;
		text-transform: uppercase;
		color: #7c92ab;
		margin-bottom: 6px;
		border-bottom: 1px solid #253044;
		padding-bottom: 3px;
	}

	.te-field {
		margin-bottom: 6px;
	}

	.te-field label {
		display: block;
		font-size: 11px;
		color: #b7c6d6;
		margin-bottom: 2px;
	}

	.te-row {
		display: flex;
		align-items: center;
		gap: 6px;
	}

	.te-row input[type='range'] {
		flex: 1;
		min-width: 0;
	}

	.te-num {
		width: 56px;
		flex-shrink: 0;
		font: inherit;
		font-size: 11px;
		background: #0f1520;
		color: #d6e2ee;
		border: 1px solid #2a3547;
		border-radius: 4px;
		padding: 2px 4px;
	}
</style>
