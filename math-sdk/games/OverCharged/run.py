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

if __name__ == "__main__":

    num_threads = 1
    rust_threads = 1
    batching_size = 50000
    compression = True
    profiling = False

    num_sim_args = {
        "base": int(1e4),
        "bonus": int(1e4),
    }

    run_conditions = {
        "run_sims": True,
        "run_optimization": False,
        "run_analysis": False,
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

    if run_conditions["run_optimization"]:
        OptimizationExecution().run_all_modes(config, target_modes, rust_threads)
        generate_configs(gamestate)
        patch_fe_config_with_custom_fields(gamestate)

    if run_conditions["run_analysis"]:
        custom_keys = [{"symbol": "scatter"}]
        create_stat_sheet(gamestate, custom_keys=custom_keys)

    if run_conditions["run_format_checks"]:
        execute_all_tests(config)
