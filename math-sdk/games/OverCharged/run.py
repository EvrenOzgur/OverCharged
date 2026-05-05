"""Main file for generating results for sample ways-pay game."""

import sys
import os

# Add math-sdk root to sys.path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "../../")))

import json

from gamestate import GameState
from game_config import GameConfig
from game_optimization import OptimizationSetup
from optimization_program.run_script import OptimizationExecution
from utils.game_analytics.run_analysis import create_stat_sheet
from utils.rgs_verification import execute_all_tests
from src.state.run_sims import create_books
from src.write_data.write_configs import generate_configs


def patch_fe_config_with_custom_fields(gamestate):
    """Inject OverCharged-specific fields into the frontend config so the client
    does not need to hardcode gameplay constants."""
    fe_path = os.path.join(
        gamestate.output_files.config_path,
        f"config_fe_{gamestate.config.game_id}.json",
    )
    with open(fe_path, "r", encoding="UTF-8") as f:
        fe = json.load(f)

    fe["skillThresholds"] = gamestate.config.skill_thresholds
    fe["multiplierWeights"] = gamestate.config.multiplier_weights
    fe["l3FactorRange"] = gamestate.config.l3_factor_range
    fe["mSpawnRate"] = gamestate.config.m_spawn_rate
    fe["freespinTriggers"] = {
        gamestate.config.basegame_type: gamestate.config.freespin_triggers[gamestate.config.basegame_type],
        gamestate.config.freegame_type: gamestate.config.freespin_triggers[gamestate.config.freegame_type],
    }

    with open(fe_path, "w", encoding="UTF-8") as f:
        json.dump(fe, f, indent=4)


def _flatten_paytable(paytable):
    """`convert_range_table` produces {(cluster_size, symbol): payout}.
    Flatten into {symbol: {cluster_size: payout}} for the web client."""
    flat = {}
    for (cluster_size, symbol), payout in paytable.items():
        flat.setdefault(symbol, {})[str(cluster_size)] = payout
    return flat


def write_web_sdk_config(gamestate):
    """Write the canonical math config consumed by web-sdk's `config.ts`.

    Both the math-side `library/configs/config_web_OverCharged.json` and the
    web-sdk source tree copy at `web-sdk/apps/overcharged/src/game/mathConfig.json`
    are produced. Frontend `config.ts` reads the latter so paytable / skill /
    bet-mode values cannot drift from math without a code change.
    """
    cfg = gamestate.config
    payload = {
        "providerName": cfg.provider_name,
        "gameName": cfg.game_name,
        "gameID": cfg.game_id,
        "rtp": cfg.rtp,
        "wincap": cfg.wincap,
        "numReels": cfg.num_reels,
        "numRows": list(cfg.num_rows),
        "betModes": {
            bm.get_name(): {
                "cost": bm.get_cost(),
                "rtp": bm.get_rtp(),
                "max_win": bm.get_wincap(),
                "feature": bm.get_feature(),
                "buyBonus": bm.get_buybonus(),
            }
            for bm in cfg.bet_modes
        },
        "skillThresholds": cfg.skill_thresholds,
        "multiplierWeights": {str(k): v for k, v in cfg.multiplier_weights.items()},
        "l3FactorRange": list(cfg.l3_factor_range),
        "mSpawnRate": cfg.m_spawn_rate,
        "freespinTriggers": {
            cfg.basegame_type: {str(k): v for k, v in cfg.freespin_triggers[cfg.basegame_type].items()},
            cfg.freegame_type: {str(k): v for k, v in cfg.freespin_triggers[cfg.freegame_type].items()},
        },
        "paytables": _flatten_paytable(cfg.paytable),
    }

    math_out = os.path.join(
        gamestate.output_files.config_path,
        f"config_web_{cfg.game_id}.json",
    )
    with open(math_out, "w", encoding="UTF-8") as f:
        json.dump(payload, f, indent=4)

    web_out = os.path.abspath(
        os.path.join(
            os.path.dirname(__file__),
            "..", "..", "..",
            "web-sdk", "apps", "overcharged", "src", "game", "mathConfig.json",
        )
    )
    if os.path.isdir(os.path.dirname(web_out)):
        with open(web_out, "w", encoding="UTF-8") as f:
            json.dump(payload, f, indent=4)
        print(f"[write_web_sdk_config] wrote {web_out}")
    else:
        print(f"[write_web_sdk_config] web-sdk path not found, skipped: {web_out}")

if __name__ == "__main__":

    num_threads = 1
    rust_threads = 1
    batching_size = 50000
    compression = True
    profiling = False

    num_sim_args = {
        "base": int(1e5),
        "bonus": int(1e5),
    }

    run_conditions = {
        "run_sims": True,
        "run_optimization": True,
        "run_analysis": True,
        "run_format_checks": True,
    }
    target_modes = ["base", "bonus"]

    config = GameConfig()
    gamestate = GameState(config)
    if run_conditions["run_optimization"] or run_conditions["run_analysis"]:
        optimization_setup_class = OptimizationSetup(config)

    if run_conditions["run_sims"]:
        create_books(
            gamestate,
            config,
            num_sim_args,
            batching_size,
            num_threads,
            compression,
            profiling,
        )

    generate_configs(gamestate)
    patch_fe_config_with_custom_fields(gamestate)
    write_web_sdk_config(gamestate)

    if run_conditions["run_optimization"]:
        OptimizationExecution().run_all_modes(config, target_modes, rust_threads)
        generate_configs(gamestate)
        patch_fe_config_with_custom_fields(gamestate)
        write_web_sdk_config(gamestate)

    if run_conditions["run_analysis"]:
        custom_keys = [{"symbol": "scatter"}]
        create_stat_sheet(gamestate, custom_keys=custom_keys)

    if run_conditions["run_format_checks"]:
        execute_all_tests(config)
