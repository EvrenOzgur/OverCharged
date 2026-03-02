import sys, os
sys.path.append(os.path.abspath('c:/Development/OverCharged_Math/math-sdk'))
from games.OverCharged.game_config import GameConfig
from games.OverCharged.gamestate import GameState
c = GameConfig()
b = GameState(c, 'basegame', None)
b.bet_mode = c.bet_modes[0]
b.reset_book()

import traceback

def trace_calls(frame, event, arg):
    if event == 'call':
        filename = frame.f_code.co_filename
        if 'math-sdk' in filename and 'statistics' not in filename:
            print(f'{os.path.basename(filename)}:{frame.f_lineno} - {frame.f_code.co_name}')
    return trace_calls

sys.settrace(trace_calls)
try:
    print('Testing draw_board with forced scatters...')
    b.draw_board(True, "scatter")
except Exception as e:
    sys.settrace(None)
    traceback.print_exc()
