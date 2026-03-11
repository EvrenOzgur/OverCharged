import EnablePixiExtension from './src/components/EnablePixiExtension.svelte';
import FadeContainer from './src/components/FadeContainer.svelte';
import LoadingProgress from './src/components/LoadingProgress.svelte';
import WinCountUpProvider from './src/components/WinCountUpProvider.svelte';
import ResponsiveBitmapText from './src/components/ResponsiveBitmapText.svelte';
import ResponsiveText from './src/components/ResponsiveText.svelte';
import type { ComponentProps } from 'svelte';
import Button from './src/components/Button.svelte';
type ButtonProps = ComponentProps<typeof Button>;
import Amount from './src/components/Amount.svelte';
type AmountProps = ComponentProps<typeof Amount>;

export {
	EnablePixiExtension,
	FadeContainer,
	LoadingProgress,
	WinCountUpProvider,
	ResponsiveBitmapText,
	ResponsiveText,
	Amount,
	Button,
};

export type { ButtonProps, AmountProps };
