<script lang="ts">
	import { Tween } from 'svelte/motion';

	import { Container, type ContainerProps } from 'pixi-svelte';

	type Props = ContainerProps & {
		show: boolean;
		persistent?: boolean;
		duration?: number;
		oncomplete?: () => void;
	};

	const { show, persistent, duration, oncomplete, children, ...restProps }: Props = $props();

	// Always start faded out, regardless of the initial `show` value, so the
	// first transition to show=true plays a real fade-in. (Previously this was
	// forced via a SEPARATE `onMount` that raced this same effect — both fired
	// near-simultaneously on first mount and both called `alpha.set()` on the
	// same Tween, leaving overlapping/un-settled animation tasks that could
	// keep re-triggering reactive updates well past mount.)
	const alpha = new Tween(0, { duration });

	// Whether the subtree should be mounted at all. Deliberately a plain
	// boolean that only flips at the two moments that matter (fade-in
	// starting, fade-out finishing) — NOT derived from `alpha.current`
	// directly in the template, which would re-evaluate the `{#if}` on every
	// single animation frame of the fade for no reason.
	let mounted = $state(show || Boolean(persistent));

	$effect(() => {
		if (show) {
			mounted = true;
			alpha.set(1, { duration }).then(() => oncomplete?.());
		} else {
			alpha.set(0, { duration }).then(() => {
				if (!persistent) mounted = false;
				oncomplete?.();
			});
		}
	});
</script>

{#if mounted}
	<Container {...restProps} alpha={alpha.current}>
		{@render children()}
	</Container>
{/if}
