<script lang="ts">
	import { onMount } from 'svelte';
	import { soundEditorState, soundConfig } from '../game/soundConfig.svelte';
	import { sound } from '../game/sound';

	// Sprite data loaded at runtime from the static assets folder
	let sprite = $state<Record<string, [number, number, boolean?]>>({});

	onMount(async () => {
		try {
			const res = await fetch('./assets/audio/sounds.json');
			if (res.ok) {
				const data = await res.json();
				sprite = data.sprite ?? {};
			}
		} catch {
			// sounds.json not available — timeline will be empty
		}
	});

	const selectedSprite = $derived(
		soundEditorState.selected && sprite[soundEditorState.selected]
			? sprite[soundEditorState.selected]
			: null,
	);
	const selectedCfg = $derived(
		soundEditorState.selected ? soundConfig.sounds[soundEditorState.selected] : null,
	);

	const duration = $derived(selectedSprite ? selectedSprite[1] : 0);
	const isLoop = $derived(selectedSprite ? !!selectedSprite[2] : false);

	// Playback tracking
	let isPlaying = $state(false);
	let playProgress = $state(0);
	let animFrame = 0;
	let playStartTime = 0;

	function formatTime(ms: number): string {
		if (ms < 1000) return `${Math.round(ms)}ms`;
		return `${(ms / 1000).toFixed(2)}s`;
	}

	function play() {
		const name = soundEditorState.selected;
		if (!name || isPlaying) return;

		sound.players.once.play({ name: name as any, forcePlay: true });
		isPlaying = true;
		playStartTime = performance.now();
		playProgress = 0;
		animateProgress();
	}

	function stop() {
		const name = soundEditorState.selected;
		if (!name) return;
		sound.stop({ name: name as any });
		isPlaying = false;
		playProgress = 0;
		cancelAnimationFrame(animFrame);
	}

	function animateProgress() {
		if (!isPlaying || !duration) return;
		const elapsed = performance.now() - playStartTime;
		playProgress = Math.min(elapsed / duration, 1);
		if (playProgress >= 1) {
			isPlaying = false;
			playProgress = 0;
			return;
		}
		animFrame = requestAnimationFrame(animateProgress);
	}

	// Compute fadeIn/fadeOut regions as percentages
	const fadeInPct = $derived(selectedCfg && duration ? Math.min((selectedCfg.fadeIn / duration) * 100, 100) : 0);
	const fadeOutPct = $derived(selectedCfg && duration ? Math.min((selectedCfg.fadeOut / duration) * 100, 100) : 0);
</script>

{#if soundEditorState.selected && selectedSprite}
	<div class="timeline">
		<div class="timeline-header">
			<span class="timeline-title">{soundEditorState.selected}</span>
			<span class="timeline-info">
				{formatTime(duration)} {isLoop ? '(loop)' : ''}
			</span>
			<div class="timeline-controls">
				{#if isPlaying}
					<button class="ctrl-btn" onclick={stop} title="Stop">■</button>
				{:else}
					<button class="ctrl-btn" onclick={play} title="Play">▶</button>
				{/if}
			</div>
		</div>

		<!-- Waveform visualization -->
		<div class="waveform-container">
			<!-- Fade regions -->
			{#if fadeInPct > 0}
				<div class="fade-region fade-in" style="width: {fadeInPct}%"></div>
			{/if}
			{#if fadeOutPct > 0}
				<div class="fade-region fade-out" style="width: {fadeOutPct}%"></div>
			{/if}

			<!-- Waveform bars (decorative representation) -->
			<div class="waveform">
				{#each Array(60) as _, i}
					{@const barHeight = 20 + Math.sin(i * 0.5 + (selectedSprite[0] * 0.001)) * 30 + Math.cos(i * 1.2) * 20}
					<div
						class="wave-bar"
						style="height: {barHeight}%"
						class:played={playProgress > 0 && (i / 60) < playProgress}
					></div>
				{/each}
			</div>

			<!-- Playhead -->
			{#if isPlaying}
				<div class="playhead" style="left: {playProgress * 100}%"></div>
			{/if}
		</div>

		<!-- Time markers -->
		<div class="time-markers">
			<span>0ms</span>
			{#if selectedCfg?.fadeIn}
				<span class="fade-marker" style="left: {fadeInPct}%">FadeIn {selectedCfg.fadeIn}ms</span>
			{/if}
			{#if selectedCfg?.fadeOut}
				<span class="fade-marker" style="right: {fadeOutPct}%">FadeOut {selectedCfg.fadeOut}ms</span>
			{/if}
			<span>{formatTime(duration)}</span>
		</div>

		<!-- Volume / Rate indicators -->
		<div class="indicators">
			<span class="indicator">Vol: {Math.round((selectedCfg?.volume ?? 1) * 100)}%</span>
			<span class="indicator">Rate: {(selectedCfg?.rate ?? 1).toFixed(2)}x</span>
			{#if selectedCfg?.delay}
				<span class="indicator">Delay: {selectedCfg.delay}ms</span>
			{/if}
			{#if !selectedCfg?.enabled}
				<span class="indicator disabled">DISABLED</span>
			{/if}
		</div>
	</div>
{/if}

<style>
	.timeline {
		position: fixed;
		bottom: 8px;
		left: 50%;
		transform: translateX(-50%);
		width: 600px;
		background: rgba(20, 20, 24, 0.96);
		color: #fff;
		border: 1px solid #ff9f14;
		border-radius: 6px;
		padding: 10px 14px;
		z-index: 9990;
		font-family: -apple-system, system-ui, sans-serif;
		font-size: 11px;
		box-shadow: 0 4px 16px rgba(0, 0, 0, 0.5);
	}
	.timeline-header {
		display: flex;
		align-items: center;
		gap: 8px;
		margin-bottom: 8px;
	}
	.timeline-title {
		color: #ff9f14;
		font-weight: 700;
		font-family: monospace;
		font-size: 12px;
	}
	.timeline-info {
		color: #666;
		font-size: 10px;
		flex: 1;
	}
	.timeline-controls {
		display: flex;
		gap: 4px;
	}
	.ctrl-btn {
		background: #2a2a2e;
		color: #ff9f14;
		border: 1px solid #ff9f14;
		width: 28px;
		height: 28px;
		border-radius: 50%;
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 12px;
		cursor: pointer;
		transition: all 0.15s;
	}
	.ctrl-btn:hover {
		background: #ff9f14;
		color: #111;
	}

	.waveform-container {
		position: relative;
		height: 60px;
		background: #111;
		border-radius: 4px;
		overflow: hidden;
		border: 1px solid #2a2a2e;
	}
	.waveform {
		display: flex;
		align-items: center;
		height: 100%;
		gap: 1px;
		padding: 0 2px;
	}
	.wave-bar {
		flex: 1;
		background: #444;
		border-radius: 1px;
		transition: background 0.1s;
		min-height: 4px;
	}
	.wave-bar.played {
		background: #ff9f14;
	}

	.fade-region {
		position: absolute;
		top: 0;
		height: 100%;
		pointer-events: none;
	}
	.fade-in {
		left: 0;
		background: linear-gradient(to right, rgba(255, 159, 20, 0.3), transparent);
	}
	.fade-out {
		right: 0;
		background: linear-gradient(to left, rgba(255, 159, 20, 0.3), transparent);
	}

	.playhead {
		position: absolute;
		top: 0;
		bottom: 0;
		width: 2px;
		background: #ff9f14;
		box-shadow: 0 0 6px rgba(255, 159, 20, 0.5);
		pointer-events: none;
		z-index: 2;
	}

	.time-markers {
		display: flex;
		justify-content: space-between;
		color: #555;
		font-size: 9px;
		margin-top: 4px;
		position: relative;
	}
	.fade-marker {
		position: absolute;
		color: #ff9f14;
		font-size: 8px;
		opacity: 0.7;
	}

	.indicators {
		display: flex;
		gap: 12px;
		margin-top: 6px;
		padding-top: 6px;
		border-top: 1px solid #2a2a2e;
	}
	.indicator {
		color: #888;
		font-size: 10px;
	}
	.indicator.disabled {
		color: #ff4444;
		font-weight: 700;
	}
</style>
