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
	const ICON_H = 44;

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
</script>

{#if stateModal.modal?.name === 'gameRules'}
	<Popup zIndex={zIndex.modal} onclose={() => (stateModal.modal = null)}>
		<div class="rules-content">
			<h2 class="rules-title">OVERCHARGED</h2>
			<h3 class="rules-subtitle">HOW TO PLAY</h3>

			<section class="rules-section">
				<p>Spin an 8×8 grid. Win by landing <strong>5 or more matching symbols</strong> connected horizontally or vertically (Cluster Pays). Winning symbols are removed and new symbols fall from above — cascades continue until no new wins occur.</p>
			</section>

			<h3 class="rules-subtitle">SYMBOLS</h3>
			<section class="rules-section">
				<div class="rules-row">
					<span style={symbolStyle('W')}></span>
					<span class="rules-desc"><strong class="rules-label-inline">WILD</strong> — Substitutes for all regular symbols. Carries a multiplier value (×2, ×3, ×5, ×10) applied to wins it completes.</span>
				</div>
				<div class="rules-row">
					<span class="multiplier-icon">M</span>
					<span class="rules-desc"><strong class="rules-label-inline">MULTIPLIER</strong> — Adds its value to the Global Multiplier. Does not form winning clusters on its own.</span>
				</div>
				<div class="rules-row">
					<span style={symbolStyle('S')}></span>
					<span class="rules-desc"><strong class="rules-label-inline">SCATTER</strong> — 4 or more Scatters anywhere on the grid trigger Free Spins.</span>
				</div>
			</section>

			<h3 class="rules-subtitle">SKILL METERS</h3>
			<section class="rules-section">
				<p>Each spin fills one of four Skill Meters. When a meter is full it activates its effect, then resets.</p>
				<div class="rules-row">
					<span style={symbolStyle('L1')}></span>
					<span class="rules-desc"><strong class="rules-label-inline" style="color:#ffd700">L1 (10)</strong> — Selected low-tier symbols are converted to Wild.</span>
				</div>
				<div class="rules-row">
					<span style={symbolStyle('L2')}></span>
					<span class="rules-desc"><strong class="rules-label-inline" style="color:#00cc44">L2 (20)</strong> — Low-tier symbols in winning positions explode, triggering an extra cascade.</span>
				</div>
				<div class="rules-row">
					<span style={symbolStyle('L3')}></span>
					<span class="rules-desc"><strong class="rules-label-inline" style="color:#4488ff">L3 (15)</strong> — The Global Multiplier is increased by the math-determined value.</span>
				</div>
				<div class="rules-row">
					<span style={symbolStyle('L4')}></span>
					<span class="rules-desc"><strong class="rules-label-inline" style="color:#ff4444">L4 (30)</strong> — A 3×3 block of symbols is converted to Wild.</span>
				</div>
			</section>

			<h3 class="rules-subtitle">GLOBAL MULTIPLIER</h3>
			<section class="rules-section">
				<p>The Global Multiplier starts at ×1 and increases through Multiplier symbols and the L3 Skill. It is applied to all cluster wins in the same round. During Free Spins the multiplier carries over and continues to grow.</p>
			</section>

			<h3 class="rules-subtitle">FREE SPINS</h3>
			<section class="rules-section">
				<p>Landing 4 or more Scatter symbols triggers Free Spins. The number of free spins awarded depends on the number of Scatters. Additional Scatters during Free Spins retrigger more spins. The Global Multiplier is retained throughout the feature.</p>
			</section>

			<h3 class="rules-subtitle">BUY BONUS</h3>
			<section class="rules-section">
				<p>Purchase direct entry to the Free Spins feature for <strong>200× your current bet</strong>. Feature availability subject to jurisdiction.</p>
			</section>

			<h3 class="rules-subtitle">GAME INFORMATION</h3>
			<section class="rules-section rules-info">
				<div class="rules-info-row"><span>RTP</span><span>97.00%</span></div>
				<div class="rules-info-row"><span>Maximum Win</span><span>5,000× bet</span></div>
				<div class="rules-info-row"><span>Reels</span><span>8×8 (Cluster Pays)</span></div>
				<div class="rules-info-row"><span>Min. Win Cluster</span><span>5 symbols</span></div>
			</section>

			<section class="rules-disclaimer">
				<p>This game is provided by Stake Engine. Any malfunction voids all pays and plays. The theoretical Return to Player (RTP) for this game is <strong>97.00%</strong>. Maximum win is <strong>5,000× your bet</strong>. Please gamble responsibly. If you have concerns about your gambling, visit <strong>begambleaware.org</strong>.</p>
			</section>

			<div class="rules-version">
				{@render props.children()}
			</div>
		</div>
	</Popup>
{/if}

<style lang="scss">
	.rules-content {
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

	.rules-title {
		text-align: center;
		font-size: 1.5rem;
		font-weight: 700;
		color: #ffd700;
		letter-spacing: 0.1em;
		margin: 0 0 0.25rem;
	}

	.rules-subtitle {
		font-size: 0.75rem;
		font-weight: 700;
		color: #ffd700;
		letter-spacing: 0.08em;
		margin: 1.25rem 0 0.5rem;
		border-bottom: 1px solid #333;
		padding-bottom: 0.25rem;
	}

	.rules-section {
		display: flex;
		flex-direction: column;
		gap: 0.6rem;
		p { margin: 0; }
	}

	.rules-row {
		display: flex;
		align-items: center;
		gap: 0.75rem;
	}

	.rules-label-inline {
		font-weight: 700;
		color: #ffffff;
	}

	.rules-desc {
		color: #cccccc;
		font-size: 0.82rem;
		flex: 1;
	}

	.multiplier-icon {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 44px;
		height: 44px;
		flex-shrink: 0;
		border-radius: 50%;
		background: radial-gradient(circle, rgba(255,215,0,0.35) 0%, rgba(255,215,0,0.05) 70%);
		border: 2px solid rgba(255,215,0,0.4);
		font-weight: 900;
		font-size: 1.3rem;
		color: #ffd700;
	}

	.rules-info {
		background: rgba(255,255,255,0.05);
		border-radius: 6px;
		padding: 0.75rem;
		gap: 0.4rem;
	}

	.rules-info-row {
		display: flex;
		justify-content: space-between;
		font-size: 0.8rem;
		span:first-child { color: #aaaaaa; }
		span:last-child { color: #ffffff; font-weight: 600; }
	}

	.rules-disclaimer {
		margin-top: 1.25rem;
		padding: 0.75rem;
		border: 1px solid #444;
		border-radius: 6px;
		background: rgba(0,0,0,0.3);
		font-size: 0.75rem;
		color: #888;
		line-height: 1.6;
		p { margin: 0; }
	}

	.rules-version {
		margin-top: 1rem;
		text-align: center;
		opacity: 0.5;
	}
</style>
