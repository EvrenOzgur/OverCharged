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
			atlas: './OverChargedAssets/loadingScreen/skeleton.atlas',
			skeleton: './OverChargedAssets/loadingScreen/skeleton.json',
			scale: 2,
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
	goldFont: {
		type: 'font',
		src: './assets/fonts/goldFont/mm_gold.xml',
	},
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
			atlas: './assets/spines/bigwin/big_wins.atlas',
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
	fsIntro: {
		type: 'spine',
		src: {
			atlas: './assets/spines/fsIntro/fs_screen.atlas',
			skeleton: './assets/spines/fsIntro/fs_screen.json',
			scale: 2,
		},
	},
	fsIntroNumber: {
		type: 'spine',
		src: {
			atlas: './assets/spines/fsIntro/fs_screen.atlas',
			skeleton: './assets/spines/fsIntro/fs_screen_number.json',
			scale: 2,
		},
	},
	fsOutroNumber: {
		type: 'spine',
		src: {
			atlas: './assets/spines/fsIntro/fs_screen.atlas',
			skeleton: './assets/spines/fsIntro/fs_total_number.json',
			scale: 2,
		},
	},
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
	iconRepeat: { type: 'sprite', src: './OverChargedAssets/ui-icons/repeat.svg', preload: true },
	iconTurbo: { type: 'sprite', src: './OverChargedAssets/ui-icons/turbo.svg', preload: true },
	iconMenu: { type: 'sprite', src: './OverChargedAssets/ui-icons/menu.svg', preload: true },
	iconMenuExit: { type: 'sprite', src: './OverChargedAssets/ui-icons/menuExit.svg', preload: true },
	iconSettings: { type: 'sprite', src: './OverChargedAssets/ui-icons/settings.svg', preload: true },
	iconPayTable: { type: 'sprite', src: './OverChargedAssets/ui-icons/payTable.svg', preload: true },
	iconInfo: { type: 'sprite', src: './OverChargedAssets/ui-icons/info.svg', preload: true },
	iconSoundOn: { type: 'sprite', src: './OverChargedAssets/ui-icons/soundOn.svg', preload: true },
	iconSoundOff: { type: 'sprite', src: './OverChargedAssets/ui-icons/soundOff.svg', preload: true },
	iconIncrease: { type: 'sprite', src: './OverChargedAssets/ui-icons/increase.svg', preload: true },
	iconDecrease: { type: 'sprite', src: './OverChargedAssets/ui-icons/decrease.svg', preload: true },
	iconBuyBonus: { type: 'sprite', src: './OverChargedAssets/ui-icons/buyBonus.svg', preload: true },
} as const;
