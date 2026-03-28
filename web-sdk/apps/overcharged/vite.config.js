// @ts-ignore
import config from 'config-vite';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));

export default () => {
	const baseConfig = config();
	return {
		...baseConfig,
		server: {
			...baseConfig.server,
			fs: {
				allow: [
					...(baseConfig.server?.fs?.allow || []),
					resolve(__dirname, 'static'),
				],
			},
		},
	};
};
