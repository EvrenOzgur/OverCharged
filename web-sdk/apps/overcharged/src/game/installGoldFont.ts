/**
 * 'gold' bitmap fontunu Ranchers TTF'inden RUNTIME'da üretir.
 *
 * Eski sistemde 'gold' önceden pişmiş bir bitmap font'tu (mm_gold.xml + png).
 * Artık tipografiyi Ranchers'a geçirmek için PIXI v8'in BitmapFont.install'ı
 * ile, Ranchers web fontunu altın dolgu + koyu stroke ile bir bitmap atlasa
 * render edip 'gold' adıyla kuruyoruz. Böylece koddaki `fontFamily: 'gold'`
 * kullanımları (Win, GlobalMultiplier, FreeSpin*, TumbleWinAmount, ClusterWin…)
 * hiç değişmeden yeni fonta geçiyor.
 *
 * GOLD RENGİNİ AYARLAMAK İÇİN TEK YER: aşağıdaki GOLD_* sabitleri.
 */

// --- Altın görünüm ayarları (istediğin gibi oyna) -------------------------
const GOLD_FILL = '#f3b53b'; // ana altın tonu (düz renk)
const GOLD_STROKE = '#3a1e05'; // koyu kahve dış çizgi
const GOLD_STROKE_WIDTH = 8; // 160px glyph'e göre çizgi kalınlığı
// Glyph çözünürlüğü: install fontSize * resolution kadar piksele render edilir.
const INSTALL_FONT_SIZE = 160;
const INSTALL_RESOLUTION = 2;
// --------------------------------------------------------------------------

let installPromise: Promise<void> | null = null;

/**
 * Ranchers web fontunun yüklenmesini bekler, sonra 'gold' bitmap fontunu kurar.
 *
 * Idempotent + AWAIT-EDİLEBİLİR: tekrar çağrılırsa aynı (tek) kurulum promise'ini
 * döndürür. Böylece çağıranlar kurulumun BİTMESİNİ bekleyebilir — gold metin
 * ('gold' fontFamily'li BitmapText) render edilmeden önce fontun hazır olması
 * garanti edilir. (Eski sürüm hemen `installed=true` yapıp erken dönüyordu; bu
 * yüzden await etmek kurulumu beklemiyor, gold metin fallback fontla çıkıyordu.)
 * Oyun render edilmeden önce çağrılmalı.
 */
export function installGoldBitmapFont(): Promise<void> {
	if (installPromise) return installPromise;
	installPromise = (async () => {
		// Glyph'leri Ranchers ile çizebilmek için fontun tarayıcıda yüklü olması şart.
		// Yavaş/başarısız yüklemede boot'u kilitlememek için timeout ile yarıştırıyoruz.
		try {
			if (typeof document !== 'undefined' && document.fonts?.load) {
				await Promise.race([
					document.fonts.load(`${INSTALL_FONT_SIZE}px ranchers`),
					new Promise((resolve) => setTimeout(resolve, 3000)),
				]);
			}
		} catch {
			// yüklenemezse fallback fontla devam — yine de install ederiz
		}

		const { BitmapFont } = await import('pixi.js');

		BitmapFont.install({
			name: 'gold',
			// Yazdırılabilir ASCII (rakam, $ . , vb.) + çarpan işareti ×
			chars: [[' ', '~'], '×'],
			resolution: INSTALL_RESOLUTION,
			padding: 4,
			style: {
				fontFamily: 'ranchers',
				fontSize: INSTALL_FONT_SIZE,
				fill: GOLD_FILL,
				stroke: { color: GOLD_STROKE, width: GOLD_STROKE_WIDTH, join: 'round' },
			},
		});
	})();
	return installPromise;
}
