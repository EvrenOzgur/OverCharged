<script lang="ts" module>
	import { defineMeta } from '@storybook/addon-svelte-csf';

	const { Story } = defineMeta({
		title: 'MODE_BONUS/book',
	});
</script>

<script lang="ts">
import {
		StoryGameTemplate,
		StoryLocale,
		type TemplateArgs,
		templateArgs,
	} from 'components-storybook';
	import { randomInteger } from 'utils-shared/random';

	import Game from '../components/Game.svelte';
	import { setContext } from '../game/context';
	import { playBet } from '../game/utils';
	import books from './data/bonus_books.json';

	setContext();
</script>

{#snippet template(args: TemplateArgs<any> & { bookIndex?: number })}
	<StoryGameTemplate
		skipLoadingScreen={args.skipLoadingScreen}
		action={async () => {
			let index: number;
			if (args.bookIndex !== undefined && args.bookIndex !== -1) {
				index = args.bookIndex;
			} else {
				index = randomInteger({ min: 0, max: books.length - 1 });
			}
			const data = books[index];
			console.log(`[DEBUG] Playing bonus book at index ${index} (ID: ${data.id})`);
			await playBet({ ...data, state: data.events });
		}}
	>
		<StoryLocale lang="en">
			<Game />
		</StoryLocale>
	</StoryGameTemplate>
{/snippet}

<Story
	name="random"
	args={templateArgs<any>({
		skipLoadingScreen: true,
		bookIndex: -1,
	})}
	{template}
/>
