from src.executables.executables import Executables
import random
from src.calculations.cluster import Cluster
from src.events.events import (
    win_info_event,
    update_freespin_event,
    update_global_mult_event,
)
from game_events import emit_multiplier_symbol_activated_event


class GameExecutables(Executables):
    """Game dependent grouped functions."""

    def _assign_multiplier_value(self, symbol):
        """Assign a weighted random multiplier value to an M symbol if not already set."""
        if not hasattr(symbol, "multiplier"):
            weights_map = self.config.multiplier_weights
            vals = list(weights_map.keys())
            weights = list(weights_map.values())
            val = random.choices(vals, weights=weights, k=1)[0]
            symbol.assign_attribute({"multiplier": val})

    def _apply_m_spawn_filter(self):
        """Roll spawn rate for each unresolved M on the board. Dormant M's are
        converted into a random low-tier symbol; active M's are flagged so the
        roll only happens once per symbol lifetime."""
        low_tiers = ["L1", "L2", "L3", "L4"]
        for reel_idx, reel in enumerate(self.board):
            for row_idx, symbol in enumerate(reel):
                if symbol.name != "M" or hasattr(symbol, "m_resolved"):
                    continue
                if random.random() >= self.config.m_spawn_rate:
                    self.board[reel_idx][row_idx] = self.create_symbol(
                        random.choice(low_tiers)
                    )
                else:
                    symbol.assign_attribute({"m_resolved": True})

    def get_clusters_update_wins(self):
        """Find clusters on board and update win manager.

        Event ordering contract (WITH emit_tumble_win_events + activate_pending_multipliers):
          1) get_clusters_update_wins — evaluates board, stashes pending multiplier activation
          2) emit_tumble_win_events   — emits winInfo (explosion animation)
          3) activate_pending_multipliers — emits multiplierSymbolActivated + updateGlobalMult

        Rationale: players expect explosions to resolve before seeing the
        global multiplier tick up. Math value is unchanged because win eval
        uses base multiplier (1.0); global_multiplier is only consumed by
        apply_final_multipliers() at the end of the tumble sequence.
        """

        # 0. M spawn-rate filter already applied by draw_board / tumble_game_board
        #    overrides, so the board here already reflects survivors only.

        # 1. Capture multiplier symbol candidates BEFORE any board modification
        multiplier_candidates = []
        for reel_idx, reel in enumerate(self.board):
            for row_idx, symbol in enumerate(reel):
                if symbol.name == "M":
                    multiplier_candidates.append({
                        "reel": reel_idx,
                        "row": row_idx,
                        "symbol": symbol
                    })

        # 2. Find symbol clusters
        clusters = Cluster.get_clusters(self.board, "wild")

        # 3. Determine if any cluster is a paying win
        is_any_win = False
        for sym, clist in clusters.items():
            for cluster in clist:
                if (len(cluster), sym) in self.config.paytable:
                    is_any_win = True
                    break
            if is_any_win: break

        # 4. Assign multiplier values to all M symbols (needed for cluster
        #    evaluation via multiplier_key and for persistent visuals).
        #    No events emitted here — this is silent state.
        for item in multiplier_candidates:
            self._assign_multiplier_value(item["symbol"])

        # 5. Evaluate wins using ONLY BASE MULTIPLIER (1.0) during tumble.
        #    Final multiplication happens at the end of the tumble sequence.
        return_data = {"totalWin": 0, "wins": []}
        self.board, self.win_data, total_win = Cluster.evaluate_clusters(
            config=self.config,
            board=self.board,
            clusters=clusters,
            global_multiplier=1.0,  # Always base win during tumble
            multiplier_key="multiplier",
            return_data=return_data,
        )
        self.accumulated_base_win += total_win
        self.win_data["totalWin"] = total_win  # Tracking raw win for this stage

        # 6. Track Skill Meters
        if hasattr(self, "skill_meters"):
            for win in self.win_data.get("wins", []):
                sym = win.get("symbol")
                if sym in self.skill_meters:
                    val = win.get("clusterSize", 0)
                    self.skill_meters[sym] += val

            # Emit Meter Update
            from game_events import emit_skill_meters_update_event
            emit_skill_meters_update_event(self)

        Cluster.record_cluster_wins(self)
        self.win_manager.update_spinwin(self.win_data["totalWin"])
        self.win_manager.tumble_win = self.win_data["totalWin"]

        # 7. Stash pending multiplier activation — emitted later in the
        #    tumble step so that winInfo is rendered first on the client.
        #    M activations are gated on `total_win > 0` so an M that lands
        #    in a no-win tumble does NOT accumulate into global_multiplier.
        #
        #    Earlier behaviour activated M's regardless of the tumble's win.
        #    The comment claimed "no effect" because apply_final_multipliers
        #    only fires when accumulated_base_win > 0 — but global_multiplier
        #    *persists across free spins* while accumulated_base_win resets
        #    per spin (see update_freespin). So a no-win M still inflated
        #    later spins' final multiplier. The player perceived this as a
        #    "free" multiplier collection, which it effectively was.
        self._pending_multiplier_activation = None
        if multiplier_candidates and total_win > 0:
            activated_symbols = []
            multiplier_added = 0

            for item in multiplier_candidates:
                symbol = item["symbol"]
                if not hasattr(symbol, "processed_multiplier"):
                    val = symbol.get_attribute("multiplier")
                    if val > 0:
                        multiplier_added += val
                        symbol.processed_multiplier = True
                        activated_symbols.append({
                            "reel": item["reel"],
                            "row": item["row"] + 1,
                            "value": val
                        })

            if multiplier_added > 0:
                self._pending_multiplier_activation = {
                    "activated_symbols": activated_symbols,
                    "multiplier_added": multiplier_added,
                }

    def activate_pending_multipliers(self):
        """Emit multiplierSymbolActivated + updateGlobalMult if any are pending.

        Must be called AFTER emit_tumble_win_events() so that winInfo
        (explosion) resolves before the multiplier ticker animates. The
        global_multiplier state is also mutated here — it is only read by
        apply_final_multipliers() at the end of the tumble sequence, so
        deferring the mutation has no effect on payouts.
        """
        pending = getattr(self, "_pending_multiplier_activation", None)
        if not pending:
            return

        multiplier_added = pending["multiplier_added"]
        activated_symbols = pending["activated_symbols"]

        if self.global_multiplier == 1:
            self.global_multiplier = multiplier_added
        else:
            self.global_multiplier += multiplier_added

        emit_multiplier_symbol_activated_event(self, activated_symbols)
        update_global_mult_event(self)

        self._pending_multiplier_activation = None

    def apply_final_multipliers(self):
        """Calculate final total win by applying the global multiplier to accumulated base wins."""
        if self.accumulated_base_win == 0:
            return

        # Sweep up any M still on the board that never coincided with a same-step
        # win (e.g. it dropped in on what turned out to be the last tumble step,
        # and nothing else matched that step, so the loop ended before it got
        # another chance — see _execute_tumble_sequence's while condition).
        # Safe here specifically because we're past the accumulated_base_win==0
        # guard: this spin already has a real win, so this can't be used to
        # inflate global_multiplier for free on a whiff spin (the exact exploit
        # the total_win>0 gate in get_clusters_update_wins was added to close).
        from game_events import emit_multiplier_symbol_activated_event
        activated_symbols = []
        multiplier_added = 0
        for reel_idx, reel in enumerate(self.board):
            for row_idx, symbol in enumerate(reel):
                if symbol.name == "M" and not hasattr(symbol, "processed_multiplier"):
                    val = symbol.get_attribute("multiplier")
                    if val and val > 0:
                        multiplier_added += val
                        symbol.processed_multiplier = True
                        activated_symbols.append({"reel": reel_idx, "row": row_idx + 1, "value": val})

        # Padding lookahead symbols (top_symbols/bottom_symbols, from the SDK's
        # include_padding lookahead-row mechanism) are shown to the player in
        # the reveal event exactly like a board M, but get_clusters_update_wins
        # never evaluates them — only a later tumble that pulls one into
        # self.board would. If a reel with a surviving M never explodes for the
        # rest of the spin, that M's value would otherwise be silently lost on
        # a spin that already won, despite looking identical to a real M the
        # whole time. Sweep both lists here too, same as the board sweep above.
        if getattr(self.config, "include_padding", False):
            for reel_idx, symbol in enumerate(getattr(self, "top_symbols", [])):
                if symbol.name == "M" and not hasattr(symbol, "processed_multiplier"):
                    val = symbol.get_attribute("multiplier")
                    if val and val > 0:
                        multiplier_added += val
                        symbol.processed_multiplier = True
                        activated_symbols.append({"reel": reel_idx, "row": 0, "value": val})
            for reel_idx, symbol in enumerate(getattr(self, "bottom_symbols", [])):
                if symbol.name == "M" and not hasattr(symbol, "processed_multiplier"):
                    val = symbol.get_attribute("multiplier")
                    if val and val > 0:
                        multiplier_added += val
                        symbol.processed_multiplier = True
                        activated_symbols.append({"reel": reel_idx, "row": len(self.board[reel_idx]) + 1, "value": val})

        if multiplier_added > 0:
            if self.global_multiplier == 1:
                self.global_multiplier = multiplier_added
            else:
                self.global_multiplier += multiplier_added
            emit_multiplier_symbol_activated_event(self, activated_symbols)

        final_win = self.accumulated_base_win * self.global_multiplier

        # Update spin win with the final multiplied value
        # Subtract accumulated_base_win because it was already added to spin_win in raw form
        added_win = final_win - self.accumulated_base_win
        self.win_manager.update_spinwin(added_win)

        # Emit the final multiplier application event for UI
        from game_events import emit_final_multiplier_applied_event
        emit_final_multiplier_applied_event(self)

    def update_freespin(self) -> None:
        """Called before a new reveal during freegame."""
        self.fs += 1
        update_freespin_event(self)
        update_global_mult_event(self)
        self.win_manager.reset_spin_win()
        self.tumblewin_mult = 0
        self.win_data = {}
        # NOTE: red_skill_used is intentionally NOT reset here. The red (L4)
        # skill fires at most once per base game and once per free-spin SESSION
        # (not per free spin). The flag is reset in reset_book (base round) and
        # reset_fs_spin (free-spin session entry), so it persists across the
        # individual free spins of a session.
        self.accumulated_base_win = 0

    def process_skills(self) -> bool:
        """
        Check if any skills are ready to be triggered based on their thresholds.
        Evaluates in priority order: L1 -> L2 -> L3 -> L4.
        Returns True if a skill was activated (meaning tumbles should resume).
        """
        if not hasattr(self, "skill_meters"):
            return False

        # L1 Skill (Priority 1)
        if self.skill_meters["L1"] >= self.config.skill_thresholds["L1"]:
            self.trigger_yellow_skill()
            return True

        # L2 Skill (Priority 2)
        if self.skill_meters["L2"] >= self.config.skill_thresholds["L2"]:
            self.trigger_green_skill()
            return True

        # L3 Skill (Priority 3)
        if self.skill_meters["L3"] >= self.config.skill_thresholds["L3"]:
            self.trigger_blue_skill()
            return True

        # L4 Skill (Priority 4 - max 1 per spin)
        if not self.red_skill_used and self.skill_meters["L4"] >= self.config.skill_thresholds["L4"]:
            self.trigger_red_skill()
            return True

        return False

    def trigger_yellow_skill(self):
        """Consume meter and add 2-7 random wilds (L1 Skill - Priority 1)."""
        self.skill_meters["L1"] -= self.config.skill_thresholds["L1"]
        import random
        from game_events import emit_skill_activated_event
        
        num_wilds = random.randint(2, 7)
        # Find all non-wild, non-M spots. M is a collectible multiplier coin,
        # not an ordinary paying symbol — no skill may overwrite/destroy one
        # sitting on the board (it could still be carrying an uncollected
        # multiplier value).
        available_spots = []
        for reel_idx, reel in enumerate(self.board):
            for row_idx, sym in enumerate(reel):
                if sym.name != "W" and sym.name != "M":
                    available_spots.append((reel_idx, row_idx))
        
        # Select random spots
        random.shuffle(available_spots)
        wilds_placed = []
        for i in range(min(num_wilds, len(available_spots))):
            r, c = available_spots[i]
            self.board[r][c] = self.create_symbol("W")
            wilds_placed.append({"reel": r, "row": c})
            
        emit_skill_activated_event(self, "L1", {"positions": wilds_placed, "count": len(wilds_placed)})
        # Manually jumpstart the win calculation to handle new board and loop again natively.
        self.get_clusters_update_wins()
        self.emit_tumble_win_events()
        self.activate_pending_multipliers()


    def trigger_green_skill(self):
        """Consume meter and explode all low-tier symbols (L2 Skill - Priority 2)."""
        self.skill_meters["L2"] -= self.config.skill_thresholds["L2"]
        from game_events import emit_skill_activated_event

        exploded_positions = []
        low_tiers = {"L1", "L2", "L3", "L4"}

        # Any M coin currently on the board must be collected as part of this
        # skill's guaranteed activation, not left to the normal win-triggered
        # path below. get_clusters_update_wins() / activate_pending_multipliers()
        # only count an M when total_win > 0 for that tumble step — a gate that
        # exists to stop M's from getting a "free" ride on a genuinely empty
        # NATURAL tumble (see that function's docstring). This skill's own
        # explosion always reports totalWin=0 (it's a board-clear, not a payout),
        # so without this, an M sitting on the board when L2 fires would fall
        # into that same gate and never get counted — it would still visually
        # get swept up in the explosion and later "collected" for show at
        # finalMultiplierApplied, but its value would silently never reach
        # global_multiplier. Since the skill is a guaranteed, player-visible
        # activation (not an empty whiff), it should collect any M outright.
        activated_symbols = []
        multiplier_added = 0

        for reel_idx, reel in enumerate(self.board):
            for row_idx, sym in enumerate(reel):
                if sym.name in low_tiers:
                    sym.explode = True
                    exploded_positions.append({"reel": reel_idx, "row": row_idx})
                    self.skill_meters[sym.name] += 1
                elif sym.name == "M" and not hasattr(sym, "processed_multiplier"):
                    val = sym.get_attribute("multiplier")
                    if val and val > 0:
                        multiplier_added += val
                        sym.processed_multiplier = True
                        activated_symbols.append({"reel": reel_idx, "row": row_idx + 1, "value": val})

        emit_skill_activated_event(self, "L2", {"positions": exploded_positions, "count": len(exploded_positions)})

        if multiplier_added > 0:
            if self.global_multiplier == 1:
                self.global_multiplier = multiplier_added
            else:
                self.global_multiplier += multiplier_added
            emit_multiplier_symbol_activated_event(self, activated_symbols)
            update_global_mult_event(self)

        # Correct way to tumble without paying: 
        # Set win_data with the positions so tumble_game_board knows what to remove
        self.win_data = {
            "totalWin": 0,
            "wins": [{
                "symbol": "skill_explosion",
                "clusterSize": len(exploded_positions),
                "win": 0,
                "positions": exploded_positions,
                "meta": {"globalMult": 1, "clusterMult": 0, "winWithoutMult": 0}
            }]
        }
        # Note: self.win_manager.update_spinwin(0) is not strictly needed but ensures clean state
        self.win_manager.update_spinwin(0)


    def trigger_blue_skill(self):
        """Consume meter and multiply global multiplier by a random factor (L3 Skill - Priority 3).

        Factor range is configurable via `config.l3_factor_range`. Can trigger multiple
        times per spin; each trigger compounds onto the current global multiplier.
        """
        self.skill_meters["L3"] -= self.config.skill_thresholds["L3"]
        import random
        from game_events import emit_skill_activated_event
        from src.events.events import update_global_mult_event

        lo, hi = self.config.l3_factor_range
        mult_factor = random.randint(lo, hi)
        self.global_multiplier *= mult_factor

        emit_skill_activated_event(self, "L3", {"multiplierFactor": mult_factor, "newGlobalMultiplier": self.global_multiplier})
        update_global_mult_event(self)
        

    def trigger_red_skill(self):
        """Consume meter and drop 3x3 Mega Wild (L4 Skill - Priority 4)."""
        self.skill_meters["L4"] -= self.config.skill_thresholds["L4"]
        self.red_skill_used = True
        import random
        from game_events import emit_skill_activated_event
        
        max_r = self.config.num_reels - 3
        max_c = self.config.num_rows[0] - 3

        # Only consider a top-left position valid if its full 3x3 footprint
        # doesn't cover any M symbol — same rule as L1 (trigger_yellow_skill):
        # no skill may overwrite/destroy an M sitting on the board.
        valid_positions = []
        for r in range(max_r + 1):
            for c in range(max_c + 1):
                covers_m = any(
                    self.board[r + r_offset][c + c_offset].name == "M"
                    for r_offset in range(3)
                    for c_offset in range(3)
                )
                if not covers_m:
                    valid_positions.append((r, c))

        if not valid_positions:
            # Every possible 3x3 footprint covers at least one M — extremely
            # unlikely, but skip placing wilds this trigger rather than
            # destroy one.
            emit_skill_activated_event(self, "L4", {"positions": []})
            return

        top_l_r, top_l_c = random.choice(valid_positions)

        wilds_placed = []
        for r_offset in range(3):
            for c_offset in range(3):
                r = top_l_r + r_offset
                c = top_l_c + c_offset
                self.board[r][c] = self.create_symbol("W")
                wilds_placed.append({"reel": r, "row": c})
                
        emit_skill_activated_event(self, "L4", {"positions": wilds_placed})
        self.get_clusters_update_wins()
        self.emit_tumble_win_events()
        self.activate_pending_multipliers()

