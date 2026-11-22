#!/usr/bin/env python3
"""Analytic economy skeleton for Monsoon Navigator (M3 analytic part, M4).

Implements research/03/pre-registrations/2026-11-22-economy-skeleton-m3-m4.md
(registered text sections 4 and 5; interpretations fixed in its section 8
before any output was seen). Standard library only, deterministic, run once.

    python research/03/models/economy_skeleton.py

Reads tests/03/fixtures/baseline-transit.json and economy-skeleton-params.json
(beside this file). Writes tables to
research/03/results/2026-11-22-economy-skeleton/, including the hazard-free
action plans that economy-skeleton-partc.mjs replays through the real engine.

Every number is a property of the game's invented parameters, not a historical
finding.
"""
import copy
import csv
import json
import math
import os

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, "..", "..", ".."))
OUT = os.path.join(ROOT, "research", "03", "results", "2026-11-22-economy-skeleton")
with open(os.path.join(HERE, "economy-skeleton-params.json"), encoding="utf8") as fh:
    BASE = json.load(fh)
with open(os.path.join(ROOT, "tests", "03", "fixtures", "baseline-transit.json"), encoding="utf8") as fh:
    FIXTURE = json.load(fh)

MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
VESSELS = list(BASE["vessels"])
DIFFS = list(BASE["difficulties"])
SWEEP_DIFFS = ["normal", "hard", "survival"]          # the difficulties in baseline section 5
POLICIES = ["sailAlways", "avoidHeadwind", "avoidHeadwindAndTransition"]
GOODS = list(BASE["goods"])                            # engine COMMODITIES order
PORTS = list(BASE["ports"])
LEVELS = [0, 1]
FILLS = ["opt", "greedy"]                              # S-opt (LP) and S-greedy (harnessPlan)
HZ = BASE["hazards"]
TB = HZ["turnBack"]
INF = float("inf")

# Baseline section 5 medians (net profit, D), seen before registration (prior look 1).
SWEEP_MEDIAN = {
    ("normal", "dhow", "sailAlways"): 88305, ("normal", "dhow", "avoidHeadwind"): 216713,
    ("normal", "dhow", "avoidHeadwindAndTransition"): 217957,
    ("normal", "junk", "sailAlways"): 167826, ("normal", "junk", "avoidHeadwind"): 175864,
    ("normal", "junk", "avoidHeadwindAndTransition"): 456317,
    ("hard", "dhow", "sailAlways"): 79478, ("hard", "dhow", "avoidHeadwind"): 189229,
    ("hard", "dhow", "avoidHeadwindAndTransition"): 190203,
    ("hard", "junk", "sailAlways"): 146944, ("hard", "junk", "avoidHeadwind"): 154944,
    ("hard", "junk", "avoidHeadwindAndTransition"): 413966,
    ("survival", "dhow", "sailAlways"): 76409, ("survival", "dhow", "avoidHeadwind"): 175372,
    ("survival", "dhow", "avoidHeadwindAndTransition"): 176596,
    ("survival", "junk", "sailAlways"): 139119, ("survival", "junk", "avoidHeadwind"): 147106,
    ("survival", "junk", "avoidHeadwindAndTransition"): 401618,
}
# Same-seed winner in section 5: +1 junk ahead, -1 dhow ahead (300/300 in every cell).
SWEEP_SIGN = {(p, d): (-1 if p == "avoidHeadwind" else 1) for p in POLICIES for d in SWEEP_DIFFS}


def jsround(x):
    """JavaScript Math.round: halves round up."""
    return math.floor(x + 0.5)


# --- transit (fixture) --------------------------------------------------------

TRANSIT = {}
for _r in FIXTURE["rows"]:
    TRANSIT[(_r["from"], _r["to"], _r["vessel"], _r["navigator"], MONTHS.index(_r["month"]))] = (_r["months"], _r["status"])
MISSING_CELLS = [
    (l["from"], l["to"], v, n, MONTHS[t])
    for l in BASE["lanes"] for v in VESSELS for n in (False, True) for t in range(12)
    if (l["from"], l["to"], v, n, t) not in TRANSIT
]


def transit(frm, to, v, t, nav=False):
    return TRANSIT[(frm, to, v, nav, t % 12)]


def is_head(s):
    return s.startswith("Headwind")


def is_tail(s):
    return s.startswith("Tailwind")


def is_dead(s):
    return s.startswith("Dead Zone")


def allowed(status, policy):
    if policy == "sailAlways":
        return True
    if is_head(status):
        return False
    if policy == "avoidHeadwindAndTransition" and is_dead(status):
        return False
    return True


def e_cal(frm, to, v, t, nav=False, trunc=None):
    """Expected months for 'sail now, retry at once', on the calendar (section 4.2)."""
    m, s = transit(frm, to, v, t, nav)
    if not is_head(s):
        return m
    if trunc is not None and t + m >= trunc:
        return m
    return m + TB * e_cal(frm, to, v, t + m, nav, trunc)


def wait_for(frm, to, v, t, pred, nav=False):
    """First k >= 0 with pred(status at t + k); None if no month in a year qualifies."""
    for k in range(13):
        if pred(transit(frm, to, v, t + k, nav)[1]):
            return k
    return None


ADJ = {}
for _l in BASE["lanes"]:
    ADJ.setdefault(_l["from"], []).append(_l["to"])


def shortest_path(a, b):
    prev, frontier = {a: None}, [a]
    while frontier:
        nxt = []
        for p in frontier:
            for q in ADJ[p]:
                if q not in prev:
                    prev[q] = p
                    nxt.append(q)
        frontier = nxt
    path, p = [], b
    while p is not None:
        path.append(p)
        p = prev[p]
    return path[::-1]


# --- prices -------------------------------------------------------------------

class Model:
    """Parameters plus caches; a copy with one value changed is used for the boundary table."""

    def __init__(self, params):
        self.P = params
        self._deliv = {}

    def price(self, g, port, t, level):
        base = self.P["goods"][g]["prices"][port]
        if level == 0:
            return base
        seed = ord(port[0]) + ord(g[0])
        wave = math.sin(((t + seed) * math.pi) / 6)
        return max(10, jsround(base * (1 + wave * self.P["priceWave"])))

    def tariff(self, port, standing=0, standing_tariff=False):
        base = self.P["ports"][port]["tariff"]
        st = self.P["standing"]
        cut = st["tariffCut"] if (standing_tariff and standing >= st["tariffCutAt"]) else 0
        return max(st["tariffFloor"], base - cut)

    def cost(self, g, port, t, level, standing=0, standing_tariff=False):
        return jsround(self.price(g, port, t, level) * (1 + self.tariff(port, standing, standing_tariff)))

    def fee(self, port, diff, standing=0):
        mult = 1.0
        for at, m in self.P["standing"]["feeTiers"]:
            if standing >= at:
                mult = m
                break
        return jsround(self.P["ports"][port]["fee"] * self.P["difficulties"][diff]["feeMult"] * mult)

    def deliv(self, i, j, tb, ta, v, level):
        """One delivery i (buy month tb) -> j (sale month ta): rankings and thresholds (section 4.1)."""
        key = (i, j, tb % 12, ta % 12, v, level)
        hit = self._deliv.get(key)
        if hit is not None:
            return hit
        K = self.P["vessels"][v]["capacity"]
        rows = []
        for g in GOODS:
            w = self.P["goods"][g]["weight"]
            c = self.cost(g, i, tb % 12, level)
            p = self.price(g, j, ta % 12, level)
            m = p - c
            rows.append({"good": g, "cost": c, "sale": p, "margin": m, "r": m / c, "perTonne": m / w, "weight": w})
        best = max(rows, key=lambda x: x["r"])          # first maximum, as a stable descending sort
        out = {"from": i, "to": j, "buyMonth": MONTHS[tb % 12], "saleMonth": MONTHS[ta % 12], "goods": rows}
        if best["r"] <= 0:
            out.update(r=0.0, good=None, cstar=None, hold={"opt": 0.0, "greedy": 0.0}, cstarOpt=None)
        else:
            hold_opt = max((K / x["weight"]) * x["margin"] for x in rows if x["margin"] > 0)
            hold_greedy = (K / best["weight"]) * best["margin"]
            out.update(r=best["r"], good=best["good"], cstar=best["cost"] * K / best["weight"],
                       hold={"opt": hold_opt, "greedy": hold_greedy})
        out["rankByR"] = [x["good"] for x in sorted(rows, key=lambda x: -x["r"]) if x["r"] > 0]
        out["rankByTonne"] = [x["good"] for x in sorted(rows, key=lambda x: -x["perTonne"]) if x["margin"] > 0]
        self._deliv[key] = out
        return out


# --- Q1: cycles -----------------------------------------------------------------

def closed_walks(max_legs=6):
    out = []

    def rec(path):
        n = len(path) - 1
        if n >= 2 and path[-1] == path[0]:
            out.append(tuple(path))
        if n == max_legs:
            return
        for q in ADJ[path[-1]]:
            rec(path + [q])

    for p in PORTS:
        rec([p])
    return out


def partitions(n_legs):
    """Delivery boundaries: every subset of the interior cut points."""
    for mask in range(2 ** (n_legs - 1)):
        cuts = [0] + [k for k in range(1, n_legs) if mask >> (k - 1) & 1] + [n_legs]
        yield tuple((cuts[a], cuts[a + 1]) for a in range(len(cuts) - 1))


def one_pass(walk, v, policy, t0):
    """Legs of one pass of the walk from absolute month t0. None if a leg is never allowed."""
    legs, t = [], t0
    for a in range(len(walk) - 1):
        frm, to = walk[a], walk[a + 1]
        k = wait_for(frm, to, v, t, lambda s: allowed(s, policy))
        if k is None:
            return None, None
        t += k
        m, s = transit(frm, to, v, t)
        charged = e_cal(frm, to, v, t) if (policy == "sailAlways" and is_head(s)) else m
        legs.append({"from": frm, "to": to, "wait": k, "dep": t, "months": m, "charged": charged, "status": s})
        t += m
    return legs, t


def steady_loop(walk, v, policy):
    """Repeat the walk from January until the starting calendar month repeats; return the periodic passes."""
    seen, passes, t = {}, [], 0
    while t % 12 not in seen:
        seen[t % 12] = len(passes)
        legs, t_next = one_pass(walk, v, policy, t)
        if legs is None:
            return None
        passes.append(legs)
        t = t_next
    return passes[seen[t % 12]:]


def interest(params, diff, horizon):
    debt = params["difficulties"][diff]["debt"]
    d0 = debt
    for _ in range(int(horizon // params["loan"]["everyMonths"])):
        if debt > 0:
            debt += jsround(debt * params["loan"]["rate"])
    return debt - d0


def cycle_metrics(model, loop, segs, v, level, diffs, horizon=None, c0_override=None):
    """rho, R_cap, C*, t*, F per difficulty and fill for one walk + delivery split (section 4.1)."""
    P = model.P
    H = P["campaignMonths"] if horizon is None else horizon
    u = P["vessels"][v]["wages"]
    T = 0.0
    hold = {"opt": 0.0, "greedy": 0.0}
    cstars, rs, delivs = [], [], []
    seq = []   # per delivery: (wait cost by fee-mult key, r, sail cost)
    for legs in loop:
        for a, b in segs:
            part = legs[a:b]
            d = model.deliv(part[0]["from"], part[-1]["to"], part[0]["dep"], part[-1]["dep"] + part[-1]["months"], v, level)
            delivs.append(d)
            T += sum(x["wait"] + x["charged"] for x in part)
            for f in FILLS:
                hold[f] += d["hold"][f]
            if d["cstar"] is not None:
                cstars.append(d["cstar"])
            seq.append((part, d["r"]))
    if T <= 0:
        return None
    res = {"T": T, "deliveries": delivs, "cstarMin": min(cstars) if cstars else None,
           "cstar": max(cstars) if cstars else None, "byDiff": {}}
    for diff in diffs:
        C0 = P["difficulties"][diff]["cash"] if c0_override is None else c0_override
        C, costs, alive = C0, 0.0, True
        for part, r in seq:
            first = part[0]
            wc = first["wait"] * (u + model.fee(first["from"], diff))
            C -= wc
            C *= 1 + r
            sc = u * first["charged"]
            for x in part[1:]:
                sc += x["wait"] * (u + model.fee(x["from"], diff)) + u * x["charged"]
            C -= sc
            costs += wc + sc
            if C <= 0:
                alive = False
        rho = math.log(C / C0) / T if (alive and C > 0) else -INF
        cstar = res["cstar"]
        per = {"rho": rho}
        for f in FILLS:
            rcap = (hold[f] - costs) / T
            if cstar is None:
                tstar, F = INF, rcap * H
            elif C0 >= cstar:
                tstar, F = 0.0, rcap * H
            elif rho <= 0:
                tstar, F = INF, (C0 * (math.exp(H * rho) - 1) if rho > -INF else -C0)
            else:
                tstar = math.log(cstar / C0) / rho
                F = cstar - C0 + rcap * (H - tstar) if tstar < H else C0 * (math.exp(H * rho) - 1)
            net = F - interest(P, diff, H)
            per[f] = {"Rcap": rcap, "tstar": tstar, "F": F, "net": net}
        res["byDiff"][diff] = per
    return res


class Enumeration:
    """All closed walks of at most 6 legs, every delivery split, per vessel, policy and level."""

    def __init__(self, model):
        self.model = model
        self.walks = closed_walks()
        self.loops = {}
        for w in self.walks:
            for v in VESSELS:
                for pol in POLICIES:
                    self.loops[(w, v, pol)] = steady_loop(w, v, pol)

    def run(self, levels=LEVELS, diffs=DIFFS, horizon=None, c0_override=None, vessels=VESSELS, policies=POLICIES):
        """Yield (walk, segs, v, policy, level, metrics)."""
        for w in self.walks:
            n = len(w) - 1
            for segs in partitions(n):
                for v in vessels:
                    for pol in policies:
                        loop = self.loops[(w, v, pol)]
                        if loop is None:
                            continue
                        for lv in levels:
                            m = cycle_metrics(self.model, loop, segs, v, lv, diffs, horizon, c0_override)
                            if m is not None:
                                yield w, segs, v, pol, lv, m

    def best(self, levels=LEVELS, diffs=DIFFS, fills=FILLS, top=1, horizon=None, c0_override=None,
             vessels=VESSELS, policies=POLICIES):
        """Best cycles by F per (vessel, difficulty, policy, level, fill); also best by rho and by R_cap."""
        cells = {}
        for w, segs, v, pol, lv, m in self.run(levels, diffs, horizon, c0_override, vessels, policies):
            for diff in diffs:
                per = m["byDiff"][diff]
                for f in fills:
                    key = (v, diff, pol, lv, f)
                    c = cells.setdefault(key, {"byF": [], "byRho": None, "byRcap": None})
                    entry = (per[f]["F"], w, segs, m, per)
                    c["byF"].append(entry)
                    if c["byRho"] is None or per["rho"] > c["byRho"][0]:
                        c["byRho"] = (per["rho"], w, segs, m, per)
                    if c["byRcap"] is None or per[f]["Rcap"] > c["byRcap"][0]:
                        c["byRcap"] = (per[f]["Rcap"], w, segs, m, per)
        for c in cells.values():
            c["byF"].sort(key=lambda e: -e[0])
            c["byF"] = c["byF"][:top]
        return cells


def walk_label(w, segs):
    """Calicut>Malacca|Malacca>Calicut style: '|' separates deliveries."""
    parts = []
    for a, b in segs:
        parts.append(">".join(x[:3].title() for x in w[a:b + 1]))
    return " | ".join(parts)


# --- R-H: integer path through the calendar (engine-like) ------------------------

class Sim:
    """The engine's money logic on a hazard-free path (sections 4.1 R-H, 6.2).

    level 0: base prices and tariffs; level 1: live prices. standing_tariff adds
    the engine's standing tariff cut (engine-exact mode, used by Part C).
    Port fees always follow standing, as the engine's do. dmg_u is the value the
    damage draw returns (0 = least damage); hazards otherwise do not fire.
    """

    def __init__(self, model, v, diff, level, standing_tariff, start="calicut", dmg_u=0.0):
        P = model.P
        self.m, self.P, self.v, self.diff, self.level = model, P, v, diff, level
        self.standing_tariff, self.dmg_u = standing_tariff, dmg_u
        d = P["difficulties"][diff]
        self.cash, self.debt = d["cash"], d["debt"]
        self.equity = self.cash - self.debt
        self.t, self.port, self.hull, self.crew = 0, start, 100, 100
        self.cargo = {g: 0 for g in GOODS}
        self.dias = {p: 0 for p in PORTS}
        self.dias[start] = P["standing"]["home"]
        self.ended, self.net, self.actions = False, None, []

    def _log(self, kind, draws=(), **kw):
        self.actions.append(dict(kind=kind, draws=list(draws), cash=self.cash, month=self.t, port=self.port,
                                 debt=self.debt, hull=self.hull, ended=self.ended, **kw))

    def price(self, g, port, t):
        return self.m.price(g, port, t, self.level)

    def unit_cost(self, g):
        return jsround(self.price(g, self.port, self.t) * (1 + self.m.tariff(self.port, self.dias[self.port], self.standing_tariff)))

    def used(self):
        return sum(self.cargo[g] * self.P["goods"][g]["weight"] for g in GOODS)

    def sell_all(self):
        for g in GOODS:
            q = self.cargo[g]
            if q > 0:
                self.cash += q * self.price(g, self.port, self.t)
                self.cargo[g] = 0
                self._log("sell", good=g, qty=q)

    def repair(self):
        rp = self.P["repair"]
        if self.hull >= 100 or self.cash < rp["cost"]:
            return
        self.cash -= rp["cost"]
        self.hull = min(100, self.hull + rp["hull"])
        self._log("repair")

    def buy(self, g, q):
        unit = self.unit_cost(g)
        w = self.P["goods"][g]["weight"]
        a = min(q, (self.P["vessels"][self.v]["capacity"] - self.used()) // w, self.cash // unit)
        if a <= 0:
            return
        self.cash -= a * unit
        self.cargo[g] += a
        self._log("buy", good=g, qty=a)

    def wait(self):
        fee = self.m.fee(self.port, self.diff, self.dias[self.port])
        self.cash -= fee + self.P["vessels"][self.v]["wages"]
        self.crew = min(100, self.crew + HZ["crewPortPerMonth"])
        self.dias[self.port] = min(100, self.dias[self.port] + self.P["standing"]["perWait"])
        draws = [0.99]                                   # no port story
        self._advance(1)
        self._log("wait", draws)

    def sail(self, dest):
        V = self.P["vessels"][self.v]
        D = self.P["difficulties"][self.diff]
        m, s = transit(self.port, dest, self.v, self.t)
        self.cash -= V["wages"] * m
        draws, loss = [], m * HZ["crewSeaPerMonth"]
        head, dead = is_head(s), is_dead(s)
        if head:
            loss += HZ["crewHazard"]
            dmg = jsround((HZ["headwindDamage"][0] + self.dmg_u * HZ["headwindDamage"][1]) * V["damageMult"] * D["damageMult"])
            self.hull = max(HZ["hullFloor"], self.hull - dmg)
            draws += [self.dmg_u, 0.99]                  # damage; no turn-back
            if self.cargo["teak"] > 0:
                draws.append(0.99)                       # no jettison
        if dead:
            draws.append(0.99)                           # neither storm nor becalming
        if self.cargo["porcelain"] > 0 and self.hull < HZ["porcelainHullBelow"] and (head or dead):
            lost = max(1, math.floor(self.cargo["porcelain"] * HZ["porcelainShare"]))
            self.cargo["porcelain"] -= lost
        if self.cargo["textiles"] > 0 and dead:
            draws.append(0.99)                           # no mildew
        draws.append(0.99)                               # no pirates
        self.port = dest
        self.dias[dest] = min(100, self.dias[dest] + self.P["standing"]["perArrival"])
        self.crew = max(0, self.crew - loss)
        if max(0, HZ["mutinyHealth"] - self.crew) > 0:
            draws.append(0.99)                           # no mutiny
        self._advance(m)
        self._log("sail", draws, dest=dest, status=s, months=m)

    def _advance(self, months):
        prev = self.t // self.P["loan"]["everyMonths"]
        self.t += months
        if self.debt > 0 and self.t // self.P["loan"]["everyMonths"] > prev:
            self.debt += jsround(self.debt * self.P["loan"]["rate"])
        if self.t >= self.P["campaignMonths"] or self.cash < self.P["endCashBelow"]:
            self._finish()

    def _finish(self):
        for g in GOODS:
            if self.cargo[g] > 0:
                self.cash += self.cargo[g] * self.price(g, self.port, min(23, self.t))
                self.cargo[g] = 0
        self.cash -= self.debt
        self.debt = 0
        self.ended = True
        self.net = self.cash - self.equity


def plan_buys(sim, final_port, arrival, fill, exclude=()):
    """S-greedy is harnessPlan generalised to a multi-leg delivery; S-opt is the LP, floored, then topped up."""
    P = sim.P
    arr = min(23, arrival)
    K = P["vessels"][sim.v]["capacity"] - sim.used()
    cash = max(0, sim.cash - P["harness"]["cashReserve"])
    items = []
    for g in GOODS:
        if g in exclude:
            continue
        c = sim.unit_cost(g)
        p = sim.price(g, final_port, arr)
        items.append({"g": g, "c": c, "p": p, "m": p - c, "w": P["goods"][g]["weight"]})
    buys = []
    if fill == "greedy":
        items = sorted([x for x in items if x["p"] / x["c"] > 1], key=lambda x: -(x["p"] / x["c"]))
        tons = 0
        for x in items:
            q = min((K - tons) // x["w"], cash // x["c"])
            if q > 0:
                buys.append((x["g"], q))
                cash -= q * x["c"]
                tons += q * x["w"]
        return buys
    pos = [x for x in items if x["m"] > 0]
    best, best_val = {}, 0.0
    for a in pos:                                        # single goods
        n = min(cash / a["c"], K / a["w"])
        if n * a["m"] > best_val:
            best, best_val = {a["g"]: n}, n * a["m"]
    for ia in range(len(pos)):                           # pairs with both constraints tight
        for ib in range(ia + 1, len(pos)):
            a, b = pos[ia], pos[ib]
            det = a["c"] * b["w"] - b["c"] * a["w"]
            if det == 0:
                continue
            na = (cash * b["w"] - b["c"] * K) / det
            nb = (a["c"] * K - cash * a["w"]) / det
            if na >= 0 and nb >= 0 and na * a["m"] + nb * b["m"] > best_val:
                best, best_val = {a["g"]: na, b["g"]: nb}, na * a["m"] + nb * b["m"]
    tons = 0
    for g, n in best.items():
        x = next(i for i in pos if i["g"] == g)
        q = math.floor(n + 1e-9)
        q = min(q, (K - tons) // x["w"], cash // x["c"])
        if q > 0:
            buys.append([g, q])
            cash -= q * x["c"]
            tons += q * x["w"]
    for x in sorted(pos, key=lambda x: -(x["m"] / x["w"])):
        q = min((K - tons) // x["w"], cash // x["c"])
        if q > 0:
            for bb in buys:
                if bb[0] == x["g"]:
                    bb[1] += q
                    break
            else:
                buys.append([x["g"], q])
            cash -= q * x["c"]
            tons += q * x["w"]
    return [tuple(b) for b in buys]


def project_arrival(legs, v, policy, t):
    for frm, to in legs:
        k = wait_for(frm, to, v, t, lambda s: allowed(s, policy))
        if k is None:
            return None
        t += k + transit(frm, to, v, t + k)[0]
    return t


def run_rh(model, walk, segs, v, diff, policy, level, standing_tariff=False, fill="greedy",
           dmg_u=0.0, exclude=(), repair=True):
    """Calicut, month 0: reach the walk's first port, then repeat the walk's deliveries to month 24."""
    sim = Sim(model, v, diff, level, standing_tariff, dmg_u=dmg_u)
    path = shortest_path(model.P["harness"]["startPort"], walk[0])
    reach = [[(path[i], path[i + 1])] for i in range(len(path) - 1)]
    cyc = [[(walk[k], walk[k + 1]) for k in range(a, b)] for a, b in segs]
    queue, qi, guard = reach + cyc, 0, 0
    while not sim.ended and guard < 500:
        guard += 1
        legs = queue[qi]
        qi += 1
        if qi == len(queue):
            queue, qi = cyc, 0
        sim.sell_all()
        hr = model.P["harness"]
        if repair and sim.hull < hr["repairBelowHull"] and sim.cash > hr["repairAboveCash"]:
            sim.repair()
        frm, to = legs[0]
        while not sim.ended and not allowed(transit(frm, to, v, sim.t)[1], policy):
            sim.wait()
        if sim.ended:
            break
        arrival = project_arrival(legs, v, policy, sim.t)
        if arrival is None:
            break
        for g, q in plan_buys(sim, legs[-1][1], arrival, fill, exclude):
            sim.buy(g, q)
        for frm, to in legs:
            while not sim.ended and not allowed(transit(frm, to, v, sim.t)[1], policy):
                sim.wait()
            if sim.ended:
                break
            sim.sail(to)
            if sim.ended:
                break
    return sim


# --- Q2: the price of time ------------------------------------------------------

def damage_pmf(base, span, mult):
    """Distribution of round((base + U*span) * mult) for U ~ Uniform[0, 1), on a fine grid."""
    n, pmf = 4000, {}
    for i in range(n):
        d = jsround((base + (i + 0.5) / n * span) * mult)
        pmf[d] = pmf.get(d, 0) + 1 / n
    return pmf


def voyage_expect(model, frm, to, v, t, nav, diff, cargo, hull, level, retry=True, trunc=24):
    """Expected direct costs of 'sail now, retry at once' from month t (section 4.2, D_sail)."""
    P = model.P
    V, D = P["vessels"][v], P["difficulties"][diff]
    m, s = transit(frm, to, v, t, nav)
    head, dead = is_head(s), is_dead(s)
    sale = {g: model.price(g, to, t + m, level) for g in GOODS}
    out = {"months": m, "attempts": 1.0, "wages": V["wages"] * m, "jettison": 0.0, "porcelain": 0.0,
           "becalm": 0.0, "textiles": 0.0}
    if not (head or dead):
        return out
    if head:
        branches = [(dmg, p) for dmg, p in damage_pmf(HZ["headwindDamage"][0], HZ["headwindDamage"][1], V["damageMult"] * D["damageMult"]).items()]
    else:
        ps = HZ["stormNavigator"] if nav else HZ["storm"]
        branches = [(dmg, p * ps) for dmg, p in damage_pmf(HZ["stormDamage"][0], HZ["stormDamage"][1], V["damageMult"] * D["damageMult"]).items()]
        branches.append((0, 1 - ps))
        out["becalm"] = HZ["becalmBand"] * HZ["becalmCost"]
    porc = cargo.get("porcelain", 0)
    for dmg, p in branches:
        h2 = max(HZ["hullFloor"], hull - dmg)
        lost = max(1, math.floor(porc * HZ["porcelainShare"])) if (porc > 0 and h2 < HZ["porcelainHullBelow"]) else 0
        out["porcelain"] += p * lost * sale["porcelain"]
        if head and retry and t + m < trunc:
            nxt = dict(cargo, porcelain=porc - lost)
            sub = voyage_expect(model, frm, to, v, t + m, nav, diff, nxt, h2, level, retry, trunc)
            for k in ("months", "attempts", "wages", "jettison", "porcelain", "becalm", "textiles"):
                out[k] += p * TB * sub[k]
    if head and cargo.get("teak", 0) > 0:
        out["jettison"] += (1 - TB) * HZ["jettison"] * sale["teak"]
    if dead and cargo.get("textiles", 0) > 0:
        out["textiles"] += HZ["textileLoss"] * sale["textiles"]
    return out


def lp_fill(model, i, j, t, ta, v, level, cash):
    """S-opt LP cargo for one lane at a given cash (None = unlimited); integer lots by flooring."""
    P = model.P
    K = P["vessels"][v]["capacity"]
    pos = []
    for g in GOODS:
        c, p, w = model.cost(g, i, t, level), model.price(g, j, ta, level), P["goods"][g]["weight"]
        if p - c > 0:
            pos.append((g, c, p - c, w))
    if not pos:
        return {}
    if cash is None:
        g, c, m, w = max(pos, key=lambda x: (K / x[3]) * x[2])
        return {g: K // w}
    best, val = {}, 0.0
    for g, c, m, w in pos:
        n = min(cash / c, K / w)
        if n * m > val:
            best, val = {g: n}, n * m
    for a in range(len(pos)):
        for b in range(a + 1, len(pos)):
            ga, ca, ma, wa = pos[a]
            gb, cb, mb, wb = pos[b]
            det = ca * wb - cb * wa
            if det == 0:
                continue
            na, nb = (cash * wb - cb * K) / det, (ca * K - cash * wa) / det
            if na >= 0 and nb >= 0 and na * ma + nb * mb > val:
                best, val = {ga: na, gb: nb}, na * ma + nb * mb
    return {g: math.floor(n + 1e-9) for g, n in best.items()}


def q2_cells(model, level, lam_table, hull0=100):
    """The Q2 table: 10 lanes x 12 months x 2 vessels x navigator (section 4.2)."""
    rows = []
    P = model.P
    for lane in P["lanes"]:
        frm, to = lane["from"], lane["to"]
        for v in VESSELS:
            u = P["vessels"][v]["wages"]
            for nav in (False, True):
                for t in range(12):
                    m, s = transit(frm, to, v, t, nav)
                    row = {"from": frm, "to": to, "vessel": v, "navigator": nav, "month": MONTHS[t], "t": t,
                           "status": s, "M": m, "headwind": is_head(s)}
                    k_nh = wait_for(frm, to, v, t, lambda x: not is_head(x), nav)
                    k_tw = wait_for(frm, to, v, t, is_tail, nav)
                    W_nh = k_nh + transit(frm, to, v, t + k_nh, nav)[0] if (k_nh is not None and t + k_nh < 24) else None
                    W_tw = k_tw + transit(frm, to, v, t + k_tw, nav)[0] if (k_tw is not None and t + k_tw < 24) else None
                    row.update(k_nh=k_nh, k_tw=k_tw, W_nh=W_nh, W_tw=W_tw)
                    if is_head(s):
                        Ecal = e_cal(frm, to, v, t, nav, trunc=24)
                        row.update(E_naive=m / (1 - TB), E_cal=Ecal)
                        opts = [(W, k) for W, k in ((W_nh, k_nh), (W_tw, k_tw)) if W is not None]
                    else:
                        Ecal = m
                        row.update(E_naive=None, E_cal=m)
                        opts = [(W_tw, k_tw)] if W_tw is not None else []
                    if not opts:
                        row["delta"] = None
                        rows.append(row)
                        continue
                    W, k = min(opts)
                    row.update(delta=Ecal - W, waitChosen=k)
                    for regime, spec in lam_table[v].items():
                        lam, cash = spec["lambda"], spec["cash"]
                        cargo = lp_fill(model, frm, to, t, t + m, v, level, cash)
                        ds = voyage_expect(model, frm, to, v, t, nav, spec["diff"], cargo, hull0, level, retry=is_head(s))
                        dv = voyage_expect(model, frm, to, v, t + k, nav, spec["diff"], cargo, hull0, level, retry=False)
                        D_sail = ds["wages"] + ds["jettison"] + ds["porcelain"] + ds["becalm"] + ds["textiles"]
                        D_wait = k * (u + model.fee(frm, spec["diff"])) + dv["wages"] + dv["jettison"] + dv["porcelain"] + dv["becalm"] + dv["textiles"]
                        dV = lam * row["delta"] + (D_sail - D_wait)
                        mut = 2 * u
                        row[f"dV_{regime}"] = dV
                        row[f"dV_{regime}_lo"] = dV - mut                       # waiting's voyage mutinies, sailing's do not
                        row[f"dV_{regime}_hi"] = dV + mut * ds["attempts"]      # every sailing attempt mutinies
                        row[f"Dsail_{regime}"] = D_sail
                        row[f"Dwait_{regime}"] = D_wait
                    sc = P["ports"][frm]["storyCash"]
                    row["waitStoryIncome"] = k * HZ["storyChance"] * sum(sc) / len(sc)
                    row["waitStandingGain"] = k * P["standing"]["perWait"]
                    rows.append(row)
    return rows


# --- predictions ------------------------------------------------------------------

def sign(x):
    return (x > 0) - (x < 0)


def main():
    os.makedirs(OUT, exist_ok=True)
    model = Model(BASE)
    en = Enumeration(model)
    out = {"missingFixtureCells": MISSING_CELLS, "walks": len(en.walks),
           "splits": sum(2 ** (len(w) - 2) for w in en.walks)}

    # Q1: best cycles
    cells = en.best(top=10)

    def cell_row(key, c):
        v, diff, pol, lv, f = key
        F, w, segs, m, per = c["byF"][0]
        return {
            "vessel": v, "difficulty": diff, "policy": pol, "level": lv, "fill": f,
            "cycle": walk_label(w, segs), "walk": list(w), "segs": [list(s) for s in segs],
            "T": m["T"], "rho": per["rho"], "Rcap": per[f]["Rcap"], "Cstar": m["cstar"], "CstarMin": m["cstarMin"],
            "C0": BASE["difficulties"][diff]["cash"], "tstar": per[f]["tstar"], "F": per[f]["F"], "net": per[f]["net"],
            "top10": [{"cycle": walk_label(e[1], e[2]), "F": e[0], "rho": e[4]["rho"], "Rcap": e[4][f]["Rcap"],
                       "T": e[3]["T"], "Cstar": e[3]["cstar"], "tstar": e[4][f]["tstar"]} for e in c["byF"]],
            "bestByRho": {"cycle": walk_label(c["byRho"][1], c["byRho"][2]), "rho": c["byRho"][0]},
            "bestByRcap": {"cycle": walk_label(c["byRcap"][1], c["byRcap"][2]), "Rcap": c["byRcap"][0]},
            "deliveries": [{k: d[k] for k in ("from", "to", "buyMonth", "saleMonth", "good", "r", "cstar", "rankByR", "rankByTonne")}
                           for d in m["deliveries"]],
        }

    q1 = [cell_row(k, c) for k, c in sorted(cells.items(), key=lambda kv: (kv[0][3], kv[0][4], kv[0][2], kv[0][1], kv[0][0]))]
    best = {(r["vessel"], r["difficulty"], r["policy"], r["level"], r["fill"]): r for r in q1}

    # R-H on each best cycle
    rh = []
    plans = []
    for (v, diff, pol, lv, f), r in best.items():
        w, segs = tuple(r["walk"]), tuple(tuple(s) for s in r["segs"])
        sim = run_rh(model, w, segs, v, diff, pol, lv, standing_tariff=False, fill=f)
        row = {"vessel": v, "difficulty": diff, "policy": pol, "level": lv, "fill": f, "cycle": r["cycle"],
               "F_linear_net": r["net"], "RH_net": sim.net, "RH_over_linear": (sim.net / r["net"]) if r["net"] else None}
        if lv == 1:
            ex = run_rh(model, w, segs, v, diff, pol, 1, standing_tariff=True, fill=f)
            row["RH_net_engineExact"] = ex.net
            if f == "greedy":
                plans.append({"vessel": v, "difficulty": diff, "policy": pol, "fill": f, "cycle": r["cycle"],
                              "walk": list(w), "segs": [list(s) for s in segs], "net": ex.net, "actions": ex.actions})
        if (diff, v, pol) in SWEEP_MEDIAN:
            med = SWEEP_MEDIAN[(diff, v, pol)]
            row["sweepMedian"] = med
            row["RH_vs_median"] = sim.net / med - 1
        rh.append(row)

    # Part C step 4 plans: sail always (headwinds), cargo without porcelain, least vs most damage, no repair.
    hull_plans = []
    for v in VESSELS:
        for diff in DIFFS:
            r = best[(v, diff, "sailAlways", 1, "greedy")]
            w, segs = tuple(r["walk"]), tuple(tuple(s) for s in r["segs"])
            lo = run_rh(model, w, segs, v, diff, "sailAlways", 1, True, "greedy", 0.0, ("porcelain",), repair=False)
            hi = run_rh(model, w, segs, v, diff, "sailAlways", 1, True, "greedy", 0.9999, ("porcelain",), repair=False)
            hull_plans.append({"vessel": v, "difficulty": diff, "cycle": r["cycle"],
                               "least": lo.actions, "most": hi.actions,
                               "skeletonCashIdentical": [a["cash"] for a in lo.actions] == [a["cash"] for a in hi.actions]})

    # Q2: lambda from the vessel's best cycle by F over all three policies (Level 0/1, S-opt)
    def lam_table(level):
        tab = {}
        for v in VESSELS:
            def top(diff):
                rows = [best[(v, diff, p, level, "opt")] for p in POLICIES]
                return max(rows, key=lambda r: r["F"])
            n, h = top("normal"), top("hard")
            tab[v] = {
                "capacity": {"lambda": n["Rcap"], "cash": None, "diff": "normal", "cycle": n["cycle"]},
                "hardStart": {"lambda": h["rho"] * BASE["difficulties"]["hard"]["cash"], "cash": BASE["difficulties"]["hard"]["cash"],
                              "diff": "hard", "cycle": h["cycle"]},
                "hardSwitch": {"lambda": h["Rcap"], "cash": None, "diff": "hard", "cycle": h["cycle"],
                               "cashAtSwitch": h["Cstar"], "rhoTimesCstar": h["rho"] * h["Cstar"]},
            }
        return tab

    q2 = {}
    lams = {}
    for lv in LEVELS:
        lams[lv] = lam_table(lv)
        q2[lv] = q2_cells(model, lv, lams[lv])

    # Boundary table (P1.7): one parameter at a time, Level 0, normal, S-opt, best cycle re-optimised.
    def delta_f(params, level, horizon=None, c0=None):
        m2 = Model(params)
        en2 = Enumeration.__new__(Enumeration)
        en2.model, en2.walks, en2.loops = m2, en.walks, en.loops
        c = en2.best(levels=[level], diffs=["normal"], fills=["opt"], horizon=horizon, c0_override=c0)
        return {p: c[("junk", "normal", p, level, "opt")]["byF"][0][0] - c[("dhow", "normal", p, level, "opt")]["byF"][0][0]
                for p in POLICIES}

    def setter(name):
        def f(val):
            p = copy.deepcopy(BASE)
            if name == "junkWages":
                p["vessels"]["junk"]["wages"] = val
            elif name == "dhowWages":
                p["vessels"]["dhow"]["wages"] = val
            elif name == "junkCapacity":
                p["vessels"]["junk"]["capacity"] = val
            elif name == "dhowCapacity":
                p["vessels"]["dhow"]["capacity"] = val
            elif name == "cloveLotWeight":
                p["goods"]["cloves"]["weight"] = val
            elif name == "malaccaClovePrice":
                p["goods"]["cloves"]["prices"]["malacca"] = val
            return p
        return f

    PARAMS_SCAN = {
        "junkWages": (35, [i * 2.5 for i in range(0, 57)]),                 # 0 .. 140 (P1.7 range 0-105)
        "dhowWages": (15, [i * 1.0 for i in range(0, 61)]),                 # 0 .. 60
        "junkCapacity": (300, [75 + i * 15 for i in range(0, 76)]),         # 75 .. 1200
        "dhowCapacity": (120, [30 + i * 6 for i in range(0, 76)]),          # 30 .. 480
        "cloveLotWeight": (1, [0.25 + i * 0.05 for i in range(0, 76)]),     # 0.25 .. 4
        "malaccaClovePrice": (150, [20 + i * 10 for i in range(0, 74)]),    # 20 .. 750
        "startingCash": (1500, [100 * 1.1 ** i for i in range(0, 70)]),     # 100 .. ~70,000
        "campaignMonths": (24, [6 + i * 1.0 for i in range(0, 67)]),        # 6 .. 72
    }

    def eval_param(name, val, level):
        if name == "startingCash":
            return delta_f(BASE, level, c0=val)
        if name == "campaignMonths":
            return delta_f(BASE, level, horizon=val)
        return delta_f(setter(name)(val), level)

    boundary = {}
    for lv in LEVELS:
        base_d = delta_f(BASE, lv)
        tab = {"baseDeltaF": base_d, "params": {}}
        for name, (cur, grid) in PARAMS_SCAN.items():
            vals = sorted(set(grid + [cur]))
            series = [(x, eval_param(name, x, lv)) for x in vals]
            perpol = {}
            for pol in POLICIES:
                s0 = sign(base_d[pol])
                flips = [x for x, d in series if sign(d[pol]) != s0]
                # nearest reversal on each side of the current value, refined by bisection
                res = {"currentSign": s0, "grid": [[x, d[pol]] for x, d in series]}
                for side in ("below", "above"):
                    cand = [x for x in flips if (x < cur if side == "below" else x > cur)]
                    if not cand:
                        res[side] = None
                        continue
                    xf = max(cand) if side == "below" else min(cand)
                    inner = [x for x in vals if (xf < x <= cur if side == "below" else cur <= x < xf)]
                    xs = min(inner) if side == "below" else max(inner)
                    a, b = xs, xf
                    for _ in range(14):
                        mid = (a + b) / 2
                        if sign(eval_param(name, mid, lv)[pol]) != s0:
                            b = mid
                        else:
                            a = mid
                    res[side] = b
                perpol[pol] = res
            tab["params"][name] = {"current": cur, "byPolicy": perpol}
        boundary[lv] = tab

    # --- scoring --------------------------------------------------------------------
    def score_level(lv):
        S = {}
        # P1.1
        fails = []
        for v in VESSELS:
            for diff in DIFFS:
                for pol in POLICIES:
                    r = best[(v, diff, pol, lv, "opt")]
                    if not any(d["rankByR"][:1] == ["cloves"] for d in r["deliveries"]):
                        fails.append([v, diff, pol, r["cycle"]])
        S["P1.1"] = {"score": "contradicted" if fails else "supported", "failedCells": fails}
        # P1.2
        fails = [[v, diff, pol, BASE["difficulties"][diff]["cash"], best[(v, diff, pol, lv, "opt")]["Cstar"]]
                 for v in VESSELS for diff in DIFFS for pol in POLICIES
                 if not (best[(v, diff, pol, lv, "opt")]["Cstar"] and BASE["difficulties"][diff]["cash"] < best[(v, diff, pol, lv, "opt")]["Cstar"])]
        strict = [[v, diff, pol] for v in VESSELS for diff in DIFFS for pol in POLICIES
                  if not (best[(v, diff, pol, lv, "opt")]["CstarMin"] and BASE["difficulties"][diff]["cash"] < best[(v, diff, pol, lv, "opt")]["CstarMin"])]
        S["P1.2"] = {"score": "contradicted" if fails else "supported", "failedCells": fails,
                     "cellsCapacityLimitedOnSomeDeliveryAtMonth0": strict}
        # P1.3
        fails = []
        for diff in DIFFS:
            for pol in POLICIES:
                d, j = best[("dhow", diff, pol, lv, "opt")], best[("junk", diff, pol, lv, "opt")]
                if d["rho"] < j["rho"] or j["Rcap"] <= d["Rcap"]:
                    fails.append({"difficulty": diff, "policy": pol, "rho": [d["rho"], j["rho"]], "Rcap": [d["Rcap"], j["Rcap"]]})
        S["P1.3"] = {"score": "contradicted" if fails else "supported", "failedCells": fails}
        # P1.4
        fails = [[v, diff, pol, best[(v, diff, pol, lv, "opt")]["net"]] for v in VESSELS for diff in DIFFS for pol in POLICIES
                 if best[(v, diff, pol, lv, "opt")]["net"] <= 1200]
        S["P1.4"] = {"score": "contradicted" if fails else "supported", "failedCells": fails}
        # P1.5
        fails, signs = [], {}
        for pol in POLICIES:
            for diff in SWEEP_DIFFS:
                dF = best[("junk", diff, pol, lv, "opt")]["net"] - best[("dhow", diff, pol, lv, "opt")]["net"]
                signs[f"{pol}/{diff}"] = dF
                if sign(dF) != SWEEP_SIGN[(pol, diff)]:
                    fails.append([pol, diff, dF])
        S["P1.5"] = {"score": "contradicted" if fails else "supported", "failedCells": fails, "deltaF": signs}
        # P1.6
        fails, rows = [], []
        for diff in SWEEP_DIFFS:
            for v in VESSELS:
                for pol in POLICIES:
                    r = next(x for x in rh if (x["vessel"], x["difficulty"], x["policy"], x["level"], x["fill"]) == (v, diff, pol, lv, "greedy"))
                    rows.append([v, diff, pol, r["RH_net"], r["sweepMedian"], r["RH_vs_median"]])
                    if pol != "sailAlways" and abs(r["RH_vs_median"]) > 0.25:
                        fails.append([v, diff, pol, r["RH_net"], r["sweepMedian"], r["RH_vs_median"]])
        S["P1.6"] = {"score": "contradicted" if fails else "supported", "failedCells": fails, "allCells": rows}
        # P1.7
        b = boundary[lv]["params"]

        def reverses(name, lo, hi):
            out = {}
            for pol in POLICIES:
                g = b[name]["byPolicy"][pol]
                pts = [x for x, d in g["grid"] if lo <= x <= hi and sign(d) != g["currentSign"]]
                edges = [g[s] for s in ("below", "above") if g[s] is not None and lo <= g[s] <= hi]
                out[pol] = bool(pts or edges)
            return out
        wage = reverses("junkWages", 0, 105)
        margin = {"malaccaClovePrice": reverses("malaccaClovePrice", 75, 300),
                  "cloveLotWeight": reverses("cloveLotWeight", 0.5, 2),
                  "junkCapacity": reverses("junkCapacity", 150, 600)}
        wage_all = all(wage.values())
        margin_any = any(all(x.values()) for x in margin.values())
        S["P1.7"] = {"score": "contradicted" if (wage_all or not margin_any) else "supported",
                     "junkWageReversesByPolicy": wage, "marginParamReversesByPolicy": margin}
        # Q2
        cells2 = q2[lv]
        head = [c for c in cells2 if c["headwind"]]
        per_v = {}
        for v in VESSELS:
            hv = [c for c in head if c["vessel"] == v and c["delta"] is not None]
            per_v[v] = {"cells": len(hv), "deltaPositive": sum(c["delta"] > 0 for c in hv)}
        S["P2.1"] = {"score": "contradicted" if any(x["deltaPositive"] * 2 <= x["cells"] for x in per_v.values()) else "supported",
                     "byVessel": per_v}
        bad = [[c["from"], c["to"], c["vessel"], c["navigator"], c["month"], c["E_naive"], c["E_cal"]] for c in head if c["E_naive"] < c["E_cal"] - 1e-12]
        strict = sum(c["E_naive"] > c["E_cal"] + 1e-12 for c in head)
        S["P2.2"] = {"score": "contradicted" if (bad or strict == 0) else "supported", "failedCells": bad,
                     "cellsStrictlyGreater": strict, "headwindCells": len(head)}
        hd = [c for c in head if c["delta"] is not None]
        agree = sum(sign(c["dV_capacity"]) == sign(c["delta"]) for c in hd)
        agree_robust = sum(sign(c["dV_capacity_lo"]) == sign(c["delta"]) == sign(c["dV_capacity_hi"]) for c in hd)
        S["P2.3"] = {"score": "supported" if agree >= 0.9 * len(hd) else "contradicted", "agree": agree, "cells": len(hd),
                     "share": agree / len(hd), "agreeAtBothMutinyBounds": agree_robust}
        sh_start = sum(c["dV_hardStart"] > 0 for c in hd) / len(hd)
        sh_switch = sum(c["dV_hardSwitch"] > 0 for c in hd) / len(hd)
        byv = {v: {"start": sum(c["dV_hardStart"] > 0 for c in hd if c["vessel"] == v) / max(1, sum(c["vessel"] == v for c in hd)),
                   "switch": sum(c["dV_hardSwitch"] > 0 for c in hd if c["vessel"] == v) / max(1, sum(c["vessel"] == v for c in hd))}
               for v in VESSELS}
        S["P2.4"] = {"score": "supported" if sh_switch > sh_start else "contradicted", "shareAtHardStart": sh_start,
                     "shareAtSwitch": sh_switch, "byVessel": byv}
        fails = []
        for v in VESSELS:
            for diff in DIFFS:
                sa, ah = best[(v, diff, "sailAlways", lv, "opt")]["net"], best[(v, diff, "avoidHeadwind", lv, "opt")]["net"]
                if sa > ah:
                    fails.append([v, diff, sa, ah])
        S["P2.5"] = {"score": "contradicted" if fails else "supported", "failedCells": fails}
        return S

    scores = {lv: score_level(lv) for lv in LEVELS}
    final = {}
    for pid in scores[0]:
        s0, s1 = scores[0][pid]["score"], scores[1][pid]["score"]
        final[pid] = {"level0": s0, "level1": s1, "levelSensitive": s0 != s1}

    # --- write ------------------------------------------------------------------------
    def dump(name, obj):
        with open(os.path.join(OUT, name), "w", encoding="utf8", newline="\n") as fh:
            json.dump(obj, fh, indent=1, default=lambda x: None if x != x else str(x))
            fh.write("\n")

    def clean(x):
        if isinstance(x, float):
            if math.isinf(x):
                return "inf" if x > 0 else "-inf"
            return round(x, 6)
        if isinstance(x, dict):
            return {k: clean(v) for k, v in x.items()}
        if isinstance(x, (list, tuple)):
            return [clean(v) for v in x]
        return x

    out.update(scores=clean(scores), summary=final)
    dump("predictions.json", out)
    dump("q1-best-cycles.json", clean(q1))
    dump("q1-horizon-check.json", clean(rh))
    dump("q1-boundary.json", clean({str(k): v for k, v in boundary.items()}))
    dump("q2-lambda.json", clean({str(k): v for k, v in lams.items()}))
    dump("partc-plans.json", {"note": "Hazard-free action plans for Part C step 2 (engine-exact R-H, S-greedy, Level 1 best cycles) and step 4 (least vs most damage, no porcelain, no repair).",
                              "rhPlans": plans, "hullPlans": hull_plans})
    for lv in LEVELS:
        keys = list(q2[lv][0].keys())
        allkeys = []
        for r in q2[lv]:
            for k in r:
                if k not in allkeys:
                    allkeys.append(k)
        with open(os.path.join(OUT, f"q2-cells-level{lv}.csv"), "w", encoding="utf8", newline="") as fh:
            wr = csv.DictWriter(fh, fieldnames=allkeys, lineterminator="\n")
            wr.writeheader()
            for r in q2[lv]:
                wr.writerow({k: (round(v, 4) if isinstance(v, float) else v) for k, v in r.items()})
    print(json.dumps(final, indent=1))


if __name__ == "__main__":
    main()
