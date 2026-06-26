<script lang="ts">
	import type { Snippet } from 'svelte';

	import { Popup } from 'components-shared';
	import { zIndex } from 'constants-shared/zIndex';
	import { stateModal, stateUrlDerived } from 'state-shared';

	type Props = {
		children: Snippet;
	};

	const props: Props = $props();

	// Stake.US (social casino) compliance: certain words are restricted.
	// "bet" → "stake", "BET" → "SPIN" (UI), "BUY BONUS" → hidden anyway, etc.
	// Selected by ?social=true URL param (mirrored to stateUrlDerived.social).
	const isSocial = $derived(stateUrlDerived.social());
	// Cluster-pay multiplier wording. "× bet" implies wagering — use "× stake"
	// in social mode (Stake's own brand, considered non-bet wording).
	const xUnit = $derived(isSocial ? 'stake' : 'bet');
	const XUnit = $derived(isSocial ? 'STAKE' : 'BET');

	// OverCharged symbols are drawn straight from the game's own Spine texture
	// atlases (the demo `symbolsStatic` sheet was the Stake template's gems).
	// Each symbol is composed in a 512×512 logical cell from one or more atlas
	// regions, positioned by the region's atlas `offsets`. High symbols + Wild +
	// Scatter are single regions; low symbols (potion bottles) layer the colored
	// liquid + rim over the shared glass body. Relative URLs — Stake serves the
	// game under a subpath, so absolute `/...` would 404 (see stake_engine_setup).
	const ICON_H = 60;
	const CELL = 512;

	type Sheet = { url: string; w: number; h: number };
	const SHEETS: Record<string, Sheet> = {
		high:    { url: './OverChargedAssets/high_symbols/high-symbols.png',       w: 1932, h: 1539 },
		low:     { url: './OverChargedAssets/low_symbols/low-symbols.png',         w: 1948, h: 1238 },
		special: { url: './OverChargedAssets/special_symbols/special-symbols.png', w: 1944, h: 1915 },
		mult:    { url: './multipliers/mutlipliers.png',                           w: 1960, h: 1328 },
	};

	type Layer = { sheet: string; x: number; y: number; w: number; h: number; ox: number; oy: number };

	// Back-to-front layer order per symbol (first entry renders behind).
	const SYMBOLS: Record<string, Layer[]> = {
		H1: [{ sheet: 'high', x: 386, y: 237,  w: 345, h: 371, ox: 86,  oy: 61 }],
		H2: [{ sheet: 'high', x: 503, y: 1195, w: 306, h: 342, ox: 109, oy: 80 }],
		H3: [{ sheet: 'high', x: 733, y: 380,  w: 294, h: 348, ox: 107, oy: 74 }],
		H4: [{ sheet: 'high', x: 2,   y: 236,  w: 382, h: 372, ox: 63,  oy: 73 }],
		// Low potions: liquid (X-inner) + rim (X-top) behind the shared glass body.
		L1: [ // yellow
			{ sheet: 'low', x: 611, y: 66,  w: 201, h: 134, ox: 147, oy: 123 },
			{ sheet: 'low', x: 611, y: 23,  w: 197, h: 41,  ox: 149, oy: 232 },
			{ sheet: 'low', x: 291, y: 468, w: 235, h: 283, ox: 140, oy: 117 },
		],
		L2: [ // green
			{ sheet: 'low', x: 205, y: 45,  w: 201, h: 134, ox: 147, oy: 123 },
			{ sheet: 'low', x: 201, y: 2,   w: 197, h: 41,  ox: 149, oy: 232 },
			{ sheet: 'low', x: 291, y: 468, w: 235, h: 283, ox: 140, oy: 117 },
		],
		L3: [ // blue
			{ sheet: 'low', x: 2,   y: 47,  w: 201, h: 134, ox: 147, oy: 123 },
			{ sheet: 'low', x: 2,   y: 4,   w: 197, h: 41,  ox: 149, oy: 232 },
			{ sheet: 'low', x: 291, y: 468, w: 235, h: 283, ox: 140, oy: 117 },
		],
		L4: [ // red
			{ sheet: 'low', x: 408, y: 45,  w: 201, h: 134, ox: 147, oy: 123 },
			{ sheet: 'low', x: 400, y: 2,   w: 197, h: 41,  ox: 149, oy: 232 },
			{ sheet: 'low', x: 291, y: 468, w: 235, h: 283, ox: 140, oy: 117 },
		],
		W: [{ sheet: 'special', x: 920, y: 1176, w: 335, h: 382, ox: 90, oy: 55 }],
		// Scatter = red glow + red burst behind the lamp (matches the in-game symbol).
		S: [
			{ sheet: 'special', x: 503, y: 1549, w: 383, h: 364, ox: 65,  oy: 82 },  // scatter-glow
			{ sheet: 'special', x: 503, y: 1209, w: 415, h: 338, ox: 44,  oy: 100 }, // scatter-red-effect
			{ sheet: 'special', x: 888, y: 1605, w: 271, h: 308, ox: 137, oy: 79 },  // scatter-lamp
		],
		// Multiplier = gold coin + value text (the in-game 2x coin).
		M: [
			{ sheet: 'mult', x: 2,    y: 271, w: 494, h: 485, ox: 12, oy: 14 },  // coinFrontnew
			{ sheet: 'mult', x: 1192, y: 538, w: 329, h: 307, ox: 98, oy: 106 }, // 2x value
		],
	};

	function layerStyle(l: Layer, size: number): string {
		const s = size / CELL;
		const sh = SHEETS[l.sheet];
		// Spine/libgdx atlas offsets are bottom-left origin (y-up); CSS is top-down,
		// so convert the vertical offset: top = originalHeight - offsetY - height.
		const top = CELL - l.oy - l.h;
		return [
			`position:absolute`,
			`left:${(l.ox * s).toFixed(2)}px`,
			`top:${(top * s).toFixed(2)}px`,
			`width:${(l.w * s).toFixed(2)}px`,
			`height:${(l.h * s).toFixed(2)}px`,
			`background-image:url(${sh.url})`,
			`background-size:${(sh.w * s).toFixed(2)}px ${(sh.h * s).toFixed(2)}px`,
			`background-position:-${(l.x * s).toFixed(2)}px -${(l.y * s).toFixed(2)}px`,
			`background-repeat:no-repeat`,
		].join(';');
	}
</script>

{#snippet sym(key: string, size: number)}
	<span class="sym-cell" style="width:{size}px;height:{size}px;">
		{#each SYMBOLS[key] ?? [] as l}
			<span style={layerStyle(l, size)}></span>
		{/each}
	</span>
{/snippet}

{#if stateModal.modal?.name === 'gameRules'}
	<Popup zIndex={zIndex.modal} onclose={() => (stateModal.modal = null)}>
		<div class="rules-content">
			<h2 class="rules-title">OVERCHARGED</h2>
			<h3 class="rules-subtitle">HOW TO PLAY</h3>

			<section class="rules-section">
				<p>Spin an 8×8 grid. Win by landing <strong>5 or more matching symbols</strong> connected horizontally or vertically (Cluster Pays). Winning symbols are removed and new symbols fall from above — cascades continue until no new wins occur.</p>
			</section>

			<h3 class="rules-subtitle">PAYTABLE (× {XUnit})</h3>
			<section class="rules-section rules-info">
				<div class="paytable-header">
					<span class="paytable-sym">Symbol</span>
					<span>5</span>
					<span>6-8</span>
					<span>9-12</span>
					<span>13+</span>
				</div>
				<div class="paytable-row"><span class="paytable-sym">{@render sym('H1', ICON_H)}</span><span>2.5×</span><span>6.3×</span><span>10×</span><span>24×</span></div>
				<div class="paytable-row"><span class="paytable-sym">{@render sym('H2', ICON_H)}</span><span>1.0×</span><span>2.5×</span><span>4×</span><span>16×</span></div>
				<div class="paytable-row"><span class="paytable-sym">{@render sym('H3', ICON_H)}</span><span>0.7×</span><span>1.6×</span><span>2.8×</span><span>12×</span></div>
				<div class="paytable-row"><span class="paytable-sym">{@render sym('H4', ICON_H)}</span><span>0.5×</span><span>1.3×</span><span>2.4×</span><span>8×</span></div>
				<div class="paytable-row"><span class="paytable-sym">{@render sym('L1', ICON_H)}</span><span>0.3×</span><span>0.8×</span><span>2.0×</span><span>5×</span></div>
				<div class="paytable-row"><span class="paytable-sym">{@render sym('L2', ICON_H)}</span><span>0.2×</span><span>0.6×</span><span>1.8×</span><span>4×</span></div>
				<div class="paytable-row"><span class="paytable-sym">{@render sym('L3', ICON_H)}</span><span>0.1×</span><span>0.4×</span><span>1.3×</span><span>2.5×</span></div>
				<div class="paytable-row"><span class="paytable-sym">{@render sym('L4', ICON_H)}</span><span>0.1×</span><span>0.3×</span><span>0.8×</span><span>2.0×</span></div>
			</section>

			<h3 class="rules-subtitle">SPECIAL SYMBOLS</h3>
			<section class="rules-section">
				<div class="rules-row">
					{@render sym('W', ICON_H)}
					<span class="rules-desc"><strong class="rules-label-inline">WILD</strong> — Substitutes for all regular symbols (excluding Scatter and Multiplier).</span>
				</div>
				<div class="rules-row">
					{@render sym('M', ICON_H)}
					<span class="rules-desc"><strong class="rules-label-inline">MULTIPLIER</strong> — Carries a value (×2, ×3, ×5, ×8). When part of a winning cluster, the value is added to the Global Multiplier. Does not form winning clusters on its own.</span>
				</div>
				<div class="rules-row">
					{@render sym('S', ICON_H)}
					<span class="rules-desc"><strong class="rules-label-inline">SCATTER</strong> — 3 or more Scatters anywhere on the grid trigger Free Spins.</span>
				</div>
			</section>

			<h3 class="rules-subtitle">FREE SPINS</h3>
			<section class="rules-section">
				<p>Free Spins are triggered when 3 or more Scatter symbols land anywhere on the grid in a single spin.</p>
				<div class="rules-info" style="margin-top:0.5rem">
					<div class="rules-info-row"><span>3 Scatters</span><span>+7 Free Spins</span></div>
					<div class="rules-info-row"><span>4 Scatters</span><span>+10 Free Spins</span></div>
					<div class="rules-info-row"><span>5 Scatters</span><span>+12 Free Spins</span></div>
					<div class="rules-info-row"><span>6 Scatters</span><span>+15 Free Spins</span></div>
					<div class="rules-info-row"><span>7 Scatters</span><span>+18 Free Spins</span></div>
					<div class="rules-info-row"><span>8+ Scatters</span><span>+20 Free Spins</span></div>
				</div>
				<p style="margin-top:0.6rem"><strong>Retrigger:</strong> Landing 3 or more Scatters during the Free Spin feature awards additional spins per the same table above. The Global Multiplier is retained throughout the entire feature (including retriggers).</p>
			</section>

			<h3 class="rules-subtitle">SKILL METERS</h3>
			<section class="rules-section">
				<p>Each spin fills one of four Skill Meters by symbols of the same colour landing in winning clusters. When a meter reaches its threshold the effect activates and the meter resets.</p>
				<div class="rules-row">
					{@render sym('L1', ICON_H)}
					<span class="rules-desc"><strong class="rules-label-inline" style="color:#ffd700">WILD STRIKE — fills at 10</strong>: Selected low-tier symbols on the grid are converted to Wild.</span>
				</div>
				<div class="rules-row">
					{@render sym('L2', ICON_H)}
					<span class="rules-desc"><strong class="rules-label-inline" style="color:#00cc44">OVERLOAD — fills at 16</strong>: All low-tier symbols on the grid explode, triggering an extra cascade.</span>
				</div>
				<div class="rules-row">
					{@render sym('L3', ICON_H)}
					<span class="rules-desc"><strong class="rules-label-inline" style="color:#4488ff">POWER SURGE — fills at 22</strong>: The Global Multiplier is increased by ×2.</span>
				</div>
				<div class="rules-row">
					{@render sym('L4', ICON_H)}
					<span class="rules-desc"><strong class="rules-label-inline" style="color:#ff4444">MEGA BOLT — fills at 25</strong>: A 3×3 block of symbols is converted to Wild.</span>
				</div>
			</section>

			<h3 class="rules-subtitle">GLOBAL MULTIPLIER</h3>
			<section class="rules-section">
				<p>The Global Multiplier starts at ×1 and increases through Multiplier (M) symbols landing in winning clusters and via the Power Surge skill. It is applied to all cluster wins in the same round. During the Free Spin feature the Global Multiplier carries across all spins (including retriggers) and continues to grow.</p>
			</section>

			<h3 class="rules-subtitle">GAME CONTROLS</h3>
			<section class="rules-section">
				<div class="rules-info">
					{#if isSocial}
						<div class="rules-info-row"><span><strong>SPIN</strong></span><span>Plays a single round at the selected stake amount. Spacebar also triggers SPIN.</span></div>
						<div class="rules-info-row"><span><strong>TURBO</strong></span><span>Toggle faster spin animations. State persists across rounds.</span></div>
						<div class="rules-info-row"><span><strong>AUTO SPIN</strong></span><span>Opens the autoplay configuration. Choose number of rounds, optional loss limit and single-win limit, then press START AUTOPLAY to begin. Click again during autoplay to stop.</span></div>
						<div class="rules-info-row"><span><strong>STAKE ± </strong></span><span>Decrease / increase the current stake amount through the available stake levels.</span></div>
						<div class="rules-info-row"><span><strong>MENU</strong></span><span>Opens the side drawer with INFO (this dialog), PAYTABLE, SETTINGS, SOUND ON/OFF, and EXIT.</span></div>
						<div class="rules-info-row"><span><strong>SETTINGS</strong></span><span>Adjust master volume, music, SFX, and turbo/quick spin preferences.</span></div>
						<div class="rules-info-row"><span><strong>SOUND ON/OFF</strong></span><span>Mute or unmute all game audio.</span></div>
						<div class="rules-info-row"><span><strong>SPACE (hold)</strong></span><span>Hold the spacebar to repeatedly spin until released (quick-spin mode).</span></div>
					{:else}
						<div class="rules-info-row"><span><strong>BET</strong></span><span>Place a single spin at the selected bet amount. Spacebar also triggers BET.</span></div>
						<div class="rules-info-row"><span><strong>TURBO</strong></span><span>Toggle faster spin animations. State persists across rounds.</span></div>
						<div class="rules-info-row"><span><strong>AUTO SPIN</strong></span><span>Opens the autoplay configuration. Choose number of rounds, optional loss limit and single-win limit, then press START AUTOPLAY to begin. Click again during autoplay to stop.</span></div>
						<div class="rules-info-row"><span><strong>BUY BONUS</strong></span><span>Opens the bonus purchase menu. Select a bonus mode and confirm in the dialog to enter the feature directly. Availability may be restricted by jurisdiction.</span></div>
						<div class="rules-info-row"><span><strong>BET ± </strong></span><span>Decrease / increase the current bet amount through the available bet levels.</span></div>
						<div class="rules-info-row"><span><strong>MENU</strong></span><span>Opens the side drawer with INFO (this dialog), PAYTABLE, SETTINGS, SOUND ON/OFF, and EXIT.</span></div>
						<div class="rules-info-row"><span><strong>SETTINGS</strong></span><span>Adjust master volume, music, SFX, and turbo/quick spin preferences.</span></div>
						<div class="rules-info-row"><span><strong>SOUND ON/OFF</strong></span><span>Mute or unmute all game audio.</span></div>
						<div class="rules-info-row"><span><strong>SPACE (hold)</strong></span><span>Hold the spacebar to repeatedly bet until released (quick-bet mode).</span></div>
					{/if}
				</div>
			</section>

			<h3 class="rules-subtitle">GAME MODES</h3>
			<section class="rules-section">
				{#if isSocial}
					<div class="mode-block">
						<strong>BASE</strong>
						<span class="rules-desc">Standard play. Cost: the player's selected stake amount. RTP 97.00%. Maximum win 5,000× stake.</span>
					</div>
					<!-- Bonus mode hidden entirely in social mode (ButtonBuyBonus is also hidden via jurisdiction.disabledBuyFeature). -->
				{:else}
					<div class="mode-block">
						<strong>BASE</strong>
						<span class="rules-desc">Standard play. Cost: the player's selected bet amount. RTP 97.00%. Maximum win 5,000× bet.</span>
					</div>
					<div class="mode-block">
						<strong>BUY BONUS</strong>
						<span class="rules-desc">Direct entry to the Free Spin feature. Cost: 200× the player's selected bet amount. RTP 97.00%. Maximum win 5,000× bet. Availability may be restricted by jurisdiction.</span>
					</div>
				{/if}
			</section>

			<h3 class="rules-subtitle">GAME INFORMATION</h3>
			<section class="rules-section rules-info">
				<div class="rules-info-row"><span>RTP (Base)</span><span>97.00%</span></div>
				{#if !isSocial}
					<div class="rules-info-row"><span>RTP (Buy Bonus)</span><span>97.00%</span></div>
				{/if}
				<div class="rules-info-row"><span>Maximum Win</span><span>5,000× {xUnit}</span></div>
				<div class="rules-info-row"><span>Maximum Win Hit Rate</span><span>1 in 500,000</span></div>
				<div class="rules-info-row"><span>Hit Rate of Non-Zero Wins</span><span>1 in 3.4</span></div>
				<div class="rules-info-row"><span>Reels</span><span>8 × 8 (Cluster Pays)</span></div>
				<div class="rules-info-row"><span>Minimum Win Cluster</span><span>5 connected symbols</span></div>
				<div class="rules-info-row"><span>Provider</span><span>Stake Engine</span></div>
			</section>

			<section class="rules-disclaimer">
				<p>Malfunction voids all wins and plays. A consistent internet connection is required. In the event of a disconnection, reload the game to finish any uncompleted rounds. The expected return is calculated over many plays. The game display is not representative of any physical device and is for illustrative purposes only. Winnings are settled according to the amount received from the Remote Game Server and not from events within the web browser. TM and © 2026 Stake Engine.</p>
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

	/* Composited symbol cell: layers are absolutely positioned inside. */
	.sym-cell {
		position: relative;
		display: inline-block;
		flex-shrink: 0;
		vertical-align: middle;
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

	.paytable-header,
	.paytable-row {
		display: grid;
		grid-template-columns: 72px repeat(4, 1fr);
		align-items: center;
		gap: 0.4rem;
		font-size: 0.78rem;
	}

	.paytable-header {
		color: #aaaaaa;
		font-weight: 600;
		border-bottom: 1px solid #333;
		padding-bottom: 0.35rem;
		margin-bottom: 0.1rem;
		span { text-align: center; }
	}

	.paytable-row {
		span { text-align: center; color: #ffffff; }
		.paytable-sym { display: flex; justify-content: center; }
	}

	.mode-block {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
		padding: 0.5rem 0.75rem;
		background: rgba(255, 255, 255, 0.04);
		border-left: 3px solid #ffd700;
		border-radius: 4px;
		strong { color: #ffd700; font-size: 0.9rem; letter-spacing: 0.06em; }
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
