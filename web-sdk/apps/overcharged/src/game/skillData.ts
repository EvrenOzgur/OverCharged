// Shared per-skill metadata: name, description, icon shape, theme color.
// Consumed by SkillMeter (in-board UI) and SkillActivatedOverlay (fullscreen
// banner that fires on skillActivated). Kept here so the two stay in lockstep.

export type SkillKind = 'bolt' | 'burst' | 'multiplier' | 'megabolt';
export type SkillKey = 'L1' | 'L2' | 'L3' | 'L4';

export type SkillMeta = {
	name: string;
	description: string;
	kind: SkillKind;
	color: number;
};

// Colors MUST match the low_symbols spine skin assigned to each math symbol
// in constants.ts SYMBOL_INFO_MAP. The math layer counts cluster sizes per
// symbol key (L1/L2/L3/L4 → skill_meters[key]); the player sees the symbol's
// SKIN color. If a meter's bar color disagrees with the symbol skin, players
// see "yellow symbol exploded → red bar filled" which reads as a bug.
//
// Skill → Name        → Skin   → Bar color
//   L1  → WILD STRIKE  → yellow → 0xffd700
//   L2  → OVERLOAD     → green  → 0x00ff00
//   L3  → POWER SURGE  → blue   → 0x4488ff
//   L4  → MEGA BOLT    → red    → 0xff4444
export const SKILL_DATA: Record<SkillKey, SkillMeta> = {
	L1: {
		name: 'WILD STRIKE',
		description: 'Charges random symbols to Wild',
		kind: 'bolt',
		color: 0xffd700,
	},
	L2: {
		name: 'OVERLOAD',
		description: 'Detonates low-tier symbols',
		kind: 'burst',
		color: 0x00ff00,
	},
	L3: {
		name: 'POWER SURGE',
		description: 'Boosts global multiplier',
		kind: 'multiplier',
		color: 0x4488ff,
	},
	L4: {
		name: 'MEGA BOLT',
		description: 'Wild explosion in a 3×3 zone',
		kind: 'megabolt',
		color: 0xff4444,
	},
};

// Draws a stylised skill icon centered at (0, 0) on a Pixi Graphics target.
// `size` is the icon's diameter in pixels (icon fits inside size x size box).
export function drawSkillIcon(g: any, kind: SkillKind, color: number, size = 14) {
	g.clear();
	const s = size;
	if (kind === 'bolt') {
		g.moveTo(-s * 0.15, -s * 0.5);
		g.lineTo(s * 0.35, -s * 0.05);
		g.lineTo(s * 0.05, -s * 0.05);
		g.lineTo(s * 0.25, s * 0.5);
		g.lineTo(-s * 0.35, s * 0.0);
		g.lineTo(-s * 0.05, s * 0.0);
		g.closePath();
		g.fill({ color, alpha: 1 });
	} else if (kind === 'burst') {
		for (let i = 0; i < 8; i++) {
			const a = (i / 8) * Math.PI * 2;
			g.moveTo(Math.cos(a) * s * 0.25, Math.sin(a) * s * 0.25);
			g.lineTo(Math.cos(a) * s * 0.5, Math.sin(a) * s * 0.5);
		}
		g.stroke({ width: 2, color, alpha: 1 });
		g.circle(0, 0, s * 0.18).fill({ color, alpha: 1 });
	} else if (kind === 'multiplier') {
		g.moveTo(-s * 0.4, -s * 0.4);
		g.lineTo(s * 0.4, s * 0.4);
		g.moveTo(s * 0.4, -s * 0.4);
		g.lineTo(-s * 0.4, s * 0.4);
		g.stroke({ width: 2.5, color, alpha: 1 });
		g.circle(-s * 0.4, -s * 0.4, 2);
		g.circle(s * 0.4, -s * 0.4, 2);
		g.circle(-s * 0.4, s * 0.4, 2);
		g.circle(s * 0.4, s * 0.4, 2);
		g.fill({ color, alpha: 1 });
	} else if (kind === 'megabolt') {
		for (const dx of [-s * 0.22, s * 0.18]) {
			g.moveTo(dx + -s * 0.12, -s * 0.5);
			g.lineTo(dx + s * 0.25, -s * 0.05);
			g.lineTo(dx + s * 0.05, -s * 0.05);
			g.lineTo(dx + s * 0.18, s * 0.5);
			g.lineTo(dx + -s * 0.25, s * 0.05);
			g.lineTo(dx + -s * 0.05, s * 0.05);
			g.closePath();
		}
		g.fill({ color, alpha: 1 });
	}
}
