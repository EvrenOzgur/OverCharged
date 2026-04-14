import path from 'node:path';
import fs from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import type { StorybookConfig } from '@storybook/sveltekit';
import type { Plugin } from 'vite';
import { main as baseConfig } from 'config-storybook';

// ESM-safe directory resolution
const HERE = path.dirname(fileURLToPath(import.meta.url));
const UI_LAYOUT_FILE = path.resolve(HERE, '../src/game/uiLayout.json');
const SOUND_CONFIG_FILE = path.resolve(HERE, '../src/game/soundConfig.json');

/**
 * Vite plugin: exposes POST /__ui-layout-save which writes the request body
 * (validated JSON) to src/game/uiLayout.json. Used by the Storybook UI layout
 * editor's "Save" button to persist edits to disk.
 */
function uiLayoutSavePlugin(): Plugin {
	return {
		name: 'overcharged-ui-layout-save',
		configureServer(server) {
			console.log('[ui-layout-save] middleware registered →', UI_LAYOUT_FILE);
			server.middlewares.use('/__ui-layout-save', async (req, res) => {
				if (req.method === 'GET') {
					res.statusCode = 200;
					res.end('ui-layout-save endpoint alive');
					return;
				}
				if (req.method !== 'POST') {
					res.statusCode = 405;
					res.end('Method Not Allowed');
					return;
				}
				try {
					const chunks: Buffer[] = [];
					for await (const chunk of req) chunks.push(chunk as Buffer);
					const body = Buffer.concat(chunks).toString('utf8');
					// Validate it's parseable JSON before writing.
					const parsed = JSON.parse(body);
					const pretty = JSON.stringify(parsed, null, 2) + '\n';
					await fs.writeFile(UI_LAYOUT_FILE, pretty, 'utf8');
					res.statusCode = 200;
					res.setHeader('Content-Type', 'application/json');
					res.end(JSON.stringify({ ok: true, path: UI_LAYOUT_FILE }));
				} catch (err) {
					res.statusCode = 400;
					res.end(String(err));
				}
			});
		},
	};
}

/**
 * Vite plugin: exposes POST /__sound-config-save which writes the request body
 * (validated JSON) to src/game/soundConfig.json. Used by the Storybook sound
 * editor's "Save" button to persist edits to disk.
 */
function soundConfigSavePlugin(): Plugin {
	return {
		name: 'overcharged-sound-config-save',
		configureServer(server) {
			console.log('[sound-config-save] middleware registered →', SOUND_CONFIG_FILE);
			server.middlewares.use('/__sound-config-save', async (req, res) => {
				if (req.method === 'GET') {
					res.statusCode = 200;
					res.end('sound-config-save endpoint alive');
					return;
				}
				if (req.method !== 'POST') {
					res.statusCode = 405;
					res.end('Method Not Allowed');
					return;
				}
				try {
					const chunks: Buffer[] = [];
					for await (const chunk of req) chunks.push(chunk as Buffer);
					const body = Buffer.concat(chunks).toString('utf8');
					const parsed = JSON.parse(body);
					const pretty = JSON.stringify(parsed, null, 2) + '\n';
					await fs.writeFile(SOUND_CONFIG_FILE, pretty, 'utf8');
					res.statusCode = 200;
					res.setHeader('Content-Type', 'application/json');
					res.end(JSON.stringify({ ok: true, path: SOUND_CONFIG_FILE }));
				} catch (err) {
					res.statusCode = 400;
					res.end(String(err));
				}
			});
		},
	};
}

const config: StorybookConfig = {
	...baseConfig,
	stories: ['../src/**/*.mdx', '../src/**/*.stories.@(js|ts|svelte)'],
	staticDirs: ['../static'],
	async viteFinal(viteConfig) {
		viteConfig.plugins = viteConfig.plugins ?? [];
		viteConfig.plugins.push(uiLayoutSavePlugin());
		viteConfig.plugins.push(soundConfigSavePlugin());
		return viteConfig;
	},
};

export default config;
