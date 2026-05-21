<script lang="ts">
	import { onMount } from 'svelte';

	import { Text } from 'pixi-svelte';

	import { gameActor } from '../game/actor';
	import { getContext } from '../game/context';

	type Props = {
		debug?: boolean;
	};

	const props: Props = $props();
	const context = getContext();

	onMount(() => {
		const { unsubscribe } = gameActor.subscribe((snapshot) => {
			context.stateXstate.value = snapshot.value;
			// const childActor = snapshot.children[snapshot.value];
		});

		gameActor.start();
		gameActor.send({ type: 'RENDERED' });

		return () => {
			// Equivalent to onDestroy(); Leave this comment for searching.
			unsubscribe();
			gameActor.stop();
		};
	});

	// STAKE-DEBUG: log every actor event dispatched from the UI / lifecycle.
	// Default ON in test/QA; flip off with localStorage.STAKE_DEBUG = '0'.
	const isDebug = () => {
		if (typeof window === 'undefined') return false;
		try {
			const ls = window.localStorage?.getItem('STAKE_DEBUG');
			if (ls === '1') return true;
			if (ls === '0') return false;
		} catch {
			// noop
		}
		const w = window as { __STAKE_DEBUG?: boolean };
		if (w.__STAKE_DEBUG === true) return true;
		if (w.__STAKE_DEBUG === false) return false;
		try {
			const p = new URLSearchParams(window.location.search).get('debug');
			if (p === '1') return true;
			if (p === '0') return false;
		} catch {
			// noop
		}
		return true;
	};
	const dbg = (msg: string) => {
		if (isDebug()) console.log('[STAKE-DEBUG]', msg);
	};

	context.eventEmitter.subscribeOnMount({
		// Connect every actor with app.eventEmitter to avoid call actor directly
		bet: () => {
			dbg('UI emitted BET → gameActor (this is the click → /wallet/play start)');
			gameActor.send({ type: 'BET' });
		},
		autoBet: () => {
			dbg('UI emitted AUTO_BET → gameActor');
			gameActor.send({ type: 'AUTO_BET' });
		},
		resumeBet: () => {
			dbg('UI emitted RESUME_BET → gameActor');
			gameActor.send({ type: 'RESUME_BET' });
		},
		forceResult: () => {
			dbg('UI emitted FORCE_RESULT → gameActor');
			gameActor.send({ type: 'FORCE_RESULT' });
		},
	});
</script>

{#if props.debug}
	<Text
		x={context.stateLayoutDerived.canvasSizes().width}
		anchor={{ x: 1, y: 0 }}
		style={{ fill: 0xffffff }}
		text={JSON.stringify(context.stateXstate.value, undefined, 2)}
	/>
{/if}
