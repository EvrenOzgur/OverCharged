<script lang="ts" module>
	import ClusterWinAmount, { type RawWin, type Win } from './ClusterWinAmount.svelte';

	export type EmitterEventClusterWinAmounts = {
		type: 'showClusterWinAmounts';
		wins: RawWin[];
	};
</script>

<script lang="ts">
	import { waitForResolve } from 'utils-shared/wait';

	import BoardContainer from './BoardContainer.svelte';
	import { getContext } from '../game/context';

	const context = getContext();

	let wins: Win[] = $state([]);

	context.eventEmitter.subscribeOnMount({
		showClusterWinAmounts: async (emitterEvent) => {
			// Wins whose cluster centroid rounds to the same board cell would
			// otherwise render exactly on top of each other; stagger duplicates.
			const cellCounts = new Map<string, number>();
			wins = emitterEvent.wins.map((rawWin) => {
				const cellKey = `${rawWin.reel},${rawWin.row}`;
				const collisionOffset = cellCounts.get(cellKey) ?? 0;
				cellCounts.set(cellKey, collisionOffset + 1);
				return { ...rawWin, collisionOffset, oncomplete: () => {} };
			});
			const gerPromises = () =>
				wins.map(async (win) => {
					await waitForResolve((resolve) => (win.oncomplete = resolve));
				});
			await Promise.all(gerPromises());
			wins = [];
		},
		skipAnimation: () => {
			// Resolve every in-flight win count-up so Promise.all completes
			// immediately — caller's flow advances without waiting for the tween.
			for (const win of wins) win.oncomplete();
		},
	});
</script>

<BoardContainer>
	{#each wins as win}
		<ClusterWinAmount {win} />
	{/each}
</BoardContainer>
