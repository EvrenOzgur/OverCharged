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
	// Stable primitive identity for each win label. Comparing/removing by
	// object reference (`w !== win`) broke silently — an element read back
	// out of a `$state` array is a reactive PROXY, which is not reference-
	// equal to the plain object originally pushed in (Svelte warns about
	// this: `state_proxy_equality_mismatch`). That made the filter below a
	// no-op: completed win labels were never actually removed, so `wins`
	// only ever grew for the rest of the round — accumulating more and more
	// live FadeContainer/effect instances the longer a (bonus) round ran,
	// until Svelte's reactive system buckled under the pile-up
	// (`effect_update_depth_exceeded`, minutes into a long free-spin
	// session). Comparing by this `id` instead sidesteps proxy identity
	// entirely.
	let nextWinId = 0;

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
				const id = nextWinId++;
				const win: Win = { ...rawWin, id, collisionOffset, oncomplete: () => {} };
				win.oncomplete = () => {
					wins = wins.filter((w) => w.id !== id);
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
	{#each wins as win (win.id)}
		<ClusterWinAmount {win} />
	{/each}
</BoardContainer>
