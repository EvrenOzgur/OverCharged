import * as SPINE_PIXI from '@esotericsoftware/spine-pixi-v8';
import type { RawType, RawAsset, RawSpine, RawSprites, SpineSrc, RawAudio } from './types';

const PROCESS_METHOD_MAP = {
	spine: ({ key, rawAsset, src }: { key: string; rawAsset: RawSpine; src: SpineSrc }) => {
		const findAsset = (url: string) => {
			if (rawAsset[url]) return rawAsset[url];
			// Fallback 1: try to find by matching the end of the URL
			const entry = Object.entries(rawAsset).find(([cacheKey]) => cacheKey.endsWith(url) || url.endsWith(cacheKey));
			if (entry) return entry[1];
			
			// Fallback 2: match just the filename (last part)
			const filename = url.split('/').pop();
			if (filename) {
				const fileEntry = Object.entries(rawAsset).find(([cacheKey]) => {
					const cacheFilename = cacheKey.split('/').pop();
					return cacheFilename === filename;
				});
				if (fileEntry) return fileEntry[1];
			}
			
			console.warn(`Spine findAsset: Could not find "${url}" in rawAsset. Available keys:`, Object.keys(rawAsset));
			return undefined;
		};

		const atlasAsset = findAsset(src.atlas) as SPINE_PIXI.TextureAtlas;
		const skeletonAsset = findAsset(src.skeleton) as Uint8Array;

		if (!atlasAsset || !skeletonAsset) {
			console.error(`Spine asset processing failed for "${key}". Atlas: ${!!atlasAsset}, Skeleton: ${!!skeletonAsset}`);
			return {};
		}

		const attachmentLoader = new SPINE_PIXI.AtlasAttachmentLoader(atlasAsset);
		const parser =
			skeletonAsset instanceof Uint8Array
				? new SPINE_PIXI.SkeletonBinary(attachmentLoader)
				: new SPINE_PIXI.SkeletonJson(attachmentLoader);
		const scale = src?.scale ?? 1;
		parser.scale = scale;
		const skeletonData = parser.readSkeletonData(skeletonAsset);

		return { [key]: skeletonData };
	},
	sprite: ({ key, rawAsset }: { key: string; rawAsset: RawSprites }) => ({ [key]: rawAsset }),
	sprites: ({ rawAsset }: { rawAsset: RawSprites }) => rawAsset.textures,
	spriteSheet: ({ key, rawAsset }: { key: string; rawAsset: RawSprites }) => ({
		[key]: Object.values(rawAsset.textures),
	}),
	audio: ({ key, rawAsset }: { key: string; rawAsset: RawAudio }) => {
		return { [key]: rawAsset };
	},
} as const;

export const getProcessed = ({
	key,
	type,
	rawAsset,
	src,
}: {
	key: string;
	type: RawType;
	rawAsset: RawAsset;
	src: string | SpineSrc;
}) => {
	if (type === 'font') return; // No need to process raw font data and add it to the loaded assets.
	const processMethod = PROCESS_METHOD_MAP[type];
	if (!processMethod)
		throw Error('No asset process method found, please check the type of the asset.');
	// @ts-expect-error
	return processMethod({ key, rawAsset, src });
};
