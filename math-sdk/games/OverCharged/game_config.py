"""OverCharged game configuration file/setup"""

import os
from src.config.config import Config
from src.config.distributions import Distribution
from src.config.betmode import BetMode


class GameConfig(Config):
    """OverCharged game configuration class."""

    _instance = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
        return cls._instance

    def __init__(self):
        super().__init__()
        self.game_id = "OverCharged"
        self.provider_name = "OverCharged"
        self.game_name = "OverCharged"
        self.provider_number = 0
        self.working_name = "OverCharged"
        self.wincap = 5000.0
        self.win_type = "cluster"
        self.rtp = 0.9500

        # Skill System Configurations
        self.skill_thresholds = {
            "L1": 10, # Adds 2-7 Wilds
            "L2": 16, # Explodes all low-tier symbols
            "L3": 22, # Multiplies global multiplier by 2-3
            "L4": 25, # Drops 3x3 Mega Wild
        }

        # Multiplier symbol (M) weighted value pool — higher values are rarer.
        # Weights are relative; they are normalised at sample time.
        # 2026-05-05 RTP rebalance: high-value M weights reduced (50/100/250/500
        # were inflating bonus-mode tail and producing 3888×/972× outliers).
        self.multiplier_weights = {
            2: 70,
            3: 22,
            5: 6,
            8: 1.5,
            10: 0.4,
            15: 0.06,
            20: 0.03,
            50: 0.01,
            100: 0.005,
            250: 0.001,
            500: 0.0001,
        }
        # L3 blue skill random factor range (multiplicative)
        # 2026-05-05: tightened to fixed ×2 to suppress runaway multiplicative
        # compounding in bonus mode (was [2,3] → 8.49× amplification).
        self.l3_factor_range = [2, 2]
        # Probability that an M symbol on the board remains active.
        # Failing the roll converts the M into a random low-tier symbol.
        # 2026-05-05: reduced from 0.25 to 0.18 to lower per-spin M density.
        self.m_spawn_rate = 0.18
        
        self.construct_paths()

        # Game Dimensions
        self.num_reels = 8
        # Optionally include variable number of rows per reel
        self.num_rows = [8] * self.num_reels
        # Board and Symbol Properties
        # 2026-05-05 RTP rebalance: paytable scaled by 0.50 across the board.
        # Pre-scale: 99% (no-mult) base / 34% (no-mult) bonus → 192% / 290% paid.
        # Multiplier amplification (1.94× base / 8.49× bonus) was the dominant
        # factor; halving the paytable drops the raw closer to 50% / 17% so the
        # optimizer has less scaling to do and large outliers carry less weight.
        # Note: All paytable values are multiples of 0.10 (=10 cents).
        # Stake's rgs_verification.verify_lookup_format asserts payoutMultiplier
        # in the publish lookup table is divisible by 10 — otherwise the
        # bet × payout multiplication wouldn't land on clean cents in every
        # currency. Previously the 0.5× scale produced .05/.25/.75 endings
        # that only passed the check because M-symbol multipliers happened to
        # round most wins back to multiples of 10. After the M-activation fix
        # (only activate when total_win > 0) those "lucky" multiplications
        # stopped covering for non-aligned base values, so 7 entries were
        # nudged ±0.05 to the nearest 0.10.
        t1, t2, t3, t4 = (5, 5), (6, 8), (9, 12), (13, 36)
        pay_group = {
            (t1, "H1"): 2.5,
            (t2, "H1"): 6.3,   # was 6.25
            (t3, "H1"): 10.0,
            (t4, "H1"): 24.0,
            (t1, "H2"): 1.0,
            (t2, "H2"): 2.5,
            (t3, "H2"): 4.0,
            (t4, "H2"): 16.0,
            (t1, "H3"): 0.7,   # was 0.65
            (t2, "H3"): 1.6,
            (t3, "H3"): 2.8,
            (t4, "H3"): 12.0,
            (t1, "H4"): 0.5,
            (t2, "H4"): 1.3,   # was 1.25
            (t3, "H4"): 2.4,
            (t4, "H4"): 8.0,
            (t1, "L1"): 0.3,
            (t2, "L1"): 0.8,   # was 0.75
            (t3, "L1"): 2.0,
            (t4, "L1"): 5.0,
            (t1, "L2"): 0.2,
            (t2, "L2"): 0.6,
            (t3, "L2"): 1.8,   # was 1.75
            (t4, "L2"): 4.0,
            (t1, "L3"): 0.1,
            (t2, "L3"): 0.4,
            (t3, "L3"): 1.3,   # was 1.25
            (t4, "L3"): 2.5,
            (t1, "L4"): 0.1,   # was 0.05
            (t2, "L4"): 0.3,   # was 0.25
            (t3, "L4"): 0.8,   # was 0.75
            (t4, "L4"): 2.0,
        }
        self.paytable = self.convert_range_table(pay_group)

        self.include_padding = True
        self.special_symbols = {"wild": ["W"], "scatter": ["S"], "is_multiplier": ["M"], "multiplier": ["M"]}

        self.freespin_triggers = {
            self.basegame_type: {3: 7, 4: 10, 5: 12, 6: 15, 7: 18, 8: 20},
            self.freegame_type: {2: 2, 3: 3, 4: 5, 5: 7, 6: 10, 7: 13, 8: 16},
        }
        self.anticipation_triggers = {
            self.basegame_type: min(self.freespin_triggers[self.basegame_type].keys()) - 1,
            self.freegame_type: min(self.freespin_triggers[self.freegame_type].keys()) - 1,
        }

        reels = {"BR0": "BR0.csv", "FR0": "FR0.csv", "WCAP": "WCAP.csv"}
        self.reels = {}
        for r, f in reels.items():
            self.reels[r] = self.read_reels_csv(
                os.path.join(self.reels_path, f))

        self.bet_modes = [
            BetMode(
                name="base",
                cost=1.0,
                rtp=self.rtp,
                max_win=self.wincap,
                auto_close_disabled=False,
                is_feature=True,
                is_buybonus=False,
                distributions=[
                    Distribution(
                        criteria="wincap",
                        quota=0.001,
                        win_criteria=self.wincap,
                        conditions={
                            "reel_weights": {
                                self.basegame_type: {"BR0": 1},
                                self.freegame_type: {"WCAP": 1},
                            },
                            "scatter_triggers": {3: 5, 4: 1},
                            "force_wincap": True,
                            "force_freegame": True,
                        },
                    ),
                    Distribution(
                        criteria="freegame",
                        quota=0.002,
                        conditions={
                            "reel_weights": {
                                self.basegame_type: {"BR0": 1},
                                self.freegame_type: {"FR0": 1},
                            },
                            "scatter_triggers": {3: 5, 4: 1},
                            "force_wincap": False,
                            "force_freegame": True,
                        },
                    ),
                    Distribution(
                        criteria="0",
                        quota=0.7,
                        win_criteria=0.0,
                        conditions={
                            "reel_weights": {self.basegame_type: {"BR0": 1}},
                            "force_wincap": False,
                            "force_freegame": False,
                        },
                    ),
                    Distribution(
                        criteria="basegame",
                        quota=0.297,
                        conditions={
                            "reel_weights": {self.basegame_type: {"BR0": 1}},
                            "force_wincap": False,
                            "force_freegame": False,
                        },
                    ),
                ],
            ),
            BetMode(
                # "OVERCHARGED MODE" — persistent ante bet (Stake's "activate"
                # bet-mode type): costs 1.25x the base stake per spin, in
                # exchange for a ~2x natural Free Spins trigger rate (see
                # game_optimization.py opt_params["ante"], hr=100 vs base's
                # hr=200). Stays active across spins until the player toggles
                # it off client-side (is_feature=True — RGS keeps replaying
                # the last-selected mode without a per-spin confirmation,
                # exactly like "base"). Same criteria/scatter_triggers shape
                # as "base", only the quota split shifts probability mass
                # from "0" (dead spin) into "freegame" to feed the higher
                # trigger rate.
                name="ante",
                cost=1.25,
                rtp=self.rtp,
                max_win=self.wincap,
                auto_close_disabled=False,
                is_feature=True,
                is_buybonus=False,
                distributions=[
                    Distribution(
                        criteria="wincap",
                        quota=0.001,
                        win_criteria=self.wincap,
                        conditions={
                            "reel_weights": {
                                self.basegame_type: {"BR0": 1},
                                self.freegame_type: {"WCAP": 1},
                            },
                            "scatter_triggers": {3: 5, 4: 1},
                            "force_wincap": True,
                            "force_freegame": True,
                        },
                    ),
                    Distribution(
                        criteria="freegame",
                        quota=0.004,
                        conditions={
                            "reel_weights": {
                                self.basegame_type: {"BR0": 1},
                                self.freegame_type: {"FR0": 1},
                            },
                            "scatter_triggers": {3: 5, 4: 1},
                            "force_wincap": False,
                            "force_freegame": True,
                        },
                    ),
                    Distribution(
                        criteria="0",
                        quota=0.65,
                        win_criteria=0.0,
                        conditions={
                            "reel_weights": {self.basegame_type: {"BR0": 1}},
                            "force_wincap": False,
                            "force_freegame": False,
                        },
                    ),
                    Distribution(
                        criteria="basegame",
                        quota=0.345,
                        conditions={
                            "reel_weights": {self.basegame_type: {"BR0": 1}},
                            "force_wincap": False,
                            "force_freegame": False,
                        },
                    ),
                ],
            ),
            BetMode(
                name="bonus",
                cost=100,
                rtp=self.rtp,
                max_win=self.wincap,
                auto_close_disabled=False,
                is_feature=False,
                is_buybonus=True,
                distributions=[
                    Distribution(
                        criteria="wincap",
                        quota=0.001,
                        win_criteria=self.wincap,
                        conditions={
                            "reel_weights": {
                                self.basegame_type: {"BR0": 1},
                                self.freegame_type: {"WCAP": 1},
                            },
                            "scatter_triggers": {3: 5, 4: 1},
                            "force_wincap": True,
                            "force_freegame": True,
                        },
                    ),
                    Distribution(
                        criteria="freegame",
                        quota=0.999,
                        conditions={
                            "reel_weights": {
                                self.basegame_type: {"BR0": 1},
                                self.freegame_type: {"FR0": 1},
                            },
                            "scatter_triggers": {3: 5, 4: 1},
                            "force_wincap": False,
                            "force_freegame": True,
                        },
                    ),
                ],
            ),
            BetMode(
                # "SUPER FREE SPINS" — premium bonus buy. Guarantees a longer
                # session (5-7 scatters -> 12/15/18 spins vs "bonus"'s ~7.5-spin
                # average) AND starts the session with the L1 (yellow) skill
                # meter half-filled, so an early Wild-drop trigger is markedly
                # more likely than a cold start. The meter pre-fill itself is
                # set in game_override.py's reset_fs_spin() (gated on
                # self.betmode == "super"), not here — this Distribution only
                # controls the guaranteed scatter count.
                name="super",
                cost=300,
                rtp=self.rtp,
                max_win=self.wincap,
                auto_close_disabled=False,
                is_feature=False,
                is_buybonus=True,
                distributions=[
                    Distribution(
                        criteria="wincap",
                        quota=0.002,
                        win_criteria=self.wincap,
                        conditions={
                            "reel_weights": {
                                self.basegame_type: {"BR0": 1},
                                self.freegame_type: {"WCAP": 1},
                            },
                            "scatter_triggers": {5: 3, 6: 2, 7: 1},
                            "force_wincap": True,
                            "force_freegame": True,
                        },
                    ),
                    Distribution(
                        criteria="freegame",
                        quota=0.998,
                        conditions={
                            "reel_weights": {
                                self.basegame_type: {"BR0": 1},
                                self.freegame_type: {"FR0": 1},
                            },
                            "scatter_triggers": {5: 3, 6: 2, 7: 1},
                            "force_wincap": False,
                            "force_freegame": True,
                        },
                    ),
                ],
            ),
            BetMode(
                # "MULTIPLIER FREE SPINS" — premium bonus buy. Same scatter/spin
                # count as standard "bonus", but the session's global_multiplier
                # starts at 5x instead of 1x, compounding with every M-symbol /
                # L3-skill hit for the rest of the session. Set in
                # game_override.py's reset_fs_spin() (gated on
                # self.betmode == "multiplier") — nothing distribution-level
                # differs here from "bonus".
                name="multiplier",
                cost=500,
                rtp=self.rtp,
                max_win=self.wincap,
                auto_close_disabled=False,
                is_feature=False,
                is_buybonus=True,
                distributions=[
                    Distribution(
                        criteria="wincap",
                        quota=0.002,
                        win_criteria=self.wincap,
                        conditions={
                            "reel_weights": {
                                self.basegame_type: {"BR0": 1},
                                self.freegame_type: {"WCAP": 1},
                            },
                            "scatter_triggers": {3: 5, 4: 1},
                            "force_wincap": True,
                            "force_freegame": True,
                        },
                    ),
                    Distribution(
                        criteria="freegame",
                        quota=0.998,
                        conditions={
                            "reel_weights": {
                                self.basegame_type: {"BR0": 1},
                                self.freegame_type: {"FR0": 1},
                            },
                            "scatter_triggers": {3: 5, 4: 1},
                            "force_wincap": False,
                            "force_freegame": True,
                        },
                    ),
                ],
            ),
        ]

        # Optimisation(rtp, avgWin, hit-rate, recordConditions)
