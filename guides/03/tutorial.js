(() => {
  "use strict";

  // Constants and equations read verbatim from projects/03/index.html (commit f71aba2).
  // Nothing here changes the game; it lets students test the game's own formulas while reading.
  const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

  const PORTS = {
    kilwa:    { id: "kilwa",    name: "Kilwa",    region: "Swahili Coast",     tariff: 0.05, layoverBase: 20, piracyRisk: 0.12 },
    aden:     { id: "aden",     name: "Aden",     region: "Red Sea / Arabia",  tariff: 0.08, layoverBase: 35, piracyRisk: 0.15 },
    calicut:  { id: "calicut",  name: "Calicut",  region: "Malabar Coast",     tariff: 0.04, layoverBase: 25, piracyRisk: 0.04 },
    malacca:  { id: "malacca",  name: "Malacca",  region: "Strait of Malacca", tariff: 0.03, layoverBase: 25, piracyRisk: 0.26 },
    quanzhou: { id: "quanzhou", name: "Quanzhou", region: "Southern China",    tariff: 0.06, layoverBase: 30, piracyRisk: 0.10 }
  };

  const SEA_LANES = [
    { id: "calicut-aden",     from: "calicut",  to: "aden",     dist: 1450, bearing: 282 },
    { id: "aden-calicut",     from: "aden",     to: "calicut",  dist: 1450, bearing: 102 },
    { id: "calicut-malacca",  from: "calicut",  to: "malacca",  dist: 1600, bearing: 105 },
    { id: "malacca-calicut",  from: "malacca",  to: "calicut",  dist: 1600, bearing: 285 },
    { id: "calicut-kilwa",    from: "calicut",  to: "kilwa",    dist: 2450, bearing: 248 },
    { id: "kilwa-calicut",    from: "kilwa",    to: "calicut",  dist: 2450, bearing: 68  },
    { id: "aden-kilwa",       from: "aden",     to: "kilwa",    dist: 1650, bearing: 205 },
    { id: "kilwa-aden",       from: "kilwa",    to: "aden",     dist: 1650, bearing: 25  },
    { id: "malacca-quanzhou", from: "malacca",  to: "quanzhou", dist: 1750, bearing: 38  },
    { id: "quanzhou-malacca", from: "quanzhou", to: "malacca",  dist: 1750, bearing: 218 }
  ];

  const COMMODITIES = [
    { id: "teak",      name: "Teak Timber",      category: "Bulk",      weight: 10, prices: { kilwa: 65,  aden: 130, calicut: 40,  malacca: 55,  quanzhou: 95  } },
    { id: "porcelain", name: "Ming Porcelain",   category: "Bulk",      weight: 8,  prices: { kilwa: 210, aden: 205, calicut: 135, malacca: 110, quanzhou: 60  } },
    { id: "textiles",  name: "Cotton Textiles",  category: "Bulk",      weight: 5,  prices: { kilwa: 155, aden: 120, calicut: 50,  malacca: 160, quanzhou: 115 } },
    { id: "pepper",    name: "Black Pepper",     category: "Semi-Bulk", weight: 2,  prices: { kilwa: 190, aden: 320, calicut: 80,  malacca: 110, quanzhou: 310 } },
    { id: "cloves",    name: "Moluccan Cloves",  category: "Luxury",    weight: 1,  prices: { kilwa: 480, aden: 750, calicut: 340, malacca: 150, quanzhou: 620 } },
    { id: "ivory",     name: "E. African Ivory", category: "Luxury",    weight: 3,  prices: { kilwa: 180, aden: 420, calicut: 540, malacca: 590, quanzhou: 820 } }
  ];

  const VESSELS = {
    dhow: {
      name: "Arab / Indian Ocean Dhow",
      rig: "Lateen-rigged · stitched-plank hull",
      capacity: 120,
      speed: 110,
      agility: 0.85,
      upkeep: 15,
      stormResist: 1.0,
      stormNote: "Standard hull damage (1.0×)"
    },
    junk: {
      name: "Chinese Ocean-Going Junk",
      rig: "Battened lug · watertight bulkheads",
      capacity: 300,
      speed: 95,
      agility: 0.60,
      upkeep: 35,
      stormResist: 0.5,
      stormNote: "Half headwind & cyclone hull damage (0.5×)"
    }
  };

  const DIFFICULTIES = {
    easy:     { name: "1. Coastal Guild Apprentice", cash: 3000, debt: 0,   stormMult: 0.5, layoverMult: 0.6, note: "Forgiving storms (0.5×), −40% layover fees, and visual wind-arrow hints." },
    normal:   { name: "2. Monsoon Merchant",         cash: 1500, debt: 0,   stormMult: 1.0, layoverMult: 1.0, note: "Standard model winds, port tariffs, and voyage hazards." },
    hard:     { name: "3. Private Venture Debt",     cash: 800,  debt: 500, stormMult: 1.0, layoverMult: 1.0, note: "Starts with 500 D investor loan accruing 5% interest every 6 months." },
    survival: { name: "4. Cyclone & Piracy Crisis",  cash: 600,  debt: 0,   stormMult: 2.0, layoverMult: 1.1, note: "2× cyclone severity, 1.8× piracy risk, and +10% layover fees." }
  };

  function getWindState(monthIdx) {
    const m = (monthIdx % 12) + 1;
    if (m >= 6 && m <= 9) {
      return { regime: "SW Monsoon", key: "sw", bearing: 45, knots: 20, isDeadZone: false, label: "SW Monsoon · 20 kts (toward NE, 045°)" };
    }
    if (m === 11 || m === 12 || m === 1 || m === 2) {
      return { regime: "NE Monsoon", key: "ne", bearing: 225, knots: 18, isDeadZone: false, label: "NE Monsoon · 18 kts (toward SW, 225°)" };
    }
    return {
      regime: "Inter-Monsoon Transition",
      key: "dead",
      bearing: m === 10 ? 135 : 315,
      knots: 6,
      isDeadZone: true,
      label: "Dead Zone · 6 kts (cyclone & doldrum risk)"
    };
  }

  function getLivePortPrice(commodity, portId, monthIdx) {
    const base = commodity.prices[portId];
    const portSeed = portId.charCodeAt(0) + commodity.id.charCodeAt(0);
    const wave = Math.sin(((monthIdx + portSeed) * Math.PI) / 6);
    return Math.max(10, Math.round(base * (1 + wave * 0.08)));
  }

  function getEffectiveTariff(portId, standing) {
    const discount = standing >= 50 ? 0.01 : 0;
    return Math.max(0.01, PORTS[portId].tariff - discount);
  }

  function getEffectiveLayoverFee(portId, standing, layoverMult = 1.0) {
    let mult = 1.0;
    if (standing >= 50) mult = 0.5;
    else if (standing >= 20) mult = 0.75;
    return Math.round(PORTS[portId].layoverBase * layoverMult * mult);
  }

  function expectedTransitMonths(lane, monthIdx, vesselKey, hasNavigator, depth = 0) {
    const c = computeTransitCore(lane, monthIdx, vesselKey, hasNavigator);
    if (!c.isHeadwind || depth > 12) return c.months;
    return c.months + 0.35 * expectedTransitMonths(lane, monthIdx + c.months, vesselKey, hasNavigator, depth + 1);
  }

  function computeTransitCore(lane, monthIdx, vesselKey, hasNavigator) {
    const vessel = VESSELS[vesselKey];
    const wind = getWindState(monthIdx);
    const radDiff = ((lane.bearing - wind.bearing) * Math.PI) / 180;
    const cosAlignment = Math.cos(radDiff);

    let effFactor = Math.max(0.25, cosAlignment * vessel.agility + 0.5);
    if (wind.isDeadZone) effFactor *= 0.65;
    if (hasNavigator) effFactor *= 1.15;

    const effSpeed = Math.round(vessel.speed * effFactor);
    const rawDays = Math.round(lane.dist / (vessel.speed * effFactor));
    const months = Math.max(1, Math.ceil(rawDays / 30));
    const stormProb = hasNavigator ? 0.18 : 0.35;

    let status = "Crosswind Reach";
    let tone = "info";
    if (!wind.isDeadZone && cosAlignment >= 0.4) { status = "Tailwind (Optimal)"; tone = "good"; }
    else if (!wind.isDeadZone && cosAlignment < -0.5) { status = "Headwind (Hazard)"; tone = "bad"; }
    else if (wind.isDeadZone) { status = `Dead Zone (${Math.round(stormProb * 100)}% storm)`; tone = "warn"; }

    return {
      days: rawDays,
      months,
      effSpeed,
      stormProb,
      status,
      tone,
      wind,
      isTailwind: !wind.isDeadZone && cosAlignment >= 0.4,
      isHeadwind: !wind.isDeadZone && cosAlignment < -0.5,
      isDeadZone: wind.isDeadZone
    };
  }

  function computeTransit(lane, monthIdx, vesselKey, hasNavigator) {
    const core = computeTransitCore(lane, monthIdx, vesselKey, hasNavigator);
    const expectedMonths = expectedTransitMonths(lane, monthIdx, vesselKey, hasNavigator, 0);
    return { ...core, expectedMonths };
  }

  function computeWaitCost(portId, waitMonths, startStanding, vesselKey, layoverMult = 1.0) {
    let portFees = 0;
    for (let m = 0; m < waitMonths; m++) {
      portFees += getEffectiveLayoverFee(portId, Math.min(100, startStanding + 15 * m), layoverMult);
    }
    const crewWages = waitMonths * VESSELS[vesselKey].upkeep;
    return { portFees, crewWages, total: portFees + crewWages };
  }

  function fmt(n) {
    return Number(n).toLocaleString("en-US");
  }

  // ---------- Stepper & Progress ----------
  const completedSteps = new Set();
  const tabs = [...document.querySelectorAll(".step-tab")];
  const panels = [...document.querySelectorAll(".step-panel")];
  const progressFill = document.getElementById("progress-fill");
  const progressLabel = document.getElementById("progress-label");
  const toggleAllBtn = document.getElementById("toggle-all-btn");
  const liveStatus = document.getElementById("tutorial-status");
  let activeStep = 0;
  let showAll = false;

  function announce(msg) {
    if (liveStatus) liveStatus.textContent = msg;
  }

  function updateProgress() {
    const count = completedSteps.size;
    const total = tabs.length;
    progressFill.style.width = `${Math.round((count / total) * 100)}%`;
    progressLabel.textContent = `${count} / ${total} checks completed`;
    tabs.forEach((tab, idx) => {
      const done = completedSteps.has(idx);
      tab.classList.toggle("is-done", done);
      const badge = tab.querySelector(".step-check");
      if (badge) badge.textContent = done ? "Done" : "";
    });
  }

  function markStepDone(stepIdx, note) {
    if (!completedSteps.has(stepIdx)) {
      completedSteps.add(stepIdx);
      updateProgress();
      if (note) announce(note);
    }
  }

  function setStep(idx, moveFocus = false) {
    activeStep = Math.max(0, Math.min(tabs.length - 1, idx));
    if (showAll) {
      showAll = false;
      toggleAllBtn.setAttribute("aria-pressed", "false");
      toggleAllBtn.textContent = "Show all 6 steps";
    }
    tabs.forEach((tab, i) => {
      const selected = i === activeStep;
      tab.setAttribute("aria-selected", String(selected));
      tab.tabIndex = selected ? 0 : -1;
    });
    panels.forEach((panel, i) => {
      panel.hidden = i !== activeStep;
    });
    if (moveFocus) {
      const heading = panels[activeStep].querySelector("h2");
      if (heading) {
        heading.tabIndex = -1;
        heading.focus();
      }
    }
  }

  tabs.forEach((tab, idx) => {
    tab.addEventListener("click", () => setStep(idx, false));
    tab.addEventListener("keydown", (e) => {
      let next = null;
      if (e.key === "ArrowRight" || e.key === "ArrowDown") next = (idx + 1) % tabs.length;
      else if (e.key === "ArrowLeft" || e.key === "ArrowUp") next = (idx - 1 + tabs.length) % tabs.length;
      else if (e.key === "Home") next = 0;
      else if (e.key === "End") next = tabs.length - 1;
      if (next !== null) {
        e.preventDefault();
        setStep(next, false);
        tabs[next].focus();
      }
    });
  });

  toggleAllBtn.addEventListener("click", () => {
    showAll = !showAll;
    toggleAllBtn.setAttribute("aria-pressed", String(showAll));
    toggleAllBtn.textContent = showAll ? "Step-by-step view" : "Show all 6 steps";
    panels.forEach((panel, i) => {
      panel.hidden = showAll ? false : i !== activeStep;
    });
    announce(showAll ? "Showing all 6 tutorial steps." : `Returned to step ${activeStep + 1} of ${tabs.length}.`);
  });

  document.querySelectorAll("[data-goto-step]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const target = Number(btn.dataset.gotoStep);
      setStep(target, true);
      panels[target].scrollIntoView({ behavior: "auto", block: "start" });
    });
  });

  // ---------- Generic Quiz Handler ----------
  document.querySelectorAll(".quiz").forEach((quiz) => {
    const stepIdx = Number(quiz.dataset.step);
    const feedback = quiz.querySelector(".quiz-feedback");
    const buttons = [...quiz.querySelectorAll(".choice-btn")];
    buttons.forEach((btn) => {
      btn.addEventListener("click", () => {
        const isCorrect = btn.dataset.correct === "true";
        buttons.forEach((b) => {
          b.setAttribute("aria-pressed", String(b === btn));
          b.classList.remove("is-right", "is-wrong");
        });
        btn.classList.add(isCorrect ? "is-right" : "is-wrong");
        feedback.hidden = false;
        feedback.className = `quiz-feedback ${isCorrect ? "good" : "bad"}`;
        feedback.textContent = btn.dataset.explain;
        if (isCorrect) {
          markStepDone(stepIdx, `Step ${stepIdx + 1} check completed.`);
        }
      });
    });
  });

  // ---------- Module 1: Charter & Ship Comparator ----------
  let m1Vessel = "dhow";
  let m1Diff = "normal";
  const m1VesselBtns = [...document.querySelectorAll("[data-m1-vessel]")];
  const m1DiffSelect = document.getElementById("m1-diff");

  function renderM1() {
    const v = VESSELS[m1Vessel];
    const d = DIFFICULTIES[m1Diff];
    const pepperPriceJanCalicut = Math.round(getLivePortPrice(COMMODITIES[3], "calicut", 0) * (1 + PORTS.calicut.tariff)); // 80 D
    const maxLotsByCash = Math.floor(d.cash / pepperPriceJanCalicut);
    const maxLotsByHold = Math.floor(v.capacity / 2);
    const buyableLots = Math.min(maxLotsByCash, maxLotsByHold);
    const filledTons = buyableLots * 2;
    const fillPct = Math.round((filledTons / v.capacity) * 100);
    const binding = maxLotsByCash < maxLotsByHold ? "Cash limits your Month-1 load" : "Hold size limits your Month-1 load";

    document.getElementById("m1-ship-cap").textContent = `${v.capacity} t`;
    document.getElementById("m1-ship-speed").textContent = `${v.speed} nm/d`;
    document.getElementById("m1-ship-wages").textContent = `${v.upkeep} D/mo`;
    document.getElementById("m1-ship-agility").textContent = `α = ${v.agility.toFixed(2)}`;
    document.getElementById("m1-start-cash").textContent = d.debt > 0 ? `${fmt(d.cash)} D (+${fmt(d.debt)} D loan)` : `${fmt(d.cash)} D`;
    document.getElementById("m1-m1-fill").textContent = `${filledTons} / ${v.capacity} t (${fillPct}%)`;
    document.getElementById("m1-note").textContent =
      `${v.name} (${v.rig}; ${v.stormNote}). ${d.note} With ${fmt(d.cash)} D in Jan at Calicut (Black Pepper = ${pepperPriceJanCalicut} D per 2 t lot), you can load at most ${buyableLots} lots (${filledTons} t): ${binding}.`;
  }

  m1VesselBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      m1Vessel = btn.dataset.m1Vessel;
      m1VesselBtns.forEach((b) => b.setAttribute("aria-pressed", String(b === btn)));
      renderM1();
    });
  });
  m1DiffSelect.addEventListener("change", () => {
    m1Diff = m1DiffSelect.value;
    renderM1();
  });

  // ---------- Module 2: Monsoon Clock & Route Simulator ----------
  let m2Month = 0; // Jan
  let m2LaneId = "calicut-aden";
  let m2Vessel = "dhow";
  let m2Nav = false;
  let m2Interactions = 0;

  const monthGrid = document.getElementById("m2-months");
  MONTHS.forEach((name, idx) => {
    const w = getWindState(idx);
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "month-btn";
    btn.dataset.month = String(idx);
    btn.dataset.regime = w.key;
    btn.setAttribute("aria-pressed", String(idx === 0));
    btn.innerHTML = `<span>${name}</span><span class="m-reg">${w.key === "ne" ? "NE" : w.key === "sw" ? "SW" : "Dead"}</span>`;
    btn.addEventListener("click", () => {
      m2Month = idx;
      m2Interactions += 1;
      monthGrid.querySelectorAll(".month-btn").forEach((b) => b.setAttribute("aria-pressed", String(b === btn)));
      renderM2();
    });
    monthGrid.appendChild(btn);
  });

  const m2LaneSelect = document.getElementById("m2-lane");
  const m2VesselSelect = document.getElementById("m2-vessel");
  const m2NavCheck = document.getElementById("m2-nav");

  function renderM2() {
    const lane = SEA_LANES.find((l) => l.id === m2LaneId);
    const res = computeTransit(lane, m2Month, m2Vessel, m2Nav);
    const wages = VESSELS[m2Vessel].upkeep * res.months;

    // Find fastest crossing month in the next 12 months
    let fastestOffset = 0;
    let fastestCalc = res;
    for (let off = 1; off < 12; off++) {
      const c = computeTransit(lane, (m2Month + off) % 12, m2Vessel, m2Nav);
      if (c.days < fastestCalc.days) {
        fastestCalc = c;
        fastestOffset = off;
      }
    }

    document.getElementById("m2-wind").textContent = res.wind.label;
    document.getElementById("m2-align").textContent = res.status;
    document.getElementById("m2-days").textContent = `~${res.days} d (${res.months} mo)`;
    document.getElementById("m2-wages").textContent = `${fmt(wages)} D`;
    document.getElementById("m2-speed").textContent = `${res.effSpeed} nm/d`;

    const riskEl = document.getElementById("m2-risk-callout");
    riskEl.className = `callout ${res.tone === "info" ? "" : res.tone}`;
    if (res.isTailwind) {
      riskEl.textContent = `Optimal tailwind on ${PORTS[lane.from].name} → ${PORTS[lane.to].name} (${lane.dist} nm, bearing ${lane.bearing}°): no headwind turn-back and no inter-monsoon cyclone roll.`;
    } else if (res.isHeadwind) {
      riskEl.textContent = `Severe headwind hazard: guaranteed hull damage (20–34% × ${VESSELS[m2Vessel].stormResist}× ship factor × difficulty storm multiplier), −${res.months * 8 + 12}% crew health, 35% chance of being forced back to ${PORTS[lane.from].name}, and 40% teak-jettison risk if you push through.`;
    } else if (res.isDeadZone) {
      riskEl.textContent = `Inter-monsoon Dead Zone: ${Math.round(res.stormProb * 100)}% cyclone risk (hull damage + extra −12% crew health) and 25% doldrums risk (−20 D water/ration burn). Un-tarped Cotton Textiles also face a 35% mildew chance.`;
    } else {
      riskEl.textContent = `Crosswind reach: slower than a tailwind (${res.days} days / ${res.months} months charged), with no headwind turn-back or dead-zone cyclone check.`;
    }

    const waitBox = document.getElementById("m2-wait-callout");
    if (fastestOffset === 0) {
      waitBox.textContent = `Sail now (${MONTHS[m2Month]}) is already the year's fastest crossing for ${PORTS[lane.from].name} → ${PORTS[lane.to].name}.`;
    } else {
      const targetM = (m2Month + fastestOffset) % 12;
      const startStanding = lane.from === "calicut" ? 10 : 0;
      const waitCost = computeWaitCost(lane.from, fastestOffset, startStanding, m2Vessel, 1.0);
      const sailNowArrival = 1 + res.expectedMonths;
      const waitArrival = 1 + fastestOffset + fastestCalc.months;
      const earlierNote = sailNowArrival < waitArrival
        ? `Even though ${MONTHS[targetM]} is ${res.days - fastestCalc.days} days faster at sea, waiting arrives about ${(waitArrival - sailNowArrival).toFixed(1).replace(/\.0$/, "")} months later — the faster wind is not always the earlier arrival.`
        : `Waiting for ${MONTHS[targetM]} cuts crossing time by ${res.days - fastestCalc.days} days and avoids ${res.isHeadwind ? "headwind turn-backs and hull damage" : "dead-zone storms"}.`;
      waitBox.textContent = `Wait ${fastestOffset} mo for ${MONTHS[targetM]} (${fastestCalc.status}, ~${fastestCalc.days} d / ${fastestCalc.months} mo): waiting costs ${fmt(waitCost.total)} D (wages ${fmt(waitCost.crewWages)} D + port fees ${fmt(waitCost.portFees)} D, starting at ${startStanding} standing). ${earlierNote}`;
    }

    if (m2Interactions >= 2) {
      const hint = document.getElementById("m2-explore-status");
      if (hint) hint.textContent = "Explored multiple wind regimes — now answer the quick check below.";
    }
  }

  m2LaneSelect.addEventListener("change", () => { m2LaneId = m2LaneSelect.value; m2Interactions += 1; renderM2(); });
  m2VesselSelect.addEventListener("change", () => { m2Vessel = m2VesselSelect.value; m2Interactions += 1; renderM2(); });
  m2NavCheck.addEventListener("change", () => { m2Nav = m2NavCheck.checked; m2Interactions += 1; renderM2(); });

  // ---------- Module 3: Arbitrage & Hold-Weight Calculator ----------
  const m3GoodEl = document.getElementById("m3-good");
  const m3FromEl = document.getElementById("m3-from");
  const m3ToEl = document.getElementById("m3-to");
  const m3BuyMonthEl = document.getElementById("m3-buy-month");
  const m3SellMonthEl = document.getElementById("m3-sell-month");
  const m3StandingEl = document.getElementById("m3-standing");

  MONTHS.forEach((m, i) => {
    const o1 = new Option(`${m} (M${i + 1})`, String(i), i === 0, i === 0);
    const o2 = new Option(`${m} (M${i + 1})`, String(i), i === 1, i === 1);
    m3BuyMonthEl.add(o1);
    m3SellMonthEl.add(o2);
  });

  function renderM3() {
    const item = COMMODITIES.find((c) => c.id === m3GoodEl.value);
    const fromId = m3FromEl.value;
    const toId = m3ToEl.value;
    const buyM = Number(m3BuyMonthEl.value);
    const sellM = Number(m3SellMonthEl.value);
    const standing = m3StandingEl.checked ? 50 : 10;

    const tariff = getEffectiveTariff(fromId, standing);
    const liveBuy = getLivePortPrice(item, fromId, buyM);
    const buyUnit = Math.round(liveBuy * (1 + tariff));
    const sellUnit = getLivePortPrice(item, toId, sellM);
    const netLot = sellUnit - buyUnit;
    const netTon = netLot / item.weight;
    const roi = Math.round((netLot / buyUnit) * 100);

    // Compare early cash (1,500 D) vs late cash (20,000 D) on a 120 t Dhow
    const lotsEarly = Math.min(Math.floor(1500 / buyUnit), Math.floor(120 / item.weight));
    const lotsLate = Math.min(Math.floor(20000 / buyUnit), Math.floor(120 / item.weight));

    document.getElementById("m3-buy").textContent = `${fmt(buyUnit)} D`;
    document.getElementById("m3-buy-sub").textContent = `${PORTS[fromId].name} (${MONTHS[buyM]}), incl. ${Math.round(tariff * 100)}% tariff`;
    document.getElementById("m3-sell").textContent = `${fmt(sellUnit)} D`;
    document.getElementById("m3-sell-sub").textContent = `${PORTS[toId].name} (${MONTHS[sellM]}), no sell tariff`;
    document.getElementById("m3-net-lot").textContent = `${netLot >= 0 ? "+" : ""}${fmt(netLot)} D`;
    document.getElementById("m3-net-lot").className = `stat-v ${netLot >= 0 ? "pos" : "neg"}`;
    const netTonText = netTon === 0
      ? "0 D/t"
      : `${netTon > 0 ? "+" : "−"}${Math.abs(netTon) < 10 ? Math.abs(netTon).toFixed(1).replace(/\.0$/, "") : fmt(Math.round(Math.abs(netTon)))} D/t`;
    document.getElementById("m3-net-ton").textContent = netTonText;
    document.getElementById("m3-roi").textContent = `${roi >= 0 ? "+" : ""}${roi}%`;

    const summary = document.getElementById("m3-summary");
    summary.className = `callout ${netLot > 0 ? "good" : "bad"}`;
    summary.textContent =
      `${item.name} (${item.category}, ${item.weight} t/lot): with 1,500 D on a 120 t Dhow you can buy ${lotsEarly} lots (${lotsEarly * item.weight} t) for ${netLot >= 0 ? "+" : ""}${fmt(lotsEarly * netLot)} D gross margin. With 20,000 D you can buy ${lotsLate} lots (${lotsLate * item.weight} t) for ${netLot >= 0 ? "+" : ""}${fmt(lotsLate * netLot)} D — notice when cash stops binding and hold tonnage takes over.`;
  }

  [m3GoodEl, m3FromEl, m3ToEl, m3BuyMonthEl, m3SellMonthEl, m3StandingEl].forEach((el) => {
    el.addEventListener("change", renderM3);
  });

  // ---------- Module 4: Diaspora Standing, Layover & Piracy Lab ----------
  const m4PortEl = document.getElementById("m4-port");
  const m4StandingEl = document.getElementById("m4-standing");
  const m4LuxuryEl = document.getElementById("m4-luxury");
  const m4MarinesEl = document.getElementById("m4-marines");
  const m4SurvivalEl = document.getElementById("m4-survival");

  function renderM4() {
    const portId = m4PortEl.value;
    const port = PORTS[portId];
    const standing = Number(m4StandingEl.value);
    const hasLuxury = m4LuxuryEl.checked;
    const hasMarines = m4MarinesEl.checked;
    const isSurvival = m4SurvivalEl.checked;

    const layoverMult = isSurvival ? 1.1 : 1.0;
    const layover = getEffectiveLayoverFee(portId, standing, layoverMult);
    const tariff = getEffectiveTariff(portId, standing);

    let pirateProb = port.piracyRisk * (hasLuxury ? 1.5 : 0.6) * (isSurvival ? 1.8 : 1.0);
    if (hasMarines) pirateProb *= 0.2;
    if (standing >= 50) pirateProb *= 0.5;
    const piratePct = Math.round(pirateProb * 100);
    const pirateLabel = pirateProb > 0 && pirateProb < 0.005 ? "<1%" : `${piratePct}%`;

    const tierLabel = standing >= 50 ? "Guild Ally (−50% layover, −1% tariff, ½ piracy)" : standing >= 20 ? "Recognised (−25% layover)" : "Stranger (base rates)";
    document.getElementById("m4-standing-val").textContent = `${standing} · ${tierLabel}`;
    document.getElementById("m4-layover").textContent = `${layover} D/mo`;
    document.getElementById("m4-tariff").textContent = `${Math.round(tariff * 100)}%`;
    document.getElementById("m4-piracy").textContent = pirateLabel;
    document.getElementById("m4-piracy").className = `stat-v ${pirateProb >= 0.15 ? "neg" : pirateProb >= 0.10 ? "" : "pos"}`;

    const pBox = document.getElementById("m4-note");
    pBox.className = `callout ${pirateProb >= 0.15 ? "bad" : pirateProb >= 0.10 ? "warn" : "good"}`;
    const penaltyText = hasLuxury
      ? "If pirates strike while carrying Cloves or Ivory, they seize 1 lot of Cloves (or 1 lot of Ivory if no Cloves are aboard)."
      : "If pirates strike without Cloves or Ivory aboard, you pay up to 75 D in tribute from remaining cash.";
    const warnText = pirateProb >= 0.10
      ? "In the game, the departure warning appears here (chance ≥ 10%)."
      : "Below the game's 10% departure-warning threshold.";
    pBox.textContent = `${port.name} base piracy is ${Math.round(port.piracyRisk * 100)}%. At your settings: ${pirateLabel} arrival risk. ${penaltyText} ${warnText}`;
  }

  [m4PortEl, m4StandingEl, m4LuxuryEl, m4MarinesEl, m4SurvivalEl].forEach((el) => {
    el.addEventListener("input", renderM4);
    el.addEventListener("change", renderM4);
  });

  // ---------- Module 6: Game or History Sorter ----------
  const sorterItems = [...document.querySelectorAll(".sorter-item")];
  const sorterSolved = new Set();

  sorterItems.forEach((item, idx) => {
    const answer = item.dataset.answer; // "history" or "model"
    const explain = item.dataset.explain;
    const fb = item.querySelector(".quiz-feedback");
    const btns = [...item.querySelectorAll(".pill-btn")];
    btns.forEach((btn) => {
      btn.addEventListener("click", () => {
        const picked = btn.dataset.pick;
        const ok = picked === answer;
        btns.forEach((b) => b.setAttribute("aria-pressed", String(b === btn)));
        fb.hidden = false;
        fb.className = `quiz-feedback ${ok ? "good" : "bad"}`;
        fb.textContent = `${ok ? "Right: " : "Not quite: "}${explain}`;
        if (ok) {
          sorterSolved.add(idx);
          const scoreEl = document.getElementById("m6-sorter-score");
          if (scoreEl) scoreEl.textContent = `${sorterSolved.size} / ${sorterItems.length} sorted`;
          if (sorterSolved.size === sorterItems.length) {
            markStepDone(5, "Step 6 Game-or-history sorter completed.");
          }
        }
      });
    });
  });

  // Initial render
  setStep(0, false);
  updateProgress();
  renderM1();
  renderM2();
  renderM3();
  renderM4();
})();
