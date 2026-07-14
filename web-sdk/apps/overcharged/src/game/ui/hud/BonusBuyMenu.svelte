<script lang="ts">
    /*
     * Bonus-buy flow using the BonusBuyPage card art.
     *   Stage 1 (select)  → card_small + BUY  (opens from the footer bonus button)
     *   Stage 2 (confirm) → card_big   + BUY  (final confirmation)
     * Confirm calls onConfirm(), which performs the real purchase
     * (activeBetModeKey = BONUS + broadcast 'bet') in FooterMenuOverlay.
     */
    import { fade, scale } from "svelte/transition";
    import { cubicIn, cubicOut } from "svelte/easing";
    import { stateBet, stateConfig, stateMeta } from "state-shared";
    import { numberToCurrencyString } from "utils-shared/amount";
    import { uiStore } from "../../../shared/stores/uiStore.svelte";
    import { eventEmitter } from "../../eventEmitter";
    import { s } from "../../../shared/utils/social";

    interface Props {
        onClose: () => void;
        onConfirm: () => void;
    }
    let { onClose, onConfirm }: Props = $props();

    let stage = $state<"select" | "confirm">("select");

    const BONUS_KEY = "BONUS";
    const VOLATILITY = 3; // medium, per math config
    const assetPath = "./assets/BonusBuyPage";

    const mode = $derived(stateMeta.betModeMeta?.[BONUS_KEY]);
    const costMultiplier = $derived(mode?.costMultiplier ?? 100);
    const totalCost = $derived(stateBet.betAmount * costMultiplier);
    const costText = $derived(numberToCurrencyString(totalCost));
    const title = $derived(mode?.text?.title || "BONUS");

    // Affordability gate: the bonus buy debits bet × costMultiplier (100×) in a
    // single play. The shared isBetCostAvailable() only sees the BASE (1×) cost
    // while this menu is open (activeBetModeKey is still BASE), so the buy must
    // check the full cost itself — otherwise the RGS rejects the play with
    // ERR_IPB and the player just gets a generic error modal.
    const affordable = $derived(totalCost <= stateBet.balanceAmount);

    // Social-casino (stake.us) builds must not show "BUY" — the card art has
    // dedicated btn_play_* assets for this, alongside the real-money btn_buy_*.
    const buyBtnPrefix = $derived(stateConfig.jurisdiction?.socialCasino ? "btn_play" : "btn_buy");

    let resVal = $derived(uiStore.currentResolution.value);
    let scaleFactor = $derived.by(() => {
        switch (resVal) {
            case "desktop": return 1.0;
            case "laptop": return 0.9;
            case "popoutL": return 0.75;
            // popoutS is a tiny 400×225 viewport; the "confirm" card (341×473)
            // is taller than that even at 0.5x (236px), so it overflowed the
            // bottom. 0.4x keeps the tallest card (~189px) comfortably inside.
            case "popoutS": return 0.4;
            case "mobileL": return 1.0;
            case "mobileM": return 0.9;
            case "mobileS": return 0.8;
            default: return 1.0;
        }
    });

    function handleSelectBuy() {
        if (!affordable) return;
        eventEmitter.broadcast({ type: "soundPressGeneral" });
        stage = "confirm";
    }
    function handleConfirmBuy() {
        if (!affordable) return;
        onConfirm();
        onClose();
    }
</script>

<div
    class="bb-backdrop"
    onclick={onClose}
    transition:fade={{ duration: 150 }}
    role="button"
    tabindex="0"
    onkeydown={(e) => e.key === "Escape" && onClose()}
>
    <!-- Resolution scale lives on the stage so it never conflicts with the
         card's own scale transition. -->
    <div class="bb-stage" style="transform: scale({scaleFactor});">
    {#key stage}
        <div
            class="bb-card {stage}"
            in:scale={{ delay: 200, duration: 240, start: 0.6, opacity: 0, easing: cubicOut }}
            out:scale={{ duration: 200, start: 0.6, opacity: 0, easing: cubicIn }}
            role="dialog"
            aria-modal="true"
            onclick={(e) => e.stopPropagation()}
        >
            <img
                class="bb-bg"
                src="{assetPath}/{stage === 'select' ? 'card_small' : 'card_big'}.png"
                alt="Bonus"
            />

            <div class="bb-content">
                <h2 class="bb-title">{title}</h2>

                <div class="bb-volatility">
                    <img src="{assetPath}/volatility{VOLATILITY}.png" alt="volatility" />
                </div>

                {#if stage === "select"}
                    <p class="bb-line">7+ free spins</p>
                    <span class="bb-cost">{costText}</span>
                {:else}
                    <p class="bb-line">This will cost</p>
                    <span class="bb-cost">{costText}</span>
                    <p class="bb-line">from your balance</p>
                {/if}

                {#if !affordable}
                    <p class="bb-line bb-insufficient">Insufficient balance</p>
                {/if}

                <button
                    class="bb-buy"
                    disabled={!affordable}
                    onclick={stage === "select" ? handleSelectBuy : handleConfirmBuy}
                >
                    <img
                        src="{assetPath}/{buyBtnPrefix}_{stage === 'select' ? 'small' : 'big'}.png"
                        alt={s("Buy", "Play")}
                    />
                </button>
            </div>
        </div>
    {/key}
    </div>
</div>

<style>
    .bb-backdrop {
        position: fixed;
        inset: 0;
        z-index: 9999;
        background: rgba(0, 0, 0, 0.7);
        backdrop-filter: blur(6px);
        -webkit-backdrop-filter: blur(6px);
        cursor: default;
    }

    /* Full-screen centering layer; carries the resolution scale so it never
       collides with the card's own scale transition. */
    .bb-stage {
        position: absolute;
        inset: 0;
        transform-origin: center;
        pointer-events: none;
    }

    .bb-card {
        position: absolute;
        inset: 0;
        margin: auto; /* centers the fixed-size card without using transform */
        pointer-events: auto;
    }
    .bb-card.select {
        width: 284px;
        height: 363px;
    }
    .bb-card.confirm {
        width: 341px;
        height: 473px;
    }

    .bb-bg {
        position: absolute;
        inset: 0;
        width: 100%;
        height: 100%;
        display: block;
        filter: drop-shadow(0 20px 50px rgba(0, 0, 0, 0.6));
    }

    /* Content sits over the white lower area of the card. */
    .bb-content {
        position: absolute;
        left: 0;
        right: 0;
        top: 40%;
        bottom: 4%;
        z-index: 1;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: space-between;
        padding: 4% 10% 0;
        box-sizing: border-box;
        text-align: center;
    }

    .bb-title {
        margin: 0;
        font-family: 'ranchers', sans-serif;
        font-size: 26px;
        letter-spacing: 1px;
        color: #1b1b1b;
        line-height: 1;
    }

    .bb-line {
        margin: 0;
        font-family: 'ranchers', sans-serif;
        font-size: 18px;
        line-height: 1.1;
        color: #1b1b1b;
    }

    .bb-volatility {
        display: flex;
        flex-direction: column;
        align-items: center;
    }
    .bb-volatility img {
        width: 111px;
        height: 25px;
        display: block;
    }

    .bb-cost {
        font-family: 'ranchers', sans-serif;
        font-size: 26px;
        color: #1b1b1b;
        line-height: 1;
    }

    .bb-buy {
        background: none;
        border: none;
        padding: 0;
        cursor: pointer;
        width: 90%;
        display: flex;
        justify-content: center;
        transition: transform 0.1s;
    }
    .bb-buy:hover {
        transform: scale(1.04);
    }
    .bb-buy:active {
        transform: scale(0.97);
    }
    .bb-buy:disabled {
        filter: grayscale(0.9) brightness(0.7);
        cursor: not-allowed;
    }
    .bb-buy:disabled:hover,
    .bb-buy:disabled:active {
        transform: none;
    }

    .bb-insufficient {
        color: #c0392b;
        font-weight: bold;
    }
    .bb-buy img {
        width: 100%;
        height: auto;
        display: block;
    }
</style>
