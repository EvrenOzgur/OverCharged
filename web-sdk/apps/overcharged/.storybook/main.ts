import type { StorybookConfig } from '@storybook/sveltekit';
import { main as baseConfig } from 'config-storybook';

const config: StorybookConfig = {
	...baseConfig,
	stories: ['../src/**/*.mdx', '../src/**/*.stories.@(js|ts|svelte)'],
	staticDirs: ['../static'],
};

export default config;
