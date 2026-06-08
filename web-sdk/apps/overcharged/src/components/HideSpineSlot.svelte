<!--
	Permanently clears the region attachment of the named spine slots so their
	setup art stops drawing — used to drop a legacy frame/background that has
	been replaced by a custom injected object (see GlobalMultiplier.svelte).

	Safe because the targeted slots have no attachment timelines (animations only
	tween their colour), so a one-shot null persists; the few delayed re-applies
	cover async skeleton/asset settle timing. Mount inside a SpineProvider.
-->
<script lang="ts">
	import { getContextSpine } from 'pixi-svelte';

	const { slotNames }: { slotNames: string[] } = $props();
	const spine = getContextSpine();

	$effect(() => {
		if (!spine?.skeleton) return;
		const apply = () => {
			for (const name of slotNames) {
				const slot = (spine.skeleton as any).findSlot(name);
				if (slot && slot.getAttachment()) slot.setAttachment(null);
			}
		};
		apply();
		const timers = [50, 200, 600].map((d) => setTimeout(apply, d));
		return () => timers.forEach(clearTimeout);
	});
</script>
