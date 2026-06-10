<!--
	Diagnostic overlay for the auto-resolution feature. Shows the live canvas
	size, derived layoutType, and which UI config (resolution preset) is
	currently in effect. Resize the window and watch the "config" line flip as
	you cross a preset breakpoint.

	Opt-in only: append `?uidebug=1` to the URL (or set localStorage uidebug=1).
	Renders nothing otherwise, so it is safe to leave mounted.
-->
<script lang="ts">
	import { Container, Text, Rectangle } from 'pixi-svelte';
	import { getContext } from '../game/context';
	import { getActiveConfigLabel } from '../game/uiLayoutConfig.svelte';

	const context = getContext();

	const enabled = (() => {
		try {
			const loc = (globalThis as any)?.location;
			if (loc?.search && /[?&]uidebug=1\b/.test(loc.search)) return true;
			return (globalThis as any)?.localStorage?.getItem('uidebug') === '1';
		} catch {
			return false;
		}
	})();

	const cs = $derived(context.stateLayoutDerived.canvasSizes());
	const layoutType = $derived(context.stateLayoutDerived.layoutType());
	const label = $derived(
		getActiveConfigLabel({ width: cs.width, height: cs.height, layoutType }),
	);
	const ratio = $derived((cs.width / (cs.height || 1)).toFixed(2));

	const lines = $derived(
		[
			`canvas: ${Math.round(cs.width)} x ${Math.round(cs.height)}  (ratio ${ratio})`,
			`layoutType: ${layoutType}`,
			`config: ${label}`,
		].join('\n'),
	);
</script>

{#if enabled}
	<Container x={8} y={8} zIndex={100000}>
		<Rectangle width={420} height={66} backgroundColor={0x000000} alpha={0.6} />
		<Text
			text={lines}
			style={{ fill: 0x39ff14, fontSize: 16, fontFamily: 'monospace', lineHeight: 20 }}
			x={8}
			y={6}
		/>
	</Container>
{/if}
