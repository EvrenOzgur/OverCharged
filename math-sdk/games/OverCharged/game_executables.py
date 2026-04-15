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
        """Find clusters on board and update win manager."""

        # 0. Apply M spawn-rate filter before any multiplier logic runs
        self._apply_m_spawn_filter()

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

        # 4. If we have a win, ACTIVATE multipliers first!
        if is_any_win and multiplier_candidates:
            activated_symbols = []
            multiplier_added = 0
            
            for item in multiplier_candidates:
                symbol = item["symbol"]
                self._assign_multiplier_value(symbol)

                # Activate if not yet processed
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
                if self.global_multiplier == 1:
                    self.global_multiplier = multiplier_added
                else:
                    self.global_multiplier += multiplier_added
                # Emit events so UI slot updates FIRST
                emit_multiplier_symbol_activated_event(self, activated_symbols)
                update_global_mult_event(self)
        else:
            # Persistent visual value assignment for M symbols even without a win
            for item in multiplier_candidates:
                self._assign_multiplier_value(item["symbol"])

        # 5. Evaluate wins using ONLY BASE MULTIPLIER (1.0) during tumble
        # Final multiplication happens at the end of the tumble sequence
        return_data = {"totalWin": 0, "wins": []}
        self.board, self.win_data, total_win = Cluster.evaluate_clusters(
            config=self.config,
            board=self.board,
            clusters=clusters,
            global_multiplier=1.0, # Always base win during tumble
            multiplier_key="multiplier",
            return_data=return_data,
        )
        self.accumulated_base_win += total_win
        self.win_data["totalWin"] = total_win # Tracking raw win for this stage
        
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

    def apply_final_multipliers(self):
        """Calculate final total win by applying the global multiplier to accumulated base wins."""
        if self.accumulated_base_win == 0:
            return

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
        self.red_skill_used = False
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
        # Find all non-wild spots
        available_spots = []
        for reel_idx, reel in enumerate(self.board):
            for row_idx, sym in enumerate(reel):
                if sym.name != "W":
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


    def trigger_green_skill(self):
        """Consume meter and explode all low-tier symbols (L2 Skill - Priority 2)."""
        self.skill_meters["L2"] -= self.config.skill_thresholds["L2"]
        from game_events import emit_skill_activated_event

        exploded_positions = []
        low_tiers = {"L1", "L2", "L3", "L4"}

        for reel_idx, reel in enumerate(self.board):
            for row_idx, sym in enumerate(reel):
                if sym.name in low_tiers:
                    sym.explode = True
                    exploded_positions.append({"reel": reel_idx, "row": row_idx})
                    self.skill_meters[sym.name] += 1
                    
        emit_skill_activated_event(self, "L2", {"positions": exploded_positions, "count": len(exploded_positions)})
        
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
        
        top_l_r = random.randint(0, max_r)
        top_l_c = random.randint(0, max_c)
        
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

