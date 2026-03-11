import type { ComponentProps } from 'svelte';
import App from './App.svelte';
import Text from './Text.svelte';
type TextProps = ComponentProps<typeof Text>;
import Container from './Container.svelte';
type ContainerProps = ComponentProps<typeof Container>;
import Rectangle from './Rectangle.svelte';
type RectangleProps = ComponentProps<typeof Rectangle>;
import Circle from './Circle.svelte';
type CircleProps = ComponentProps<typeof Circle>;
import Graphics from './Graphics.svelte';
type GraphicsProps = ComponentProps<typeof Graphics>;
import AnimatedSprite from './AnimatedSprite.svelte';
type AnimatedSpriteProps = ComponentProps<typeof AnimatedSprite>;
import SpriteSheet from './SpriteSheet.svelte';
type SpriteSheetProps = ComponentProps<typeof SpriteSheet>;
import Sprite from './Sprite.svelte';
type SpriteProps = ComponentProps<typeof Sprite>;
import BaseSprite from './BaseSprite.svelte';
type BaseSpriteProps = ComponentProps<typeof BaseSprite>;
import BaseSpineProvider, {
	type Props as BaseSpineProviderProps,
} from './BaseSpineProvider.svelte';
import SpineProvider from './SpineProvider.svelte';
type SpineProviderProps = ComponentProps<typeof SpineProvider>;
import SpineEventEmitterProvider, {
	type Props as SpineEventEmitterProviderProps,
} from './SpineEventEmitterProvider.svelte';
import SpineTrack from './SpineTrack.svelte';
type SpineTrackProps = ComponentProps<typeof SpineTrack>;
import SpineBone from './SpineBone.svelte';
type SpineBoneProps = ComponentProps<typeof SpineBone>;
import SpineSlot from './SpineSlot.svelte';
type SpineSlotProps = ComponentProps<typeof SpineSlot>;
import ParticleContainer, {
	type Props as ParticleContainerProps,
} from './ParticleContainer.svelte';
import Particles from './Particles.svelte';
type ParticlesProps = ComponentProps<typeof Particles>;
import BitmapText from './BitmapText.svelte';
type BitmapTextProps = ComponentProps<typeof BitmapText>;
import ParticleEmitter from './ParticleEmitter.svelte';
type ParticleEmitterProps = ComponentProps<typeof ParticleEmitter>;

export {
	App,
	Text,
	Container,
	Rectangle,
	Circle,
	Graphics,
	AnimatedSprite,
	SpriteSheet,
	Sprite,
	BaseSprite,
	BaseSpineProvider,
	SpineProvider,
	SpineEventEmitterProvider,
	SpineTrack,
	SpineBone,
	SpineSlot,
	ParticleContainer,
	Particles,
	BitmapText,
	ParticleEmitter,
};

export type {
	TextProps,
	ContainerProps,
	RectangleProps,
	CircleProps,
	GraphicsProps,
	AnimatedSpriteProps,
	SpriteSheetProps,
	SpriteProps,
	BaseSpriteProps,
	BaseSpineProviderProps,
	SpineProviderProps,
	SpineEventEmitterProviderProps,
	SpineTrackProps,
	SpineBoneProps,
	SpineSlotProps,
	ParticleContainerProps,
	ParticlesProps,
	BitmapTextProps,
	ParticleEmitterProps,
};
