<!--
	Brief 300ms colored highlight on the cells a skill is about to affect.
	Fires BEFORE the skill's actual animation runs so the player gets a
	"preview" beat — anticipation increases the felt impact of the change.

	Game.svelte broadcasts 'skillPreHighlight' { positions, color }, this
	component fades in colored rounded rectangles over those cells, holds
	briefly, then fades out. Drawn inside BoardContainer so it shares the
	same coordinate space as the board cells.
-->
<script lang="ts" module>
	import type { Position } from '../game/types';
	export type EmitterEventSkillPreHighlight = {
		type: 'skillPreHighlight';
		positions: Position[];
		color: number;
		holdMs?: number;
	};
</script>

<script lang="ts">
	import { Container, Graphics } from 'pixi-svelte';
	import { Tween } from 'svelte/motion';
	import { cubicOut, cubicIn } from 'svelte/easing';

	import { getContext } from '../game/context';
	import { getSymbolX, getSymbolY } from '../game/utils';
	import { SYMBOL_SIZE } from '../game/constants';
	import BoardContainer from './BoardContainer.svelte';

	const context = getContext();

	type Pos = { reel: number; row: number };

	let positions = $state<Pos[]>([]);
	let color = $state(0xffffff);
	const alpha = new Tween(0, { duration: 200, easing: cubicOut });

	// Invalidate-on-skip token (see SkillActivatedOverlay for the pattern).
	let runId = 0;
	// Skip sinyali: her `await alpha.set(...)`'i bununla yarıştırıyoruz. Aksi halde
	// skip'in `alpha.set({duration:0/80})`'i, beklenen tween'i Svelte tarafında
	// abort eder ama promise'i fulfill ETMEZ → await sonsuza dek asılır ve
	// runId kontrolüne hiç ulaşılamaz (üst üste Space → akış takılır).
	let skipResolve: (() => void) | null = null;

	context.eventEmitter.subscribeOnMount({
		skillPreHighlight: async ({ positions: p, color: c, holdMs = 200 }) => {
			const id = ++runId;
			positions = p;
			color = c;
			const skipped = new Promise<void>((resolve) => (skipResolve = resolve));
			alpha.set(0, { duration: 0 });
			await Promise.race([alpha.set(0.7, { duration: 140, easing: cubicOut }), skipped]);
			if (id !== runId) return;
			await Promise.race([new Promise((resolve) => setTimeout(resolve, holdMs)), skipped]);
			if (id !== runId) return;
			await Promise.race([alpha.set(0, { duration: 180, easing: cubicIn }), skipped]);
			if (id !== runId) return;
			positions = [];
		},
		skipAnimation: () => {
			if (positions.length === 0) return;
			++runId;
			// Asılı await'leri çöz (orphan tween promise'ine güvenme), sonra hızlı fade.
			skipResolve?.();
			skipResolve = null;
			alpha.set(0, { duration: 80, easing: cubicIn }).then(() => {
				if (alpha.current <= 0.01) positions = [];
			});
		},
	});
</script>

{#if positions.length > 0}
	<BoardContainer>
		<Graphics
			draw={(g) => {
				g.clear();
				const a = alpha.current;
				if (a <= 0) return;
				// Soft outer glow
				g.beginFill(color, a * 0.25);
				for (const p of positions) {
					const x = getSymbolX(p.reel) - SYMBOL_SIZE * 0.5;
					const y = getSymbolY(p.row) - SYMBOL_SIZE * 0.5;
					g.drawRoundedRect(
						x - 4,
						y - 4,
						SYMBOL_SIZE + 8,
						SYMBOL_SIZE + 8,
						10,
					);
				}
				g.endFill();
				// Inner solid pulse
				g.beginFill(color, a * 0.55);
				for (const p of positions) {
					const x = getSymbolX(p.reel) - SYMBOL_SIZE * 0.46;
					const y = getSymbolY(p.row) - SYMBOL_SIZE * 0.46;
					g.drawRoundedRect(x, y, SYMBOL_SIZE * 0.92, SYMBOL_SIZE * 0.92, 6);
				}
				g.endFill();
				// Border for "outline" emphasis
				g.lineStyle(2, color, a * 0.9);
				for (const p of positions) {
					const x = getSymbolX(p.reel) - SYMBOL_SIZE * 0.46;
					const y = getSymbolY(p.row) - SYMBOL_SIZE * 0.46;
					g.drawRoundedRect(x, y, SYMBOL_SIZE * 0.92, SYMBOL_SIZE * 0.92, 6);
				}
				g.lineStyle(0);
			}}
		/>
	</BoardContainer>
{/if}
