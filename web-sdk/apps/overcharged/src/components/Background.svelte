<script lang="ts">
	import { Rectangle, Sprite, SpineProvider, SpineTrack } from 'pixi-svelte';

	import { getContext } from '../game/context';
	import { uiLayoutConfig, hexToPixi } from '../game/uiLayoutConfig.svelte';

	const context = getContext();
	const backgroundProps = $derived(
		context.stateLayoutDerived.normalBackgroundLayout({ scale: 0.5 }),
	);
	const canvasSizes = $derived(context.stateLayoutDerived.canvasSizes());
	const layers = $derived(uiLayoutConfig.bgLayers);

	function responsiveProps(layer: typeof layers[0]) {
		if (layer.useResponsiveLayout) {
			return context.stateLayoutDerived.normalBackgroundLayout({ scale: layer.responsiveScale });
		}
		return { x: layer.x, y: layer.y };
	}
</script>

{#each layers as layer, i (layer.id)}
	{#if layer.visible}
		{#if layer.type === 'color'}
			<Rectangle
				width={canvasSizes.width}
				height={canvasSizes.height}
				backgroundColor={hexToPixi(layer.color)}
				alpha={layer.alpha}
				zIndex={-100 + i}
			/>
		{:else if layer.type === 'sprite' && layer.spriteKey}
			<Sprite
				key={layer.spriteKey}
				{...responsiveProps(layer)}
				scale={{ x: layer.scaleX, y: layer.scaleY }}
				alpha={layer.alpha}
				zIndex={-100 + i}
			/>
		{:else if layer.type === 'spine' && layer.spineKey}
			<SpineProvider
				asset={layer.spineKey}
				{...responsiveProps(layer)}
				scale={{ x: layer.scaleX, y: layer.scaleY }}
				alpha={layer.alpha}
				zIndex={-100 + i}
			>
				{#each layer.spineAnims as anim (anim.trackIndex)}
					<SpineTrack
						trackIndex={anim.trackIndex}
						animationName={anim.animationName}
						loop={anim.loop}
					/>
				{/each}
			</SpineProvider>
		{/if}
	{/if}
{/each}
