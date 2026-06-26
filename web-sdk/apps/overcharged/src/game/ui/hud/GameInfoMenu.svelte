<script lang="ts">
    import { fade, slide } from "svelte/transition";
    import { backOut } from "svelte/easing";
    import { s } from "../../../shared/utils/social";
    import { t } from "../../../shared/i18n/index.svelte";
    import SpineSymbol from './SpineSymbol.svelte';
    import { uiStore } from "../../../shared/stores/uiStore.svelte";

    interface Props {
        onClose: () => void;
    }
    
    let { onClose }: Props = $props();

    let isPortrait = $derived(uiStore.currentResolution.value.includes('mobile'));
    let symbolSizeH = $derived(isPortrait ? 32 : 80);
    let symbolSizeL = $derived(isPortrait ? 24 : 60);

    function dragScroll(node: HTMLElement) {
        let isDown = false;
        let startY = 0;
        let scrollTop = 0;
        let didDrag = false;

        const down = (e: PointerEvent) => {
            isDown = true;
            didDrag = false;
            startY = e.pageY - node.offsetTop;
            scrollTop = node.scrollTop;
            
            window.addEventListener('pointermove', move);
            window.addEventListener('pointerup', up);
            window.addEventListener('pointercancel', up);
            node.style.cursor = 'grabbing';
        };

        const move = (e: PointerEvent) => {
            if (!isDown) return;
            const y = e.pageY - node.offsetTop;
            const walk = (y - startY) * 1.5; 
            if (Math.abs(walk) > 5) didDrag = true;
            node.scrollTop = scrollTop - walk;
        };

        const up = (e: PointerEvent) => {
            if (!isDown) return;
            isDown = false;
            
            window.removeEventListener('pointermove', move);
            window.removeEventListener('pointerup', up);
            window.removeEventListener('pointercancel', up);
            node.style.cursor = '';
            
            setTimeout(() => { didDrag = false; }, 50);
        };
        
        const click = (e: MouseEvent) => {
            if (didDrag) {
                e.stopPropagation();
                e.preventDefault();
            }
        };

        node.addEventListener('pointerdown', down);
        node.addEventListener('click', click, { capture: true });

        return {
            destroy() {
                node.removeEventListener('pointerdown', down);
                node.removeEventListener('click', click, { capture: true });
                window.removeEventListener('pointermove', move);
                window.removeEventListener('pointerup', up);
                window.removeEventListener('pointercancel', up);
            }
        };
    }
</script>

<div class="info-overlay" transition:fade={{ duration: 200 }} role="dialog" aria-modal="true" onclick={onClose}>
    <div class="info-modal" onclick={(e) => e.stopPropagation()}>
        <!-- Header -->
        <header class="info-header">
            <h2>{s('GAME RULES', 'GAME RULES')}</h2>
            <button class="close-btn" onclick={onClose} aria-label="Close">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
            </button>
        </header>

        <!-- Scrollable Content -->
        <div class="info-content-scroll" use:dragScroll style="cursor: grab;">



            <div class="info-section">
                <h3>ÖDEME TABLOSU</h3>
                
                <div class="table-responsive">
                    <div class="paytable-grid high-pay">
                        <!-- Header -->
                        <div class="pt-header">Eşleşme</div>
                        <div class="pt-header"><SpineSymbol skin="H1" size={symbolSizeH} /></div>
                        <div class="pt-header"><SpineSymbol skin="H2" size={symbolSizeH} /></div>
                        <div class="pt-header"><SpineSymbol skin="H3" size={symbolSizeH} /></div>
                        <div class="pt-header"><SpineSymbol skin="H4" size={symbolSizeH} /></div>
                        
                        <!-- Row 5 -->
                        <div class="pt-cell match-count">5</div>
                        <div class="pt-cell">5x</div>
                        <div class="pt-cell">3x</div>
                        <div class="pt-cell">2x</div>
                        <div class="pt-cell">1.6x</div>

                        <!-- Row 4 -->
                        <div class="pt-cell match-count">4</div>
                        <div class="pt-cell">3x</div>
                        <div class="pt-cell">2x</div>
                        <div class="pt-cell">1.2x</div>
                        <div class="pt-cell">1x</div>

                        <!-- Row 3 -->
                        <div class="pt-cell match-count">3</div>
                        <div class="pt-cell">1.5x</div>
                        <div class="pt-cell">1x</div>
                        <div class="pt-cell">0.6x</div>
                        <div class="pt-cell">0.5x</div>
                    </div>
                </div>

                <div class="table-responsive">
                    <div class="paytable-grid low-pay">
                        <!-- Header -->
                        <div class="pt-header">Eşleşme</div>
                        <div class="pt-header"><SpineSymbol skin="L1" size={symbolSizeL} /></div>
                        <div class="pt-header"><SpineSymbol skin="L2" size={symbolSizeL} /></div>
                        <div class="pt-header"><SpineSymbol skin="L3" size={symbolSizeL} /></div>
                        <div class="pt-header"><SpineSymbol skin="L4" size={symbolSizeL} /></div>
                        
                        <!-- Row 5 -->
                        <div class="pt-cell match-count">5</div>
                        <div class="pt-cell">1x</div>
                        <div class="pt-cell">1x</div>
                        <div class="pt-cell">1x</div>
                        <div class="pt-cell">1x</div>

                        <!-- Row 4 -->
                        <div class="pt-cell match-count">4</div>
                        <div class="pt-cell">0.5x</div>
                        <div class="pt-cell">0.5x</div>
                        <div class="pt-cell">0.5x</div>
                        <div class="pt-cell">0.5x</div>

                        <!-- Row 3 -->
                        <div class="pt-cell match-count">3</div>
                        <div class="pt-cell">0.1x</div>
                        <div class="pt-cell">0.1x</div>
                        <div class="pt-cell">0.1x</div>
                        <div class="pt-cell">0.1x</div>
                    </div>
                </div>
            </div>

            <div class="info-section">
                <h3>KAZANÇ ÇİZGİLERİ (PAYLINES)</h3>
                <p>Tüm kazançlar soldan sağa doğru ardışık makaralar üzerinde aşağıdaki 11 çizgiden herhangi biriyle eşleşmelidir.</p>
                
                <div class="paylines-container">
                    {#each [
                        [1, 1, 1, 1, 1], // 1: Middle row
                        [0, 0, 0, 0, 0], // 2: Top row
                        [2, 2, 2, 2, 2], // 3: Bottom row
                        [0, 1, 2, 1, 0], // 4: V-shape down
                        [2, 1, 0, 1, 2], // 5: V-shape up
                        [1, 0, 0, 0, 1], // 6: Hat
                        [1, 2, 2, 2, 1], // 7: Bowl
                        [0, 0, 1, 2, 2], // 8: Stairs down
                        [2, 2, 1, 0, 0], // 9: Stairs up
                        [1, 2, 1, 0, 1], // 10: Zigzag up
                        [1, 0, 1, 2, 1], // 11: Zigzag down
                    ] as payline, lineIndex}
                        <div class="mini-grid">
                            <span class="line-number">{lineIndex + 1}</span>
                            <div class="mg-wrapper">
                                {#each Array(3) as _, r}
                                    <div class="mg-row">
                                        {#each Array(5) as _, c}
                                            <div class="mg-cell" class:active={payline[c] === r}></div>
                                        {/each}
                                    </div>
                                {/each}
                            </div>
                        </div>
                    {/each}
                </div>
            </div>

            <div class="info-section">
                <h3>MAKS KAZANÇ</h3>
                <p>Maksimum kazanç, hem temel oyunda hem de ücretsiz dönüş özelliğinde bahsin <strong style="color: #ffd700">15,000x</strong> katı ile sınırlandırılmıştır.</p>
                <p>Ücretsiz Oyun turu sırasında toplam kazanç bahsin 15,000x katına ulaşırsa, tur hemen sona erer, kazanç ödenir ve kalan ücretsiz dönüşler iptal edilir.</p>
            </div>

            <div class="info-footer">
                <p>Version 1.0.0</p>
                <p>{s(t('info_disclaimer'), t('info_disclaimer_social'))}</p>
            </div>
        </div>
    </div>
</div>

<style>
    .info-overlay {
        position: absolute;
        inset: 0;
        z-index: 10000;
        background: rgba(0, 0, 0, 0.85);
        backdrop-filter: blur(8px);
        -webkit-backdrop-filter: blur(8px);
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 24px;
        /* Make sure it sits exactly over the active resolution area in Main */
        pointer-events: auto;
    }

    .info-modal {
        width: 100%;
        max-width: 800px;
        height: 100%;
        max-height: 900px;
        background: #0f131a;
        border: 1px solid rgba(255, 255, 255, 0.1);
        border-radius: 20px;
        box-shadow: 0 25px 60px rgba(0, 0, 0, 0.8), inset 0 1px 1px rgba(255, 255, 255, 0.05);
        display: flex;
        flex-direction: column;
        overflow: hidden;
        animation: slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1);
    }

    @keyframes slideUp {
        from {
            opacity: 0;
            transform: translateY(40px) scale(0.98);
        }
        to {
            opacity: 1;
            transform: translateY(0) scale(1);
        }
    }

    .info-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 24px 32px;
        border-bottom: 1px solid rgba(255, 255, 255, 0.05);
        background: rgba(255, 255, 255, 0.02);
    }

    .info-header h2 {
        margin: 0;
        font-family: "Inter", sans-serif;
        font-size: 20px;
        font-weight: 700;
        color: #ffffff;
        letter-spacing: 1px;
    }

    .close-btn {
        background: transparent;
        border: none;
        color: rgba(255, 255, 255, 0.5);
        cursor: pointer;
        padding: 8px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.2s ease;
    }

    .close-btn:hover {
        background: rgba(255, 255, 255, 0.1);
        color: #ffffff;
    }

    .close-btn svg {
        width: 24px;
        height: 24px;
    }

    .info-content-scroll {
        flex: 1;
        overflow-y: auto;
        padding: 32px;
        scrollbar-width: thin;
        scrollbar-color: rgba(255, 255, 255, 0.2) transparent;
        display: flex;
        flex-direction: column;
        gap: 40px;
    }

    .info-content-scroll::-webkit-scrollbar {
        width: 6px;
    }

    .info-content-scroll::-webkit-scrollbar-track {
        background: transparent;
    }

    .info-content-scroll::-webkit-scrollbar-thumb {
        background: rgba(255, 255, 255, 0.2);
        border-radius: 10px;
    }

    .info-section h3 {
        margin: 0 0 16px 0;
        font-family: "Inter", sans-serif;
        font-size: 14px;
        font-weight: 700;
        color: #4ade80;
        letter-spacing: 1.5px;
        text-transform: uppercase;
    }

    .info-section p {
        margin: 0 0 16px 0;
        font-family: "Inter", sans-serif;
        font-size: 15px;
        line-height: 1.6;
        color: rgba(255, 255, 255, 0.7);
    }
    
    .table-responsive {
        width: 100%;
        overflow-x: auto;
        margin-bottom: 32px;
        scrollbar-width: none; /* Hide scrollbar for cleaner look, or use thin */
    }
    .table-responsive::-webkit-scrollbar {
        display: none;
    }

    .paytable-grid {
        display: grid;
        gap: 1px;
        background: rgba(255, 255, 255, 0.1);
        border: 1px solid rgba(255, 255, 255, 0.1);
        border-radius: 8px;
        overflow: hidden;
        min-width: 480px; /* Forces minimum width so it scrolls instead of squishing */
    }

    .pt-header {
        background: rgba(255, 255, 255, 0.05);
        padding: 16px 8px;
        text-align: center;
        font-weight: 700;
        font-size: 13px;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 8px;
        color: rgba(255, 255, 255, 0.9);
    }

    .paytable-grid.high-pay { grid-template-columns: 80px repeat(4, 1fr); }
    .paytable-grid.low-pay { grid-template-columns: 80px repeat(4, 1fr); }

    .pt-header .emoji {
        font-size: 32px;
        line-height: 1;
        filter: drop-shadow(0 4px 6px rgba(0,0,0,0.5));
    }
    
    .pt-placeholder {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 42px;
        height: 42px;
        background: rgba(255, 255, 255, 0.1);
        border: 2px solid rgba(255, 255, 255, 0.2);
        border-radius: 8px;
        font-family: "Inter", sans-serif;
        font-weight: 800;
        color: #fff;
        text-shadow: 0 2px 4px rgba(0,0,0,0.5);
    }
    
    .pt-placeholder.high {
        font-size: 18px;
        color: #ffca28;
        border-color: rgba(255, 202, 40, 0.4);
    }
    
    .pt-placeholder.low {
        width: 32px;
        height: 32px;
        font-size: 14px;
        color: #90caf9;
        border-color: rgba(144, 202, 249, 0.4);
    }

    .pt-header.low-symbol {
        font-size: 28px;
        font-family: "Inter", sans-serif;
        color: #ffca28;
        text-shadow: 0 2px 4px rgba(0,0,0,0.5);
    }

    .pt-cell {
        background: rgba(0, 0, 0, 0.3);
        padding: 14px 8px;
        text-align: center;
        font-size: 15px;
        font-family: "Inter", sans-serif;
        color: rgba(255, 255, 255, 0.8);
        display: flex;
        align-items: center;
        justify-content: center;
    }

    .pt-cell.match-count {
        background: rgba(255, 255, 255, 0.02);
        font-weight: 700;
        color: #fff;
        border-right: 1px solid rgba(255, 255, 255, 0.05);
    }
    
    .info-footer {
        margin-top: auto;
        padding-top: 32px;
        border-top: 1px solid rgba(255, 255, 255, 0.05);
        text-align: center;
    }
    
    .info-footer p {
        margin: 4px 0;
        font-family: "Inter", sans-serif;
        font-size: 12px;
        color: rgba(255, 255, 255, 0.3);
    }

    /* ====================================================== */
    /* CONTAINER QUERIES (Resolution Presets Adaptability)    */
    /* ====================================================== */
    @container game-container (max-width: 600px) or (max-height: 600px) {
        .info-overlay {
            padding: 12px;
        }

        .info-header {
            padding: 16px 20px;
        }

        .info-header h2 {
            font-size: 16px;
        }

        .info-content-scroll {
            padding: 20px;
            gap: 24px;
        }

        .info-section h3 {
            font-size: 12px;
            margin-bottom: 12px;
        }

        .info-section p {
            font-size: 13px;
            line-height: 1.5;
        }

        .paytable-grid {
            min-width: 100%; /* Permit shrinking */
        }
        .paytable-grid.high-pay { grid-template-columns: 50px repeat(4, 1fr); }
        .paytable-grid.low-pay { grid-template-columns: 50px repeat(4, 1fr); }

        .pt-header {
            padding: 8px 2px;
            font-size: 10px;
        }
        .pt-cell {
            padding: 10px 2px;
            font-size: 12px;
        }
    }

    @container game-container (max-width: 400px) or (max-height: 400px) {
        .info-overlay {
            padding: 0;
        }

        .info-modal {
            border-radius: 0;
            border: none;
        }
        
        .info-header {
            padding: 12px 16px;
        }
        
        .info-header h2 {
            font-size: 14px;
        }
        
        .close-btn svg {
            width: 20px;
            height: 20px;
        }
        
        .info-content-scroll {
            padding: 16px;
            gap: 20px;
        }
        
        .info-section p {
            font-size: 12px;
        }
        
        .paytable-grid.high-pay { grid-template-columns: 45px repeat(4, 1fr); }
        .paytable-grid.low-pay { grid-template-columns: 45px repeat(4, 1fr); }
        
        .pt-header {
            font-size: 9px;
            padding: 6px 2px;
        }
        
        .pt-cell {
            font-size: 11px;
            padding: 8px 2px;
        }
    }
    
    /* Paylines Styles */
    .paylines-container {
        display: flex;
        flex-wrap: wrap;
        gap: 16px;
        margin-top: 16px;
        margin-bottom: 32px;
        justify-content: flex-start;
    }
    
    .mini-grid {
        display: flex;
        flex-direction: column;
        align-items: center;
        background: rgba(255, 255, 255, 0.05);
        border: 1px solid rgba(255, 255, 255, 0.1);
        border-radius: 8px;
        padding: 12px;
        width: 120px;
        gap: 8px;
    }
    
    .line-number {
        font-family: "Inter", sans-serif;
        font-size: 14px;
        font-weight: 700;
        color: rgba(255, 255, 255, 0.9);
    }
    
    .mg-wrapper {
        display: flex;
        flex-direction: column;
        gap: 2px;
    }
    
    .mg-row {
        display: flex;
        gap: 2px;
    }
    
    .mg-cell {
        width: 16px;
        height: 12px;
        background: rgba(0, 0, 0, 0.5);
        border-radius: 2px;
    }
    
    .mg-cell.active {
        background: #ffca28;
        box-shadow: 0 0 4px #ffca28;
    }
</style>
