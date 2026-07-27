<script lang="ts">
	import { MainContainer, OnPressFullScreen } from 'components-layout';
	import { OnHotkey } from 'components-shared';
	import { stateI18nDerived } from 'state-shared';
	import { Text } from 'pixi-svelte';

	import { getContext } from '../game/context';

	type Props = {
		onpress: () => void;
	};

	const props: Props = $props();
	const context = getContext();

	// Portrait: a fixed *fraction* of mainLayout().height doesn't translate to a
	// consistent real on-screen gap above the DOM footer, because mainLayout's
	// reference height varies hugely by layoutType (desktop 800, tablet 1000,
	// landscape 900, portrait 1422 - see stateLayout.ts) while the footer's own
	// real height does not scale with it (it's an independent DOM overlay).
	// Measured on Mobile L (415x812, scale≈0.52): the old 85% fraction only
	// cleared ~111 real px above the canvas bottom, well inside the portrait
	// footer's own ~250-300px real height - the text rendered behind it.
	// Fix (portrait only - landscape/tablet aren't reported broken): pick a
	// fixed real-pixel margin and convert it through mainLayout().scale, which
	// (per MainContainer's alignVertical="bottom" math: screenY = canvasHeight
	// - scale*(height - localY)) guarantees that exact on-screen gap regardless
	// of layoutType's differing height/scale.
	const PORTRAIT_FOOTER_SAFE_MARGIN_PX = 320;
	const y = $derived(
		context.stateLayoutDerived.layoutType() === 'portrait'
			? context.stateLayoutDerived.mainLayout().height -
					PORTRAIT_FOOTER_SAFE_MARGIN_PX / context.stateLayoutDerived.mainLayout().scale
			: context.stateLayoutDerived.mainLayout().height * 0.85,
	);
</script>

<MainContainer alignVertical="bottom">
	<!-- Eski pressToContinueText_{lang}.png sprite'ı yerine Ranchers font-text.
	     Footer, canvas'ın üzerine bindirilmiş ayrı bir DOM overlay (z-index
	     100) — bu yüzden Pixi içindeki hiçbir çizim onun ÜSTÜNE çıkamaz,
	     sadece ARKASINDA kalmayacak kadar yukarıda durabilir. `y` hesabı
	     yukarıda (script) — bkz. PORTRAIT_FOOTER_SAFE_MARGIN_PX yorumu. -->
	<Text
		text={stateI18nDerived.translate('PRESS ANYWHERE TO CONTINUE')}
		anchor={{ x: 0.5, y: 1 }}
		x={context.stateLayoutDerived.mainLayout().width * 0.5}
		{y}
		style={{
			fontFamily: 'ranchers',
			fontSize: 28,
			fill: 0xffffff,
			stroke: { color: 0x000000, width: 3 },
			align: 'center',
		}}
	/>
</MainContainer>
<OnHotkey hotkey="Space" onpress={() => props.onpress()} />
<OnPressFullScreen onpress={() => props.onpress()} />
