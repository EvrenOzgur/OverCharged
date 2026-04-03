
from game_override import GameStateOverride


class GameState(GameStateOverride):
    """Core function handling simulation results."""

    def run_spin(self, sim, simulation_seed=None):
        self.reset_seed(sim)
        self.repeat = True
        while self.repeat:
            # Reset simulation variables and draw a new board based on the betmode criteria.
            self.reset_book()
            self.draw_board()

            self.get_clusters_update_wins()
            self.emit_tumble_win_events()

            skills_active = False
            if self.win_data["totalWin"] == 0:
                skills_active = self.process_skills()

            while (self.win_data["totalWin"] > 0 or len(self.win_data.get("wins", [])) > 0 or skills_active) and not (self.wincap_triggered):
                if self.win_data["totalWin"] > 0 or len(self.win_data.get("wins", [])) > 0:
                    self.tumble_game_board()
                    self.get_clusters_update_wins()
                    self.emit_tumble_win_events()
                
                if self.win_data["totalWin"] == 0 and len(self.win_data.get("wins", [])) == 0:
                    skills_active = self.process_skills()
                else:
                    skills_active = False

            # End of tumble sequence - Apply multipliers to accumulated base win
            self.apply_final_multipliers()
            self.set_end_tumble_event()
            self.win_manager.update_gametype_wins(self.gametype)

            if self.check_fs_condition() and self.check_freespin_entry():
                self.run_freespin_from_base()

            self.evaluate_finalwin()
            self.check_repeat()

        self.imprint_wins()

    def run_freespin(self):
        self.reset_fs_spin()
        while self.fs < self.tot_fs:
            self.update_freespin()
            self.draw_board()
            
            self.get_clusters_update_wins()
            self.emit_tumble_win_events()

            skills_active = False
            if self.win_data["totalWin"] == 0:
                skills_active = self.process_skills()

            while (self.win_data["totalWin"] > 0 or len(self.win_data.get("wins", [])) > 0 or skills_active) and not (self.wincap_triggered):
                if self.win_data["totalWin"] > 0 or len(self.win_data.get("wins", [])) > 0:
                    self.tumble_game_board()
                    self.get_clusters_update_wins()
                    self.emit_tumble_win_events()
                
                if self.win_data["totalWin"] == 0 and len(self.win_data.get("wins", [])) == 0:
                    skills_active = self.process_skills()
                else:
                    skills_active = False

            # End of tumble sequence - Apply multipliers to accumulated base win
            self.apply_final_multipliers()
            self.set_end_tumble_event()
            self.win_manager.update_gametype_wins(self.gametype)

            if self.check_fs_condition():
                self.update_fs_retrigger_amt()

        self.end_freespin()
