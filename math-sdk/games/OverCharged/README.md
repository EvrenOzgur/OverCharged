# OverCharged - Math SDK Simulation Guide

This folder contains the game-specific logic and configuration for the OverCharged game running within the Stake Math SDK.

## Running Simulations

The simulation script (`run.py`) must be executed from the `math-sdk` root directory to ensure all `src` and `utils` modules are correctly imported.

```bash
# Navigate to the math-sdk root
cd /path/to/math-sdk

# Execute the simulation
python games/OverCharged/run.py
```

## Simulation Configuration

The configuration parameters for the simulation runs can be adjusted directly in `games/OverCharged/run.py`:

- `num_sim_args`: Controls the number of simulations for `base` and `bonus` modes.
- `run_conditions`: Toggle specific processes like `run_sims`, `run_optimization`, `run_analysis`, and `run_format_checks`.
- `compression`: If set to `True`, the simulation output books will be `.jsonl.gz` located in `library/optimization_files`. If `False`, standard `.json` format outputs are generated in `library/books`.

## Game Logic Components

- `game_config.py`: Defines game rules, paytables, symbols, grid dimensions, and behavior distributions (base vs. bonus mode).
- `game_calculations.py`: Overrides default cluster evaluations to apply the unique grid multipliers of OverCharged.
- `game_executables.py`: Contains standard step behaviors for managing grid multiplier values and handling free spins logic.
- `game_events.py`: Defines the `update_grid_mult_event` to correctly log multiplier changes in the generated books.
