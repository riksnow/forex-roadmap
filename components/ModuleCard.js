"use client";

import ItemRow from "./ItemRow";

export default function ModuleCard({ mod, items, checked, onToggleItem }) {
  const done = mod.items.filter((it) => checked[it.id]).length;
  const total = mod.items.length;
  const pct = total ? Math.round((done / total) * 100) : 0;

  return (
    <details
      className="module"
      id={"module-" + mod.code}
      open={mod.code === "M01"}
    >
      <summary className="mod-head">
        <span className="mod-code">{mod.code}</span>
        <span className="mod-title">{mod.title}</span>
        <span className="mod-frac">
          {done}/{total}
        </span>
        <span className="mod-bar-outer">
          <span className="mod-bar-fill" style={{ width: pct + "%" }}></span>
        </span>
        <span className="chevron" aria-hidden="true"></span>
      </summary>
      <div className="items">
        {items.map((it) => (
          <ItemRow
            key={it.id}
            item={it}
            checkedValue={!!checked[it.id]}
            onToggle={onToggleItem}
          />
        ))}
      </div>
    </details>
  );
}
