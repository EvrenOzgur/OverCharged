<script lang="ts" module>
	import { defineMeta } from '@storybook/addon-svelte-csf';

	const { Story } = defineMeta({
		title: 'ANIMATIONS/Debug Lab',
	});
</script>

<script lang="ts">
	import { StoryGameTemplate, StoryLocale, type TemplateArgs } from 'components-storybook';
	import type { SymbolState } from '../game/types';

	import Game from '../components/Game.svelte';
	import { setContext, getContext } from '../game/context';

	setContext();
	const context = getContext();

	// Board 10 satırlık (index 0 ve 9 padding, 1-8 görünür)
	// SYMBOL_ROW görünür alanın ortası: index 4
	const SYMBOL_REEL = 3;
	const SYMBOL_ROW = 4;

	const ALL_SYMBOLS = ['H1', 'H2', 'H3', 'H4', 'L1', 'L2', 'L3', 'L4', 'W', 'S', 'M'] as const;
	type SymbolName = (typeof ALL_SYMBOLS)[number];

	// 'spin' animasyonu loop yapıp oncomplete tetiklemediği için burada yer almıyor
	const ANIMATION_STATES: { state: SymbolState; label: string }[] = [
		{ state: 'land',          label: 'Land'         },
		{ state: 'win',           label: 'Win'          },
		{ state: 'postWinStatic', label: 'Post-Win'     },
		{ state: 'explosion',     label: 'Explosion'    },
		{ state: 'static',        label: 'Static (Reset)' },
	];

	let selectedSymbol = $state<SymbolName>('H1');
	let multiplierValue = $state(2);
	let isSpawned = $state(false);
	let panelOpen = $state(true);

	function buildBoard(symbol: SymbolName, mult?: number) {
		// 8 reel × 10 satır — index 0 ve 9 padding, 1-8 görünür alan
		const board: any[][] = Array.from({ length: 8 }, () =>
			Array.from({ length: 10 }, () => ({ name: 'L4' })),
		);
		board[SYMBOL_REEL][SYMBOL_ROW] = {
			name: symbol,
			...(mult !== undefined ? { multiplier: mult } : {}),
		};
		return board;
	}

	async function spawnSymbol(symbol: SymbolName) {
		const mult = symbol === 'M' || symbol === 'W' ? multiplierValue : undefined;

		// Board'u sahneden tamamen kaldır, ardından PixiJS'in en az bir
		// render frame'ini tamamlamasını bekle. Bu sayede eski Spine nesneleri
		// render pipeline'dan çıkar ve destroy güvenli hale gelir.
		context.eventEmitter.broadcast({ type: 'boardHide' });
		context.eventEmitter.broadcast({ type: 'boardSymbolsReset' });
		await new Promise((r) => setTimeout(r, 100));

		await context.eventEmitter.broadcastAsync({
			type: 'boardSettle',
			board: buildBoard(symbol, mult),
		});
		context.eventEmitter.broadcast({ type: 'boardShow' });
		isSpawned = true;
	}

	async function selectSymbol(symbol: SymbolName) {
		selectedSymbol = symbol;
		await spawnSymbol(symbol);
	}

	async function triggerAnimation(state: SymbolState) {
		if (!isSpawned) await spawnSymbol(selectedSymbol);

		if (state === 'static') {
			context.eventEmitter.broadcast({ type: 'boardSymbolsReset' });
			return;
		}

		await context.eventEmitter.broadcastAsync({
			type: 'boardWithAnimateSymbols',
			symbolPositions: [{ reel: SYMBOL_REEL, row: SYMBOL_ROW }],
			state,
		});

		// Explosion sonrası sembol kaybolur, yeniden spawn gerekir
		if (state === 'explosion') {
			isSpawned = false;
		}
	}
</script>

{#snippet template(args: TemplateArgs<any>)}
	<div class="root">
		<div class="game-area">
			<StoryGameTemplate skipLoadingScreen={true}>
				<StoryLocale lang="en">
					<Game />
				</StoryLocale>
			</StoryGameTemplate>
		</div>

		<button class="toggle-btn" onclick={() => (panelOpen = !panelOpen)}>
			{panelOpen ? '▶' : '◀'}
		</button>

		{#if panelOpen}
		<div class="panel">
			<h3>Symbol Inspector</h3>

			<!-- Sembol Seçici -->
			<div class="section">
				<p class="label">Sembol</p>
				<div class="symbol-grid">
					{#each ALL_SYMBOLS as sym}
						<button
							class="sym-btn"
							class:active={selectedSymbol === sym}
							onclick={() => selectSymbol(sym)}
						>
							{sym}
						</button>
					{/each}
				</div>
			</div>

			<!-- M ve W için multiplier girişi -->
			{#if selectedSymbol === 'M' || selectedSymbol === 'W'}
				<div class="section">
					<p class="label">Multiplier</p>
					<div class="row">
						<input
							type="number"
							bind:value={multiplierValue}
							min="2"
							max="999"
						/>
						<button onclick={() => spawnSymbol(selectedSymbol)}>Uygula</button>
					</div>
				</div>
			{/if}

			<!-- Animasyon Tetikleyicileri -->
			<div class="section">
				<p class="label">Animasyonlar</p>
				{#if !isSpawned}
					<p class="hint">Önce yukarıdan bir sembol seç</p>
				{/if}
				<div class="anim-grid">
					{#each ANIMATION_STATES as { state, label }}
						<button
							class="anim-btn"
							class:danger={state === 'explosion'}
							class:muted={state === 'static' || state === 'spin'}
							onclick={() => triggerAnimation(state)}
						>
							{label}
						</button>
					{/each}
				</div>
			</div>

			<!-- Yeniden Spawn (explosion sonrası) -->
			{#if !isSpawned}
				<div class="section">
					<button class="respawn-btn" onclick={() => spawnSymbol(selectedSymbol)}>
						↺ Yeniden Spawn
					</button>
				</div>
			{/if}
		</div>
		{/if}
	</div>
{/snippet}

<Story name="Symbol Inspector" {template} />

<style>
	.root {
		display: flex;
		width: 100vw;
		height: 100vh;
		background: #111;
		color: #ddd;
		font-family: sans-serif;
		font-size: 13px;
	}

	.game-area {
		flex: 1;
		position: relative;
		overflow: hidden;
	}

	.toggle-btn {
		position: fixed;
		right: 0;
		top: 50%;
		transform: translateY(-50%);
		z-index: 9999;
		width: 24px;
		height: 48px;
		padding: 0;
		background: #2a2a2a;
		color: #ffd700;
		border: 1px solid #444;
		border-right: none;
		border-radius: 4px 0 0 4px;
		cursor: pointer;
		font-size: 10px;
		display: flex;
		align-items: center;
		justify-content: center;
	}
	.toggle-btn:hover {
		background: #383838;
	}

	.panel {
		width: 220px;
		background: #1a1a1a;
		border-left: 1px solid #2e2e2e;
		padding: 16px 12px;
		display: flex;
		flex-direction: column;
		gap: 0;
		overflow-y: auto;
	}

	h3 {
		margin: 0 0 14px;
		color: #fff;
		font-size: 13px;
		font-weight: 600;
		letter-spacing: 0.5px;
	}

	.section {
		margin-bottom: 16px;
	}

	.label {
		margin: 0 0 6px;
		color: #666;
		font-size: 11px;
		text-transform: uppercase;
		letter-spacing: 0.5px;
	}

	.hint {
		margin: 0 0 6px;
		color: #444;
		font-size: 11px;
	}

	.symbol-grid {
		display: grid;
		grid-template-columns: repeat(4, 1fr);
		gap: 4px;
	}

	.sym-btn {
		padding: 7px 4px;
		text-align: center;
		font-size: 12px;
		font-weight: 600;
		background: #252525;
		color: #aaa;
		border: 1px solid #333;
		border-radius: 3px;
		cursor: pointer;
		transition: background 0.1s;
	}
	.sym-btn:hover { background: #2e2e2e; color: #ddd; }
	.sym-btn.active {
		background: #ffd700;
		color: #111;
		border-color: #ffd700;
	}

	.anim-grid {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 5px;
	}

	.anim-btn {
		padding: 9px 8px;
		text-align: center;
		font-size: 12px;
		font-weight: 500;
		background: #1e3a1e;
		color: #7fef7f;
		border: 1px solid #2d6a2d;
		border-radius: 3px;
		cursor: pointer;
		transition: background 0.1s;
	}
	.anim-btn:hover { background: #254d25; }

	.anim-btn.danger {
		background: #3a1010;
		color: #ff8080;
		border-color: #7a2020;
	}
	.anim-btn.danger:hover { background: #4a1515; }

	.anim-btn.muted {
		background: #252525;
		color: #888;
		border-color: #333;
	}
	.anim-btn.muted:hover { background: #2e2e2e; }

	.row {
		display: flex;
		gap: 6px;
		align-items: center;
	}

	input[type='number'] {
		width: 64px;
		background: #252525;
		color: #ccc;
		border: 1px solid #444;
		padding: 5px 7px;
		font-size: 12px;
		border-radius: 3px;
	}

	button {
		background: #252525;
		color: #ccc;
		border: 1px solid #333;
		padding: 6px 10px;
		cursor: pointer;
		border-radius: 3px;
		font-size: 12px;
		transition: background 0.1s;
	}
	button:hover { background: #2e2e2e; }

	.respawn-btn {
		width: 100%;
		padding: 10px;
		text-align: center;
		background: #1a2a3a;
		color: #80c8ff;
		border-color: #2a5a8a;
		font-weight: 600;
	}
	.respawn-btn:hover { background: #223344; }
</style>
