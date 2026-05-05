import random

from src.events.events import reveal_event, tumble_board_event

from game_executables import GameExecutables


class GameStateOverride(GameExecutables):
    """
    This class is is used to override or extend universal state.py functions.
    e.g: A specific game may have custom book properties to reset
    """

    def __init__(self, config):
        # SKILLS PARAMETERS
        super().__init__(config)
        self.skill_meters = {"L1": 0, "L2": 0, "L3": 0, "L4": 0}
        self.accumulated_base_win = 0

    def create_symbol(self, name: str) -> object:
        # Assign multiplier value at creation so reveal/tumbleBoard events
        # serialize M symbols with an integer value rather than the True flag
        # that Symbol.__init__ sets via special_symbols.
        symObject = super().create_symbol(name)
        if name == "M":
            weights_map = self.config.multiplier_weights
            val = random.choices(
                list(weights_map.keys()),
                weights=list(weights_map.values()),
                k=1,
            )[0]
            symObject.assign_attribute({"multiplier": val})
        return symObject

    def _resolve_m_spawns(self, sync_new_symbols: bool = False) -> None:
        # Run the M spawn-rate filter and keep self.board, new_symbols_from_tumble
        # and top_symbols consistent so reveal/tumbleBoard events reflect the
        # symbols the math layer will actually evaluate. Without this sync the
        # client would display an M that the math engine silently converted.
        low_tiers = ["L1", "L2", "L3", "L4"]
        replacements = {}
        for reel_idx, reel in enumerate(self.board):
            for row_idx, symbol in enumerate(reel):
                if symbol.name != "M" or hasattr(symbol, "m_resolved"):
                    continue
                if random.random() >= self.config.m_spawn_rate:
                    replacement = self.create_symbol(random.choice(low_tiers))
                    self.board[reel_idx][row_idx] = replacement
                    replacements[id(symbol)] = replacement
                else:
                    # Surviving M: assign its multiplier value here so the reveal /
                    # tumbleBoard event serializes `"multiplier": <int>` instead of
                    # the boolean True set by Symbol.__init__. Without this the
                    # client renders the symbol but cannot show its X-value badge
                    # on spins where the M never gets activated (no win to apply).
                    val = random.choices(
                        list(self.config.multiplier_weights.keys()),
                        weights=list(self.config.multiplier_weights.values()),
                        k=1,
                    )[0]
                    symbol.assign_attribute({"m_resolved": True, "multiplier": val})

        if not replacements:
            return

        if sync_new_symbols and hasattr(self, "new_symbols_from_tumble"):
            for reel_idx, new_syms in enumerate(self.new_symbols_from_tumble):
                for i, sym in enumerate(new_syms):
                    if id(sym) in replacements:
                        self.new_symbols_from_tumble[reel_idx][i] = replacements[id(sym)]

        if self.config.include_padding and hasattr(self, "top_symbols"):
            for reel_idx, top in enumerate(self.top_symbols):
                if id(top) in replacements:
                    self.top_symbols[reel_idx] = replacements[id(top)]

    def draw_board(self, emit_event: bool = True, trigger_symbol: str = "scatter") -> None:
        super().draw_board(emit_event=False, trigger_symbol=trigger_symbol)
        self._resolve_m_spawns()
        if emit_event:
            reveal_event(self)

    def tumble_game_board(self):
        self.tumble_board()
        self._resolve_m_spawns(sync_new_symbols=True)
        tumble_board_event(self)

    def reset_book(self):
        # Reset global values used across multiple projects
        super().reset_book()
        # Reset parameters relevant to local game only
        self.tumble_win = 0
        self.skill_meters = {"L1": 0, "L2": 0, "L3": 0, "L4": 0}
        self.red_skill_used = False
        self.global_multiplier = 1
        self.accumulated_base_win = 0

    def reset_fs_spin(self):
        super().reset_fs_spin()
        self.skill_meters = {"L1": 0, "L2": 0, "L3": 0, "L4": 0}

    def assign_special_sym_function(self):
        pass

    def check_repeat(self) -> None:
        """Checks if the spin failed a criteria constraint at any point."""
        if self.repeat is False:
            win_criteria = self.get_current_betmode_distributions().get_win_criteria()
            if win_criteria is not None and self.final_win != win_criteria:
                self.repeat = True

            if self.get_current_distribution_conditions()["force_freegame"] and not (self.triggered_freegame):
                self.repeat = True

            if self.win_manager.running_bet_win == 0 and self.criteria != "0":
                self.repeat = True
