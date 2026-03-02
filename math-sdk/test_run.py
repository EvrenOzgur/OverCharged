import sys, os
sys.path.append(os.path.abspath('c:/Development/OverCharged_Math/math-sdk'))
sys.path.append(os.path.abspath('c:/Development/OverCharged_Math/math-sdk/games/OverCharged'))
from game_config import GameConfig
from gamestate import GameState
import traceback

c = GameConfig()
b = GameState(c)
b.gametype = c.basegame_type
b.betmode = c.bet_modes[0]
b.reset_book()

class Tracer:
    def __init__(self):
        self.count = 0
    def trace_calls(self, frame, event, arg):
        if event == 'call':
            filename = frame.f_code.co_filename
            if 'math-sdk' in filename and 'statistics' not in filename:
                func = frame.f_code.co_name
                print(f'{os.path.basename(filename)}:{frame.f_lineno} - {func}')
                self.count += 1
                if self.count > 1000:
                    sys.exit(1)
        return self.trace_calls

try:
    print('Executing spin...')
    sys.settrace(Tracer().trace_calls)
    b.run_spin(0)
    sys.settrace(None)
    print('Spin completed.')
except SystemExit:
    print("EXIT CAUGHT")
    sys.settrace(None)
    pass
except Exception as e:
    sys.settrace(None)
    traceback.print_exc()
