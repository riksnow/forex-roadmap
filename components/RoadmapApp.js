"use client";

import { useEffect, useState } from "react";
import { ROADMAP, TOTAL_ITEMS, LEVELS } from "@/lib/data";
import { useProgress } from "@/hooks/useProgress";
import ModuleCard from "./ModuleCard";

const LEVEL_ORDER = ["all", "beginner", "intermediate", "advanced", "professional"];

export default function RoadmapApp() {
  const { checked, toggle, reset, loaded, signedIn } = useProgress();
  const [activeLevel, setActiveLevel] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");

  const term = searchTerm.trim().toLowerCase();
  const filtering = activeLevel !== "all" || term !== "";

  function matches(item) {
    if (activeLevel !== "all" && item.level !== activeLevel) return false;
    if (term) {
      const haystack = (item.title + " " + item.desc).toLowerCase();
      if (!haystack.includes(term)) return false;
    }
    return true;
  }

  const visibleModules = ROADMAP.map((mod) => ({
    ...mod,
    visibleItems: filtering ? mod.items.filter(matches) : mod.items,
  })).filter((mod) => (filtering ? mod.visibleItems.length > 0 : true));

  // When a filter/search narrows the list, force-open every matching module
  // so results are actually visible without an extra click.
  useEffect(() => {
    if (!filtering) return;
    document
      .querySelectorAll(".modules details.module")
      .forEach((el) => {
        el.open = true;
      });
  }, [filtering, term, activeLevel]);

  const doneCount = Object.values(checked).filter(Boolean).length;
  const pct = TOTAL_ITEMS ? Math.round((doneCount / TOTAL_ITEMS) * 100) : 0;

  function jumpTo(code) {
    const el = document.getElementById("module-" + code);
    if (el) {
      el.open = true;
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }

  function handleReset() {
    const scope = signedIn ? "for your account" : "in this browser";
    const ok = confirm(
      `This clears every checked item ${scope}. This cannot be undone. Reset progress?`
    );
    if (ok) reset();
  }

  function clearFilters() {
    setActiveLevel("all");
    setSearchTerm("");
  }

  return (
    <div className="wrap">
      <div className="eyebrow">
        <span className="dot" aria-hidden="true"></span> LEARNING TERMINAL — FX / CURRICULUM v1
      </div>
      <h1>Forex Trading Roadmap</h1>
      <p className="sub">
        A complete, sourced curriculum from first principles to
        professional-grade concepts — 17 modules, {TOTAL_ITEMS} concepts.{" "}
        {signedIn
          ? "Signed in — your progress syncs to your account."
          : "Browsing as a guest — sign in with Google to sync progress across devices."}
      </p>
      <p className="disclaimer">
        Educational reference only, not financial or investment advice.
        Verify current spreads, leverage limits, and regulatory status
        directly with any broker before funding an account.
      </p>

      <div className="stats">
        <div className="stat-num">
          {loaded ? doneCount : "…"}
          <span> / {TOTAL_ITEMS} concepts</span>
        </div>
        <div className="stat-pct">{loaded ? pct : 0}%</div>
      </div>
      <div className="progress-outer">
        <div
          className="progress-fill"
          style={{ width: (loaded ? pct : 0) + "%" }}
        ></div>
      </div>

      <div className="ticker-label">Module progress — click a bar to jump</div>
      <div className="ticker">
        {ROADMAP.map((mod) => {
          const done = mod.items.filter((it) => checked[it.id]).length;
          const modPct = mod.items.length
            ? Math.round((done / mod.items.length) * 100)
            : 0;
          const color =
            modPct === 100 ? "var(--beg)" : modPct > 0 ? "var(--int)" : "var(--border)";
          return (
            <button
              key={mod.code}
              className="tick"
              title={`${mod.code}: ${mod.title} — ${modPct}%`}
              onClick={() => jumpTo(mod.code)}
              type="button"
            >
              <span
                className="tick-bar"
                style={{ height: Math.max(modPct, 4) + "%", background: color }}
              ></span>
            </button>
          );
        })}
      </div>

      <div className="toolbar">
        {LEVEL_ORDER.map((lvl) => (
          <button
            key={lvl}
            type="button"
            className={"chip" + (activeLevel === lvl ? " active" : "")}
            data-lvl={lvl}
            onClick={() => setActiveLevel(lvl)}
          >
            {lvl === "all" ? "All levels" : LEVELS[lvl].label}
          </button>
        ))}
        <input
          className="search-input"
          type="text"
          placeholder="Search concepts…"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <button type="button" className="reset-btn" onClick={handleReset}>
          Reset progress
        </button>
      </div>

      <div className="quicklinks">
        <a
          className="qlink"
          href="https://www.babypips.com/learn/forex"
          target="_blank"
          rel="noopener noreferrer"
        >
          ↗ BabyPips School of Pipsology
        </a>
        <a
          className="qlink"
          href="https://www.forexfactory.com/calendar"
          target="_blank"
          rel="noopener noreferrer"
        >
          ↗ Forex Factory Calendar
        </a>
        <a
          className="qlink"
          href="https://www.myfxbook.com/forex-calculators/position-size"
          target="_blank"
          rel="noopener noreferrer"
        >
          ↗ MyFXBook Position Size Calculator
        </a>
        <a
          className="qlink"
          href="https://www.tradingview.com/"
          target="_blank"
          rel="noopener noreferrer"
        >
          ↗ TradingView
        </a>
        <a className="qlink" href="/tools">
          ↗ All professional tools
        </a>
      </div>

      {visibleModules.length === 0 ? (
        <div className="empty-state">
          No concepts match your filters.
          <br />
          <button type="button" onClick={clearFilters}>
            Clear filters
          </button>
        </div>
      ) : (
        <div className="modules">
          {visibleModules.map((mod) => (
            <ModuleCard
              key={mod.code}
              mod={mod}
              items={mod.visibleItems}
              checked={checked}
              onToggleItem={toggle}
            />
          ))}
        </div>
      )}
    </div>
  );
}
