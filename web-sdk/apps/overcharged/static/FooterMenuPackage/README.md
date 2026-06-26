# Footer Menu System Package

Bu klasör (`FooterMenuPackage`), oyunlarınızda kullandığınız dinamik alt menü (Footer), Otomatik Oyun (AutoSpin), Ödeme Tablosu (GameInfo/Paytable), Ayarlar (Options) ve Bonus Satın Alma (BonusBuy) sistemlerini başka bir projeye "Tak-Çalıştır" mantığıyla taşımanız için hazırlanmıştır.

## İçindekiler
Paket içerisindeki dosyalar:
- `src/game/ui/hud/`: Svelte bileşenleri ve CSS dosyaları.
- `src/shared/stores/` & `utils/`: Bağımlı olunan Store ve Helper dosyaları (Referans amaçlıdır).
- `public/assets/`: Footer ve Menülerin ihtiyaç duyduğu tüm görseller.

## 🚀 Kurulum (Diğer Projeye Ekleme)

Bu paketi yeni bir projeye entegre etmek için aşağıdaki adımları izleyin:

### 1. Dosyaları Kopyalayın
Bu paket içindeki klasörleri, yeni projenizdeki aynı yollara (path) kopyalayın.
- `src/game/ui/hud/` içerisindekileri yeni projedeki `src/game/ui/hud/` klasörüne atın.
- `public/assets/` altındaki `FooterMenu`, `PopupsASSETS` ve `BonusBuyPage` klasörlerini yeni projenin `public/assets/` dizinine taşıyın.

### 2. Svelte Store'ların Kurulumu
Bu menüler düzgün çalışabilmek için aşağıdaki Global State (Store) dosyalarına ihtiyaç duyar:
- `uiStore.svelte.ts`: Ekran çözünürlüğü, ses, turbo ve debug toggle'larını yönetir.
- `autoSpinStore.svelte.ts`: Autospin miktarını ve limitlerini yönetir.
- `bettingState.svelte.ts`: Mevcut bahis miktarını ve bakiyeyi içerir. (Mevcut projenizdeki yapıya bağlamanız gerekebilir).

> **Not:** Referans olması açısından `src/shared/stores` ve `src/shared/utils/resolutions.ts` dosyaları pakete dahil edilmiştir. Eğer hedef projede bu dosyalar yoksa, paket içindekileri direkt kullanabilirsiniz.

### 3. Ana Arayüze (HUD) Eklenmesi
`FooterMenu` bileşenini ana oyun arayüzünüze (`App.svelte` veya `HUD.svelte`) import ederek en alt katmana ekleyin.

```svelte
<script>
    import FooterMenu from './game/ui/hud/FooterMenu.svelte';
</script>

<div class="hud-layer">
    <!-- Diğer UI elemanları -->
    <FooterMenu />
</div>
```

---

## 📱 Çözünürlük (Resolution Presets) Entegrasyonu

Bu alt menü sistemi, **Container Queries** ve `uiStore.currentResolution` yardımıyla her cihaza (Masaüstü, Laptop, Mobil, Popout) otomatik olarak uyum sağlar.

**Duyarlı Tasarımın Çalışma Mantığı:**
1. **Desktop / Laptop:** Footer menüsü yatay uzunlukta (`landscape-anchor`), butonlar yanyana listelenir. Autospin ve Ayarlar popupları alt ortadan veya hamburger menünün yanından çıkar.
2. **Popout S/L:** Daha dar ekranlarda, orta paneller veya yan menüler Svelte'in reaktif `scaleFactor` mekanizmasıyla orantılı şekilde (0.85, 0.67, 0.33) küçültülür.
3. **Mobile (Portrait):** Mobil cihazlarda (`mobileL`, `mobileM`, `mobileS`) menü yapısı dikey forma (`portrait-anchor`) dönüşür.
   - Ödeme tablosu (GameInfoMenu) dikeyde ekrana sığmak için kolon sayılarını (CSS Grid) daraltır ve ikonları yarı yarıya küçültür.
   - Options menüsü sol menü ikonunun üzerine yerleşir.

**Geliştirici İpucu:** Eğer yeni bir çözünürlük preset'i eklerseniz, `src/shared/utils/resolutions.ts` dosyasına yeni boyutları tanımladığınız anda tüm Footer CSS hesaplamaları (içerisinde bulunan `isPortrait` veya `scaleFactor` değişkenleri aracılığıyla) hiçbir koda dokunmadan otomatik adapte olacaktır.
