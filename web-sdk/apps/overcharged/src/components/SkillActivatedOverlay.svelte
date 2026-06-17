<!--
	Skill aktivasyonunda tam ekran banner. Artık her skill için ayrı bir spine
	animasyonu oynatıyor (skillActivated spine'ı, 4 animasyon). Eski yer-tutucu
	(programatik ikon + isim + açıklama) kaldırıldı.

	Game.svelte bunu 'skillActivatedDisplay' emitter event'iyle tetikler.
-->
<script lang="ts" module>
	import type { SkillKey } from '../game/skillData';
	export type EmitterEventSkillActivatedDisplay = {
		type: 'skillActivatedDisplay';
		skillKey: SkillKey;
	};
</script>

<script lang="ts">
	import { Container, Rectangle, SpineProvider, SpineTrack } from 'pixi-svelte';
	import { MainContainer } from 'components-layout';

	import { getContext } from '../game/context';
	import type { SkillKey as Key } from '../game/skillData';

	const context = getContext();

	// Her skill -> ilgili spine animasyonu.
	const ANIM_BY_SKILL: Record<Key, string> = {
		L1: 'wildstrike_intro', // WILD STRIKE (sarı)
		L2: 'overload_intro', // OVERLOAD (yeşil)
		L3: 'powersurge_intro', // POWER SURGE (mavi)
		L4: 'megabolt_intro', // MEGA BOLT (kırmızı)
	};

	let activeSkill = $state<Key | null>(null);

	const mainLayout = $derived.by(context.stateLayoutDerived.mainLayout);

	// Stabil listener — inline obje her render'da yeniden oluşup track'i
	// restart etmesin diye component başına bir kez tanımlanıyor.
	const trackListener = { complete: () => (activeSkill = null) };

	context.eventEmitter.subscribeOnMount({
		skillActivatedDisplay: ({ skillKey }) => {
			activeSkill = skillKey;
		},
		skipAnimation: () => {
			activeSkill = null;
		},
	});
</script>

{#if activeSkill}
	<MainContainer>
		<!-- Hafif karartma — animasyon öne çıksın. -->
		<Rectangle
			x={0}
			y={0}
			width={mainLayout.width}
			height={mainLayout.height}
			backgroundColor={0x000000}
			alpha={0.5}
		/>

		<!-- Skill aktivasyon spine'ı, ekran ortasında. -->
		<Container x={mainLayout.width * 0.5} y={mainLayout.height * 0.5}>
			<SpineProvider
				key="skillActivated"
				width={context.stateGameDerived.boardLayout().width * 0.25}
			>
				<SpineTrack
					trackIndex={0}
					animationName={ANIM_BY_SKILL[activeSkill]}
					listener={trackListener}
				/>
			</SpineProvider>
		</Container>
	</MainContainer>
{/if}
