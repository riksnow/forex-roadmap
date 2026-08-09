"use client";

export default function ItemRow({ item, checkedValue, onToggle }) {
  return (
    <label className={"item lvl-" + item.level + (checkedValue ? " done" : "")}>
      <input
        type="checkbox"
        checked={checkedValue}
        onChange={(e) => onToggle(item.id, e.target.checked)}
      />
      <span className="box" aria-hidden="true"></span>
      <span className="item-body">
        <span className="item-title">{item.title}</span>
        <span className="item-desc">{item.desc}</span>
        <a
          className="item-link"
          href={item.url}
          target="_blank"
          rel="noopener noreferrer"
        >
          Learn more ↗
        </a>
      </span>
      <span className={"lvl-dot " + item.level} title={item.level}></span>
    </label>
  );
}
