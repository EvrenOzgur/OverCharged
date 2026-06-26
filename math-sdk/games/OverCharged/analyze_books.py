"""Static analyzer for books_*.json — checks math invariants spin by spin."""
import json
import os
from collections import defaultdict

BASE_PATH = os.path.join(os.path.dirname(__file__), "library", "books")

# Math configuration constants (must mirror game_config.py)
SKILL_THRESHOLDS = {"L1": 10, "L2": 16, "L3": 22, "L4": 25}
L3_FACTOR_RANGE = (2, 3)
M_VALID_VALUES = {2, 3, 5, 8, 10, 15, 20, 50, 100, 250, 500}
PAYABLE_SYMBOLS = {"H1", "H2", "H3", "H4", "L1", "L2", "L3", "L4"}
LOW_TIER = {"L1", "L2", "L3", "L4"}
ALL_SYMBOLS = PAYABLE_SYMBOLS | {"W", "S", "M"}
NUM_REELS = 8
ROW_PADDING_TOTAL = 10  # 8 grid + 2 padding (top + bottom)
WINCAP_BET_MULT = 5000
WINCAP_AMOUNT_CENTS = WINCAP_BET_MULT * 100  # 500000

PAYTABLE = {
    "H1": {5: 2.5, 6: 6.25, 7: 6.25, 8: 6.25, 9: 10.0, 10: 10.0, 11: 10.0, 12: 10.0, **{i: 24.0 for i in range(13, 37)}},
    "H2": {5: 1.0, 6: 2.5, 7: 2.5, 8: 2.5, 9: 4.0, 10: 4.0, 11: 4.0, 12: 4.0, **{i: 16.0 for i in range(13, 37)}},
    "H3": {5: 0.65, 6: 1.6, 7: 1.6, 8: 1.6, 9: 2.8, 10: 2.8, 11: 2.8, 12: 2.8, **{i: 12.0 for i in range(13, 37)}},
    "H4": {5: 0.5, 6: 1.25, 7: 1.25, 8: 1.25, 9: 2.4, 10: 2.4, 11: 2.4, 12: 2.4, **{i: 8.0 for i in range(13, 37)}},
    "L1": {5: 0.3, 6: 0.75, 7: 0.75, 8: 0.75, 9: 2.0, 10: 2.0, 11: 2.0, 12: 2.0, **{i: 5.0 for i in range(13, 37)}},
    "L2": {5: 0.2, 6: 0.6, 7: 0.6, 8: 0.6, 9: 1.75, 10: 1.75, 11: 1.75, 12: 1.75, **{i: 4.0 for i in range(13, 37)}},
    "L3": {5: 0.1, 6: 0.4, 7: 0.4, 8: 0.4, 9: 1.25, 10: 1.25, 11: 1.25, 12: 1.25, **{i: 2.5 for i in range(13, 37)}},
    "L4": {5: 0.05, 6: 0.25, 7: 0.25, 8: 0.25, 9: 0.75, 10: 0.75, 11: 0.75, 12: 0.75, **{i: 2.0 for i in range(13, 37)}},
}
FS_TRIGGERS_BASE = {3: 7, 4: 10, 5: 12, 6: 15, 7: 18, 8: 20}
FS_TRIGGERS_FREE = {2: 2, 3: 3, 4: 5, 5: 7, 6: 10, 7: 13, 8: 16}


class Issues:
    def __init__(self):
        self.by_kind = defaultdict(list)  # kind -> [(spin_id, msg)]
        self.spins_with_issue = set()

    def add(self, kind, spin_id, msg):
        self.by_kind[kind].append((spin_id, msg))
        self.spins_with_issue.add(spin_id)

    def total(self):
        return sum(len(v) for v in self.by_kind.values())


def m_positions_in_board(board):
    """Return list of (reel, row, multiplier_value) for M symbols in the board."""
    out = []
    for ri, reel in enumerate(board):
        for row, sym in enumerate(reel):
            if sym.get("name") == "M":
                out.append((ri, row, sym.get("multiplier")))
    return out


def collect_distribution_stats(spins, mode):
    """Aggregate RTP and event statistics across all spins for the mode."""
    from collections import Counter
    n = len(spins)
    cost_map = {"base": 1.0, "bonus": 100.0}
    cost = cost_map.get(mode, 1.0)

    total_payout = 0.0
    zero_wins = 0
    fs_triggers = 0
    wincap_hits = 0
    spin_events_count = Counter()
    fmult_hist = Counter()  # finalMultiplier histogram
    payout_buckets = Counter()  # log-binned payout
    m_total = 0
    m_active_total = 0  # M activations
    m_dormant_check_examples = []
    skills_fired = Counter()
    free_spin_lengths = []

    for s in spins:
        pm = s.get("payoutMultiplier", 0) / 100.0  # cents → bet-mult
        total_payout += pm
        if pm == 0:
            zero_wins += 1
        # bucket
        if pm == 0:
            payout_buckets["0"] += 1
        elif pm <= 1:
            payout_buckets["0<x<=1"] += 1
        elif pm <= 5:
            payout_buckets["1<x<=5"] += 1
        elif pm <= 20:
            payout_buckets["5<x<=20"] += 1
        elif pm <= 100:
            payout_buckets["20<x<=100"] += 1
        elif pm <= 500:
            payout_buckets["100<x<=500"] += 1
        elif pm < 5000:
            payout_buckets["500<x<5000"] += 1
        else:
            payout_buckets["5000 (wincap)"] += 1

        seen_fs = False
        seen_wincap = False
        for e in s.get("events", []):
            t = e.get("type")
            spin_events_count[t] += 1
            if t == "freeSpinTrigger":
                fs_triggers += 1
                seen_fs = True
            elif t == "wincap":
                wincap_hits += 1
                seen_wincap = True
            elif t == "finalMultiplierApplied":
                fm = e.get("finalMultiplier", 1)
                fmult_hist[fm] += 1
            elif t == "multiplierSymbolActivated":
                m_active_total += len(e.get("symbols", []))
            elif t == "skillActivated" and e.get("skillType") in {"L1","L2","L3","L4"}:
                skills_fired[e["skillType"]] += 1
            elif t == "reveal":
                # Reveal serialises 10 rows per reel: index 0 = top padding,
                # 1..8 = grid (math's self.board), 9 = bottom padding. Padding
                # M's are visible to the client but math doesn't process them.
                for reel in e.get("board", []):
                    for row, sym in enumerate(reel):
                        if sym.get("name") == "M" and 1 <= row <= 8:
                            m_total += 1

    rtp = (total_payout / n / cost) * cost  # bet-mult units already
    avg_payout_x_bet = total_payout / n / cost
    return {
        "n_spins": n,
        "total_payout_x_bet": total_payout,
        "rtp_pct": avg_payout_x_bet * 100,
        "zero_win_pct": zero_wins / n * 100,
        "fs_trigger_pct": fs_triggers / n * 100,
        "wincap_pct": wincap_hits / n * 100,
        "M_symbols_total": m_total,
        "M_activations_total": m_active_total,
        "M_inactive_pct": (1 - m_active_total / m_total) * 100 if m_total else 0,
        "fmult_hist": dict(fmult_hist),
        "payout_buckets": dict(payout_buckets),
        "skills_fired": dict(skills_fired),
        "event_freq": dict(spin_events_count),
    }


def analyze_spin(spin, mode, issues):
    sid = spin.get("id", "?")
    events = spin.get("events", [])
    payout_mult = spin.get("payoutMultiplier", None)

    if not events:
        issues.add("A.empty", sid, "no events")
        return

    # ---- A) Structure
    if events[0].get("type") != "reveal":
        issues.add("A.firstNotReveal", sid, f"first event = {events[0].get('type')}")
    if events[-1].get("type") != "finalWin":
        issues.add("A.lastNotFinalWin", sid, f"last event = {events[-1].get('type')}")

    for i, e in enumerate(events):
        if e.get("index") != i:
            issues.add("A.indexGap", sid, f"event[{i}] has index={e.get('index')}")
            break

    # ---- State machine
    skill_meters = {"L1": 0, "L2": 0, "L3": 0, "L4": 0}
    last_skill_meters_seen = dict(skill_meters)
    global_mult = 1
    accumulated_base_win = 0
    red_skill_used = False
    in_freegame = False
    fs_remaining = 0
    fs_total = 0
    wincap_triggered = False
    current_board = None  # most recent reveal/tumble board state
    pending_skill_after_winInfo = False
    winInfo_emitted_this_tumble = False
    last_winInfo_idx = -10
    last_multActivated_idx = -10
    last_updateGlobalMult_idx = -10
    finalMult_emitted = False
    spin_total_win_cents = 0  # sum of base win × global mult logic, used for wincap check

    for idx, e in enumerate(events):
        et = e.get("type")

        if et == "reveal":
            # A1: board shape
            board = e.get("board", [])
            if len(board) != NUM_REELS:
                issues.add("A.boardReels", sid, f"reveal has {len(board)} reels (expected {NUM_REELS})")
            for ri, reel in enumerate(board):
                if len(reel) != ROW_PADDING_TOTAL:
                    issues.add("A.boardRows", sid, f"reel {ri} has {len(reel)} rows")
                for sym in reel:
                    name = sym.get("name")
                    if name not in ALL_SYMBOLS:
                        issues.add("A.unknownSym", sid, f"unknown symbol '{name}' in reveal")
                    if name == "M":
                        mv = sym.get("multiplier")
                        if mv is None:
                            issues.add("D.M_no_value", sid, f"M at ({ri},?) reveals without multiplier value")
                        elif mv not in M_VALID_VALUES:
                            issues.add("D.M_bad_value", sid, f"M multiplier={mv} not in valid set")

            # A: gameType valid
            gt = e.get("gameType")
            if gt not in {"basegame", "freegame"}:
                issues.add("A.bad_gameType", sid, f"gameType={gt}")

            # B1: meters reset on basegame reveal (first reveal of spin)
            if idx == 0:
                # First reveal: skill meters logically 0 (math reset_book)
                # We can't see emitted meters here, just snapshot internal expectation
                skill_meters = {"L1": 0, "L2": 0, "L3": 0, "L4": 0}
                global_mult = 1
                accumulated_base_win = 0
                red_skill_used = False
                in_freegame = (gt == "freegame")  # bonus mode starts as freegame potentially
            else:
                # Mid-spin reveal — fs entry/retrigger or freespin progression
                if gt == "freegame":
                    # red_skill_used resets once on FS entry (session start),
                    # NOT on every free-spin reveal — red fires at most once per
                    # free-spin session. Matches reset_fs_spin in the game code.
                    if not in_freegame:
                        red_skill_used = False
                    in_freegame = True
                    skill_meters = {"L1": 0, "L2": 0, "L3": 0, "L4": 0}
                    # global_mult resets per FS spin
                    global_mult = 1
                    accumulated_base_win = 0

            current_board = board
            winInfo_emitted_this_tumble = False
            finalMult_emitted = False

        elif et == "winInfo":
            winInfo_emitted_this_tumble = True
            last_winInfo_idx = idx
            wins = e.get("wins", [])
            total = e.get("totalWin", 0)
            sum_wins = 0
            for w in wins:
                sym = w.get("symbol")
                positions = w.get("positions", [])
                size = len(positions)
                meta = w.get("meta", {})
                base_pay = meta.get("winWithoutMult", 0)
                gm = meta.get("globalMult", None)
                cm = meta.get("clusterMult", None)
                w_amt = w.get("win", 0)

                # C1: payable symbol
                if sym not in PAYABLE_SYMBOLS:
                    if sym != "skill_explosion":  # L2 explosion stub
                        issues.add("C.nonPayableSym", sid, f"winInfo cluster sym={sym}")
                # C2: size >= 5
                if sym in PAYABLE_SYMBOLS and size < 5:
                    issues.add("C.clusterTooSmall", sid, f"{sym} cluster size={size}")
                # C4: meta.globalMult == 1 during tumble
                if sym in PAYABLE_SYMBOLS and gm is not None and gm != 1:
                    issues.add("C.metaGlobalMultNon1", sid, f"{sym} cluster meta.globalMult={gm}")
                # C3: paytable check (without M-multiplier; cluster_mult applies if M in cluster)
                if sym in PAYABLE_SYMBOLS and base_pay > 0:
                    expected_lookup = PAYTABLE.get(sym, {}).get(size, None)
                    if expected_lookup is None:
                        issues.add("C.payTableMissing", sid, f"{sym} cluster size={size} not in paytable")
                    else:
                        # winWithoutMult is in CENTS; lookup is in bet-multiplier units.
                        # cluster_mult applies when an M is part of the cluster.
                        eff_cm = cm if cm and cm > 0 else 1
                        expected_cents = expected_lookup * 100 * eff_cm
                        if abs(base_pay - expected_cents) > 1e-6:
                            issues.add("C.payTableMismatch", sid,
                                       f"{sym} size={size} winWithoutMult={base_pay}c expected={expected_cents}c (lookup={expected_lookup} clusterMult={cm})")

                sum_wins += w_amt

            # C6: totalWin equals sum
            if abs(total - sum_wins) > 1e-6:
                issues.add("C.totalWinSum", sid, f"winInfo totalWin={total} but Σwins={sum_wins}")

            accumulated_base_win += total

            # Track meter delta from this winInfo (used to validate skillActivated UPDATE later)
            for w in wins:
                sym = w.get("symbol")
                if sym in LOW_TIER:
                    skill_meters[sym] += len(w.get("positions", []))
            pending_skill_after_winInfo = True

        elif et == "tumbleBoard":
            # update board with explode + new symbols (best effort)
            current_board = None  # too complex to maintain perfectly; rely on subsequent reveal/skill

        elif et == "skillActivated":
            stype = e.get("skillType")
            new_meters = e.get("skillMeters", {})

            if stype == "UPDATE":
                # Math `get_clusters_update_wins` emits UPDATE before winInfo, after
                # crediting cluster sizes to skill meters. We trust the event as the
                # authoritative meter snapshot.
                last_skill_meters_seen = dict(new_meters)
                skill_meters = dict(new_meters)
            elif stype in {"L1", "L2", "L3", "L4"}:
                # B2: threshold consumed. L2's trigger also re-credits +1 per low-tier
                # symbol on the board, so its post-meter is `prev - 16 + N`. We can only
                # validate the lower bound: post >= prev - threshold (otherwise underflow).
                prev = last_skill_meters_seen.get(stype, skill_meters.get(stype, 0))
                threshold = SKILL_THRESHOLDS[stype]
                actual_after = new_meters.get(stype, None)
                if actual_after is None:
                    issues.add("B.skillMeterMissing", sid, f"{stype} skillMeters missing key")
                elif actual_after < 0:
                    issues.add("B.meterNegative", sid, f"{stype} meter went negative: {actual_after}")
                elif prev < threshold:
                    issues.add("B.thresholdUnderflow", sid,
                               f"{stype} fired with prev meter={prev} < threshold={threshold}")
                elif stype != "L2" and actual_after != prev - threshold:
                    issues.add("B.threshold_partial", sid,
                               f"{stype} meter prev={prev} after={actual_after} expected={prev - threshold}")
                last_skill_meters_seen = dict(new_meters)
                skill_meters = dict(new_meters)

                if stype == "L1":
                    # B6: 2-7 wilds
                    cnt = e.get("count", None)
                    if cnt is None:
                        issues.add("B.L1_no_count", sid, "L1 missing count")
                    elif not (2 <= cnt <= 7):
                        issues.add("B.L1_count", sid, f"L1 count={cnt}")
                    positions = e.get("positions", [])
                    if positions and len(positions) != cnt:
                        issues.add("B.L1_pos_count_mismatch", sid,
                                   f"L1 count={cnt} but positions len={len(positions)}")
                elif stype == "L2":
                    # B10: positions should reference low-tier slots (best-effort)
                    pass
                elif stype == "L3":
                    mf = e.get("multiplierFactor", None)
                    if mf is None:
                        issues.add("B.L3_no_factor", sid, "L3 missing multiplierFactor")
                    elif not (L3_FACTOR_RANGE[0] <= mf <= L3_FACTOR_RANGE[1]):
                        issues.add("B.L3_factor", sid, f"L3 factor={mf}")
                    new_gm = e.get("newGlobalMultiplier", None)
                    if new_gm is not None and mf is not None:
                        # global_mult *= mf
                        # If global_mult was 1 (uninitialised) we expect mf
                        # else previous * mf
                        # We don't perfectly track global_mult before L3 due to event ordering,
                        # but post-condition: new_gm == prev * mf
                        if new_gm < mf:
                            issues.add("B.L3_newGM_too_small", sid, f"newGM={new_gm} < factor={mf}")
                    global_mult = new_gm if new_gm is not None else global_mult
                elif stype == "L4":
                    # B7: 9 positions
                    positions = e.get("positions", [])
                    if len(positions) != 9:
                        issues.add("B.L4_positions", sid, f"L4 positions={len(positions)} (expected 9)")
                    # B8: max 1 L4 per base round / per free-spin session
                    if red_skill_used:
                        issues.add("B.L4_doubleUse", sid, "L4 fired more than once per base round / FS session")
                    red_skill_used = True

                pending_skill_after_winInfo = False
            else:
                issues.add("B.unknownSkillType", sid, f"skillType={stype}")

            # B4: meters >= 0
            for k, v in new_meters.items():
                if v < 0:
                    issues.add("B.meterNeg", sid, f"{k}={v}")

        elif et == "multiplierSymbolActivated":
            last_multActivated_idx = idx
            symbols = e.get("symbols", [])
            new_gm = e.get("newGlobalMultiplier", None)

            # D9: ordering — must come AFTER winInfo (when there is win) within same tumble
            # Hard to verify strictly, but check it does not come BEFORE winInfo of the
            # same tumble. We allow no winInfo when M lands without any win.
            # (Win-less tumble with M is allowed: pending_multiplier still emits.)

            # D2: each activated symbol position must have an M with same value (best-effort)
            # current_board may be stale across tumbles, skip strict check

            # D5: globalMult monotonic non-decreasing (M just adds; never reset mid-tumble)
            if new_gm is None:
                issues.add("D.multAct_no_gm", sid, "multiplierSymbolActivated missing newGlobalMultiplier")
            else:
                if new_gm < global_mult:
                    issues.add("D.gm_decrease", sid, f"globalMult decreased {global_mult}→{new_gm}")
                global_mult = new_gm

            # symbols values valid
            for s in symbols:
                v = s.get("value")
                if v not in M_VALID_VALUES:
                    issues.add("D.activated_bad_value", sid, f"activated value={v} not in valid set")

        elif et == "updateGlobalMult":
            last_updateGlobalMult_idx = idx
            gm = e.get("globalMult", None)
            if gm is None:
                issues.add("D.updateGM_missing", sid, "updateGlobalMult missing globalMult")
            else:
                # D4: should match latest activation/L3
                if last_multActivated_idx > last_updateGlobalMult_idx - 2:
                    # paired with multiplierSymbolActivated
                    pass
                global_mult = gm

        elif et == "updateTumbleWin":
            amt = e.get("amount", 0)
            # informational; expect amount equals running base win × 100 (we can only sanity-check >= 0)
            if amt < 0:
                issues.add("F.negTumbleWin", sid, f"updateTumbleWin amount={amt}")

        elif et == "finalMultiplierApplied":
            fm = e.get("finalMultiplier", None)
            base = e.get("baseWin", 0)
            tw = e.get("totalWin", 0)
            # D7: totalWin == baseWin × fm
            if fm is not None and abs(base * fm - tw) > 1e-6:
                issues.add("D.finalMultMath", sid, f"baseWin={base} × fm={fm} ≠ totalWin={tw}")
            # D8: only emitted when accumulated > 0
            if accumulated_base_win <= 0:
                issues.add("D.finalApply_zeroBase", sid, "finalMultiplierApplied with no winInfo accumulator")
            # winInfo.totalWin is already cents → accumulated_base_win is cents.
            if abs(base - accumulated_base_win) > 1:
                issues.add("D.finalBaseMismatch", sid,
                           f"baseWin event={base} accumulator={accumulated_base_win}")
            finalMult_emitted = True
            spin_total_win_cents = tw

        elif et == "freeSpinTrigger":
            scatters = len(e.get("positions", []))
            total_fs = e.get("totalFs", 0)
            added_fs = e.get("addedFs", 0)
            if scatters not in FS_TRIGGERS_BASE:
                issues.add("E.fsTrigger_scatterCount", sid, f"trigger with {scatters} scatters (need 3-8)")
            else:
                expected = FS_TRIGGERS_BASE[scatters]
                if total_fs != expected:
                    issues.add("E.fsTrigger_totalFs", sid,
                               f"{scatters}S → totalFs={total_fs} (expected {expected})")
            in_freegame = True
            fs_total = total_fs
            fs_remaining = total_fs

        elif et == "freeSpinRetrigger":
            scatters = len(e.get("positions", []))
            total_fs = e.get("totalFs", 0)
            added_fs = e.get("addedFs", 0)
            if scatters not in FS_TRIGGERS_FREE:
                issues.add("E.fsRetrigger_scatterCount", sid,
                           f"retrigger with {scatters} scatters (need 2-8)")
            else:
                expected_added = FS_TRIGGERS_FREE[scatters]
                if added_fs != expected_added:
                    issues.add("E.fsRetrigger_addedFs", sid,
                               f"{scatters}S → addedFs={added_fs} (expected {expected_added})")

        elif et == "updateFreeSpin":
            cur = e.get("amount", 0)
            tot = e.get("total", 0)
            if cur > tot:
                issues.add("E.fsCurrentExceedsTotal", sid, f"updateFreeSpin {cur}/{tot}")

        elif et == "freeSpinEnd":
            in_freegame = False

        elif et == "setWin":
            amt = e.get("amount", 0)
            # F1: per-spin setWin is gametype-scoped; in basegame ≤ 5000×bet, in freegame
            # the cumulative free-game win can exceed 5000 if accumulated, but each setWin
            # is current spin's win. We guard against negative.
            if amt < 0:
                issues.add("F.setWinNeg", sid, f"setWin amount={amt}")

        elif et == "setTotalWin":
            amt = e.get("amount", 0)
            # F2: total ≤ wincap
            if amt > WINCAP_AMOUNT_CENTS:
                issues.add("F.setTotalWinExceedsCap", sid,
                           f"setTotalWin amount={amt} > wincap={WINCAP_AMOUNT_CENTS}")

        elif et == "wincap":
            wincap_triggered = True
            amt = e.get("amount", 0)
            if amt != WINCAP_AMOUNT_CENTS:
                issues.add("F.wincapAmount", sid, f"wincap amount={amt}")

        elif et == "finalWin":
            amt = e.get("amount", 0)
            if amt > WINCAP_AMOUNT_CENTS:
                issues.add("F.finalWinExceedsCap", sid, f"finalWin={amt} > {WINCAP_AMOUNT_CENTS}")
            # payoutMultiplier in spin metadata is already in cents (== finalWin amount).
            if payout_mult is not None:
                if abs(amt - payout_mult) > 1:
                    issues.add("A.payoutMultMismatch", sid,
                               f"finalWin={amt} but spin.payoutMultiplier={payout_mult}")

        elif et in {"createBonusSnapshot"}:
            pass  # internal helper for resume bet

        else:
            issues.add("A.unknownEvent", sid, f"unknown event type '{et}'")

    # Spin-end checks
    if accumulated_base_win > 0 and not finalMult_emitted and not wincap_triggered:
        issues.add("D.missingFinalApply", sid,
                   f"accumulated base win={accumulated_base_win} but no finalMultiplierApplied")


def main():
    summary = {}
    for mode in ["base", "bonus"]:
        path = os.path.join(BASE_PATH, f"books_{mode}.json")
        if not os.path.exists(path):
            print(f"[skip] {path} not found")
            continue
        with open(path, "r", encoding="utf-8") as f:
            spins = json.load(f)

        issues = Issues()
        for spin in spins:
            analyze_spin(spin, mode, issues)

        stats = collect_distribution_stats(spins, mode)

        summary[mode] = {
            "total_spins": len(spins),
            "spins_with_issue": len(issues.spins_with_issue),
            "total_issues": issues.total(),
            "by_kind": {k: len(v) for k, v in sorted(issues.by_kind.items())},
            "examples": {k: v[:3] for k, v in sorted(issues.by_kind.items())},
            "stats": stats,
        }

    # Pretty print
    print("=" * 80)
    print("OverCharged Books Audit — Math Invariant Analyzer")
    print("=" * 80)
    for mode, data in summary.items():
        print(f"\n[{mode.upper()}] spins={data['total_spins']}, "
              f"with_issue={data['spins_with_issue']} ({data['spins_with_issue']/max(data['total_spins'],1)*100:.1f}%), "
              f"total_issues={data['total_issues']}")
        if not data["by_kind"]:
            print("  [OK] no invariant violations detected")
        else:
            print(f"\n  Issues by kind:")
            for k, n in data["by_kind"].items():
                print(f"    {k:32s} {n:>6d}")
            print(f"\n  Example occurrences (up to 3 per kind):")
            for k, exs in data["examples"].items():
                for sid, msg in exs:
                    print(f"    [{k}] spin={sid}: {msg}")

        st = data["stats"]
        print(f"\n  Distribution stats:")
        print(f"    RTP                       {st['rtp_pct']:8.2f} %  (target 97.00 %)")
        print(f"    zero-win                  {st['zero_win_pct']:8.2f} %")
        print(f"    free spin trigger rate    {st['fs_trigger_pct']:8.2f} %")
        print(f"    wincap rate               {st['wincap_pct']:8.2f} %")
        print(f"    M symbols on revealed boards     {st['M_symbols_total']}")
        print(f"    M activations emitted             {st['M_activations_total']}")
        if st['M_symbols_total']:
            print(f"    M inactive (no activation)        {st['M_inactive_pct']:6.2f} %")
        print(f"    finalMultiplier histogram: {st['fmult_hist']}")
        print(f"    payout buckets:")
        for k in ["0","0<x<=1","1<x<=5","5<x<=20","20<x<=100","100<x<=500","500<x<5000","5000 (wincap)"]:
            v = st['payout_buckets'].get(k, 0)
            pct = v / st['n_spins'] * 100
            print(f"      {k:18s} {v:>6d}  ({pct:5.2f} %)")
        print(f"    skill fires: {st['skills_fired']}")


if __name__ == "__main__":
    import sys
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    main()
