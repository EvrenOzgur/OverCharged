<script lang="ts">
    import { fade, scale } from "svelte/transition";
    import { backOut } from "svelte/easing";
    import { autoSpinStore } from "../../../shared/stores/autoSpinStore.svelte";
    import { uiStore } from "../../../shared/stores/uiStore.svelte";

    interface Props {
        onClose: () => void;
        onBet: () => void;
    }
    let { onClose, onBet }: Props = $props();

    let selectedCount = $state(1000);
    let stopOnBonus = $state(true);

    const counts = [10, 25, 50, 75, 100, 250, 500, 1000, -1];

    const assetPath = "./assets/PopupsASSETS/AUTOPLAY";

    function getCountStr(count: number) {
        if (count === -1) return "infinity";
        return count.toString();
    }

    function handleStart() {
        autoSpinStore.start(selectedCount, stopOnBonus);
        onClose();
        onBet();
    }

    let resVal = $derived(uiStore.currentResolution.value);
    let isLandscape = $derived(
        ["desktop", "laptop", "popoutL", "popoutS"].includes(resVal),
    );

    let scaleFactor = $derived.by(() => {
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

    let bottomPadding = $derived.by(() => {
        if (!isLandscape) return 0;
        switch (resVal) {
            case "desktop":
                return 10;
            case "laptop":
                return 5;
            case "popoutL":
                return 5;
            case "popoutS":
                return 5;
            default:
                return 10;
        }
    });
</script>

<div
    class="backdrop {isLandscape ? 'landscape' : 'portrait'}"
    onclick={onClose}
    transition:fade={{ duration: 150 }}
    role="button"
    tabindex="0"
    onkeydown={(e) => e.key === "Escape" && onClose()}
>
    {#if isLandscape}
        <!-- Yatay modda (Masaüstü, Popout vb.) Footer'ın tam üstüne yapışık olması için merkezlenmiş ve Footer ile aynı şekilde ölçeklenen anchor -->
        <div
            class="landscape-anchor"
            style="--scale: {scaleFactor}; --bottom-padding: {bottomPadding}px;"
        >
            <div
                class="auto-menu-panel"
                transition:scale={{
                    duration: 300,
                    start: 0.8,
                    easing: backOut,
                }}
                role="dialog"
                aria-modal="true"
                onclick={(e) => e.stopPropagation()}
            >
                <img
                    class="bg-img"
                    src="{assetPath}/autoplayPopup_bg.png"
                    alt="Autoplay Background"
                />
                <div class="content">
                    <div class="presets-grid">
                        {#each counts as count}
                            {@const cStr = getCountStr(count)}
                            <button
                                class="preset-btn"
                                class:selected={selectedCount === count}
                                onclick={() => (selectedCount = count)}
                            >
                                <img
                                    class="default"
                                    src="{assetPath}/{cStr}_default.png"
                                    alt={cStr}
                                />
                                <img
                                    class="hover"
                                    src="{assetPath}/{cStr}_hover.png"
                                    alt={cStr}
                                />
                                <img
                                    class="active"
                                    src="{assetPath}/{cStr}_active.png"
                                    alt={cStr}
                                />
                            </button>
                        {/each}
                    </div>

                    <button class="start-btn" onclick={handleStart}>
                        <img
                            class="default"
                            src="{assetPath}/btn_start_default.png"
                            alt="Start"
                        />
                        <img
                            class="hover"
                            src="{assetPath}/btn_start_hover.png"
                            alt="Start"
                        />
                    </button>
                </div>
            </div>
        </div>
    {:else}
        <!-- Dikey modda (Mobil) Footer ile hizalı olması için portrait-anchor -->
        <div class="portrait-anchor" style="--scale: {scaleFactor};">
            <div
                class="auto-menu-panel"
                transition:scale={{
                    duration: 300,
                    start: 0.8,
                    easing: backOut,
                }}
                role="dialog"
                aria-modal="true"
                onclick={(e) => e.stopPropagation()}
            >
                <img
                    class="bg-img"
                    src="{assetPath}/autoplayPopup_bg.png"
                    alt="Autoplay Background"
                />
                <div class="content">
                    <div class="presets-grid">
                        {#each counts as count}
                            {@const cStr = getCountStr(count)}
                            <button
                                class="preset-btn"
                                class:selected={selectedCount === count}
                                onclick={() => (selectedCount = count)}
                            >
                                <img
                                    class="default"
                                    src="{assetPath}/{cStr}_default.png"
                                    alt={cStr}
                                />
                                <img
                                    class="hover"
                                    src="{assetPath}/{cStr}_hover.png"
                                    alt={cStr}
                                />
                                <img
                                    class="active"
                                    src="{assetPath}/{cStr}_active.png"
                                    alt={cStr}
                                />
                            </button>
                        {/each}
                    </div>

                    <button class="start-btn" onclick={handleStart}>
                        <img
                            class="default"
                            src="{assetPath}/btn_start_default.png"
                            alt="Start"
                        />
                        <img
                            class="hover"
                            src="{assetPath}/btn_start_hover.png"
                            alt="Start"
                        />
                    </button>
                </div>
            </div>
        </div>
    {/if}
</div>

<style>
    .backdrop {
        position: fixed;
        inset: 0;
        z-index: 9999;
        background: rgba(0, 0, 0, 0.6);
        backdrop-filter: blur(6px);
        -webkit-backdrop-filter: blur(6px);
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: default;
    }

    /* Yatay modda ekran kararmaz */
    .backdrop.landscape,
    .backdrop.portrait {
        background: transparent;
        backdrop-filter: none;
        -webkit-backdrop-filter: none;
        align-items: flex-end;
        justify-content: center; /* Padding ile değil, anchor ile hizalanacak */
    }

    .landscape-anchor {
        position: absolute;
        bottom: var(--bottom-padding);
        left: 50%;
        transform: translateX(-50%) scale(var(--scale, 1));
        transform-origin: bottom center;
        pointer-events: none; /* Arka plana tıklamaları engelleme */
        width: 100%;
        display: flex;
        justify-content: center;
        align-items: flex-end;
    }

    .landscape-anchor .auto-menu-panel {
        position: absolute;
        bottom: 110px; /* Footer'ın üstüne tam oturacak dikey mesafe */
        margin-left: 515px; /* Play butonunun sağına hizalanmak için (ortadan sağa) */
        pointer-events: auto; /* Tıklamaları tekrar aç */
    }

    .portrait-anchor {
        position: absolute;
        bottom: 0px;
        left: 50%;
        transform: translateX(-50%) scale(var(--scale, 1));
        transform-origin: bottom center;
        width: 100%;
        display: flex;
        justify-content: center;
        align-items: flex-end;
        pointer-events: none; /* Clicks pass through */
    }

    .portrait-anchor .auto-menu-panel {
        position: absolute;
        bottom: 170px; /* Menüyü biraz daha yukarı almak için artırıldı */
        margin-left: -120px; /* Sol tarafa (ortadan sola) sabitlemek için eksi değer. Buradan sola/sağa kaydırabilirsiniz. */
        pointer-events: auto; /* Tıklamaları tekrar aç */
    }

    .auto-menu-panel {
        position: relative;
        display: flex;
        align-items: center;
        justify-content: center;
        width: 280px; /* Boyut küçültüldü */
        max-width: 90vw;
    }

    .bg-img {
        width: 100%;
        height: auto;
        display: block;
        filter: drop-shadow(0 20px 50px rgba(0, 0, 0, 0.6));
    }

    .content {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        padding: 10% 8% 8% 8%; /* Görsele tam oturması için kenar boşlukları */
        box-sizing: border-box;
    }

    .presets-grid {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 6px;
        width: 100%;
        margin-bottom: 20px;
    }

    .preset-btn {
        background: none;
        border: none;
        padding: 0;
        cursor: pointer;
        position: relative;
        display: flex;
        align-items: center;
        justify-content: center;
        width: 100%;
    }

    .preset-btn img {
        width: 100%;
        height: auto;
        display: block;
        transition: opacity 0.15s;
        position: absolute;
        top: 0;
        left: 0;
    }

    /* Durumlara göre görünürlük */
    .preset-btn img.default {
        position: relative;
        opacity: 1;
    }
    .preset-btn img.hover {
        opacity: 0;
    }
    .preset-btn img.active {
        opacity: 0;
    }

    .preset-btn:hover:not(.selected) img.default {
        opacity: 0;
    }
    .preset-btn:hover:not(.selected) img.hover {
        opacity: 1;
    }

    .preset-btn.selected img.default {
        opacity: 0;
    }
    .preset-btn.selected img.hover {
        opacity: 0;
    }
    .preset-btn.selected img.active {
        opacity: 1;
    }

    .start-btn {
        background: none;
        border: none;
        padding: 0;
        cursor: pointer;
        position: relative;
        display: flex;
        align-items: center;
        justify-content: center;
        width: 75%; /* Görseldeki boyuta göre uyarlandı */
        margin-bottom: 5%;
    }

    .start-btn img {
        width: 100%;
        height: auto;
        display: block;
        transition: opacity 0.15s;
        position: absolute;
        top: 0;
        left: 0;
    }

    .start-btn img.default {
        position: relative;
        opacity: 1;
    }
    .start-btn img.hover {
        opacity: 0;
    }

    .start-btn:hover img.default {
        opacity: 0;
    }
    .start-btn:hover img.hover {
        opacity: 1;
    }

    .start-btn:active {
        transform: scale(0.96);
    }
</style>
