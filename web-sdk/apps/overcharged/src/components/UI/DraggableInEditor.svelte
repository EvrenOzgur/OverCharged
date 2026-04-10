<script lang="ts">
	import type { Snippet } from 'svelte';
	import { onMount } from 'svelte';
	import { Container, Graphics } from 'pixi-svelte';
	import {
		editorState,
		registerEditableElement,
		unregisterEditableElement,
		getElementStyle,
		type UiElementTransform,
	} from '../../game/uiLayoutConfig.svelte';

	type Props = {
		id: string;
		transform: UiElementTransform;
		/** Compound scale of all ancestor containers, so screen-pixel drag delta
		 *  can be converted into this container's local coordinate space. */
		ancestorScale?: number;
		/** Fallback hit box used until real bounds are measured. */
		fallbackHit?: number;
		children: Snippet;
	};

	const {
		id,
		transform,
		ancestorScale = 1,
		fallbackHit = 80,
		children,
	}: Props = $props();

	let dragging = $state(false);
	let hovered = $state(false);

	let measured = $state<{ x: number; y: number; w: number; h: number } | null>(null);

	let startScreenX = 0;
	let startScreenY = 0;
	let startCfgX = 0;
	let startCfgY = 0;

	const isSelected = $derived(editorState.selected === id);
	const showOutline = $derived(editorState.enabled && (hovered || dragging || isSelected));
	const elStyle = $derived(getElementStyle(id));

	onMount(() => {
		registerEditableElement(id, transform);
		return () => unregisterEditableElement(id);
	});

	function onWindowMove(e: PointerEvent) {
		if (!dragging) return;
		const dx = (e.clientX - startScreenX) / ancestorScale;
		const dy = (e.clientY - startScreenY) / ancestorScale;
		transform.x = Math.round(startCfgX + dx);
		transform.y = Math.round(startCfgY + dy);
	}

	function onWindowUp() {
		if (!dragging) return;
		dragging = false;
		window.removeEventListener('pointermove', onWindowMove);
		window.removeEventListener('pointerup', onWindowUp);
	}

	function onPointerDown(e: any) {
		if (!editorState.enabled) return;
		editorState.selected = id;
		dragging = true;
		startScreenX = e.clientX ?? e.nativeEvent?.clientX ?? 0;
		startScreenY = e.clientY ?? e.nativeEvent?.clientY ?? 0;
		startCfgX = transform.x;
		startCfgY = transform.y;
		window.addEventListener('pointermove', onWindowMove);
		window.addEventListener('pointerup', onWindowUp);
		e?.stopPropagation?.();
	}

	function measureFromGraphics(g: any) {
		const overlay = g?.parent;
		const outer = overlay?.parent;
		if (!outer) return null;

		let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
		let found = false;
		for (const ch of outer.children) {
			if (ch === overlay) continue;
			let b: any;
			try {
				b = ch.getBounds();
			} catch {
				continue;
			}
			// Pixi v8 returns Bounds with .x/.y/.width/.height (or .minX/.maxX)
			const bx = b.x ?? b.minX;
			const by = b.y ?? b.minY;
			const bw = b.width ?? (b.maxX - b.minX);
			const bh = b.height ?? (b.maxY - b.minY);
			if (!isFinite(bx) || !isFinite(by) || (bw === 0 && bh === 0)) continue;
			minX = Math.min(minX, bx);
			minY = Math.min(minY, by);
			maxX = Math.max(maxX, bx + bw);
			maxY = Math.max(maxY, by + bh);
			found = true;
		}
		if (!found) return null;

		// Convert world rect corners to outer's local space.
		const tl = outer.toLocal({ x: minX, y: minY });
		const br = outer.toLocal({ x: maxX, y: maxY });
		const x = Math.min(tl.x, br.x);
		const y = Math.min(tl.y, br.y);
		const w = Math.abs(br.x - tl.x);
		const h = Math.abs(br.y - tl.y);
		return { x, y, w, h };
	}

	function drawOutline(g: any) {
		g.clear();
		if (!editorState.enabled) return;

		// First draw call: schedule a real measurement on next frame.
		if (!measured) {
			requestAnimationFrame(() => {
				const m = measureFromGraphics(g);
				if (m) measured = m;
			});
		}

		const rect = measured ?? {
			x: -fallbackHit,
			y: -fallbackHit,
			w: fallbackHit * 2,
			h: fallbackHit * 2,
		};

		// Always draw a (nearly) transparent fill so the Graphics has a real hit area.
		g.beginFill(0x39ff14, showOutline ? (dragging ? 0.18 : 0.08) : 0.001);
		if (showOutline) {
			g.lineStyle(2, isSelected || dragging ? 0x39ff14 : 0xffffff, 1);
		}
		g.drawRect(rect.x, rect.y, rect.w, rect.h);
		g.endFill();
	}
</script>

<Container
	x={transform.x}
	y={transform.y}
	scale={transform.scale}
	rotation={transform.rotation}
	alpha={elStyle?.alpha ?? 1}
	visible={elStyle?.visible ?? true}
>
	{@render children()}

	{#if editorState.enabled}
		<Container
			eventMode="static"
			cursor={dragging ? 'grabbing' : 'grab'}
			onpointerdown={onPointerDown}
			onpointerover={() => (hovered = true)}
			onpointerout={() => (hovered = false)}
		>
			<Graphics draw={drawOutline} />
		</Container>
	{/if}
</Container>
