<script lang="ts" module>
	import ClusterWinAmount, { type RawWin, type Win } from './ClusterWinAmount.svelte';

	export type EmitterEventClusterWinAmounts = {
		type: 'showClusterWinAmounts';
		wins: RawWin[];
	};
</script>

<script lang="ts">
	import BoardContainer from './BoardContainer.svelte';
	import { getContext } from '../game/context';

	const context = getContext();

	let wins: Win[] = $state([]);

	context.eventEmitter.subscribeOnMount({
		// Not awaited by the caller (winInfo fires this and moves on) — batches
		// from consecutive tumbles can be floating away at the same time, so
		// wins are additive (each removes only itself on complete) rather than
		// replacing the whole array like a single blocking batch would.
		showClusterWinAmounts: (emitterEvent) => {
			// Wins whose cluster centroid rounds to the same board cell would
			// otherwise render exactly on top of each other; stagger duplicates,
			// counting any still-floating wins from a previous batch too so a
			// new batch never lands on top of one that hasn't finished yet.
			const cellCounts = new Map<string, number>();
			for (const w of wins) {
				const cellKey = `${w.reel},${w.row}`;
				cellCounts.set(cellKey, Math.max(cellCounts.get(cellKey) ?? 0, (w.collisionOffset ?? 0) + 1));
			}
			const newWins: Win[] = emitterEvent.wins.map((rawWin) => {
				const cellKey = `${rawWin.reel},${rawWin.row}`;
				const collisionOffset = cellCounts.get(cellKey) ?? 0;
				cellCounts.set(cellKey, collisionOffset + 1);
				const win: Win = { ...rawWin, collisionOffset, oncomplete: () => {} };
				win.oncomplete = () => {
					wins = wins.filter((w) => w !== win);
				};
				return win;
			});
			wins = [...wins, ...newWins];
		},
		skipAnimation: () => {
			// Resolve every in-flight win label immediately — caller's flow
			// doesn't wait on these anyway, but skip should still clear them.
			for (const win of wins) win.oncomplete();
		},
	});
</script>

<BoardContainer>
	{#each wins as win}
		<ClusterWinAmount {win} />
	{/each}
</BoardContainer>
