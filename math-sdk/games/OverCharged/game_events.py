from copy import deepcopy

APPLY_TUMBLE_MULTIPLIER = "applyMultiplierToTumble"
UPDATE_GRID = "updateGrid"
SKILL_ACTIVATED = "skillActivated"
FINAL_MULTIPLIER_APPLIED = "finalMultiplierApplied"

def update_grid_mult_event(gamestate):
    """Pass updated position multipliers after a win."""
    event = {
        "index": len(gamestate.book.events),
        "type": UPDATE_GRID,
        "gridMultipliers": deepcopy(gamestate.position_multipliers),
    }
    gamestate.book.add_event(event)

def emit_skill_activated_event(gamestate, skill_type, action_data=None):
    """
    Emits skillActivated event in the format expected by the frontend.
    skill_type: 'L1', 'L2', 'L3', 'L4'
    """
    event = {
        "index": len(gamestate.book.events),
        "type": SKILL_ACTIVATED,
        "skillType": skill_type,
        "skillMeters": dict(gamestate.skill_meters),
    }
    if action_data:
        event.update(action_data)

    gamestate.book.add_event(event)

def emit_skill_meters_update_event(gamestate):
    """Update meter bars without triggering a skill."""
    event = {
        "index": len(gamestate.book.events),
        "type": SKILL_ACTIVATED,
        "skillType": "UPDATE",
        "skillMeters": dict(gamestate.skill_meters),
    }
    gamestate.book.add_event(event)

def emit_multiplier_symbol_activated_event(gamestate, symbols):
    """
    Emitted when a symbol with a multiplier lands on the board.
    symbols: list of {'reel': int, 'row': int, 'value': int}
    """
    event = {
        "index": len(gamestate.book.events),
        "type": "multiplierSymbolActivated",
        "symbols": symbols,
        "newGlobalMultiplier": gamestate.global_multiplier
    }
    gamestate.book.add_event(event)

def emit_final_multiplier_applied_event(gamestate):
    """
    Emitted at the end of a tumble sequence to multiply the accumulated base win 
    by the total global multiplier collected.
    """
    event = {
        "index": len(gamestate.book.events),
        "type": FINAL_MULTIPLIER_APPLIED,
        "finalMultiplier": gamestate.global_multiplier,
        "baseWin": int(round(gamestate.accumulated_base_win * 100, 0)),
        "totalWin": int(round(gamestate.accumulated_base_win * gamestate.global_multiplier * 100, 0))
    }
    gamestate.book.add_event(event)
