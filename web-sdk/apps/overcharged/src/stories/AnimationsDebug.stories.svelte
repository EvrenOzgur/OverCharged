<script lang="ts" module>
	import { defineMeta } from '@storybook/addon-svelte-csf';
	const { Story } = defineMeta({ title: 'ANIMATIONS/Debug Lab' });
</script>

<script lang="ts">
	import { StoryGameTemplate, StoryLocale, type TemplateArgs } from 'components-storybook';
	import type { SymbolState } from '../game/types';
	import Game from '../components/Game.svelte';
	import { setContext, getContext } from '../game/context';
	import { winLevelMap } from '../game/winLevelMap';
	import config from '../game/config';

	setContext();
	const context = getContext();

	// ─── YARDIMCILAR ─────────────────────────────────────────────────────────────

	const SYMBOL_REEL = 3;
	const SYMBOL_ROW  = 4; // padded board (10 satır), görünür alan ortası

	function buildBoard(symbol: string, mult?: number): any[][] {
		const board = Array.from({ length: 8 }, () =>
			Array.from({ length: 10 }, () => ({ name: 'L4' })),
		);
		board[SYMBOL_REEL][SYMBOL_ROW] = { name: symbol, ...(mult !== undefined ? { multiplier: mult } : {}) };
		return board;
	}

	function buildFullBoard(fill = 'L4'): any[][] {
		return Array.from({ length: 8 }, () =>
			Array.from({ length: 10 }, () => ({ name: fill })),
		);
	}

	async function safeSettle(board: any[][]) {
		context.eventEmitter.broadcast({ type: 'boardHide' });
		context.eventEmitter.broadcast({ type: 'boardSymbolsReset' });
		await new Promise((r) => setTimeout(r, 100));
		await context.eventEmitter.broadcastAsync({ type: 'boardSettle', board });
		context.eventEmitter.broadcast({ type: 'boardShow' });
	}

	// ─── 1. SYMBOL INSPECTOR ─────────────────────────────────────────────────────

	const ALL_SYMBOLS = ['H1','H2','H3','H4','L1','L2','L3','L4','W','S','M'] as const;
	type SymbolName = (typeof ALL_SYMBOLS)[number];

	const SYMBOL_ANIM_STATES: { state: SymbolState; label: string; danger?: boolean; muted?: boolean }[] = [
		{ state: 'land',          label: 'Land'     },
		{ state: 'win',           label: 'Win'      },
		{ state: 'postWinStatic', label: 'Post-Win' },
		{ state: 'explosion',     label: 'Explosion', danger: true },
		{ state: 'static',        label: 'Reset',     muted: true  },
	];

	let selectedSymbol  = $state<SymbolName>('H1');
	let multiplierValue = $state(2);
	let isSpawned       = $state(false);

	async function spawnSymbol(symbol: SymbolName) {
		const mult = symbol === 'M' || symbol === 'W' ? multiplierValue : undefined;
		await safeSettle(buildBoard(symbol, mult));
		isSpawned = true;
	}

	async function selectSymbol(symbol: SymbolName) {
		selectedSymbol = symbol;
		await spawnSymbol(symbol);
	}

	async function triggerSymbolAnimation(state: SymbolState) {
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
		if (state === 'explosion') isSpawned = false;
	}

	// ─── 2. SKILL INSPECTOR ──────────────────────────────────────────────────────

	type SkillKey = 'L1' | 'L2' | 'L3' | 'L4';

	// Colors mirror low_symbols spine skin assigned to each math key in
	// constants.ts SYMBOL_INFO_MAP (and SKILL_DATA in skillData.ts):
	//   L1 → yellow (WILD STRIKE), L2 → green (OVERLOAD),
	//   L3 → blue (POWER SURGE), L4 → red (MEGA BOLT).
	const SKILLS = [
		{ key: 'L1' as SkillKey, label: 'L1 — Yellow (Wild Strike)', target: config.skillThresholds.L1, color: '#ffd700', border: '#aa8800' },
		{ key: 'L2' as SkillKey, label: 'L2 — Green (Overload)',     target: config.skillThresholds.L2, color: '#66ff66', border: '#33aa33' },
		{ key: 'L3' as SkillKey, label: 'L3 — Blue (Power Surge)',   target: config.skillThresholds.L3, color: '#6699ff', border: '#3366bb' },
		{ key: 'L4' as SkillKey, label: 'L4 — Red (Mega Bolt)',      target: config.skillThresholds.L4, color: '#ff6666', border: '#aa3333' },
	];

	let selectedSkill = $state<SkillKey>('L1');
	let isFilling     = $state(false);

	const skillData      = $derived(SKILLS.find((s) => s.key === selectedSkill)!);
	const currentMeter   = $derived(context.stateGame.skillMeters[selectedSkill]);

	function setMeter(key: SkillKey, val: number) { context.stateGame.skillMeters[key] = val; }

	async function fillAnimation() {
		if (isFilling) return;
		isFilling = true;
		const { key, target } = skillData;
		setMeter(key, 0);
		await new Promise((r) => setTimeout(r, 80));
		for (let i = 1; i <= target; i++) {
			setMeter(key, i);
			await new Promise((r) => setTimeout(r, 120));
		}
		isFilling = false;
	}

	async function activateSkill() {
		const { key, target } = skillData;
		const meters = { ...context.stateGame.skillMeters, [key]: target };
		let extra: Record<string, any> = {};

		if (key === 'L1') {
			extra = { positions: [{ reel: SYMBOL_REEL, row: SYMBOL_ROW }] };
		} else if (key === 'L2') {
			const pos = [];
			for (let r = 0; r < 8; r++) for (let row = 1; row <= 6; row++) pos.push({ reel: r, row });
			extra = { positions: pos };
		} else if (key === 'L3') {
			const cur = context.stateGame.globalMultiplier;
			const [lo, hi] = config.l3FactorRange;
			const factor = Math.floor(Math.random() * (hi - lo + 1)) + lo;
			extra = { multiplierFactor: factor, newGlobalMultiplier: cur * factor };
		} else if (key === 'L4') {
			const pos = [];
			for (let r = 2; r <= 4; r++) for (let row = 3; row <= 5; row++) pos.push({ reel: r, row });
			extra = { positions: pos };
		}

		await context.eventEmitter.broadcastAsync({ index: 0, type: 'skillActivated', skillType: key, skillMeters: meters, ...extra } as any);
	}

	function resetMeters() { context.stateGame.skillMeters = { L1: 0, L2: 0, L3: 0, L4: 0 }; }

	// ─── 3. BOARD & SAHNE ────────────────────────────────────────────────────────

	async function triggerTransition() {
		await context.eventEmitter.broadcastAsync({ type: 'transition' });
	}

	// ─── 4. WIN AMOUNTS ──────────────────────────────────────────────────────────

	let clusterBase   = $state(500);
	let clusterMult   = $state(1);
	let tumbleAmount  = $state(5000);
	let tumbleAnimate = $state(true);
	let winAmount     = $state(10000);

	async function triggerClusterWins() {
		await context.eventEmitter.broadcastAsync({
			type: 'showClusterWinAmounts',
			wins: [
				{ win: clusterBase,     mult: clusterMult, result: clusterBase * clusterMult,     reel: 1, row: 2 },
				{ win: clusterBase * 2, mult: clusterMult, result: clusterBase * 2 * clusterMult, reel: 4, row: 4 },
				{ win: clusterBase * 3, mult: clusterMult, result: clusterBase * 3 * clusterMult, reel: 6, row: 2 },
			],
		});
	}

	async function triggerTumbleWin() {
		context.eventEmitter.broadcast({ type: 'tumbleWinAmountShow' });
		await context.eventEmitter.broadcastAsync({ type: 'tumbleWinAmountUpdate', amount: tumbleAmount, animate: tumbleAnimate });
	}

	function hideTumbleWin() {
		context.eventEmitter.broadcast({ type: 'tumbleWinAmountHide' });
		context.eventEmitter.broadcast({ type: 'tumbleWinAmountReset' });
	}

	async function triggerWin(level: keyof typeof winLevelMap) {
		context.eventEmitter.broadcast({ type: 'winShow' });
		await context.eventEmitter.broadcastAsync({ type: 'winUpdate', amount: winAmount, winLevelData: winLevelMap[level] });
		context.eventEmitter.broadcast({ type: 'winHide' });
	}

	// ─── 5. FREE SPINS ───────────────────────────────────────────────────────────

	let fsCurrent    = $state(7);
	let fsTotal      = $state(10);
	let outroAmount  = $state(50000);
	let outroLevel   = $state<keyof typeof winLevelMap>(6);

	function showFsCounter() {
		context.eventEmitter.broadcast({ type: 'freeSpinCounterShow' });
		context.eventEmitter.broadcast({ type: 'freeSpinCounterUpdate', current: fsCurrent, total: fsTotal });
	}

	async function triggerFsIntro(isRetrigger: boolean) {
		context.eventEmitter.broadcast({ type: 'freeSpinIntroShow' });
		await context.eventEmitter.broadcastAsync({ type: 'freeSpinIntroUpdate', totalFreeSpins: fsTotal, addedFs: fsTotal, isRetrigger });
		context.eventEmitter.broadcast({ type: 'freeSpinIntroHide' });
	}

	async function triggerFsOutro() {
		context.eventEmitter.broadcast({ type: 'freeSpinOutroShow' });
		await context.eventEmitter.broadcastAsync({ type: 'freeSpinOutroCountUp', amount: outroAmount, winLevelData: winLevelMap[outroLevel] });
		context.eventEmitter.broadcast({ type: 'freeSpinOutroHide' });
	}

	// ─── 6. GLOBAL MULTİPLİER ────────────────────────────────────────────────────

	let multValue    = $state(5);
	let multSpawned  = $state(false);

	async function triggerMultiplier(val: number) {
		context.stateGame.globalMultiplier = val;
		context.eventEmitter.broadcast({ type: 'globalMultiplierShow' });
		await context.eventEmitter.broadcastAsync({ type: 'globalMultiplierUpdate', multiplier: val });
	}

	function hideMultiplier() {
		context.eventEmitter.broadcast({ type: 'globalMultiplierHide' });
		context.stateGame.globalMultiplier = 1;
	}

	// Multiplier symbol (M): board'a M sembolü koy, sonra multiplierSymbolActivated tetikle
	let mSymbolValue = $state(5);

	async function spawnMSymbol() {
		const board = buildFullBoard('L4');
		board[SYMBOL_REEL][SYMBOL_ROW] = { name: 'M', multiplier: mSymbolValue };
		await safeSettle(board);
		multSpawned = true;
	}

	async function triggerMSymbolActivated() {
		if (!multSpawned) await spawnMSymbol();
		const newGlobal = context.stateGame.globalMultiplier === 1
			? mSymbolValue
			: context.stateGame.globalMultiplier + mSymbolValue;
		context.stateGame.globalMultiplier = newGlobal;
		context.eventEmitter.broadcast({ type: 'globalMultiplierShow' });
		await context.eventEmitter.broadcastAsync({
			type: 'multiplierSymbolActivated',
			symbols: [{ reel: SYMBOL_REEL, row: SYMBOL_ROW + 1, value: mSymbolValue }],
			newGlobalMultiplier: newGlobal,
		});
	}

	// ─── 7. CASCADE / TUMBLE ─────────────────────────────────────────────────────

	async function triggerCascade() {
		// Board hazırla — explode olacak satırlar
		const board = buildFullBoard('H2');
		board[0][2] = { name: 'H1' }; board[1][2] = { name: 'H1' }; board[2][2] = { name: 'H1' };
		board[0][3] = { name: 'H3' }; board[1][3] = { name: 'H3' }; board[2][3] = { name: 'H3' };
		await safeSettle(board);

		// Win animasyonu
		await context.eventEmitter.broadcastAsync({
			type: 'boardWithAnimateSymbols',
			symbolPositions: [{ reel: 0, row: 2 }, { reel: 1, row: 2 }, { reel: 2, row: 2 }],
			state: 'win',
		});

		// Tumble dizisi
		const addingBoard = [
			[{ name: 'L1' }, { name: 'L2' }],
			[{ name: 'L3' }, { name: 'W'  }],
			[{ name: 'H4' }, { name: 'S'  }],
		];

		context.eventEmitter.broadcast({ type: 'boardHide' });
		context.eventEmitter.broadcast({ type: 'tumbleBoardShow' });
		context.eventEmitter.broadcast({ type: 'tumbleBoardInit', addingBoard });
		await context.eventEmitter.broadcastAsync({
			type: 'tumbleBoardExplode',
			explodingPositions: [{ reel: 0, row: 2 }, { reel: 1, row: 2 }, { reel: 2, row: 2 }],
		});
		context.eventEmitter.broadcast({ type: 'tumbleBoardRemoveExploded' });
		await context.eventEmitter.broadcastAsync({ type: 'tumbleBoardSlideDown' });

		const combined = context.stateGameDerived
			.tumbleBoardCombined()
			.map((r: any[]) => r.map((s: any) => s.rawSymbol));
		context.eventEmitter.broadcast({ type: 'boardSettle', board: combined });
		context.eventEmitter.broadcast({ type: 'tumbleBoardReset' });
		context.eventEmitter.broadcast({ type: 'tumbleBoardHide' });
		context.eventEmitter.broadcast({ type: 'boardShow' });
	}

	// ─── PANEL AÇIK/KAPALI DURUMLAR ──────────────────────────────────────────────

	let panelOpen   = $state(true);
	const sections  = $state({
		symbol:     true,
		skill:      true,
		board:      true,
		winAmounts: true,
		freeSpins:  true,
		multiplier: true,
		cascade:    true,
	});
</script>

{#snippet template(args: TemplateArgs<any>)}
<div class="root">
	<div class="game-area">
		<StoryGameTemplate skipLoadingScreen={true}>
			<StoryLocale lang="en"><Game /></StoryLocale>
		</StoryGameTemplate>
	</div>

	<button class="toggle-btn" onclick={() => (panelOpen = !panelOpen)}>
		{panelOpen ? '▶' : '◀'}
	</button>

	{#if panelOpen}
	<div class="panel">

		<!-- ═══ 1. SYMBOL INSPECTOR ═══════════════════════════════════════════ -->
		<button class="sec-hdr" onclick={() => (sections.symbol = !sections.symbol)}>
			Symbol Inspector <span class="chv">{sections.symbol ? '▲' : '▼'}</span>
		</button>
		{#if sections.symbol}
			<div class="sec">
				<p class="lbl">Sembol</p>
				<div class="sym-grid">
					{#each ALL_SYMBOLS as sym}
						<button class="sym-btn" class:active={selectedSymbol === sym}
							onclick={() => selectSymbol(sym)}>{sym}</button>
					{/each}
				</div>
			</div>

			{#if selectedSymbol === 'M' || selectedSymbol === 'W'}
				<div class="sec">
					<p class="lbl">Multiplier</p>
					<div class="row">
						<input type="number" bind:value={multiplierValue} min="2" max="999" />
						<button onclick={() => spawnSymbol(selectedSymbol)}>Uygula</button>
					</div>
				</div>
			{/if}

			<div class="sec">
				<p class="lbl">Animasyonlar</p>
				{#if !isSpawned}<p class="hint">Önce sembol seç</p>{/if}
				<div class="btn-grid">
					{#each SYMBOL_ANIM_STATES as { state, label, danger, muted }}
						<button class="abtn" class:danger class:muted
							onclick={() => triggerSymbolAnimation(state)}>{label}</button>
					{/each}
				</div>
			</div>

			{#if !isSpawned}
				<div class="sec">
					<button class="wide-btn blue" onclick={() => spawnSymbol(selectedSymbol)}>↺ Yeniden Spawn</button>
				</div>
			{/if}
		{/if}

		<!-- ═══ 2. SKILL INSPECTOR ════════════════════════════════════════════ -->
		<button class="sec-hdr" onclick={() => (sections.skill = !sections.skill)}>
			Skill Inspector <span class="chv">{sections.skill ? '▲' : '▼'}</span>
		</button>
		{#if sections.skill}
			<div class="sec">
				<p class="lbl">Skill</p>
				<div class="btn-grid">
					{#each SKILLS as sk}
						<button class="skill-btn" class:active={selectedSkill === sk.key}
							style="--c:{sk.color};--b:{sk.border}"
							onclick={() => (selectedSkill = sk.key)}>{sk.key}</button>
					{/each}
				</div>
				<p class="skill-info" style="color:{skillData.color}">{skillData.label} · Hedef: {skillData.target}</p>
			</div>

			<div class="sec">
				<p class="lbl">Meter — {currentMeter}/{skillData.target}</p>
				<input type="range" min="0" max={skillData.target} value={currentMeter}
					style="width:100%;accent-color:{skillData.color}"
					oninput={(e) => setMeter(selectedSkill, Number((e.target as HTMLInputElement).value))} />
			</div>

			<div class="sec">
				<p class="lbl">Animasyonlar</p>
				<div class="btn-grid">
					<button class="abtn" class:muted={isFilling} onclick={fillAnimation}>
						{isFilling ? 'Dolduruluyor…' : 'Doldur'}
					</button>
					<button class="abtn" onclick={activateSkill}>Aktive Et</button>
				</div>
				<button class="wide-btn red" style="margin-top:6px" onclick={resetMeters}>↺ Sıfırla</button>
			</div>
		{/if}

		<!-- ═══ 3. BOARD & SAHNE ══════════════════════════════════════════════ -->
		<button class="sec-hdr" onclick={() => (sections.board = !sections.board)}>
			Board & Sahne <span class="chv">{sections.board ? '▲' : '▼'}</span>
		</button>
		{#if sections.board}
			<div class="sec">
				<p class="lbl">Sahne Geçişi</p>
				<button class="abtn" onclick={triggerTransition}>Transition</button>
			</div>
		{/if}

		<!-- ═══ 4. WIN AMOUNTS ════════════════════════════════════════════════ -->
		<button class="sec-hdr" onclick={() => (sections.winAmounts = !sections.winAmounts)}>
			Win Amounts <span class="chv">{sections.winAmounts ? '▲' : '▼'}</span>
		</button>
		{#if sections.winAmounts}
			<div class="sec">
				<p class="lbl">Cluster Wins (yüzen rakamlar)</p>
				<div class="row">
					<label>Base<input type="number" bind:value={clusterBase} min="100" step="100" /></label>
					<label>Mult<input type="number" bind:value={clusterMult} min="1" max="50" /></label>
				</div>
				<button class="abtn" style="margin-top:5px" onclick={triggerClusterWins}>Göster (3 konum)</button>
			</div>

			<div class="sec">
				<p class="lbl">Tumble Win Counter</p>
				<div class="row">
					<label>Tutar<input type="number" bind:value={tumbleAmount} min="100" step="1000" /></label>
					<label class="toggle-label">
						<input type="checkbox" bind:checked={tumbleAnimate} /> Animate
					</label>
				</div>
				<div class="btn-grid" style="margin-top:5px">
					<button class="abtn" onclick={triggerTumbleWin}>Göster</button>
					<button class="abtn muted" onclick={hideTumbleWin}>Gizle</button>
				</div>
			</div>

			<div class="sec">
				<p class="lbl">Win Overlay — Tutar</p>
				<input type="number" bind:value={winAmount} min="100" step="1000" style="width:100%;margin-bottom:6px" />
				<p class="lbl">Win Level Seç</p>
				<div class="win-grid">
					{#each Object.entries(winLevelMap) as [lvl, data]}
						<button class="win-btn" class:win-big={data.type === 'big'}
							title="Level {lvl}"
							onclick={() => triggerWin(Number(lvl) as keyof typeof winLevelMap)}>
							{data.alias}
						</button>
					{/each}
				</div>
			</div>
		{/if}

		<!-- ═══ 5. FREE SPINS ═════════════════════════════════════════════════ -->
		<button class="sec-hdr" onclick={() => (sections.freeSpins = !sections.freeSpins)}>
			Free Spins <span class="chv">{sections.freeSpins ? '▲' : '▼'}</span>
		</button>
		{#if sections.freeSpins}
			<div class="sec">
				<p class="lbl">Counter</p>
				<div class="row">
					<label>Mevcut<input type="number" bind:value={fsCurrent} min="0" max="99" /></label>
					<label>Toplam<input type="number" bind:value={fsTotal}   min="1" max="99" /></label>
				</div>
				<div class="btn-grid" style="margin-top:5px">
					<button class="abtn" onclick={showFsCounter}>Göster</button>
					<button class="abtn muted" onclick={() => context.eventEmitter.broadcast({ type: 'freeSpinCounterHide' })}>Gizle</button>
				</div>
			</div>

			<div class="sec">
				<p class="lbl">Intro</p>
				<div class="btn-grid">
					<button class="abtn" onclick={() => triggerFsIntro(false)}>Normal</button>
					<button class="abtn" onclick={() => triggerFsIntro(true)}>Retrigger</button>
				</div>
			</div>

			<div class="sec">
				<p class="lbl">Outro — Tutar</p>
				<input type="number" bind:value={outroAmount} min="1000" step="10000" style="width:100%;margin-bottom:6px" />
				<p class="lbl">Win Level</p>
				<div class="win-grid">
					{#each Object.entries(winLevelMap) as [lvl, data]}
						<button class="win-btn" class:win-big={data.type === 'big'}
							class:active-win={outroLevel === Number(lvl)}
							title="Level {lvl}"
							onclick={() => { outroLevel = Number(lvl) as keyof typeof winLevelMap; triggerFsOutro(); }}>
							{data.alias}
						</button>
					{/each}
				</div>
			</div>
		{/if}

		<!-- ═══ 6. GLOBAL MULTİPLİER ══════════════════════════════════════════ -->
		<button class="sec-hdr" onclick={() => (sections.multiplier = !sections.multiplier)}>
			Global Multiplier <span class="chv">{sections.multiplier ? '▲' : '▼'}</span>
		</button>
		{#if sections.multiplier}
			<div class="sec">
				<p class="lbl">Çarpan Değeri</p>
				<div class="btn-grid">
					<button class="abtn" onclick={() => triggerMultiplier(2)}>×2</button>
					<button class="abtn" onclick={() => triggerMultiplier(5)}>×5</button>
					<button class="abtn" onclick={() => triggerMultiplier(10)}>×10</button>
					<button class="abtn" onclick={() => triggerMultiplier(50)}>×50</button>
				</div>
				<div class="row" style="margin-top:6px">
					<input type="number" bind:value={multValue} min="1" max="999" />
					<button class="abtn" onclick={() => triggerMultiplier(multValue)}>×{multValue}</button>
				</div>
				<div class="btn-grid" style="margin-top:6px">
					<button class="abtn" onclick={() => { context.eventEmitter.broadcast({ type: 'globalMultiplierShow' }); }}>Göster</button>
					<button class="abtn muted" onclick={hideMultiplier}>Sıfırla & Gizle</button>
				</div>
			</div>

			<div class="sec">
				<p class="lbl">M Sembolü Aktivasyonu</p>
				<div class="row">
					<label>Değer<input type="number" bind:value={mSymbolValue} min="2" max="500" /></label>
					<button onclick={spawnMSymbol}>Spawn M</button>
				</div>
				<button class="abtn" style="margin-top:5px" onclick={triggerMSymbolActivated}>
					Multiplier Activated
				</button>
			</div>
		{/if}

		<!-- ═══ 7. CASCADE / TUMBLE ═══════════════════════════════════════════ -->
		<button class="sec-hdr" onclick={() => (sections.cascade = !sections.cascade)}>
			Cascade / Tumble <span class="chv">{sections.cascade ? '▲' : '▼'}</span>
		</button>
		{#if sections.cascade}
			<div class="sec">
				<p class="hint">Board kur → Win anim → Patlama → Yeni semboller düşer → Settle</p>
				<button class="abtn" onclick={triggerCascade}>Tam Cascade Demo</button>
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
		font-size: 12px;
	}
	.game-area { flex: 1; position: relative; overflow: hidden; }

	/* Toggle */
	.toggle-btn {
		position: fixed; right: 0; top: 50%; transform: translateY(-50%);
		z-index: 9999; width: 22px; height: 44px; padding: 0;
		background: #2a2a2a; color: #ffd700; border: 1px solid #444;
		border-right: none; border-radius: 4px 0 0 4px; cursor: pointer;
		font-size: 9px; display: flex; align-items: center; justify-content: center;
	}
	.toggle-btn:hover { background: #383838; }

	/* Panel */
	.panel {
		width: 230px; background: #1a1a1a;
		border-left: 1px solid #2e2e2e;
		display: flex; flex-direction: column; overflow-y: auto;
	}

	/* Section header */
	.sec-hdr {
		width: 100%; display: flex; justify-content: space-between; align-items: center;
		padding: 9px 12px; background: #222; color: #fff;
		border: none; border-bottom: 1px solid #2e2e2e;
		font-size: 11px; font-weight: 700; cursor: pointer;
		text-transform: uppercase; letter-spacing: 0.4px;
	}
	.sec-hdr:hover { background: #2a2a2a; }
	.chv { font-size: 8px; color: #555; }

	.sec {
		padding: 9px 12px;
		border-bottom: 1px solid #1e1e1e;
	}

	.lbl {
		margin: 0 0 5px; color: #555;
		font-size: 10px; text-transform: uppercase; letter-spacing: 0.4px;
	}

	.hint { margin: 0 0 6px; color: #444; font-size: 10px; }

	/* Symbol grid */
	.sym-grid { display: grid; grid-template-columns: repeat(4,1fr); gap: 3px; }
	.sym-btn {
		padding: 6px 3px; text-align: center; font-size: 11px; font-weight: 700;
		background: #252525; color: #aaa; border: 1px solid #333; border-radius: 3px; cursor: pointer;
	}
	.sym-btn:hover { background: #2e2e2e; color: #ddd; }
	.sym-btn.active { background: #ffd700; color: #111; border-color: #ffd700; }

	/* Skill buttons */
	.skill-btn {
		padding: 7px 4px; text-align: center; font-size: 12px; font-weight: 700;
		background: #1e1e1e; color: var(--c); border: 1px solid #333; border-radius: 3px; cursor: pointer;
	}
	.skill-btn:hover { background: #262626; }
	.skill-btn.active { border-color: var(--b); box-shadow: 0 0 0 1px var(--b); }
	.skill-info { margin: 6px 0 0; font-size: 10px; }

	/* Anim buttons */
	.btn-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 4px; }

	.abtn {
		padding: 8px 6px; text-align: center; font-size: 11px; font-weight: 500;
		background: #1e3a1e; color: #7fef7f; border: 1px solid #2d6a2d;
		border-radius: 3px; cursor: pointer;
	}
	.abtn:hover { background: #254d25; }
	.abtn.danger { background: #3a1010; color: #ff8080; border-color: #7a2020; }
	.abtn.danger:hover { background: #4a1515; }
	.abtn.muted  { background: #222; color: #555; border-color: #2e2e2e; cursor: default; }
	.abtn.active-glow { background: #3a3000; color: #ffd700; border-color: #aa8800; }

	/* Win grid */
	.win-grid { display: grid; grid-template-columns: repeat(5,1fr); gap: 3px; }
	.win-btn {
		padding: 4px 2px; text-align: center; font-size: 9px;
		background: #222; color: #888; border: 1px solid #2e2e2e; border-radius: 2px; cursor: pointer;
	}
	.win-btn:hover { background: #2a2a2a; color: #ccc; }
	.win-btn.win-big { background: #2a1500; color: #ff9944; border-color: #7a3a00; }
	.win-btn.win-big:hover { background: #3a1e00; }
	.win-btn.active-win { outline: 1px solid #ffd700; }

	/* Row / inputs */
	.row { display: flex; gap: 5px; align-items: center; flex-wrap: wrap; }

	label {
		display: flex; align-items: center; gap: 3px;
		font-size: 10px; color: #777;
	}

	.toggle-label { gap: 5px; cursor: pointer; }

	input[type='number'] {
		width: 58px; background: #222; color: #ccc;
		border: 1px solid #3a3a3a; padding: 4px 6px;
		font-size: 11px; border-radius: 2px;
	}
	input[type='range'] { accent-color: #ffd700; }
	input[type='checkbox'] { accent-color: #ffd700; }

	button {
		background: #252525; color: #ccc; border: 1px solid #333;
		padding: 5px 9px; cursor: pointer; border-radius: 3px; font-size: 11px;
	}
	button:hover { background: #2e2e2e; }

	.wide-btn {
		width: 100%; padding: 8px; text-align: center; font-weight: 600;
	}
	.wide-btn.blue { background: #1a2a3a; color: #80c8ff; border-color: #2a5a8a; }
	.wide-btn.blue:hover { background: #223344; }
	.wide-btn.red  { background: #2a1010; color: #ff8080; border-color: #5a2020; }
	.wide-btn.red:hover  { background: #331414; }
</style>
