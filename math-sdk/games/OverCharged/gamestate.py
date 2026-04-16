
from game_override import GameStateOverride


class GameState(GameStateOverride):
    """Core function handling simulation results."""

    def _execute_tumble_sequence(self):
        """Shared tumble + skill-resolution loop used by both base and free spins."""
        self.get_clusters_update_wins()
        self.emit_tumble_win_events()
        self.activate_pending_multipliers()

        skills_active = False
        if self.win_data["totalWin"] == 0:
            skills_active = self.process_skills()

        while (self.win_data["totalWin"] > 0 or len(self.win_data.get("wins", [])) > 0 or skills_active) and not self.wincap_triggered:
            if self.win_data["totalWin"] > 0 or len(self.win_data.get("wins", [])) > 0:
                self.tumble_game_board()
                self.get_clusters_update_wins()
                self.emit_tumble_win_events()
                self.activate_pending_multipliers()

            if self.win_data["totalWin"] == 0 and len(self.win_data.get("wins", [])) == 0:
                skills_active = self.process_skills()
            else:
                skills_active = False

        self.apply_final_multipliers()
        self.set_end_tumble_event()
        self.win_manager.update_gametype_wins(self.gametype)
        # Re-check wincap after skill-triggered multipliers settle, so base/free
        # loops stop at the first spin that crosses the cap.
        self.evaluate_wincap()

    def run_spin(self, sim, simulation_seed=None):
        self.reset_seed(sim)
        self.repeat = True
        while self.repeat:
            self.reset_book()
            self.draw_board()

            self._execute_tumble_sequence()

            if not self.wincap_triggered and self.check_fs_condition() and self.check_freespin_entry():
                self.run_freespin_from_base()

            self.evaluate_finalwin()
            self.check_repeat()

        self.imprint_wins()

    def run_freespin(self):
        self.reset_fs_spin()
        while self.fs < self.tot_fs and not self.wincap_triggered:
            self.update_freespin()
            self.draw_board()

            self._execute_tumble_sequence()

            if self.check_fs_condition():
                self.update_fs_retrigger_amt()

        self.end_freespin()
