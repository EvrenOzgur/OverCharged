<script lang="ts">
    import { fade, scale } from "svelte/transition";
    import "./BonusMenu.css";
    import { bettingState } from "../../logic/BettingState.svelte";
    import { uiStore } from "../../../shared/stores/uiStore.svelte";
    import { FormatWinAmount } from "../../../shared/utils/currency";
    import { s } from "../../../shared/utils/social";

    interface Props {
        currency?: string;
        onClose?: () => void;
        onConfirm?: (featureId: string) => void;
        onDisable?: () => void;
        onBuySpecialBonus?: (featureId?: string) => void;
    }

    let {
        currency = "$",
        onClose = () => {},
        onDisable = () => {},
        onBuySpecialBonus = () => {}
    }: Props = $props();

    type BonusOption = { 
        id: string; 
        title: string; 
        subtitle: string; 
        costMult: number; 
        volatility: number; 
        isToggle?: boolean;
        assetBase: string;
        btnColor: string;
        btnText: string;
    };

    const buyOptions: BonusOption[] = [
        {
            id: "extra_chance",
            title: "LUCKY CROWN",
            subtitle: "Boost your bonus chances by 3x on each spin!",
            costMult: 2,
            volatility: 4,
            isToggle: true,
            assetBase: "LuckyCrown",
            btnColor: "blue",
            btnText: "ENABLE"
        },
        {
            id: "tornado_spin",
            title: "KING'S REWARD",
            subtitle: "Every spin includes a guaranteed WILD KING REEL with a random multiplier from 2x to 1024x!",
            costMult: 50,
            volatility: 5,
            isToggle: true,
            assetBase: "KingsReward",
            btnColor: "blue",
            btnText: "ENABLE"
        },
        {
            id: "bonus_standard",
            title: "BONUS",
            subtitle: "8 spins with a roaming WILD KING REEL!",
            costMult: 100,
            volatility: 4,
            assetBase: "Bonus",
            btnColor: "green",
            btnText: s("BUY", "PLAY")
        },
        {
            id: "bonus_super",
            title: "SUPER BONUS",
            subtitle: "8 spins with a roaming WILD KING REEL starting multiplier of 8x!",
            costMult: 250,
            volatility: 5,
            assetBase: "SuperBonus",
            btnColor: "green",
            btnText: s("BUY", "PLAY")
        },
        {
            id: "bonus_random",
            title: "MYSTERY BONUS",
            subtitle: "52% for BONUS, 40% for SUPER BONUS, 8% for SECRET BONUS!",
            costMult: 250,
            volatility: 5,
            assetBase: "MysteryBonus",
            btnColor: "green",
            btnText: s("BUY", "PLAY")
        }
    ];

    let selectedOption = $state<BonusOption | null>(null);
    let isMobile = $derived(uiStore.currentResolution?.value.startsWith('mobile') ?? false);
    
    let resVal = $derived(uiStore.currentResolution?.value || "desktop");
    let scaleFactor = $derived.by(() => {
        switch (resVal) {
            case "desktop": return 1.0;
            case "laptop": return 0.85;
            case "popoutL": return 0.67;
            case "popoutS": return 0.33;
            case "mobileL": return 1.0;
            case "mobileM": return 0.88;
            case "mobileS": return 0.75;
            default: return 1.0;
        }
    });

    // Drag to scroll logic
    let modalRef = $state<HTMLDivElement | null>(null);
    let isDragging = $state(false);
    let startY = $state(0);
    let scrollTop = $state(0);
    let dragDistance = $state(0);

    function onPointerDown(e: PointerEvent) {
        if (e.button !== 0 || !modalRef) return;
        isDragging = true;
        dragDistance = 0;
        startY = e.pageY - modalRef.offsetTop;
        scrollTop = modalRef.scrollTop;
        // setPointerCapture kaldırıldı çünkü tıklandığında alt elemanların (kartların) click eventini yutuyordu
    }

    function onPointerMove(e: PointerEvent) {
        if (!isDragging || !modalRef) return;
        const y = e.pageY - modalRef.offsetTop;
        const walk = (y - startY) * 1.5; // Scroll speed multiplier
        dragDistance = Math.abs(y - startY);
        if (dragDistance > 5) {
            e.preventDefault();
        }
        modalRef.scrollTop = scrollTop - walk;
    }

    function onPointerUp(e: PointerEvent) {
        if (!isDragging || !modalRef) return;
        isDragging = false;
    }

    function handleCardClick(option: BonusOption, e?: Event) {
        if (dragDistance > 5) {
            e?.stopPropagation();
            e?.preventDefault();
            return;
        }
        if (!selectedOption) {
            selectedOption = option;
        }
    }

    function handleActionClick(option: BonusOption, canAfford: boolean, e?: Event) {
        // console.log(`[BonusMenu] handleActionClick fired. option: ${option.id}, canAfford: ${canAfford}, dragDistance: ${dragDistance}, isToggle: ${option.isToggle}, active: ${bettingState.activeFeatureId}`);
        if (dragDistance > 5) {
            e?.stopPropagation();
            e?.preventDefault();
            return;
        }
        
        // Svelte 5 $state objeleri proxy'lediği için referans karşılaştırması (===) yerine id karşılaştırması yapmalıyız
        if (selectedOption?.id === option.id) {
            // Confirm
            if (option.isToggle) {
                if (bettingState.activeFeatureId === option.id) {
                    console.log(`[BonusMenu] disabling ${option.id}`);
                    onDisable();
                    selectedOption = null;
                } else if (canAfford) {
                    console.log(`[BonusMenu] enabling ${option.id}`);
                    onBuySpecialBonus(option.id);
                    selectedOption = null;
                } else {
                    console.log(`[BonusMenu] Cannot afford ${option.id}`);
                }
            } else {
                if (canAfford) {
                    onBuySpecialBonus(option.id);
                    selectedOption = null;
                }
            }
        } else {
            selectedOption = option;
        }
    }

    function handleClose() {
        if (selectedOption) {
            selectedOption = null;
        } else {
            onClose();
        }
    }

    function getButtonImage(option: BonusOption, canAfford: boolean, isLong: boolean) {
        const isActive = bettingState.activeFeatureId === option.id;
        const suffix = isLong ? "_long.png" : ".png";
        
        if (!canAfford && !isActive) return `./assets/BonusBuyPage/Buttons/passiveButton${suffix}`;
        return `./assets/BonusBuyPage/Buttons/${option.btnColor}Button${suffix}`;
    }
</script>

<div class="bonus-menu-overlay" class:is-mobile={isMobile} in:fade={{ duration: 250 }} out:fade={{ duration: 200 }} style="--scale: {scaleFactor}; --inv-scale: {1 / scaleFactor};">
    <button class="bonus-menu-backdrop" aria-label="Close" onclick={handleClose}></button>
    
    <div class="bonus-menu-scaler">
        {#if !selectedOption}
        <button class="screen-close-btn" onclick={handleClose} aria-label="Close menu">
            <img src="./assets/BonusBuyPage/CloseIcon.png" alt="Close" />
        </button>
    {/if}
    
    <div class="bonus-menu-controls" in:fade={{ duration: 300, delay: 100 }}>
        <div class="bm-balance-block">
            <span class="bm-label">BALANCE</span>
            <span class="bm-amount">{FormatWinAmount(bettingState.displayedBalance, currency)}</span>
        </div>
        
        <div class="bm-bet-block">
            <span class="bm-label">BET</span>
            <div class="bm-bet-controls">
                <button class="bm-btn" onclick={() => bettingState.decreaseBet()}>
                    <img src="./assets/FooterMenu/Assets/btn_minus_default.png" alt="Minus" />
                </button>
                <span class="bm-amount">{FormatWinAmount(bettingState.currentBet, currency)}</span>
                <button class="bm-btn" onclick={() => bettingState.increaseBet()}>
                    <img src="./assets/FooterMenu/Assets/btn_plus_default.png" alt="Plus" />
                </button>
            </div>
        </div>
    </div>

    <div 
        class="bonus-menu-modal" 
        class:single-card-mode={!!selectedOption}
        bind:this={modalRef}
        in:scale={{ duration: 300, start: 0.95, opacity: 0 }} 
        out:scale={{ duration: 200, start: 0.95, opacity: 0 }}
        onpointerdown={onPointerDown}
        onpointermove={onPointerMove}
        onpointerup={onPointerUp}
        onpointercancel={onPointerUp}
    >

        <div class="cards-wrapper">
            {#each buyOptions as option}
                {#if !selectedOption || selectedOption.id === option.id}
                    {@const isSelected = selectedOption?.id === option.id}
                    {@const optionCost = bettingState.currentBet * option.costMult}
                    {@const canAfford = bettingState.displayedBalance >= optionCost}
                    {@const isActive = bettingState.activeFeatureId === option.id}
                    {@const btnText = isActive ? "DISABLE" : option.btnText}
                    
                    <div class="bonus-card-container" class:long-mode={isSelected}>
                        {#if isSelected}
                            <button class="card-close-btn" onclick={handleClose} aria-label="Cancel">
                                <img src="./assets/BonusBuyPage/CloseIcon.png" alt="Cancel" />
                            </button>
                        {/if}

                        <img 
                            class="card-header-img" 
                            src="./assets/BonusBuyPage/Cards/{isSelected ? 'long' : 'short'}/{option.assetBase}{isSelected ? '_long' : ''}.png" 
                            alt={option.title} 
                            onclick={(e) => handleCardClick(option, e)}
                        />

                        <!-- svelte-ignore a11y_click_events_have_key_events -->
                        <!-- svelte-ignore a11y_no_static_element_interactions -->
                        <div class="card-body" onclick={(e) => handleCardClick(option, e)}>
                            <div class="volatility-stars">
                                <img src="./assets/BonusBuyPage/Volatility/volatility{option.volatility}.png" alt="Volatility {option.volatility}" />
                            </div>

                            {#if isSelected}
                                <div class="card-desc">
                                    {option.subtitle}
                                </div>
                            {/if}

                            <div class="card-price">{FormatWinAmount(optionCost, currency)}</div>
                            
                            <button 
                                class="card-action-btn"
                                onclick={(e) => { e.stopPropagation(); handleActionClick(option, canAfford, e); }}
                                disabled={!canAfford && !isActive}
                            >
                                <img src={getButtonImage(option, canAfford, isSelected)} alt={btnText} />
                                <span class="btn-text" class:text-dark={option.btnColor === 'green' && (canAfford || isActive)}>{btnText}</span>
                            </button>
                        </div>
                    </div>
                {/if}
            {/each}
        </div>
    </div>
    </div>
</div>
