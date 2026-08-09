"use client";

import { ROADMAP } from "@/lib/data";
import { useProgress } from "@/hooks/useProgress";

export default function ToolsApp() {
  const { checked, toggle, loaded, signedIn } = useProgress();

  const toolModules = ROADMAP.map((mod) => ({
    ...mod,
    items: mod.items.filter((it) => it.tool),
  })).filter((mod) => mod.items.length > 0);

  const totalTools = toolModules.reduce((n, m) => n + m.items.length, 0);
  const doneTools = toolModules.reduce(
    (n, m) => n + m.items.filter((it) => checked[it.id]).length,
    0
  );

  return (
    <div className="wrap">
      <div className="eyebrow">
        <span className="dot" aria-hidden="true"></span> LEARNING TERMINAL — PRO TOOLS
      </div>
      <h1>Getting Started With Professional Tools</h1>
      <p className="sub">
        Everything you need to actually start trading — brokers, platforms,
        calendars, calculators, journaling and backtesting tools,
        algorithmic-trading resources, and proprietary-funding paths — pulled
        out of the full roadmap for quick access.{" "}
        {signedIn
          ? "Signed in — checks here sync with your account."
          : "Sign in with Google to sync these across devices."}
      </p>

      <div className="stats">
        <div className="stat-num">
          {loaded ? doneTools : "…"}
          <span> / {totalTools} tools</span>
        </div>
      </div>
      <div className="progress-outer">
        <div
          className="progress-fill"
          style={{
            width: (loaded && totalTools ? Math.round((doneTools / totalTools) * 100) : 0) + "%",
          }}
        ></div>
      </div>

      <div className="tools-grid">
        {toolModules.map((mod) => (
          <div className="tool-group" key={mod.code}>
            <h2 className="tool-group-title">{mod.title}</h2>
            <div className="tool-cards">
              {mod.items.map((it) => (
                <div
                  className={
                    "tool-card lvl-" + it.level + (checked[it.id] ? " done" : "")
                  }
                  key={it.id}
                >
                  <div className="tool-card-top">
                    <label className="tool-check">
                      <input
                        type="checkbox"
                        checked={!!checked[it.id]}
                        onChange={(e) => toggle(it.id, e.target.checked)}
                      />
                      <span className="box" aria-hidden="true"></span>
                    </label>
                    <span className={"lvl-dot " + it.level}></span>
                  </div>
                  <h3 className="tool-card-title">{it.title}</h3>
                  <p className="tool-card-desc">{it.desc}</p>
                  <a
                    className="tool-open-btn"
                    href={it.url}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Open resource ↗
                  </a>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
