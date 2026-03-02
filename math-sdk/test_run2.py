import sys, os
sys.path.append(os.path.abspath('c:/Development/OverCharged_Math/math-sdk'))
sys.path.append(os.path.abspath('c:/Development/OverCharged_Math/math-sdk/games/OverCharged'))
from game_config import GameConfig
from gamestate import GameState
c = GameConfig()
b = GameState(c)
b.gametype = 'basegame'
b.criteria = 'freegame'
b.betmode = 'base'
b.reset_book()

b._force_special_board('scatter', 3)
print('Count on board:', b.count_special_symbols('scatter'))
