<script lang="ts">
    import { uiStore } from "../../../shared/stores/uiStore.svelte";
    import { uiState } from "../../../shared/stores/uiStateStore.svelte";
    import { FormatWinAmount, FormatWinAmountPrecise } from "../../../shared/utils/currency";
    import { s } from "../../../shared/utils/social";
    import { bettingState } from "../../logic/BettingState.svelte";
    import "./FooterMenu.css";

    interface Props {
        balance?: number;
        currentBet?: number;
        lastWinAmount?: number;
        currency?: string;
        disabled?: boolean;
        isIdle?: boolean;
        hideBonusBuy?: boolean;
        turboLevel?: number;
        isAutoMenuOpen?: boolean;
        onIncrease?: () => void;
        onDecrease?: () => void;
        onBet?: () => void;
        onToggleTurbo?: () => void;
        onMenu?: () => void;
        onAutoSpinMenu?: () => void;
        onBonusBuy?: () => void;
    }

    let {
        balance = 0,
        currentBet = 0,
        lastWinAmount = 0,
        currency = "USD",
        disabled = false,
        isIdle = true,
        hideBonusBuy = false,
        turboLevel = 0,
        isAutoMenuOpen = false,
        onIncrease = () => {},
        onDecrease = () => {},
        onBet = () => {},
        onToggleTurbo = () => {},
        onMenu = () => {},
        onAutoSpinMenu = () => {},
        onBonusBuy = () => {},
    }: Props = $props();

    let resVal = $derived(uiStore.currentResolution.value);
    let isLandscape = $derived(
        ["desktop", "laptop", "popoutL", "popoutS"].includes(resVal),
    );

    let scale = $derived.by(() => {
        switch (resVal) {
            case "desktop":
                return 1.0;
            case "laptop":
                return 0.85;
            case "popoutL":
                return 0.67;
            case "popoutS":
                return 0.33;
            case "mobileL":
                return 1.0;
            case "mobileM":
                return 0.88;
            case "mobileS":
                return 0.75;
            default:
                return 1.0;
        }
    });

    // Ana kasanın aşağı itilmesi ve alt boşluk hesabı ekran boyutuna göre orantılanmalıdır.
    // Masaüstünde 10px olan boşluk, Popout ekranlarda çok büyük bir orana denk geldiği için
    // ekran küçüldükçe bu sabit boşluğu azaltarak "havada kalma" hissini yok ediyoruz.
    let bottomPadding = $derived.by(() => {
        if (!isLandscape) return 0; // Dikey ekranda tam dibe yapışır

        switch (resVal) {
            case "desktop":
                return 10; // Büyük ekranda 10px ideal
            case "laptop":
                return 5; // Laptop'ta hafif azaltıyoruz
            case "popoutL":
                return 5; // Popout'larda footer'ı biraz daha yukarı aldık
            case "popoutS":
                return 5;
            default:
                return 10;
        }
    });

    $effect(() => {
        console.log(
            `%c[FooterMenu] Yerleşim ayarlandı: Çözünürlük Preset = ${resVal} | Mod = ${isLandscape ? "Yatay (Landscape)" : "Dikey (Portrait)"} | Scale = ${scale}`,
            "color: #3b82f6; font-weight: bold;",
        );
    });

    import { autoSpinStore } from "../../../shared/stores/autoSpinStore.svelte";

    let hasActiveAnte = $derived(
        ["double_chance", "extra_chance", "extreme_hunt", "tornado_spin"].includes(bettingState.activeFeatureId)
    );

    let isAutoPlaying = $derived(autoSpinStore.isActive);
    let isTurbo = $derived(turboLevel > 0);
    let isFreeSpin = $derived(uiState.isBonusActive);

    // Asset paths (Kritik: Production'da base './' olduğu için asset yolları her zaman '.' ile başlamalıdır)
    const ASSET_DIR = "./assets/FooterMenu/Assets/";

    // State trackers for hover/active
    let menuHover = $state(false);
    let bonusHover = $state(false);
    let autoplayHover = $state(false);
    let playHover = $state(false);
    let turboHover = $state(false);
    let plusHover = $state(false);
    let plusPressed = $state(false);
    let minusHover = $state(false);
    let minusPressed = $state(false);

    let menuSrc = $derived(
        ASSET_DIR + (menuHover ? "btn_menu_hover.png" : "btn_menu_default.png"),
    );

    let bonusSrc = $derived(
        hasActiveAnte 
            ? ASSET_DIR + "btn_bonus_active.png"
            : ASSET_DIR + "btn_bonus_default.png",
    );

    let autoplaySrc = $derived(
        disabled
            ? ASSET_DIR + "btn_autoplay_disabled.png"
            : isAutoPlaying
              ? ASSET_DIR + "btn_autoplay_active.png"
              : autoplayHover
                ? ASSET_DIR + "btn_autoplay_hover.png"
                : ASSET_DIR + "btn_autoplay_default.png",
    );

    let playSrc = $derived(
        isAutoPlaying
            ? (playHover ? ASSET_DIR + "btn_play_stop_hover.png" : ASSET_DIR + "btn_play_stop.png")
            : disabled || !isIdle
              ? ASSET_DIR + "btn_play_disabled.png"
              : playHover
                ? ASSET_DIR + "btn_play_hover.png"
                : ASSET_DIR + "btn_play_default.png",
    );

    let turboSrc = $derived(
        isTurbo
            ? ASSET_DIR + "btn_turbo_active.png"
            : turboHover
            ? ASSET_DIR + "btn_turbo_hover.png"
            : ASSET_DIR + "btn_turbo_default.png",
    );

    let isMaxBet = $derived(
        bettingState.currentBetIndex >= bettingState.maxBet,
    ); // Needs actual limit check, simplify for now
    let plusSrc = $derived(
        disabled || !isIdle
            ? ASSET_DIR + "btn_plus_disabled.png"
            : plusPressed
              ? ASSET_DIR + "btn_plus_pressed.png"
              : plusHover
                ? ASSET_DIR + "btn_plus_hover.png"
                : ASSET_DIR + "btn_plus_default.png",
    );

    let minusSrc = $derived(
        disabled || !isIdle
            ? ASSET_DIR + "btn_minus_disabled.png"
            : minusPressed
              ? ASSET_DIR + "btn_minus_pressed.png"
              : minusHover
                ? ASSET_DIR + "btn_minus_hover.png"
                : ASSET_DIR + "btn_minus_default.png",
    );

    import { onMount } from "svelte";

    onMount(() => {
        // RGS ortamında hover gecikmesini önlemek için görselleri önbelleğe al (preload)
        const imagesToPreload = [
            "btn_menu_hover.png",
            "btn_bonus_active.png",
            "btn_autoplay_hover.png",
            "btn_autoplay_active.png",
            "btn_autoplay_disabled.png",
            "btn_play_default.png",
            "btn_play_hover.png",
            "btn_play_disabled.png",
            "btn_play_stop.png",
            "btn_play_stop_hover.png",
            "btn_turbo_default.png",
            "btn_turbo_hover.png",
            "btn_turbo_active.png",
            "btn_turbo_disabled.png",
            "btn_plus_hover.png",
            "btn_plus_pressed.png",
            "btn_plus_disabled.png",
            "btn_minus_hover.png",
            "btn_minus_pressed.png",
            "btn_minus_disabled.png",
        ];

        imagesToPreload.forEach((src) => {
            const img = new Image();
            img.src = ASSET_DIR + src;
        });
    });
</script>

<div
    class="footer-root"
    style="--scale: {scale}; --bottom-padding: {bottomPadding};"
>
    {#if isLandscape}
        <!-- LANDSCAPE_FOOTER_UI -->
        <div class="landscape-ui">
            <!-- BONUS_BUTTON -->
            {#if !isFreeSpin && !hideBonusBuy}
                <button
                    class="btn bonus-button bonus-btn"
                    onmouseenter={() => (bonusHover = true)}
                    onmouseleave={() => (bonusHover = false)}
                    onclick={onBonusBuy}
                    disabled={disabled && !hasActiveAnte}
                >
                    <img src={bonusSrc} alt="Bonus" />
                </button>
            {/if}

            <!-- FOOTER_MENU -->
            <div class="footer-menu">
                <img
                    class="decorative-bg"
                    src="{ASSET_DIR}footer_background.png"
                    alt="bg"
                />

                <!-- LEFT_SIDE -->
                <div class="left-side">
                    <button
                        class="btn menu-btn"
                        onmouseenter={() => (menuHover = true)}
                        onmouseleave={() => (menuHover = false)}
                        onclick={onMenu}
                    >
                        <img src={menuSrc} alt="Menu" />
                    </button>
                    <div class="balance-block">
                        <span class="label-text">BALANCE</span>
                        <span class="amount-text"
                            >{FormatWinAmount(balance, currency)}</span
                        >
                    </div>
                </div>

                <!-- MIDDLE_PART -->
                <div class="middle-part">
                    {#if isFreeSpin}
                        <span class="label-text">TOTAL WIN</span>
                        <span class="amount-text"
                            >{FormatWinAmountPrecise(uiState.bonusTotalWin, currency)}</span
                        >
                    {:else if lastWinAmount > 0}
                        <span class="label-text green">LAST WIN</span>
                        <span class="amount-text"
                            >{FormatWinAmountPrecise(lastWinAmount, currency)}</span
                        >
                    {/if}
                </div>

                <!-- RIGHT_SIDE -->
                <div class="right-side">
                    {#if !isFreeSpin}
                        <div class="bet-part">
                            <div class="bet-info">
                                <span class="label-text">{s("BET", "PLAY")}</span>
                                <span class="amount-text"
                                    >{FormatWinAmount(currentBet, currency)}</span
                                >
                            </div>
                            <div class="bet-controls">
                                <button
                                    class="btn plus-btn"
                                    onmouseenter={() => (plusHover = true)}
                                    onmouseleave={() => {
                                        plusHover = false;
                                        plusPressed = false;
                                    }}
                                    onmousedown={() => (plusPressed = true)}
                                    onmouseup={() => (plusPressed = false)}
                                    onclick={onIncrease}
                                    disabled={disabled || !isIdle}
                                >
                                    <img src={plusSrc} alt="Plus" />
                                </button>
                                <button
                                    class="btn minus-btn"
                                    onmouseenter={() => (minusHover = true)}
                                    onmouseleave={() => {
                                        minusHover = false;
                                        minusPressed = false;
                                    }}
                                    onmousedown={() => (minusPressed = true)}
                                    onmouseup={() => (minusPressed = false)}
                                    onclick={onDecrease}
                                    disabled={disabled || !isIdle}
                                >
                                    <img src={minusSrc} alt="Minus" />
                                </button>
                            </div>
                        </div>
                        <div class="play-part">
                            <button
                                class="btn play-btn"
                                onmouseenter={() => (playHover = true)}
                                onmouseleave={() => (playHover = false)}
                                onclick={onBet}
                                disabled={(disabled || !isIdle) && !isAutoPlaying}
                            >
                                <img src={playSrc} alt="Play" />
                                {#if isAutoPlaying}
                                    <div class="autospin-counter">
                                        {#if autoSpinStore.isInfinite}
                                            <img src="./assets/PopupsASSETS/AUTOPLAY/infinityicon_360.png" alt="Infinity" class="infinity-icon" />
                                        {:else}
                                            {autoSpinStore.remaining}
                                        {/if}
                                    </div>
                                {/if}
                            </button>
                            <div class="play-options">
                                <button
                                    class="btn auto-btn"
                                    onmouseenter={() => (autoplayHover = true)}
                                    onmouseleave={() => (autoplayHover = false)}
                                    onclick={onAutoSpinMenu}
                                    {disabled}
                                >
                                    <img src={autoplaySrc} alt="Autoplay" />
                                </button>
                                <button
                                    class="btn turbo-btn"
                                    onmouseenter={() => (turboHover = true)}
                                    onmouseleave={() => (turboHover = false)}
                                    onclick={onToggleTurbo}
                                >
                                    <img src={turboSrc} alt="Turbo" />
                                </button>
                            </div>
                        </div>
                    {/if}
                </div>
            </div>

            <!-- FREE SPIN HUD (Now positioned relative to the entire screen/footer bar) -->
            {#if isFreeSpin}
                <div class="freespin-hud">
                    <button
                        class="btn turbo-btn fs-turbo"
                        onmouseenter={() => (turboHover = true)}
                        onmouseleave={() => (turboHover = false)}
                        onclick={onToggleTurbo}
                    >
                        <img src={turboSrc} alt="Turbo in FS" />
                    </button>
                </div>
            {/if}
        </div>
    {:else}
        <!-- PORTRAIT_FOOTER_UI -->
        <div class="portrait-ui">
            <!-- LAST_WIN_BLOCK -->
            <div class="last-win-block">
                {#if isFreeSpin}
                    <span class="label-text">TOTAL WIN</span>
                    <span class="amount-text"
                        >{FormatWinAmountPrecise(uiState.bonusTotalWin, currency)}</span
                    >
                {:else if lastWinAmount > 0}
                    <span class="label-text green">LAST WIN</span>
                    <span class="amount-text"
                        >{FormatWinAmountPrecise(lastWinAmount, currency)}</span
                    >
                {/if}
            </div>

            <!-- TOP_ROW -->
            <div class="top-row">
                <img
                    class="decorative-bg"
                    src="{ASSET_DIR}portrait_top_row_background.png"
                    alt="bg"
                />

                <button
                    class="btn menu-btn"
                    onmouseenter={() => (menuHover = true)}
                    onmouseleave={() => (menuHover = false)}
                    onclick={onMenu}
                >
                    <img src={menuSrc} alt="Menu" />
                </button>

                {#if !isFreeSpin}
                    <div class="play-part">
                        <button
                            class="btn auto-btn"
                            onmouseenter={() => (autoplayHover = true)}
                            onmouseleave={() => (autoplayHover = false)}
                            onclick={onAutoSpinMenu}
                            {disabled}
                        >
                            <img src={autoplaySrc} alt="Autoplay" />
                        </button>
                        <button
                            class="btn play-btn"
                            onmouseenter={() => (playHover = true)}
                            onmouseleave={() => (playHover = false)}
                            onclick={onBet}
                            disabled={(disabled || !isIdle) && !isAutoPlaying}
                        >
                            <img src={playSrc} alt="Play" />
                            {#if isAutoPlaying}
                                <div class="autospin-counter">
                                    {#if autoSpinStore.isInfinite}
                                        <img src="./assets/PopupsASSETS/AUTOPLAY/infinityicon_360.png" alt="Infinity" class="infinity-icon" />
                                    {:else}
                                        {autoSpinStore.remaining}
                                    {/if}
                                </div>
                            {/if}
                        </button>
                        <button
                            class="btn turbo-btn"
                            onmouseenter={() => (turboHover = true)}
                            onmouseleave={() => (turboHover = false)}
                            onclick={onToggleTurbo}
                        >
                            <img src={turboSrc} alt="Turbo" />
                        </button>
                    </div>
                {/if}

                {#if isFreeSpin}
                    <button
                        class="btn turbo-btn"
                        onmouseenter={() => (turboHover = true)}
                        onmouseleave={() => (turboHover = false)}
                        onclick={onToggleTurbo}
                    >
                        <img src={turboSrc} alt="Turbo" />
                    </button>
                {:else if !hideBonusBuy}
                    <button
                        class="btn bonus-btn"
                        onmouseenter={() => (bonusHover = true)}
                        onmouseleave={() => (bonusHover = false)}
                        onclick={onBonusBuy}
                        disabled={disabled && !hasActiveAnte}
                    >
                        <img src={bonusSrc} alt="Bonus" />
                    </button>
                {/if}
            </div>

            <!-- BOTTOM_ROW -->
            <div class="bottom-row">
                <img
                    class="decorative-bg"
                    src="{ASSET_DIR}portrait_bottom_row_background.png"
                    alt="bg"
                />

                <div class="balance-block">
                    <span class="label-text">BALANCE</span>
                    <span class="amount-text"
                        >{FormatWinAmount(balance, currency)}</span
                    >
                </div>

                    <div class="bet-block">
                        <div class="bet-label-container">
                            <span class="label-text">{s("BET", "PLAY")}</span>
                        </div>
                        <div class="bet-info-portrait">
                            <button
                                class="btn minus-btn"
                                onmouseenter={() => (minusHover = true)}
                                onmouseleave={() => {
                                    minusHover = false;
                                    minusPressed = false;
                                }}
                                onmousedown={() => (minusPressed = true)}
                                onmouseup={() => (minusPressed = false)}
                                onclick={onDecrease}
                                disabled={disabled || isFreeSpin || !isIdle}
                            >
                                <img src={minusSrc} alt="Minus" />
                            </button>
                            <span class="amount-text"
                                >{FormatWinAmount(currentBet, currency)}</span
                            >
                            <button
                                class="btn plus-btn"
                                onmouseenter={() => (plusHover = true)}
                                onmouseleave={() => {
                                    plusHover = false;
                                    plusPressed = false;
                                }}
                                onmousedown={() => (plusPressed = true)}
                                onmouseup={() => (plusPressed = false)}
                                onclick={onIncrease}
                                disabled={disabled || isFreeSpin || !isIdle}
                            >
                                <img src={plusSrc} alt="Plus" />
                            </button>
                        </div>
                    </div>
            </div>
        </div>
    {/if}
</div>
