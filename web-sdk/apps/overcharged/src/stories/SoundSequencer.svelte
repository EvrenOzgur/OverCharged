<script lang="ts">
	import {
		soundConfig,
		getAllSoundNames,
		addSequence,
		removeSequence,
		addSequenceStep,
		removeSequenceStep,
	} from '../game/soundConfig.svelte';
	import { pushSoundSnapshot } from './editorSoundHistory.svelte';
	import { sound } from '../game/sound';

	let newSeqName = $state('');
	let selectedSeq = $state<string | null>(null);
	let isPlayingSeq = $state(false);

	const sequenceNames = $derived(Object.keys(soundConfig.sequences));
	const allSounds = $derived(getAllSoundNames());
	const activeSeq = $derived(selectedSeq ? soundConfig.sequences[selectedSeq] : null);

	function handleAddSequence() {
		const name = newSeqName.trim();
		if (!name || soundConfig.sequences[name]) return;
		pushSoundSnapshot('add sequence ' + name);
		addSequence(name);
		selectedSeq = name;
		newSeqName = '';
	}

	function handleRemoveSequence(name: string) {
		pushSoundSnapshot('remove sequence ' + name);
		removeSequence(name);
		if (selectedSeq === name) selectedSeq = null;
	}

	function handleAddStep() {
		if (!selectedSeq || allSounds.length === 0) return;
		pushSoundSnapshot('add step');
		addSequenceStep(selectedSeq, allSounds[0]);
	}

	function handleRemoveStep(index: number) {
		if (!selectedSeq) return;
		pushSoundSnapshot('remove step');
		removeSequenceStep(selectedSeq, index);
	}

	async function playSequence() {
		if (!activeSeq || isPlayingSeq) return;
		isPlayingSeq = true;

		for (const step of activeSeq.steps) {
			if (!isPlayingSeq) break;
			if (step.delay > 0) {
				await new Promise<void>((r) => setTimeout(r, step.delay));
			}
			if (!isPlayingSeq) break;
			sound.players.once.play({ name: step.sound as any, forcePlay: true });
			// Wait a bit for the sound to play before moving to next
			await new Promise<void>((r) => setTimeout(r, 200));
		}

		isPlayingSeq = false;
	}

	function stopSequence() {
		isPlayingSeq = false;
	}
</script>

<div class="sequencer">
	<header>
		<span class="title">Sequences</span>
	</header>

	<!-- Sequence list -->
	<div class="seq-list">
		{#each sequenceNames as name}
			<div class="seq-item" class:selected={selectedSeq === name}>
				<button class="seq-name" onclick={() => selectedSeq = selectedSeq === name ? null : name}>
					{name}
				</button>
				<button class="remove-btn" onclick={() => handleRemoveSequence(name)} title="Remove">x</button>
			</div>
		{/each}
	</div>

	<!-- Add new sequence -->
	<div class="add-row">
		<input
			type="text"
			placeholder="New sequence name..."
			bind:value={newSeqName}
			class="add-input"
			onkeydown={(e) => e.key === 'Enter' && handleAddSequence()}
		/>
		<button class="add-btn" onclick={handleAddSequence} disabled={!newSeqName.trim()}>+</button>
	</div>

	<!-- Sequence editor -->
	{#if activeSeq && selectedSeq}
		<div class="seq-editor">
			<div class="seq-header">
				<span class="seq-title">{selectedSeq}</span>
				<div class="seq-controls">
					{#if isPlayingSeq}
						<button class="ctrl-btn" onclick={stopSequence}>■ Stop</button>
					{:else}
						<button class="ctrl-btn" onclick={playSequence}>▶ Play</button>
					{/if}
				</div>
			</div>

			<!-- Steps -->
			<div class="steps">
				{#each activeSeq.steps as step, i}
					<div class="step">
						<span class="step-num">{i + 1}</span>
						<select
							value={step.sound}
							onchange={(e) => { step.sound = (e.currentTarget as HTMLSelectElement).value; }}
							class="step-select"
						>
							{#each allSounds as s}
								<option value={s}>{s}</option>
							{/each}
						</select>
						<div class="step-delay">
							<label>delay</label>
							<input type="number" bind:value={step.delay} step="50" min="0" max="10000" class="delay-input" />
							<span class="ms">ms</span>
						</div>
						<button class="remove-step" onclick={() => handleRemoveStep(i)} title="Remove step">x</button>
					</div>
				{/each}
			</div>

			<button class="add-step-btn" onclick={handleAddStep}>+ Add Step</button>
		</div>
	{/if}
</div>

<style>
	.sequencer {
		position: fixed;
		bottom: 8px;
		right: 8px;
		width: 340px;
		max-height: 400px;
		background: rgba(20, 20, 24, 0.96);
		color: #fff;
		border: 1px solid #ff9f14;
		border-radius: 6px;
		padding: 12px;
		z-index: 9990;
		font-family: -apple-system, system-ui, sans-serif;
		font-size: 12px;
		box-shadow: 0 4px 16px rgba(0, 0, 0, 0.5);
		overflow-y: auto;
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

	.seq-list {
		display: flex;
		flex-direction: column;
		gap: 2px;
		margin-bottom: 8px;
	}
	.seq-item {
		display: flex;
		align-items: center;
		gap: 4px;
		padding: 2px;
		border-radius: 3px;
	}
	.seq-item.selected {
		background: rgba(255, 159, 20, 0.15);
	}
	.seq-name {
		flex: 1;
		background: transparent;
		border: none;
		color: #ccc;
		font-size: 11px;
		cursor: pointer;
		text-align: left;
		padding: 4px 6px;
		border-radius: 3px;
	}
	.seq-name:hover {
		background: rgba(255, 159, 20, 0.1);
	}
	.remove-btn {
		background: transparent;
		border: none;
		color: #666;
		cursor: pointer;
		font-size: 12px;
		padding: 2px 6px;
	}
	.remove-btn:hover {
		color: #ff4444;
	}

	.add-row {
		display: flex;
		gap: 4px;
		margin-bottom: 10px;
	}
	.add-input {
		flex: 1;
		background: #111;
		border: 1px solid #333;
		color: #fff;
		padding: 4px 8px;
		border-radius: 3px;
		font-size: 11px;
	}
	.add-input::placeholder {
		color: #555;
	}
	.add-btn {
		background: #2a2a2e;
		color: #ff9f14;
		border: 1px solid #ff9f14;
		width: 28px;
		border-radius: 3px;
		font-size: 14px;
		cursor: pointer;
	}
	.add-btn:disabled {
		opacity: 0.3;
		cursor: default;
	}
	.add-btn:hover:not(:disabled) {
		background: #ff9f14;
		color: #111;
	}

	.seq-editor {
		border-top: 1px solid #333;
		padding-top: 8px;
	}
	.seq-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 8px;
	}
	.seq-title {
		color: #ff9f14;
		font-weight: 700;
		font-size: 12px;
		font-family: monospace;
	}
	.seq-controls {
		display: flex;
		gap: 4px;
	}
	.ctrl-btn {
		background: #2a2a2e;
		color: #ff9f14;
		border: 1px solid #ff9f14;
		padding: 3px 10px;
		border-radius: 3px;
		font-size: 10px;
		font-weight: 700;
		cursor: pointer;
	}
	.ctrl-btn:hover {
		background: #ff9f14;
		color: #111;
	}

	.steps {
		display: flex;
		flex-direction: column;
		gap: 4px;
		margin-bottom: 8px;
	}
	.step {
		display: flex;
		align-items: center;
		gap: 4px;
		padding: 4px 6px;
		background: #1a1a1e;
		border: 1px solid #2a2a2e;
		border-radius: 3px;
	}
	.step-num {
		color: #555;
		font-size: 10px;
		width: 16px;
		text-align: center;
		flex-shrink: 0;
	}
	.step-select {
		flex: 1;
		background: #111;
		border: 1px solid #333;
		color: #fff;
		padding: 3px 4px;
		border-radius: 3px;
		font-size: 10px;
		font-family: monospace;
	}
	.step-delay {
		display: flex;
		align-items: center;
		gap: 2px;
		flex-shrink: 0;
	}
	.step-delay label {
		color: #666;
		font-size: 9px;
	}
	.delay-input {
		background: #111;
		border: 1px solid #333;
		color: #fff;
		padding: 2px 4px;
		border-radius: 3px;
		font-size: 10px;
		width: 50px;
	}
	.ms {
		color: #555;
		font-size: 9px;
	}
	.remove-step {
		background: transparent;
		border: none;
		color: #555;
		cursor: pointer;
		font-size: 11px;
		padding: 2px 4px;
		flex-shrink: 0;
	}
	.remove-step:hover {
		color: #ff4444;
	}

	.add-step-btn {
		width: 100%;
		background: #1a1a1e;
		border: 1px dashed #444;
		color: #888;
		padding: 6px;
		border-radius: 3px;
		font-size: 11px;
		cursor: pointer;
		transition: all 0.15s;
	}
	.add-step-btn:hover {
		border-color: #ff9f14;
		color: #ff9f14;
	}
</style>
