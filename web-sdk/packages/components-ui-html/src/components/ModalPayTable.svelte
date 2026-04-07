<script lang="ts">
	import type { Snippet } from 'svelte';

	import { Popup } from 'components-shared';
	import { zIndex } from 'constants-shared/zIndex';
	import { stateModal } from 'state-shared';

	type Props = {
		children: Snippet;
	};

	const props: Props = $props();

	// Spritesheet: /assets/sprites/symbolsStatic/symbolsStatic.webp (386×1645)
	const SHEET_URL = '/assets/sprites/symbolsStatic/symbolsStatic.webp';
	const SHEET_W = 386;
	const SHEET_H = 1645;
	const ICON_H = 52;

	const FRAMES: Record<string, { x: number; y: number; w: number; h: number }> = {
		H1: { x: 1,   y: 1,    w: 200, h: 200 },
		H2: { x: 1,   y: 203,  w: 200, h: 199 },
		H3: { x: 1,   y: 1185, w: 200, h: 188 },
		H4: { x: 191, y: 1263, w: 190, h: 194 },
		L1: { x: 203, y: 1,    w: 200, h: 175 },
		L2: { x: 203, y: 945,  w: 172, h: 159 },
		L3: { x: 203, y: 777,  w: 166, h: 171 },
		L4: { x: 198, y: 1106, w: 155, h: 173 },
		W:  { x: 1,   y: 988,  w: 195, h: 195 },
		S:  { x: 195, y: 1455, w: 189, h: 190 },
	};

	function symbolStyle(key: string): string {
		const f = FRAMES[key];
		if (!f) return '';
		const scale = ICON_H / f.h;
		const bw = (SHEET_W * scale).toFixed(1);
		const bh = (SHEET_H * scale).toFixed(1);
		const bx = (-f.x * scale).toFixed(1);
		const by = (-f.y * scale).toFixed(1);
		const dw = (f.w * scale).toFixed(1);
		return [
			`display:inline-block`,
			`width:${dw}px`,
			`height:${ICON_H}px`,
			`background-image:url(${SHEET_URL})`,
			`background-size:${bw}px ${bh}px`,
			`background-position:${bx}px ${by}px`,
			`background-repeat:no-repeat`,
			`vertical-align:middle`,
			`flex-shrink:0`,
		].join(';');
	}

	const paytableRows: { key: string; tier: 'high' | 'low'; values: number[] }[] = [
		{ key: 'H1', tier: 'high', values: [5.0, 12.5, 25.0, 60.0] },
		{ key: 'H2', tier: 'high', values: [2.0,  5.0,  10.0, 40.0] },
		{ key: 'H3', tier: 'high', values: [1.3,  3.2,   7.0, 30.0] },
		{ key: 'H4', tier: 'high', values: [1.0,  2.5,   6.0, 20.0] },
		{ key: 'L1', tier: 'low',  values: [0.6,  1.5,   4.0, 10.0] },
		{ key: 'L2', tier: 'low',  values: [0.4,  1.2,   3.5,  8.0] },
		{ key: 'L3', tier: 'low',  values: [0.2,  0.8,   2.5,  5.0] },
		{ key: 'L4', tier: 'low',  values: [0.1,  0.5,   1.5,  4.0] },
	];

	const specialSymbols: { key: string; title: string; desc: string }[] = [
		{ key: 'W', title: 'WILD',       desc: 'Substitutes for all regular symbols. Carries a multiplier (×2 / ×3 / ×5 / ×10) applied to any win it completes.' },
		{ key: 'S', title: 'SCATTER',    desc: '4 or more Scatters trigger Free Spins. Does not pay independently.' },
	];
</script>

{#if stateModal.modal?.name === 'payTable'}
	<Popup zIndex={zIndex.modal} onclose={() => (stateModal.modal = null)}>
		<div class="paytable-content">
			<h2 class="paytable-title">PAY TABLE</h2>
			<p class="paytable-subtitle">All values shown as multipliers of total bet. Minimum winning cluster: <strong>5 symbols</strong>.</p>

			<table class="paytable-table">
				<thead>
					<tr>
						<th class="col-symbol">Symbol</th>
						<th>5</th>
						<th>6–8</th>
						<th>9–12</th>
						<th>13+</th>
					</tr>
				</thead>
				<tbody>
					{#each paytableRows as row}
						<tr class="row-{row.tier}">
							<td class="col-symbol">
								<span style={symbolStyle(row.key)}></span>
							</td>
							{#each row.values as val}
								<td>{val}×</td>
							{/each}
						</tr>
					{/each}
				</tbody>
			</table>

			<h3 class="paytable-section-title">SPECIAL SYMBOLS</h3>
			<div class="special-symbols">
				{#each specialSymbols as sym}
					<div class="special-row">
						<span style={symbolStyle(sym.key)}></span>
						<div class="special-text">
							<span class="special-label">{sym.title}</span>
							<span class="special-desc">{sym.desc}</span>
						</div>
					</div>
				{/each}
				<div class="special-row">
					<span class="multiplier-icon">M</span>
					<div class="special-text">
						<span class="special-label">MULTIPLIER</span>
						<span class="special-desc">Increases the Global Multiplier when part of a cascade. Does not pay independently.</span>
					</div>
				</div>
			</div>

			<div class="paytable-note">
				<p>Payouts are multiplied by the active <strong>Global Multiplier</strong> at the time of win evaluation. All wins pay in connected clusters.</p>
			</div>

			<div class="paytable-version">
				{@render props.children()}
			</div>
		</div>
	</Popup>
{/if}

<style lang="scss">
	.paytable-content {
		position: relative;
		z-index: 100;
		width: min(500px, 90vw);
		max-height: 85vh;
		overflow-y: auto;
		overscroll-behavior: contain;
		padding: 1.5rem 1.25rem 1.5rem;
		color: #e0e0e0;
		font-size: 0.875rem;
		line-height: 1.5;
		text-align: left;

		scrollbar-width: thin;
		scrollbar-color: #555 transparent;
		&::-webkit-scrollbar { width: 6px; }
		&::-webkit-scrollbar-thumb { background: #555; border-radius: 10px; }
	}

	.paytable-title {
		text-align: center;
		font-size: 1.5rem;
		font-weight: 700;
		color: #ffd700;
		letter-spacing: 0.1em;
		margin: 0 0 0.25rem;
	}

	.paytable-subtitle {
		text-align: center;
		font-size: 0.8rem;
		color: #aaaaaa;
		margin: 0 0 1rem;
	}

	.paytable-table {
		width: 100%;
		border-collapse: collapse;
		font-size: 0.85rem;

		th, td {
			padding: 0.3rem 0.5rem;
			text-align: center;
			border-bottom: 1px solid #2a2a2a;
			vertical-align: middle;
		}

		th {
			color: #888;
			font-weight: 600;
			font-size: 0.75rem;
			letter-spacing: 0.05em;
			background: rgba(0,0,0,0.3);
		}

		.col-symbol {
			text-align: center;
			padding: 0.2rem 0.5rem;
		}

		.row-high td { color: #ffffff; }
		.row-low td { color: #cccccc; }

		tr:hover td { background: rgba(255,255,255,0.04); }
	}

	.paytable-section-title {
		font-size: 0.75rem;
		font-weight: 700;
		color: #ffd700;
		letter-spacing: 0.08em;
		margin: 1.25rem 0 0.5rem;
		border-bottom: 1px solid #333;
		padding-bottom: 0.25rem;
	}

	.special-symbols {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}

	.special-row {
		display: flex;
		align-items: center;
		gap: 0.75rem;
	}

	.special-text {
		display: flex;
		flex-direction: column;
		gap: 0.15rem;
	}

	.special-label {
		font-weight: 700;
		color: #ffffff;
		font-size: 0.8rem;
	}

	.special-desc {
		color: #cccccc;
		font-size: 0.8rem;
	}

	.multiplier-icon {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 52px;
		height: 52px;
		flex-shrink: 0;
		border-radius: 50%;
		background: radial-gradient(circle, rgba(255,215,0,0.35) 0%, rgba(255,215,0,0.05) 70%);
		border: 2px solid rgba(255,215,0,0.4);
		font-weight: 900;
		font-size: 1.4rem;
		color: #ffd700;
	}

	.paytable-note {
		margin-top: 1rem;
		padding: 0.75rem;
		background: rgba(255,215,0,0.05);
		border: 1px solid #3a3a00;
		border-radius: 6px;
		font-size: 0.75rem;
		color: #aaaaaa;
		p { margin: 0; }
	}

	.paytable-version {
		margin-top: 1rem;
		text-align: center;
		opacity: 0.5;
	}
</style>
