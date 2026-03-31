<script lang="ts" module>
	import { defineMeta } from '@storybook/addon-svelte-csf';

	const { Story } = defineMeta({
		title: 'Components/<SymbolMultiplier>',
		component: Symbol,
	});
</script>

<script lang="ts">
	import { Container, Text } from 'pixi-svelte';
	import { StoryPixiApp } from 'components-storybook';

	import Symbol from '../components/Symbol.svelte';
	import assets from '../game/assets';

	const MULTIPLIERS = [2, 5, 10, 25, 50, 100, 250, 500];
	const states = ['static', 'land', 'win'];
</script>

<Story name="multipliers">
	{#snippet template()}
		<StoryPixiApp {assets}>
			<Container scale={1}>
				{#each MULTIPLIERS as mult, rowIndex}
					<Text x={50} y={(rowIndex + 1) * 150} text={`${mult}x`} />
					{#each states as state, columnIndex}
						{@const x = (columnIndex + 2) * 150}
						{@const y = (rowIndex + 1) * 150}
						<Symbol {x} {y} rawSymbol={{ name: 'M', multiplier: mult }} {state} loop />
					{/each}
				{/each}
			</Container>
		</StoryPixiApp>
	{/snippet}
</Story>
