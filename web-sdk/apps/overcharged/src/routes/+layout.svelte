<script lang="ts">
	import { type Snippet } from 'svelte';
	import { GlobalStyle } from 'components-ui-html';
	import { Authenticate, LoaderStakeEngine, LoadI18n } from 'components-shared';
	import { stateUrlDerived } from 'state-shared';
	import Game from '../components/Game.svelte';
	import ReplayOverlay from '../components/ReplayOverlay.svelte';
	import { setContext } from '../game/context';

	import messagesMap from '../i18n/messagesMap';

	type Props = { children: Snippet };

	const props: Props = $props();

	const loaderUrlStakeEngine = new URL('../../stake-engine-loader.gif', import.meta.url).href;

	const isReplay = $derived(stateUrlDerived.isReplayMode());

	setContext();
</script>

<GlobalStyle>
	<Authenticate>
		<LoadI18n {messagesMap}>
			<Game />
			{#if isReplay}
				<ReplayOverlay />
			{/if}
		</LoadI18n>
	</Authenticate>
</GlobalStyle>

<!-- Stake's required boot loader. The game's own Pixi loading screen takes over
     once assets load; the old "Add Your Loader" placeholder GIF was removed. -->
<LoaderStakeEngine src={loaderUrlStakeEngine} />

{@render props.children()}