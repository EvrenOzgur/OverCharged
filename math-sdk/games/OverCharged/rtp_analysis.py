"""RTP attribution and what-if simulator for OverCharged books.

Decomposes payout into:
  - base wins by symbol & cluster size
  - global-multiplier amplification (M activation + L3 skill compound)
  - free-game contribution
  - skill trigger contribution

Then runs counterfactual scenarios (paytable scaled, multiplier weights
re-weighted, etc.) without re-running math, by replaying recorded events.
"""
import json
import os
import sys
from collections import defaultdict, Counter

sys.stdout.reconfigure(encoding="utf-8", errors="replace")

BOOKS = os.path.join(os.path.dirname(__file__), "library", "books")

PAYTABLE = {
    "H1": {5: 5.0, 6: 12.5, 7: 12.5, 8: 12.5, 9: 20.0, 10: 20.0, 11: 20.0, 12: 20.0, **{i: 48.0 for i in range(13, 37)}},
    "H2": {5: 2.0, 6: 5.0, 7: 5.0, 8: 5.0, 9: 8.0, 10: 8.0, 11: 8.0, 12: 8.0, **{i: 32.0 for i in range(13, 37)}},
    "H3": {5: 1.3, 6: 3.2, 7: 3.2, 8: 3.2, 9: 5.6, 10: 5.6, 11: 5.6, 12: 5.6, **{i: 24.0 for i in range(13, 37)}},
    "H4": {5: 1.0, 6: 2.5, 7: 2.5, 8: 2.5, 9: 4.8, 10: 4.8, 11: 4.8, 12: 4.8, **{i: 16.0 for i in range(13, 37)}},
    "L1": {5: 0.6, 6: 1.5, 7: 1.5, 8: 1.5, 9: 4.0, 10: 4.0, 11: 4.0, 12: 4.0, **{i: 10.0 for i in range(13, 37)}},
    "L2": {5: 0.4, 6: 1.2, 7: 1.2, 8: 1.2, 9: 3.5, 10: 3.5, 11: 3.5, 12: 3.5, **{i: 8.0 for i in range(13, 37)}},
    "L3": {5: 0.2, 6: 0.8, 7: 0.8, 8: 0.8, 9: 2.5, 10: 2.5, 11: 2.5, 12: 2.5, **{i: 5.0 for i in range(13, 37)}},
    "L4": {5: 0.1, 6: 0.5, 7: 0.5, 8: 0.5, 9: 1.5, 10: 1.5, 11: 1.5, 12: 1.5, **{i: 4.0 for i in range(13, 37)}},
}
TIER_OF = {5: "t1", 6: "t2", 7: "t2", 8: "t2", 9: "t3", 10: "t3", 11: "t3", 12: "t3"}
for i in range(13, 37):
    TIER_OF[i] = "t4"

WINCAP = 5000.0


def load(mode):
    with open(os.path.join(BOOKS, f"books_{mode}.json"), encoding="utf-8") as f:
        return json.load(f)


def attribute_spin(spin):
    """Return per-spin attribution dict (in bet-multiplier units)."""
    out = {
        "base_win_x": 0.0,         # raw cluster sum (no global mult), base game
        "free_win_x": 0.0,         # raw cluster sum, free game tumbles
        "applied_total_x": 0.0,    # actual paid (post mult, post wincap)
        "by_sym_tier": Counter(),  # (sym, tier) -> raw bet-mult
        "by_size": Counter(),      # cluster size -> raw bet-mult
        "m_added": 0,              # sum of all multiplier values added across activations
        "m_count": 0,              # number of M activations (symbols)
        "l3_fires": 0,
        "l1_fires": 0,
        "l2_fires": 0,
        "l4_fires": 0,
        "wincap": False,
        "fs_won": False,
        "max_globalmult": 1,
    }
    in_freegame = False
    for e in spin.get("events", []):
        t = e.get("type")
        if t == "reveal":
            in_freegame = (e.get("gameType") == "freegame")
        elif t == "winInfo":
            for w in e.get("wins", []):
                sym = w.get("symbol")
                if sym not in PAYTABLE:
                    continue
                size = w.get("clusterSize", len(w.get("positions", [])))
                cluster_mult = (w.get("meta") or {}).get("clusterMult") or 1
                # winWithoutMult is the per-cluster pre-globalMult amount (cents)
                pay_x = (w.get("meta") or {}).get("winWithoutMult", 0) / 100.0
                tier = TIER_OF.get(size, "t4")
                out["by_sym_tier"][(sym, tier)] += pay_x
                out["by_size"][size] += pay_x
                if in_freegame:
                    out["free_win_x"] += pay_x
                else:
                    out["base_win_x"] += pay_x
        elif t == "multiplierSymbolActivated":
            syms = e.get("symbols", [])
            out["m_count"] += len(syms)
            out["m_added"] += sum(s.get("value", 0) for s in syms)
            ngm = e.get("newGlobalMultiplier", 0)
            if ngm > out["max_globalmult"]:
                out["max_globalmult"] = ngm
        elif t == "skillActivated":
            stype = e.get("skillType")
            if stype == "L1":
                out["l1_fires"] += 1
            elif stype == "L2":
                out["l2_fires"] += 1
            elif stype == "L3":
                out["l3_fires"] += 1
                ngm = e.get("newGlobalMultiplier", 0)
                if ngm > out["max_globalmult"]:
                    out["max_globalmult"] = ngm
            elif stype == "L4":
                out["l4_fires"] += 1
        elif t == "wincap":
            out["wincap"] = True
        elif t == "freeSpinTrigger":
            out["fs_won"] = True
        elif t == "finalWin":
            out["applied_total_x"] = e.get("amount", 0) / 100.0
    return out


def aggregate(spins, cost):
    n = len(spins)
    agg = {
        "n": n,
        "rtp_actual": 0.0,
        "rtp_no_mult": 0.0,    # if every globalMult were 1
        "rtp_base_only": 0.0,  # only base-game tumble wins
        "rtp_free_only": 0.0,
        "wincap_x": 0.0,
        "wincap_count": 0,
        "by_sym_tier": Counter(),
        "by_size": Counter(),
        "m_count_avg": 0.0,
        "m_added_total": 0,
        "globalmult_hist": Counter(),
        "skill_fires": Counter(),
    }
    for s in spins:
        a = attribute_spin(s)
        agg["rtp_actual"] += a["applied_total_x"]
        # raw (no-mult) cap of cluster wins
        raw_total = a["base_win_x"] + a["free_win_x"]
        agg["rtp_no_mult"] += raw_total
        agg["rtp_base_only"] += a["base_win_x"]
        agg["rtp_free_only"] += a["free_win_x"]
        if a["wincap"]:
            agg["wincap_count"] += 1
            agg["wincap_x"] += a["applied_total_x"]
        for k, v in a["by_sym_tier"].items():
            agg["by_sym_tier"][k] += v
        for k, v in a["by_size"].items():
            agg["by_size"][k] += v
        agg["m_count_avg"] += a["m_count"]
        agg["m_added_total"] += a["m_added"]
        agg["globalmult_hist"][a["max_globalmult"]] += 1
        for k in ("l1_fires", "l2_fires", "l3_fires", "l4_fires"):
            agg["skill_fires"][k] += a[k]

    # Convert sums to per-spin RTP (divide by n × cost)
    # cost is in bet-mult units (bonus cost = 100 means 100x bet)
    norm = n * cost
    rtp_actual = agg["rtp_actual"] / norm
    rtp_no_mult = agg["rtp_no_mult"] / norm
    rtp_base_only = agg["rtp_base_only"] / norm
    rtp_free_only = agg["rtp_free_only"] / norm

    print(f"\n  Per-spin RTP decomposition (cost = {cost}× bet):")
    print(f"    Total RTP (actual paid):           {rtp_actual*100:8.2f} %")
    print(f"    RTP without any global multiplier: {rtp_no_mult*100:8.2f} %")
    print(f"    Multiplier amplification factor:   {rtp_actual/max(rtp_no_mult,1e-9):8.2f}×")
    print(f"    Base-game raw win contribution:    {rtp_base_only*100:8.2f} %")
    print(f"    Free-game raw win contribution:    {rtp_free_only*100:8.2f} %")
    print(f"    Wincap contribution:               {agg['wincap_x']/norm*100:8.2f} %  ({agg['wincap_count']} spins)")

    print(f"\n  Cluster contribution by symbol × tier (raw bet-mult, no global mult):")
    print(f"    {'symbol':<4} {'tier':<4} {'sum_x':>10} {'pct_of_raw':>12}")
    total_raw = sum(agg["by_sym_tier"].values()) or 1
    for (sym, tier), v in sorted(agg["by_sym_tier"].items(), key=lambda x: -x[1])[:20]:
        print(f"    {sym:<4} {tier:<4} {v:>10.2f} {v/total_raw*100:>11.2f}%")

    print(f"\n  Cluster contribution by size:")
    for size in sorted(agg["by_size"].keys()):
        v = agg["by_size"][size]
        print(f"    size={size:<3} sum_x={v:>9.2f}  ({v/total_raw*100:5.2f}%)")

    print(f"\n  Multiplier stats:")
    print(f"    avg M activations per spin:   {agg['m_count_avg']/n:6.3f}")
    print(f"    avg M total value per spin:   {agg['m_added_total']/n:6.3f}")
    print(f"    max-globalMult histogram (top 10): "
          f"{sorted(agg['globalmult_hist'].items(), key=lambda x: -x[1])[:10]}")

    print(f"\n  Skill fires (totals across {n} spins):")
    for k in ["l1_fires", "l2_fires", "l3_fires", "l4_fires"]:
        v = agg["skill_fires"][k]
        print(f"    {k:<10} {v:>6}  ({v/n:.4f} per spin)")
    return agg


def what_if(spins, cost, label, paytable_scale=1.0, mult_value_scale=1.0,
            wincap_scale=1.0, l3_disable=False, m_drop_threshold=None):
    """Replay spins under a counterfactual configuration. Approximations:
       - paytable_scale: scale every cluster's winWithoutMult by k
       - mult_value_scale: scale every M activation value by k (compounds)
       - l3_disable: treat L3 multiplier factor = 1 (skip)
       - m_drop_threshold: if M.value > threshold, treat as 0 (cap big M's)
       - wincap_scale: scale wincap (5000 → 5000*scale); spins capped accordingly
    """
    n = len(spins)
    total = 0.0
    cap = WINCAP * wincap_scale
    for s in spins:
        # Reconstruct payout from events: walk per-tumble, track running base accumulator
        # and globalMult; apply final multiplier; cap at wincap.
        accumulated = 0.0
        gm = 1
        for e in s.get("events", []):
            t = e.get("type")
            if t == "reveal":
                # New spin segment (basegame reveal or fs reveal)
                accumulated = 0.0
                gm = 1
            elif t == "winInfo":
                for w in e.get("wins", []):
                    if w.get("symbol") not in PAYTABLE:
                        continue
                    pay_x = (w.get("meta") or {}).get("winWithoutMult", 0) / 100.0
                    accumulated += pay_x * paytable_scale
            elif t == "multiplierSymbolActivated":
                syms = e.get("symbols", [])
                added = 0
                for sym in syms:
                    v = sym.get("value", 0)
                    if m_drop_threshold is not None and v > m_drop_threshold:
                        v = 0
                    added += v * mult_value_scale
                if gm == 1:
                    gm = added if added > 0 else 1
                else:
                    gm += added
            elif t == "skillActivated" and e.get("skillType") == "L3":
                if not l3_disable:
                    factor = e.get("multiplierFactor", 1)
                    gm *= factor
            elif t == "finalMultiplierApplied":
                # tumble sequence ends — apply global multiplier
                # actual replay: apply gm to accumulated, then reset for next FS spin
                final = accumulated * gm
                final = min(final, cap)
                total += final
                accumulated = 0.0
                gm = 1

    rtp = total / (n * cost) * 100
    print(f"  {label:<55} RTP = {rtp:7.2f} %")
    return rtp


def main():
    print("=" * 80)
    print("OverCharged RTP Attribution & What-If Analysis")
    print("=" * 80)

    for mode, cost in [("base", 1.0), ("bonus", 100.0)]:
        print(f"\n[{mode.upper()}]  spins=10000  cost={cost}× bet")
        spins = load(mode)
        aggregate(spins, cost)

        print(f"\n  What-if scenarios for {mode}:")
        what_if(spins, cost, "current config (sanity)", paytable_scale=1.0, mult_value_scale=1.0)
        what_if(spins, cost, "paytable × 0.50 (halve all payouts)", paytable_scale=0.50)
        what_if(spins, cost, "paytable × 0.40", paytable_scale=0.40)
        what_if(spins, cost, "paytable × 0.30", paytable_scale=0.30)
        what_if(spins, cost, "paytable × 0.25", paytable_scale=0.25)
        what_if(spins, cost, "M values × 0.50 (halve every M value)", mult_value_scale=0.50)
        what_if(spins, cost, "M values × 0.30", mult_value_scale=0.30)
        what_if(spins, cost, "drop M values > 100 (cap big multipliers)", m_drop_threshold=100)
        what_if(spins, cost, "drop M values > 50", m_drop_threshold=50)
        what_if(spins, cost, "drop M values > 20", m_drop_threshold=20)
        what_if(spins, cost, "drop M values > 10", m_drop_threshold=10)
        what_if(spins, cost, "L3 (multiplicative) disabled", l3_disable=True)
        what_if(spins, cost, "paytable × 0.5 + M × 0.5", paytable_scale=0.5, mult_value_scale=0.5)
        what_if(spins, cost, "paytable × 0.5 + L3 disabled", paytable_scale=0.5, l3_disable=True)
        what_if(spins, cost, "paytable × 0.4 + drop M > 20",
                paytable_scale=0.4, m_drop_threshold=20)
        what_if(spins, cost, "paytable × 0.5 + drop M > 50 + L3 off",
                paytable_scale=0.5, m_drop_threshold=50, l3_disable=True)


if __name__ == "__main__":
    main()
