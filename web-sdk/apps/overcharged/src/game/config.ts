// Math values (paytable, skill thresholds, multiplier weights, bet modes,
// freespin triggers) are sourced from mathConfig.json so they cannot drift
// from the math-sdk. The math run.py overwrites mathConfig.json on every
// `python run.py`. Symbol meta (special_properties) and provider branding
// remain hardcoded here because the math layer does not own them.
import mathConfig from './mathConfig.json';

type SymbolMeta = { paytable: { [k: string]: number }[] | null; special_properties?: string[] };

const SPECIAL_SYMBOL_META: Record<string, SymbolMeta> = {
	W: { paytable: null, special_properties: ['wild', 'multiplier'] },
	M: { paytable: null, special_properties: ['multiplier'] },
	S: { paytable: null, special_properties: ['scatter'] },
};

const PAYING_SYMBOL_NAMES = ['H1', 'H2', 'H3', 'H4', 'L1', 'L2', 'L3', 'L4'] as const;

const buildSymbols = (): Record<string, SymbolMeta> => {
	const out: Record<string, SymbolMeta> = { ...SPECIAL_SYMBOL_META };
	for (const name of PAYING_SYMBOL_NAMES) {
		const flat = (mathConfig.paytables as Record<string, Record<string, number>>)[name] ?? {};
		out[name] = {
			paytable: Object.entries(flat)
				.sort(([a], [b]) => Number(a) - Number(b))
				.map(([size, payout]) => ({ [size]: payout })),
		};
	}
	return out;
};

export default {
	providerName: mathConfig.providerName,
	gameName: mathConfig.gameName,
	gameID: mathConfig.gameID,
	rtp: mathConfig.rtp,
	numReels: mathConfig.numReels,
	numRows: mathConfig.numRows,
	betModes: mathConfig.betModes,
	skillThresholds: mathConfig.skillThresholds,
	multiplierWeights: Object.fromEntries(
		Object.entries(mathConfig.multiplierWeights).map(([k, v]) => [Number(k), v]),
	) as Record<number, number>,
	l3FactorRange: mathConfig.l3FactorRange as [number, number],
	mSpawnRate: mathConfig.mSpawnRate,
	symbols: buildSymbols(),
	paddingReels: {
		basegame: '',
		freegame: '',
	},
};
