<script lang="ts" module>
	import type { Snippet } from 'svelte';
	import * as SPINE_PIXI from '@esotericsoftware/spine-pixi-v8';

	import type { OverwriteCursor } from '../types';

	export type Props = OverwriteCursor<Omit<SPINE_PIXI.SpineOptions, 'children'>> & {
		spineData: SPINE_PIXI.SkeletonData;
		children: Snippet;
		skin?: string;
	};
</script>

<script lang="ts">
	import { propsSyncEffect } from '../utils.svelte';
	import { setContextSpine, getContextParent } from '../context.svelte';

	const props: Props = $props();
	const parentContext = getContextParent();
	const spine = new SPINE_PIXI.Spine(props.spineData);

	propsSyncEffect({ props, target: spine, ignore: ['children', 'skin'] });

	$effect(() => {
		if (props.skin) {
			try {
				spine.skeleton.setSkinByName(props.skin);
				spine.skeleton.setSlotsToSetupPose();
			} catch (error) {
				console.error(`Error setting skin "${props.skin}":`, error);
			}
		}
	});

	parentContext.addToParent(spine);
	setContextSpine(spine);
</script>

{@render props.children()}
