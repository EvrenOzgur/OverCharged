<!--
	Background renderer — data-driven from `uiLayoutConfig.bgLayers`.

	Layer architecture (z-order, alttan üste):
	  ─ Layer 0 "base"            : solid color bg (siyah zemin)
	  ─ Layer 1 "bgEnvironment"   : statik environment / mekan (henüz asset yok)
	  ─ Layer 2 "bgCharacters"    : ana karakter spine + idle animasyon
	  ─ Layer 3 "bgSkillEffects"  : trigger animasyonları (henüz asset yok)

	Yeni bir asset bağlamak için:
	  1. assets.ts'e spine entry ekle (key tercih: snake_case veya camelCase).
	  2. uiLayout.json'da ilgili layer'a `spineKey` yaz, animation isimlerini
	     idleAnimation / gameTypeAnimations / triggers map'inde belirt.
	  3. `visible: true` yap.

	Trigger key formatı (uiLayout.json `triggers`):
	  "<eventType>"           → "freeSpinTrigger", "wincap", "multiplierSymbolActivated"
	  "<eventType>.<subType>" → "skillActivated.L1", "skillActivated.L2", ...

	Trigger config alanları:
	  animation     (string)  — Spine animation name to play.
	  loop          (bool)    — Trigger animasyonu loop'lasın mı (default false).
	  trackIndex    (int)     — Hangi spine track'inde oynasın (default 0).
	                            Birden fazla trigger aynı track'i kullanırsa
	                            son tetiklenen baskındır.
	  returnToIdle  (bool)    — Animation complete'ından sonra baseline'a
	                            (gameTypeAnimations veya spineAnims) dönsün mü
	                            (default true).
-->
<script lang="ts">
	import { uiLayoutConfig } from '../game/uiLayoutConfig.svelte';
	import BackgroundLayer from './BackgroundLayer.svelte';

	const layers = $derived(uiLayoutConfig.bgLayers);
</script>

{#each layers as layer, i (layer.id)}
	<BackgroundLayer {layer} zIndex={-100 + i} />
{/each}
