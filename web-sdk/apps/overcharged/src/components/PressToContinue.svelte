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
</script>

<MainContainer alignVertical="bottom">
	<!-- Eski pressToContinueText_{lang}.png sprite'ı yerine Ranchers font-text. -->
	<Text
		text={stateI18nDerived.translate('PRESS ANYWHERE TO CONTINUE')}
		anchor={{ x: 0.5, y: 1 }}
		x={context.stateLayoutDerived.mainLayout().width * 0.5}
		y={context.stateLayoutDerived.mainLayout().height - 20}
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
