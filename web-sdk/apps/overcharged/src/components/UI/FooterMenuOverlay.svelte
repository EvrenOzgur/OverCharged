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
	import { stateBet, stateBetDerived, stateConfig, stateModal } from 'state-shared';
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
	// Jurisdiction requirement: the Bonus Buy feature must not be offered at
	// all in social-casino builds (nor where the RGS otherwise disables it) —
	// matching the retired Pixi ButtonBuyBonus.svelte's `hidden` check.
	const hideBonusBuy = $derived(
		stateConfig.jurisdiction?.disabledBuyFeature || stateConfig.jurisdiction?.socialCasino,
	);
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

	// TEST/MODE toggle: flips stateGame.skipExplosions. When ON, every spin
	// auto-skips the symbol explosion animations + the green L2 explosion burst
	// so the final board is reached fast (see TumbleBoard / Board handlers).
	const skipExplosions = $derived(context.stateGame.skipExplosions);
	const onToggleMode = () => {
		context.eventEmitter.broadcast({ type: 'soundPressGeneral' });
		context.stateGame.skipExplosions = !context.stateGame.skipExplosions;
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

	// Final confirm: mirrors the SDK's ModalBuyBonusConfirm — switch to the BONUS
	// buy mode and place the (100×) bet that enters the feature directly.
	const onBonusConfirm = () => {
		stateBet.activeBetModeKey = 'BONUS';
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

	<!-- TEST/MODE toggle — standalone DOM button (asset-free). Skips explosion
	     animations every spin so QA can reach the result fast. -->
	<button
		class="mode-toggle"
		class:active={skipExplosions}
		onclick={onToggleMode}
		title="Patlama animasyonlarını atla (test modu)"
	>
		MODE{skipExplosions ? ' ●' : ''}
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
		overflow: hidden;
	}

	/* TEST/MODE toggle: re-enables pointer events on itself (root is click-through).
	   Anchored top-left of the game area, out of the way of the footer chrome. */
	.mode-toggle {
		position: absolute;
		top: 8px;
		left: 8px;
		pointer-events: auto;
		padding: 4px 10px;
		font:
			700 12px/1 system-ui,
			sans-serif;
		letter-spacing: 0.5px;
		color: #cde6d2;
		background: rgba(0, 0, 0, 0.55);
		border: 1px solid rgba(0, 255, 0, 0.35);
		border-radius: 6px;
		cursor: pointer;
		user-select: none;
		outline: none;
	}

	.mode-toggle:hover {
		border-color: rgba(0, 255, 0, 0.7);
	}

	.mode-toggle.active {
		color: #0a0a0a;
		background: #00d23a;
		border-color: #00ff00;
		box-shadow: 0 0 8px rgba(0, 255, 0, 0.6);
	}
</style>
