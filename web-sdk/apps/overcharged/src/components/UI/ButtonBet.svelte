<script lang="ts">
	import { Text, Sprite, SpineProvider, SpineTrack } from 'pixi-svelte';
	import { Button, type ButtonProps } from 'components-pixi';
	import { OnHotkey } from 'components-shared';
	import { stateBetDerived } from 'state-shared';

	import HoverAnimContainer from './HoverAnimContainer.svelte';
	import UiSprite from './UiSprite.svelte';
	import ButtonBetProvider from './ButtonBetProvider.svelte';
	import { UI_BASE_FONT_SIZE, UI_BASE_SIZE } from 'components-ui-pixi/src/constants';
	import { i18nDerived } from 'components-ui-pixi/src/i18n/i18nDerived';
	import { getElementStyle, hexToPixi } from '../../game/uiLayoutConfig.svelte';

	const props: Partial<Omit<ButtonProps, 'children'>> = $props();
	const disabled = $derived(!stateBetDerived.isBetCostAvailable());
	const sizes = { width: UI_BASE_SIZE, height: UI_BASE_SIZE };
	const style = $derived(getElementStyle('buttonBet'));
	const textColor = $derived(style ? hexToPixi(style.fontColor) : 0xffffff);
	const fontMult = $derived(style?.fontSize ?? 1);
	const textOverride = $derived(style?.textOverride ?? '');
	const bgType = $derived(style?.bgType ?? 'color');
	const bgSpriteKey = $derived(style?.bgSpriteKey ?? '');
	const bgSpineKey = $derived(style?.bgSpineKey ?? '');
	const bgSpineAnim = $derived(style?.bgSpineAnim ?? '');
	const bgSpineLoop = $derived(style?.bgSpineLoop ?? true);
</script>

<ButtonBetProvider>
	{#snippet children({ key, onpress })}
		<OnHotkey hotkey="Space" {disabled} {onpress} />
		<Button {...props} {sizes} {onpress} {disabled}>
			{#snippet children({ center, hovered })}
				<HoverAnimContainer {...center} {hovered} {disabled} hoverScale={1.08}>
					<!-- Background: sprite / spine / default UiSprite -->
					{#if bgType === 'sprite' && bgSpriteKey}
						<Sprite
							key={bgSpriteKey}
							width={sizes.width}
							height={sizes.height}
							anchor={0.5}
						/>
					{:else if bgType === 'spine' && bgSpineKey}
						<SpineProvider
							key={bgSpineKey}
							width={sizes.width}
							height={sizes.height}
							anchor={0.5}
						>
							{#if bgSpineAnim}
								<SpineTrack trackIndex={0} animationName={bgSpineAnim} loop={bgSpineLoop} />
							{/if}
						</SpineProvider>
					{:else if bgType !== 'color' && (!bgSpriteKey && !bgSpineKey)}
						<UiSprite
							key="bet"
							width={sizes.width}
							height={sizes.height}
							anchor={0.5}
							backgroundColor={0xff9f14}
							borderColor={0xff9f14}
						/>
					{:else}
						<UiSprite
							key="bet"
							width={sizes.width}
							height={sizes.height}
							anchor={0.5}
							{...disabled || ['spin_disabled', 'stop_disabled'].includes(key)
								? {
										backgroundColor: 0xaaaaaa,
									}
								: {}}
						/>
					{/if}
					<Text
						anchor={0.5}
						text={textOverride || (['spin_default', 'spin_disabled'].includes(key)
							? i18nDerived.bet()
							: i18nDerived.stop())}
						style={{
							align: 'center',
							wordWrap: true,
							wordWrapWidth: 200,
							fontFamily: 'proxima-nova',
							fontWeight: '600',
							fontSize: UI_BASE_FONT_SIZE * 0.9 * fontMult,
							fill: textColor,
						}}
					/>
				</HoverAnimContainer>
			{/snippet}
		</Button>
	{/snippet}
</ButtonBetProvider>
