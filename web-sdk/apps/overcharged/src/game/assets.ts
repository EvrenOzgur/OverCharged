// All asset paths are runtime-relative (`./assets/...` or `./OverChargedAssets/...`).
// Reasoning: when Stake serves the game from a sub-path on its CDN
// (e.g. `…/overcharged00/v7/`) `import.meta.url`-resolved Vite-hashed URLs
// can fall through to the platform's scratch/draft API and 403 on un-promoted
// files. Static paths under `static/assets/...` are copied 1:1 by SvelteKit's
// adapter-static and resolve consistently against the iframe's base URL,
// so they survive Stake's deploy/promote pipeline cleanly.
//
// XML/Atlas page references (e.g. `<page file="mm_gold.png">`) are resolved
// by Pixi loaders against the manifest's directory, so keeping these paths
// flat makes the texture lookups deterministic.
export default {
	loader: {
		type: 'spine',
		src: {
			atlas: './OverChargedAssets/loadingScreen/loadingScreen.atlas',
			skeleton: './OverChargedAssets/loadingScreen/loadingScreen.json',
			// scale 1: the skeleton is authored at 1200×819 and its bg texture
			// region is 1:1 with that. A load scale > 1 inflates the geometry
			// (renders ~2× too big since SpineProvider fits from the raw
			// skeleton.width) AND upscales the texture (blur). Keep at 1.
			scale: 1,
		},
		preload: true,
	},
	pressToContinueText: {
		type: 'sprites',
		src: './assets/sprites/pressToContinueText/MM_pressanywhere.json',
		preload: true,
	},
	highSymbols: {
		type: 'spine',
		src: {
			atlas: './OverChargedAssets/high_symbols/high-symbols.atlas',
			skeleton: './OverChargedAssets/high_symbols/high-symbols.json',
			scale: 2,
		},
		preload: true,
	},
	lowSymbols: {
		type: 'spine',
		src: {
			atlas: './OverChargedAssets/low_symbols/low-symbols.atlas',
			skeleton: './OverChargedAssets/low_symbols/low-symbols.json',
			scale: 2,
		},
		preload: true,
	},
	specialSymbols: {
		type: 'spine',
		src: {
			atlas: './OverChargedAssets/special_symbols/special-symbols.atlas',
			skeleton: './OverChargedAssets/special_symbols/special-symbols.json',
			scale: 2,
		},
		preload: true,
	},
	// Multiplier (M) symbol — coin-flip spine with one skin per value
	// (`2x`..`500x`) and `flip` / `land` animations. Replaces the old
	// specialSymbols + "X{n}" text overlay (see SYMBOL_INFO_MAP.M / Symbol.svelte).
	multipliers: {
		type: 'spine',
		src: {
			atlas: './multipliers/mutlipliers.atlas',
			skeleton: './multipliers/mutlipliers.json',
			scale: 2,
		},
		preload: true,
	},
	bgCharacters: {
		type: 'spine',
		src: {
			atlas: './bg_characters/bg_characters.atlas',
			skeleton: './bg_characters/bg_characters.json',
			scale: 2,
		},
		preload: true,
	},
	reelsFrame: {
		type: 'sprites',
		src: './assets/sprites/reelsFrame/reels_frame.json',
	},
	payFrame: {
		type: 'sprite',
		src: './assets/sprites/payFrame/payFrame.png',
	},
	anticipation: {
		type: 'spine',
		src: {
			atlas: './assets/spines/anticipation/anticipation.atlas',
			skeleton: './assets/spines/anticipation/anticipation.json',
			scale: 2,
		},
	},
	// NOT: 'gold' bitmap fontu artık xml'den yüklenmiyor — Ranchers TTF'inden
	// runtime'da üretiliyor (bkz. installGoldFont.ts, +layout.svelte). Eski
	// mm_gold.xml burada kalsaydı AssetsLoader onu yükleyip Ranchers-gold'u ezerdi.
	goldBlur: {
		type: 'font',
		src: './assets/fonts/goldBlur/miningfont_gold_blur.xml',
	},
	silverFont: {
		type: 'font',
		src: './assets/fonts/silverFont/mm_silver.xml',
	},
	purpleFont: {
		type: 'font',
		src: './assets/fonts/purpleFont/mm_purple.xml',
	},
	bigwin: {
		type: 'spine',
		src: {
			atlas: './assets/spines/bigwin/mm_bigwin.atlas',
			skeleton: './assets/spines/bigwin/mm_bigwin.json',
			scale: 2,
		},
	},
	globalMultiplier: {
		type: 'spine',
		src: {
			atlas: './assets/spines/globalMultiplier/multiframe.atlas',
			skeleton: './assets/spines/globalMultiplier/multiframe.json',
			scale: 2,
		},
	},
	// Custom backing plate for the global-multiplier panel — injected into the
	// multiframe spine's `Frame_Multiplier` slot (covers the old frame art);
	// see GlobalMultiplier.svelte.
	boardMultiplierPart: { type: 'sprite', src: './BoardmultiplierPart.png', preload: true },
	fsIntro: {
		type: 'spine',
		src: {
			atlas: './assets/spines/fsIntro/fs_screen.atlas',
			skeleton: './assets/spines/fsIntro/fs_screen.json',
			scale: 2,
		},
	},
	// fsIntroNumber / fsOutroNumber kaldırıldı — yeni fsIntro export'u sayı
	// çerçevesi spine'larını (fs_screen_number.json / fs_total_number.json) ve
	// atlas region'larını içermiyor. Sayılar artık FreeSpinIntro/Outro'da
	// doğrudan text olarak gösteriliyor.
	tumble_multiplier: {
		type: 'spine',
		src: {
			atlas: './assets/spines/tumbleWin/tumble_win.atlas',
			skeleton: './assets/spines/tumbleWin/tumble_multiplier.json',
			scale: 2,
		},
	},
	tumble_win: {
		type: 'spine',
		src: {
			atlas: './assets/spines/tumbleWin/tumble_win.atlas',
			skeleton: './assets/spines/tumbleWin/tumble_win.json',
			scale: 2,
		},
	},
	// Tumble kazancı çarpanla çarpılırken oynayan patlama (eski tumble_win
	// 'explosion' animasyonu yerine). Tek animasyon: 'tumblewin'. static/tumblewinexplosion/.
	tumbleWinExplosion: {
		type: 'spine',
		src: {
			atlas: './tumblewinexplosion/tumblewinexplosion.atlas',
			skeleton: './tumblewinexplosion/tumblewinexplosion.json',
			scale: 2,
		},
	},
	progressBar: {
		type: 'sprites',
		src: './assets/sprites/progressBar/progressBar.json',
		preload: true,
	},
	freeSpins: {
		type: 'sprites',
		src: './assets/sprites/freeSpins/freeSpins.json',
	},
	winSmall: {
		type: 'sprites',
		src: './assets/sprites/winSmall/MM_Localisation_winsmall.json',
	},
	clusterWin: {
		type: 'spine',
		src: {
			atlas: './assets/spines/clusterWin/clusterpay.atlas',
			skeleton: './assets/spines/clusterWin/clusterpay.json',
			scale: 2,
		},
	},
	transition: {
		type: 'spine',
		src: {
			atlas: './assets/spines/transition/transition.atlas',
			skeleton: './assets/spines/transition/transition.json',
			scale: 2,
		},
	},
	// Skill aktivasyon animasyonu — 4 skill için 4 animasyon
	// (wildstrike/overload/powersurge/megabolt _intro). static/skillActivated/.
	skillActivated: {
		type: 'spine',
		src: {
			atlas: './skillActivated/skillActivated.atlas',
			skeleton: './skillActivated/skillActivated.json',
			scale: 2,
		},
	},
	symbolsStatic: {
		type: 'sprites',
		src: './assets/sprites/symbolsStatic/symbolsStatic.json',
	},
	coins: {
		type: 'spriteSheet',
		src: './assets/sprites/coin/SD2_Coin.json',
	},
	sound: {
		type: 'audio',
		src: './assets/audio/sounds.json',
		preload: true,
	},
	// UI icons — Material Icons (Apache 2.0). White-filled SVGs at 192×192;
	// tinted at the Sprite level so a single asset re-themes per button.
	iconRefresh: { type: 'sprite', src: './OverChargedAssets/ui-icons/refresh.svg', preload: true },
	iconStop: { type: 'sprite', src: './OverChargedAssets/ui-icons/stop.svg', preload: true },
	iconAutoSpin: { type: 'sprite', src: './OverChargedAssets/ui-icons/autoSpin.svg', preload: true },
	// Autoplay (repeat) ve Turbo: aktif/varsayılan AYRI görseller. Buton aktif
	// duruma göre *Active / default arasında geçiş yapar (bkz. ButtonAutoSpin /
	// ButtonTurbo). Renkli PNG oldukları için UiButton'da icon tint'i beyaz tutulur.
	iconRepeat: { type: 'sprite', src: './menu/autoplayButton_default.png', preload: true },
	iconRepeatActive: { type: 'sprite', src: './menu/autoplayButton_active.png', preload: true },
	iconTurbo: { type: 'sprite', src: './menu/turboButton_default.png', preload: true },
	iconTurboActive: { type: 'sprite', src: './menu/turboButton_active.png', preload: true },
	// Menü iconları artık static/menu/ altındaki renkli PNG'ler (beyaz SVG + tint
	// yerine). Idle'da beyaz tint olduğu için renkler doğru çıkar.
	iconMenu: { type: 'sprite', src: './menu/menuButton.png', preload: true },
	iconMenuExit: { type: 'sprite', src: './menu/closeIcon.png', preload: true },
	iconSettings: { type: 'sprite', src: './menu/settingsIcon.png', preload: true },
	// payTable'ın menu/ klasöründe karşılığı yok — eski SVG kalıyor.
	iconPayTable: { type: 'sprite', src: './OverChargedAssets/ui-icons/payTable.svg', preload: true },
	iconInfo: { type: 'sprite', src: './menu/infoIcon.png', preload: true },
	iconSoundOn: { type: 'sprite', src: './menu/soundOnIcon.png', preload: true },
	iconSoundOff: { type: 'sprite', src: './menu/soundOffIcon.png', preload: true },
	iconIncrease: { type: 'sprite', src: './menu/plusButton.png', preload: true },
	iconDecrease: { type: 'sprite', src: './menu/minusButton.png', preload: true },
	iconBuyBonus: { type: 'sprite', src: './menu/bonusButton.png', preload: true },
	// Ana spin butonu — komple buton görseli (zemin + ring + icon PNG'de baked).
	// playButtonSpin = idle (spin oku), playButtonStop = spinning (yeşil dur karesi,
	// dosya adı "autoplay" ama işlevi STOP durumudur).
	playButtonSpin: { type: 'sprite', src: './menu/PlayButton_default.png', preload: true },
	playButtonStop: { type: 'sprite', src: './menu/PlayButton_autoplay.png', preload: true },
} as const;
