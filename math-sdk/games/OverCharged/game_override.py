import random

from src.events.events import reveal_event, tumble_board_event, fs_trigger_event
from src.events.event_constants import EventConstants

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

    def _roll_m_symbol(self, symbol):
        """Resolve one unresolved M: convert it to a random low-tier (spawn-rate
        failure) or lock in its multiplier value (survivor). Returns the
        replacement symbol if converted, otherwise None. Shared by the board
        pass and the padding-buffer pass below so both go through the exact
        same odds and the exact same "m_resolved" marking."""
        low_tiers = ["L1", "L2", "L3", "L4"]
        if random.random() >= self.config.m_spawn_rate:
            return self.create_symbol(random.choice(low_tiers))
        val = random.choices(
            list(self.config.multiplier_weights.keys()),
            weights=list(self.config.multiplier_weights.values()),
            k=1,
        )[0]
        symbol.assign_attribute({"m_resolved": True, "multiplier": val})
        return None

    def _resolve_m_spawns(self, sync_new_symbols: bool = False) -> None:
        # Run the M spawn-rate filter and keep self.board, new_symbols_from_tumble
        # and top_symbols consistent so reveal/tumbleBoard events reflect the
        # symbols the math layer will actually evaluate. Without this sync the
        # client would display an M that the math engine silently converted.
        replacements = {}
        for reel_idx, reel in enumerate(self.board):
            for row_idx, symbol in enumerate(reel):
                if symbol.name != "M" or hasattr(symbol, "m_resolved"):
                    continue
                replacement = self._roll_m_symbol(symbol)
                if replacement is not None:
                    self.board[reel_idx][row_idx] = replacement
                    replacements[id(symbol)] = replacement

        if sync_new_symbols and hasattr(self, "new_symbols_from_tumble"):
            for reel_idx, new_syms in enumerate(self.new_symbols_from_tumble):
                for i, sym in enumerate(new_syms):
                    if id(sym) in replacements:
                        self.new_symbols_from_tumble[reel_idx][i] = replacements[id(sym)]

        if self.config.include_padding and hasattr(self, "top_symbols"):
            for reel_idx, top in enumerate(self.top_symbols):
                if id(top) in replacements:
                    self.top_symbols[reel_idx] = replacements[id(top)]

        # Padding lookahead symbols (top_symbols/bottom_symbols) are created by
        # the base SDK's create_board_reelstrips via the same create_symbol()
        # override, so an M can land there too — but get_clusters_update_wins()
        # only ever scans self.board, never these two lists. Left unresolved, a
        # padding M keeps whatever raw (unfiltered, un-rolled) value it got at
        # creation and is serialized into the reveal event looking exactly like
        # a real, biddable M — yet if its reel never explodes for the rest of
        # the spin, it never enters self.board, is never evaluated, and its
        # value is silently lost even on a spin that otherwise won. Resolving
        # it here, the same way board M's are resolved, keeps every M the
        # player is shown on equal footing: it either fails its spawn roll (and
        # is shown as its converted low-tier instead of M) or survives with a
        # locked multiplier value — never a permanently-unresolved phantom.
        if self.config.include_padding:
            for reel_idx, top in enumerate(getattr(self, "top_symbols", [])):
                if top.name == "M" and not hasattr(top, "m_resolved"):
                    replacement = self._roll_m_symbol(top)
                    if replacement is not None:
                        self.top_symbols[reel_idx] = replacement
            for reel_idx, bottom in enumerate(getattr(self, "bottom_symbols", [])):
                if bottom.name == "M" and not hasattr(bottom, "m_resolved"):
                    replacement = self._roll_m_symbol(bottom)
                    if replacement is not None:
                        self.bottom_symbols[reel_idx] = replacement

    def draw_board(self, emit_event: bool = True, trigger_symbol: str = "scatter") -> None:
        super().draw_board(emit_event=False, trigger_symbol=trigger_symbol)
        self._resolve_m_spawns()
        if emit_event:
            reveal_event(self)

    def tumble_game_board(self):
        self.tumble_board()
        self._fix_new_symbols_from_tumble_offset()
        self._resolve_m_spawns(sync_new_symbols=True)
        tumble_board_event(self)

    def _fix_new_symbols_from_tumble_offset(self) -> None:
        """Correct a base-SDK off-by-one: with include_padding=True (as here),
        Tumble.tumble_board() reports the WRONG symbol as "new" for a reel's
        very first inserted slot each time that reel had an explosion — it
        puts the freshly-created NEXT self.top_symbols (which hasn't entered
        self.board at all yet, it's queued for a FUTURE tumble) into
        new_symbols_from_tumble, instead of the symbol that actually just
        moved from the OLD self.top_symbols into self.board.

        Concretely (verified empirically): for a reel with N exploding
        positions, self.board[reel][:N] ends up holding the N real symbols
        that just landed, but new_symbols_from_tumble[reel] ends up
        containing the new lookahead top_symbols first and is missing the
        real last one — i.e. it's shifted by one relative to self.board.

        new_symbols_from_tumble is exactly what tumble_board_event() (below)
        serializes as the tumbleBoard book event's `newSymbols` — the data
        the client renders as "just fell into place". Left uncorrected, the
        client displays a symbol that is not actually the one math just
        scored at that position, for the first landed symbol of every
        exploding reel, every tumble. This is invisible for ordinary symbols
        (any symbol looks as valid as any other to a player) but glaring for
        an M (multiplier) coin, since its value is directly checkable against
        the round's total — this was the exact bug reported and chased for a
        while as a "multiplier collection" issue, when the real defect was
        this display/score mismatch.

        Fix: for every reel that had new symbols drop in this tumble,
        replace the reported slice with the ACTUAL leading slice of
        self.board (which tumble_board() already correctly populated) —
        restoring a direct positional correspondence. Must run BEFORE
        _resolve_m_spawns(sync_new_symbols=True) so that function's
        id()-based replacement lookups operate against the corrected (real)
        symbol references.
        """
        for reel_idx, new_syms in enumerate(self.new_symbols_from_tumble):
            n = len(new_syms)
            if n > 0:
                self.new_symbols_from_tumble[reel_idx] = list(self.board[reel_idx][:n])

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
        # Allow exactly one red (L4) skill per free-spin session. reset_fs_spin
        # runs once on FS entry, so the flag stays True for the rest of the
        # session after the first trigger (see update_freespin note).
        self.red_skill_used = False
        # global_multiplier is only reset in reset_book (once per BASE round),
        # not here — so a multiplier collected during the triggering base
        # spin's own tumbles (right before/as the scatter landed) was carrying
        # straight into the free-spin session instead of starting fresh at 1x.
        # reset_fs_spin runs exactly once, on FS entry (not per individual free
        # spin — see update_freespin, which resets accumulated_base_win every
        # free spin but deliberately leaves global_multiplier alone so it can
        # keep accumulating ACROSS the free spins within this session). This is
        # the correct single point to zero it going INTO the session.
        self.global_multiplier = 1

    def assign_special_sym_function(self):
        pass

    def _clamped_added_fs(self, scatter_key: str = "scatter") -> int:
        """Map the active scatter count to its freespin award, clamping to the
        highest defined trigger tier.

        The base SDK indexes ``freespin_triggers[self.gametype][count]`` directly
        (executables.update_freespin_amount / update_fs_retrigger_amt). The 8x8
        board could in theory show more scatters than the trigger dict defines
        keys for if the reelstrips are ever rebalanced to carry >1 scatter per
        column, which would raise a KeyError mid-simulation. With the current
        reels each column carries a single scatter (max 8 == the top key), so
        this clamp is purely defensive and changes no live behaviour: a 9+
        scatter board would simply award the same as an 8-scatter board.
        """
        triggers = self.config.freespin_triggers[self.gametype]
        count = self.count_special_symbols(scatter_key)
        return triggers[min(count, max(triggers.keys()))]

    def update_freespin_amount(self, scatter_key: str = "scatter") -> None:
        """Set initial number of spins for a freegame (clamped scatter count)."""
        added_fs = self._clamped_added_fs(scatter_key)
        self.tot_fs = added_fs
        if self.gametype == self.config.basegame_type:
            basegame_trigger, freegame_trigger = True, False
        else:
            basegame_trigger, freegame_trigger = False, True
        fs_trigger_event(
            self, added_fs=added_fs, basegame_trigger=basegame_trigger, freegame_trigger=freegame_trigger
        )

    def update_fs_retrigger_amt(self, scatter_key: str = "scatter") -> None:
        """Update total freespin amount on retrigger (clamped scatter count)."""
        added_fs = self._clamped_added_fs(scatter_key)
        self.tot_fs += added_fs
        fs_trigger_event(self, added_fs=added_fs, freegame_trigger=True, basegame_trigger=False)

    def end_freespin(self) -> None:
        """Emit the bonus-end "TOTAL WIN" event with the full round total.

        The base SDK's ``freespin_end_event`` reports only
        ``win_manager.freegame_wins``, which excludes any win on the base spin
        that triggered the feature. Because the client labels this screen
        "TOTAL WIN" and credits the full round total (``final_win`` ==
        ``running_bet_win``) to the balance, showing only the free-game portion
        made the screen read low whenever the trigger spin also paid — a visible
        mismatch against the credited balance.

        Report the full round total instead, and round to cents with
        ``round(... , 0)`` like every other money event (the base helper used a
        bare ``int()`` truncation that could also drop a cent). ``winLevel`` is
        derived from the same clamped amount so the presentation tier matches
        the number shown.
        """
        win_amount = min(self.win_manager.running_bet_win, self.config.wincap)
        self.book.add_event(
            {
                "index": len(self.book.events),
                "type": EventConstants.FREE_SPIN_END.value,
                "amount": int(round(win_amount * 100, 0)),
                "winLevel": self.config.get_win_level(win_amount, "endFeature"),
            }
        )

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

        # Mirror the base Executables.check_repeat tail: keep the running repeat
        # tally and the periodic "High repeat count" warning. This override
        # previously dropped both, so a hard-to-hit criteria would re-roll
        # silently with no console diagnostic. repeat_count feeds only the
        # warning (not the RNG seed), so restoring it changes no book output.
        self.repeat_count += 1
        self.check_current_repeat_count()
