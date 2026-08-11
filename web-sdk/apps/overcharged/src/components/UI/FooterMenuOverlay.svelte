<script lang="ts">
	/*
	 * DOM-overlay adapter for the FooterMenuPackage.
	 *
	 * The package's FooterMenu is a presentational component driven entirely by
	 * props + callbacks. This wrapper is the single integration point that feeds
	 * it the live SDK bet state and routes its actions to the engine and the
	 * existing SDK HTML modals (settings / autoSpin / buyBonus). It replaces the
	 * old Pixi `OverchargedUI` footer.
	 */
	import { onMount } from 'svelte';
	import { stateBet, stateBetDerived, stateConfig, stateMeta, stateModal } from 'state-shared';
	import { bookEventAmountToNormalisedAmount } from 'utils-shared/amount';

	import { getContext } from '../../game/context';
	import { bettingState } from '../../game/logic/BettingState.svelte';
	import { uiStore } from '../../shared/stores/uiStore.svelte';
	import { RESOLUTION_PRESETS, type ResolutionPreset } from '../../shared/utils/resolutions';
	import FooterMenu from '../../game/ui/hud/FooterMenu.svelte';
	import OptionsMenu from '../../game/ui/hud/OptionsMenu.svelte';
	import AutoSpinMenu from '../../game/ui/hud/AutoSpinMenu.svelte';
	import BonusBuyMenu from '../../game/ui/hud/BonusBuyMenu.svelte';

	const context = getContext();

	// Footer chrome opens the package's own DOM overlays (menu hub, autoplay
	// picker, bonus-buy cards) instead of the SDK modals.
	let menuOpen = $state(false);
	let autoMenuOpen = $state(false);
	let bonusMenuOpen = $state(false);

	// The footer is a DOM overlay, but the game lives inside the Pixi <canvas>,
	// which is NOT always at the window's top-left (Storybook/editor stories place
	// it inside a flex/offset container). Anchor the overlay to the canvas element's
	// real on-screen box so the footer tracks the game area in every context.
	let box = $state({ left: 0, top: 0, width: 0, height: 0 });

	const findCanvas = (): HTMLCanvasElement | null =>
		(context.stateApp?.pixiApplication?.canvas as HTMLCanvasElement | undefined) ??
		document.querySelector('canvas');

	onMount(() => {
		const measure = () => {
			const el = findCanvas();
			if (!el) return;
			const r = el.getBoundingClientRect();
			if (r.left !== box.left || r.top !== box.top || r.width !== box.width || r.height !== box.height) {
				box = { left: r.left, top: r.top, width: r.width, height: r.height };
			}
		};
		measure();
		// Re-measure on size changes (canvas + layout) and viewport scroll.
		const ro = new ResizeObserver(measure);
		const el = findCanvas();
		if (el) ro.observe(el);
		ro.observe(document.body);
		window.addEventListener('resize', measure);
		window.addEventListener('scroll', measure, true);
		return () => {
			ro.disconnect();
			window.removeEventListener('resize', measure);
			window.removeEventListener('scroll', measure, true);
		};
	});

	const byValue = (value: string) =>
		RESOLUTION_PRESETS.find((p) => p.value === value) ?? RESOLUTION_PRESETS[0];

	const pickPreset = (w: number, h: number): ResolutionPreset => {
		const exact = RESOLUTION_PRESETS.find((p) => p.width === w && p.height === h);
		if (exact) return exact;
		// Classify by the on-screen canvas size (mirrors resolutions.ts).
		if (h >= w) {
			if (w <= 360) return byValue('mobileS');
			if (w <= 390) return byValue('mobileM');
			return byValue('mobileL');
		}
		if (h <= 400 || w <= 500) return byValue('popoutS');
		if (w <= 800 || h <= 500) return byValue('popoutL');
		if (w <= 1100 || h <= 650) return byValue('laptop');
		return byValue('desktop');
	};

	// Drive the footer's own scale/orientation off the visible canvas box.
	$effect(() => {
		if (box.width > 0) uiStore.setResolution(pickPreset(box.width, box.height));
	});

	const balance = $derived(stateBet.balanceAmount);
	// HUD bet readout must always show the real per-spin base bet, not the
	// total charge — during bonus-buy that total is 100x+ the base bet.
	const currentBet = $derived(stateBet.betAmount);
	const lastWinAmount = $derived(bookEventAmountToNormalisedAmount(stateBet.winBookEventAmount));
	const disabled = $derived(!stateBetDerived.isBetCostAvailable());
	// Bet +/- and the play button (for a manual single spin) are disabled while
	// a round is in flight; the play button stays live during autoplay so it can
	// still act as the Stop button (see FooterMenu.svelte's play-btn disabled expr).
	const isIdle = $derived(context.stateXstateDerived.isIdle());
	// Only the RGS-driven `disabledBuyFeature` flag actually gates the feature.
	// social-casino builds keep the button — BonusBuyMenu.svelte already swaps
	// in the compliant btn_play_* art + play-safe copy for that case (see its
	// buyBtnPrefix / s() usage) instead of hiding the entry point entirely.
	const hideBonusBuy = $derived(Boolean(stateConfig.jurisdiction?.disabledBuyFeature));
	const turboLevel = $derived(stateBet.isTurbo ? 1 : 0);

	const onIncrease = () => {
		if (!context.stateXstateDerived.isIdle()) return;
		context.eventEmitter.broadcast({ type: 'soundPressStep' });
		bettingState.increaseBet();
	};

	const onDecrease = () => {
		if (!context.stateXstateDerived.isIdle()) return;
		context.eventEmitter.broadcast({ type: 'soundPressStepDown' });
		bettingState.decreaseBet();
	};

	// Skip-to-result: keep broadcasting `skipAnimation` every frame until the
	// round returns to idle, so every animation/wait fast-forwards to the final
	// outcome in one click (reuses each component's existing skip handler).
	let pumping = false;
	const skipToResult = () => {
		if (pumping) return;
		pumping = true;
		let frames = 0;
		const tick = () => {
			if (!pumping) return;
			// Safety cap (~10s at 60fps) guards against a round that never idles.
			if (context.stateXstateDerived.isIdle() || frames++ > 600) {
				pumping = false;
				return;
			}
			context.eventEmitter.broadcast({ type: 'skipAnimation' });
			requestAnimationFrame(tick);
		};
		requestAnimationFrame(tick);
	};

	// idle → place bet; mid-round → fast-forward to the result (and cancel any
	// running autoplay loop). Space stays one-step (handled in Game.svelte).
	const onBet = () => {
		context.eventEmitter.broadcast({ type: 'soundPressBet' });
		if (context.stateXstateDerived.isIdle()) {
			context.eventEmitter.broadcast({ type: 'bet' });
		} else {
			if (stateBetDerived.hasAutoBetCounter()) stateBet.autoSpinsCounter = 0;
			context.eventEmitter.broadcast({ type: 'stopButtonClick' });
			skipToResult();
		}
	};

	const onToggleTurbo = () => {
		context.eventEmitter.broadcast({ type: 'soundPressGeneral' });
		stateBetDerived.updateIsTurbo(!stateBet.isTurbo, { persistent: true });
	};

	// OVERCHARGED MODE — persistent ante-bet toggle (math bet mode "ante",
	// type: 'activate' in betModes.ts). Costs 1.25x the base stake per spin
	// in exchange for a ~2x natural Free Spins trigger rate. Stays active
	// across spins (including autoplay) until the player toggles it off —
	// mirrors onToggleTurbo's persistent on/off pattern, not a one-shot buy
	// like BONUS. Gated to idle only: it changes the RGS bet cost, so it
	// must not be switched mid-round (unlike Turbo, which is purely a
	// client-side animation-speed flag and safe to flip anytime).
	const overchargedModeActive = $derived(stateBet.activeBetModeKey === 'ANTE');
	const overchargedModeCost = $derived(stateMeta.betModeMeta?.ANTE?.costMultiplier ?? 1.25);
	const onToggleOverchargedMode = () => {
		if (!isIdle) return;
		context.eventEmitter.broadcast({ type: 'soundPressGeneral' });
		stateBet.activeBetModeKey = overchargedModeActive ? 'BASE' : 'ANTE';
	};

	// Menu → OptionsMenu hub (Info + Sound). Autoplay → AutoSpinMenu picker.
	// Bonus → BonusBuyMenu cards (select → confirm).
	const onMenu = () => {
		context.eventEmitter.broadcast({ type: 'soundPressGeneral' });
		menuOpen = true;
	};
	const onAutoSpinMenu = () => {
		context.eventEmitter.broadcast({ type: 'soundPressGeneral' });
		autoMenuOpen = true;
	};
	const onBonusBuy = () => {
		context.eventEmitter.broadcast({ type: 'soundPressGeneral' });
		bonusMenuOpen = true;
	};

	// Final confirm: mirrors the SDK's ModalBuyBonusConfirm — switch to whichever
	// Bonus Buy tier the player selected in BonusBuyMenu (BONUS / SUPER /
	// MULTIPLIER) and place the bet that enters that feature directly.
	const onBonusConfirm = (tierKey: string) => {
		stateBet.activeBetModeKey = tierKey;
		context.eventEmitter.broadcast({ type: 'soundPressGeneral' });
		context.eventEmitter.broadcast({ type: 'bet' });
	};

	// OptionsMenu "Info" opens the rich game-rules modal (HOW TO PLAY + PAYTABLE +
	// special symbols + free spins); "Settings" opens the sound settings modal.
	const onMenuInfo = () => {
		context.eventEmitter.broadcast({ type: 'soundPressGeneral' });
		stateModal.modal = { name: 'gameRules' };
	};
	const onMenuSettings = () => {
		context.eventEmitter.broadcast({ type: 'soundPressGeneral' });
		stateModal.modal = { name: 'settings' };
	};

	// AutoSpinMenu's START: the counter/limits are set by autoSpinStore.start();
	// here we kick off the real loop exactly like the SDK's AutoSpinsStartButton.
	const onAutoBetStart = () => {
		if (stateBetDerived.activeBetMode()?.type === 'buy') stateBet.activeBetModeKey = 'BASE';
		context.eventEmitter.broadcast({ type: 'soundPressGeneral' });
		context.eventEmitter.broadcast({ type: 'autoBet' });
	};
</script>

<!-- Click-through layer aligned to the on-screen Pixi canvas box, so the footer's
     `position:absolute; bottom` anchors to the game area bottom wherever the canvas
     sits. Only the footer's own hitboxes re-enable pointer events. -->
<div
	class="footer-overlay-root"
	style="left: {box.left}px; top: {box.top}px; width: {box.width}px; height: {box.height}px;"
>
	<FooterMenu
		{balance}
		{currentBet}
		{lastWinAmount}
		{disabled}
		{isIdle}
		{hideBonusBuy}
		{turboLevel}
		{onIncrease}
		{onDecrease}
		{onBet}
		{onToggleTurbo}
		{onMenu}
		{onAutoSpinMenu}
		{onBonusBuy}
	/>

	<!-- OVERCHARGED MODE — persistent ante-bet toggle. Standalone DOM button
	     (asset-free, same corner slot the old debug MODE toggle used to sit
	     in) since FooterMenu is a fixed-prop package component with no free
	     button slot of its own. -->
	<button
		class="overcharged-mode-toggle"
		class:active={overchargedModeActive}
		disabled={!isIdle}
		onclick={onToggleOverchargedMode}
		title="{overchargedModeCost}x bet — ~2x Free Spins trigger chance. Stays active until you turn it off."
	>
		⚡ OVERCHARGED{overchargedModeActive ? ' ●' : ''}
	</button>
</div>

{#if menuOpen}
	<OptionsMenu
		onClose={() => (menuOpen = false)}
		onInfo={onMenuInfo}
		onSettings={onMenuSettings}
	/>
{/if}

{#if autoMenuOpen}
	<AutoSpinMenu onClose={() => (autoMenuOpen = false)} onBet={onAutoBetStart} />
{/if}

{#if bonusMenuOpen}
	<BonusBuyMenu onClose={() => (bonusMenuOpen = false)} onConfirm={onBonusConfirm} />
{/if}

<style>
	.footer-overlay-root {
		position: fixed;
		pointer-events: none;
		z-index: 50;
		/* Was `overflow: hidden`. This box is sized to the MEASURED canvas rect
		   (see `box` above), but FooterMenu's portrait layout uses a fixed-px
		   design (.portrait-ui { width: 400px }, per-preset --scale) that isn't
		   derived from that same measurement — on some real device/embed sizes
		   (observed: a narrow-tall preview reporting ~415×812) the rendered
		   footer ends up a few px taller than the measured box, and `hidden`
		   was silently deleting the bottom row (BALANCE/BET) instead of just
		   trimming stray overflow. `visible` still renders at the same
		   position — since this box already sits at the canvas's true edges,
		   the worst case is a few px bleeding past the ideal box, which stays
		   on-screen instead of disappearing. No effect where content already
		   fit inside the box (desktop/landscape/mobileM/mobileS). */
		overflow: visible;
	}

	/* OVERCHARGED MODE toggle: re-enables pointer events on itself (root is
	   click-through). Anchored top-left of the game area, out of the way of
	   the footer chrome. */
	.overcharged-mode-toggle {
		position: absolute;
		top: 8px;
		left: 8px;
		pointer-events: auto;
		padding: 5px 12px;
		font:
			700 12px/1 system-ui,
			sans-serif;
		letter-spacing: 0.5px;
		color: #d9e6cd;
		background: rgba(0, 0, 0, 0.55);
		border: 1px solid rgba(180, 255, 60, 0.4);
		border-radius: 6px;
		cursor: pointer;
		user-select: none;
		outline: none;
		transition:
			background 0.15s,
			border-color 0.15s,
			box-shadow 0.15s;
	}

	.overcharged-mode-toggle:hover:not(:disabled) {
		border-color: rgba(180, 255, 60, 0.8);
	}

	.overcharged-mode-toggle:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.overcharged-mode-toggle.active {
		color: #0a0a0a;
		background: linear-gradient(135deg, #b4ff3c, #39ff14);
		border-color: #b4ff3c;
		box-shadow: 0 0 10px rgba(180, 255, 60, 0.7);
	}
</style>
