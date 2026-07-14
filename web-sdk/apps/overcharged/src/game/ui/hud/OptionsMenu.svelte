<script lang="ts">
    import { fade, scale } from "svelte/transition";
    import { backOut } from "svelte/easing";
    import { uiStore } from "../../../shared/stores/uiStore.svelte";
    import { eventEmitter } from "../../eventEmitter";

    interface Props {
        onClose: () => void;
        onInfo?: () => void;
        onSettings?: () => void;
    }

    let { onClose, onInfo, onSettings }: Props = $props();

    function handleSoundToggle() {
        eventEmitter.broadcast({ type: "soundPressGeneral" });
        uiStore.toggleSound();
    }

    function handleInfo() {
        if (onInfo) onInfo();
        onClose();
    }

    function handleSettings() {
        if (onSettings) onSettings();
        onClose();
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
                return 0;
            case "laptop":
                return 0;
            case "popoutL":
                return 0;
            case "popoutS":
                return -35;
            default:
                return 0;
        }
    });

    const assetPath = "./assets/PopupsASSETS/MENU";
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
        <div
            class="landscape-anchor"
            style="bottom: {bottomPadding}px; --scale: {scaleFactor};"
        >
            <div
                class="options-menu-panel"
                style="height: 187px;"
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
                    src="{assetPath}/menuPopup_bg.png"
                    alt="Menu Background"
                />
                <div class="content">
                    <button class="menu-btn" onclick={handleInfo}>
                        <img
                            class="default"
                            src="{assetPath}/btn_info_default.png"
                            alt="Info"
                        />
                        <img
                            class="hover"
                            src="{assetPath}/btn_info_hover.png"
                            alt="Info"
                        />
                        <img
                            class="active"
                            src="{assetPath}/btn_info_pressed.png"
                            alt="Info"
                        />
                    </button>
                    <button class="menu-btn" onclick={handleSoundToggle}>
                        <img
                            class="default"
                            src="{assetPath}/btn_sound{uiStore.soundEnabled
                                ? 'On'
                                : 'Off'}_default.png"
                            alt="Sound"
                        />
                        <img
                            class="hover"
                            src="{assetPath}/btn_sound{uiStore.soundEnabled
                                ? 'On'
                                : 'Off'}_hover.png"
                            alt="Sound"
                        />
                    </button>
                    <button class="menu-btn" onclick={handleSettings}>
                        <img
                            class="default"
                            src="{assetPath}/btn_settings_default.png"
                            alt="Settings"
                        />
                        <img
                            class="hover"
                            src="{assetPath}/btn_settings_hover.png"
                            alt="Settings"
                        />
                        <img
                            class="active"
                            src="{assetPath}/btn_settings_pressed.png"
                            alt="Settings"
                        />
                    </button>
                </div>
            </div>
        </div>
    {:else}
        <div class="portrait-anchor" style="--scale: {scaleFactor};">
            <div
                class="options-menu-panel"
                style="height: 187px;"
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
                    src="{assetPath}/menuPopup_bg.png"
                    alt="Menu Background"
                />
                <div class="content">
                    <button class="menu-btn" onclick={handleInfo}>
                        <img
                            class="default"
                            src="{assetPath}/btn_info_default.png"
                            alt="Info"
                        />
                        <img
                            class="hover"
                            src="{assetPath}/btn_info_hover.png"
                            alt="Info"
                        />
                        <img
                            class="active"
                            src="{assetPath}/btn_info_pressed.png"
                            alt="Info"
                        />
                    </button>
                    <button class="menu-btn" onclick={handleSoundToggle}>
                        <img
                            class="default"
                            src="{assetPath}/btn_sound{uiStore.soundEnabled
                                ? 'On'
                                : 'Off'}_default.png"
                            alt="Sound"
                        />
                        <img
                            class="hover"
                            src="{assetPath}/btn_sound{uiStore.soundEnabled
                                ? 'On'
                                : 'Off'}_hover.png"
                            alt="Sound"
                        />
                    </button>
                    <button class="menu-btn" onclick={handleSettings}>
                        <img
                            class="default"
                            src="{assetPath}/btn_settings_default.png"
                            alt="Settings"
                        />
                        <img
                            class="hover"
                            src="{assetPath}/btn_settings_hover.png"
                            alt="Settings"
                        />
                        <img
                            class="active"
                            src="{assetPath}/btn_settings_pressed.png"
                            alt="Settings"
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
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: default;
    }

    .backdrop.landscape,
    .backdrop.portrait {
        background: transparent;
        backdrop-filter: none;
        -webkit-backdrop-filter: none;
        align-items: flex-end;
        justify-content: center;
    }

    .landscape-anchor {
        position: absolute;
        bottom: var(--bottom-padding);
        left: 50%;
        transform: translateX(-50%) scale(var(--scale, 1));
        transform-origin: bottom center;
        pointer-events: none;
        width: 100%;
        display: flex;
        justify-content: center;
        align-items: flex-end;
    }

    .landscape-anchor .options-menu-panel {
        position: absolute;
        bottom: 110px; /* Footer'ın üstüne oturacak mesafe */
        margin-left: -715px; /* Hamburger menü ikonunun (sol tarafta) tam üzerine hizalanması için */
        pointer-events: auto;
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
        pointer-events: none;
    }

    .portrait-anchor .options-menu-panel {
        position: absolute;
        bottom: 170px;
        margin-left: -320px; /* Portre modunda soldaki menü ikonunun üzerine gelmesi için */
        pointer-events: auto;
    }

    .options-menu-panel {
        position: relative;
        display: flex;
        align-items: center;
        justify-content: center;
        width: 83px; /* menuPopup_bg.png genişliği */
        /* height: 187px; height is controlled inline now */
    }

    .bg-img {
        position: absolute;
        width: 100%;
        height: 100%;
        display: block;
        filter: drop-shadow(0 10px 20px rgba(0, 0, 0, 0.6));
    }

    .content {
        position: relative;
        z-index: 1;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        width: 100%;
        height: 100%;
        gap: 0px; /* Resimlerin iç içe binmemesi için ilk başta 0 */
    }

    .menu-btn {
        position: relative;
        width: 81px;
        height: 81px;
        flex-shrink: 0;
        background: none;
        border: none;
        padding: 0;
        cursor: pointer;
        display: flex;
        justify-content: center;
        align-items: center;
        margin-top: -28px; /* 3 adet 81px'lik butonun 187px yüksekliğe sığması için */
    }

    .menu-btn:first-child {
        margin-top: 0;
    }

    .menu-btn img {
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        transition: opacity 0.1s;
    }

    .menu-btn .hover,
    .menu-btn .active {
        opacity: 0;
    }

    .menu-btn:hover .default {
        opacity: 0;
    }

    .menu-btn:hover .hover {
        opacity: 1;
    }

    .menu-btn:active .hover {
        opacity: 0;
    }

    .menu-btn:active .active {
        opacity: 1;
    }
</style>
