"use client";

import { useState, useEffect, useCallback, useRef } from "react";

/* ============ constants & pure helpers ============ */

const DEFAULT_PUZZLE =
  "530070000600195000098000060800060003400803001700020006060000280000419005000080079";
const DEFAULT_SOLUTION =
  "534678912672195348198342567859761423426853791713924856961537284287419635345286179";

const defaultGivenMask = DEFAULT_PUZZLE.split("").map((d) => d !== "0");
const defaultInitialValues = DEFAULT_PUZZLE.split("").map((d) => parseInt(d, 10));
const defaultSolutionArr = DEFAULT_SOLUTION.split("").map((d) => parseInt(d, 10));
const noGiven = new Array(81).fill(false);

function peersOf(i) {
  const r = Math.floor(i / 9);
  const c = i % 9;
  const br = Math.floor(r / 3) * 3;
  const bc = Math.floor(c / 3) * 3;
  const set = new Set();
  for (let k = 0; k < 9; k++) {
    set.add(r * 9 + k);
    set.add(k * 9 + c);
  }
  for (let rr = br; rr < br + 3; rr++)
    for (let cc = bc; cc < bc + 3; cc++) set.add(rr * 9 + cc);
  set.delete(i);
  return set;
}

function findConflicts(values) {
  const conflicts = new Set();
  for (let i = 0; i < 81; i++) {
    if (values[i] === 0) continue;
    for (const p of peersOf(i)) {
      if (values[p] === values[i]) {
        conflicts.add(i);
        conflicts.add(p);
      }
    }
  }
  return conflicts;
}

// Backtracking solver — finds one valid completion of `initial`, if any exists.
function solveSudoku(initial) {
  const board = initial.slice();

  function isValid(idx, val) {
    const r = Math.floor(idx / 9);
    const c = idx % 9;
    for (let k = 0; k < 9; k++) {
      if (board[r * 9 + k] === val) return false;
      if (board[k * 9 + c] === val) return false;
    }
    const br = Math.floor(r / 3) * 3;
    const bc = Math.floor(c / 3) * 3;
    for (let rr = br; rr < br + 3; rr++)
      for (let cc = bc; cc < bc + 3; cc++)
        if (board[rr * 9 + cc] === val) return false;
    return true;
  }

  let steps = 0;
  const MAX_STEPS = 2000000;

  function backtrack(pos) {
    steps++;
    if (steps > MAX_STEPS) return "timeout";
    while (pos < 81 && board[pos] !== 0) pos++;
    if (pos === 81) return true;
    for (let v = 1; v <= 9; v++) {
      if (isValid(pos, v)) {
        board[pos] = v;
        const res = backtrack(pos + 1);
        if (res === true) return true;
        if (res === "timeout") return "timeout";
        board[pos] = 0;
      }
    }
    return false;
  }

  const result = backtrack(0);
  if (result === true) return { solved: board, status: "ok" };
  if (result === "timeout") return { solved: null, status: "timeout" };
  return { solved: null, status: "unsolvable" };
}

/* ---------- handwriting recognition (shared model) ---------- */
const MODEL_URL =
  "https://storage.googleapis.com/tfjs-models/tfjs/mnist_transfer_cnn_v1/model.json";
let cachedModelPromise = null;
function getDigitModel() {
  if (!cachedModelPromise) {
    cachedModelPromise = (async () => {
      const tf = await import("@tensorflow/tfjs");
      const model = await tf.loadLayersModel(MODEL_URL);
      return { tf, model };
    })();
  }
  return cachedModelPromise;
}

// Converts the overlay's ink (alpha-based) into a solid black-on-white bitmap,
// the format an MNIST-style digit model expects.
function inkToBWImageData(srcImgData) {
  const out = new ImageData(srcImgData.width, srcImgData.height);
  for (let p = 0; p < srcImgData.data.length; p += 4) {
    const a = srcImgData.data[p + 3];
    if (a > 10) {
      out.data[p] = 0; out.data[p + 1] = 0; out.data[p + 2] = 0; out.data[p + 3] = 255;
    } else {
      out.data[p] = 255; out.data[p + 1] = 255; out.data[p + 2] = 255; out.data[p + 3] = 255;
    }
  }
  return out;
}

/* ============ presentational pieces ============ */

function Board({ values, given, notes, selected, wrongCells }) {
  const selPeers = selected != null ? peersOf(selected) : new Set();
  const selVal = selected != null ? values[selected] : 0;
  const conflicts = findConflicts(values);

  return (
    <div className="sudoku-board">
      {values.map((val, i) => {
        const r = Math.floor(i / 9);
        const c = i % 9;
        const isGiven = given[i];
        const isSelected = i === selected;
        const isPeer = selPeers.has(i);
        const isSameNum = selVal !== 0 && val === selVal && i !== selected;
        const isConflict = conflicts.has(i);
        const isWrong = wrongCells && wrongCells.has(i);

        const cls = [
          "sudoku-cell",
          isGiven && "given",
          isSelected && "selected",
          !isSelected && isPeer && "peer",
          isSameNum && "samenum",
          isConflict || isWrong ? "conflict" : "",
          c % 3 === 2 && c !== 8 ? "thick-right" : "",
          r % 3 === 2 && r !== 8 ? "thick-bottom" : "",
        ]
          .filter(Boolean)
          .join(" ");

        return (
          <div key={i} className={cls}>
            {val !== 0 ? (
              val
            ) : notes && notes[i] && notes[i].size > 0 ? (
              <div className="sudoku-notes">
                {Array.from({ length: 9 }, (_, n) => n + 1).map((n) => (
                  <span key={n}>{notes[i].has(n) ? n : ""}</span>
                ))}
              </div>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}

function Numpad({ onNumber }) {
  return (
    <div className="sudoku-numpad">
      {Array.from({ length: 9 }, (_, n) => n + 1).map((n) => (
        <button key={n} type="button" onClick={() => onNumber(n)}>
          {n}
        </button>
      ))}
    </div>
  );
}

// Transparent canvas layered directly over the board. Press-and-drag inside
// any empty cell to handwrite a digit — same interaction as a stylus notes
// app. A tap with no real movement just selects the cell instead.
function InkOverlay({ given, onSelect, onDigit }) {
  const canvasRef = useRef(null);
  const modelRef = useRef({ tf: null, model: null });
  const strokeRef = useRef({ drawing: false, cell: null, x0: 0, y0: 0, moved: false });
  const [modelReady, setModelReady] = useState(false);
  const [modelFailed, setModelFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    getDigitModel()
      .then((m) => {
        if (cancelled) return;
        modelRef.current = m;
        setModelReady(true);
      })
      .catch((err) => {
        console.error("Handwriting model failed to load:", err);
        if (!cancelled) setModelFailed(true);
      });
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    function resize() {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width;
      canvas.height = rect.height;
    }
    resize();
    window.addEventListener("resize", resize);
    return () => window.removeEventListener("resize", resize);
  }, []);

  function localPos(e) {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  }

  function cellFromPoint(x, y) {
    const canvas = canvasRef.current;
    const col = Math.min(8, Math.max(0, Math.floor((x / canvas.width) * 9)));
    const row = Math.min(8, Math.max(0, Math.floor((y / canvas.height) * 9)));
    return row * 9 + col;
  }

  function handlePointerDown(e) {
    e.preventDefault();
    const canvas = canvasRef.current;
    canvas.setPointerCapture?.(e.pointerId);
    const { x, y } = localPos(e);
    strokeRef.current = { drawing: true, cell: cellFromPoint(x, y), x0: x, y0: y, moved: false };
    const ctx = canvas.getContext("2d");
    ctx.beginPath();
    ctx.moveTo(x, y);
  }

  function handlePointerMove(e) {
    if (!strokeRef.current.drawing) return;
    e.preventDefault();
    const { x, y } = localPos(e);
    const s = strokeRef.current;
    if (Math.hypot(x - s.x0, y - s.y0) > 4) s.moved = true;
    const ctx = canvasRef.current.getContext("2d");
    ctx.lineWidth = e.pointerType === "pen" ? 3 : 6;
    ctx.lineCap = "round";
    ctx.strokeStyle = "#1d9e75";
    ctx.lineTo(x, y);
    ctx.stroke();
  }

  async function handlePointerUp() {
    const s = strokeRef.current;
    if (!s.drawing) return;
    strokeRef.current.drawing = false;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    const idx = s.cell;

    if (!s.moved) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      onSelect(idx);
      return;
    }

    if (given[idx] || !modelRef.current.model) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      if (!given[idx]) onSelect(idx);
      return;
    }

    try {
      const raw = ctx.getImageData(0, 0, canvas.width, canvas.height);
      let minX = canvas.width, minY = canvas.height, maxX = 0, maxY = 0;
      for (let y = 0; y < canvas.height; y++) {
        for (let x = 0; x < canvas.width; x++) {
          const a = raw.data[(y * canvas.width + x) * 4 + 3];
          if (a > 10) {
            if (x < minX) minX = x; if (x > maxX) maxX = x;
            if (y < minY) minY = y; if (y > maxY) maxY = y;
          }
        }
      }
      if (maxX < minX || maxY < minY) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        onSelect(idx);
        return;
      }

      const bw = inkToBWImageData(raw);
      const temp = document.createElement("canvas");
      temp.width = canvas.width;
      temp.height = canvas.height;
      temp.getContext("2d").putImageData(bw, 0, 0);

      const { tf, model } = modelRef.current;
      const tensor = tf.tidy(() => {
        let t = tf.browser.fromPixels(temp, 1);
        t = tf.image.cropAndResize(
          tf.expandDims(tf.cast(t, "float32")),
          [[minY / temp.height, minX / temp.width, maxY / temp.height, maxX / temp.width]],
          [0],
          [20, 20]
        );
        t = tf.pad(t.squeeze([0]), [[4, 4], [4, 4], [0, 0]]);
        t = tf.sub(1, tf.div(t, 255));
        return t.reshape([1, 28, 28, 1]);
      });
      const prediction = model.predict(tensor);
      const probs = await prediction.data();
      tensor.dispose();
      prediction.dispose();

      let best = 0;
      for (let i = 1; i < probs.length; i++) if (probs[i] > probs[best]) best = i;
      const confidence = probs[best];

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      if (best === 0 || confidence < 0.4) {
        onSelect(idx);
      } else {
        onDigit(idx, best);
      }
    } catch (err) {
      console.error("Recognition failed:", err);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      onSelect(idx);
    }
  }

  return (
    <canvas
      ref={canvasRef}
      className="sudoku-ink-canvas"
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerUp}
      title={
        modelFailed
          ? "Handwriting recognition unavailable — use the numpad or keyboard."
          : modelReady
          ? "Draw a digit directly on a cell, or tap to select it."
          : "Loading handwriting recognition…"
      }
    />
  );
}

/* ============ main component ============ */

export default function SudokuPractice() {
  const [tab, setTab] = useState("default");

  // --- default puzzle state ---
  const [defaultValues, setDefaultValues] = useState(defaultInitialValues.slice());
  const [defaultNotes, setDefaultNotes] = useState(() => Array.from({ length: 81 }, () => new Set()));
  const [defaultSelected, setDefaultSelected] = useState(null);
  const [defaultStatus, setDefaultStatus] = useState({ msg: "", type: "ok" });
  const [defaultWrong, setDefaultWrong] = useState(new Set());

  // --- open whiteboard state (your own puzzle, always editable) ---
  const [customValues, setCustomValues] = useState(() => new Array(81).fill(0));
  const [customNotes, setCustomNotes] = useState(() => Array.from({ length: 81 }, () => new Set()));
  const [customSelected, setCustomSelected] = useState(null);
  const [customStatus, setCustomStatus] = useState({ msg: "", type: "ok" });

  const [notesMode, setNotesMode] = useState(false);

  const isDefault = tab === "default";

  const activeValues = isDefault ? defaultValues : customValues;
  const activeGiven = isDefault ? defaultGivenMask : noGiven;
  const activeNotes = isDefault ? defaultNotes : customNotes;
  const activeSelected = isDefault ? defaultSelected : customSelected;
  const activeStatus = isDefault ? defaultStatus : customStatus;
  const activeWrong = isDefault ? defaultWrong : new Set();
  const setActiveSelected = isDefault ? setDefaultSelected : setCustomSelected;

  function setActiveValue(idx, val) {
    if (isDefault) {
      setDefaultValues((prev) => { const next = [...prev]; next[idx] = val; return next; });
      setDefaultStatus({ msg: "", type: "ok" });
      setDefaultWrong(new Set());
    } else {
      setCustomValues((prev) => { const next = [...prev]; next[idx] = val; return next; });
      setCustomStatus({ msg: "", type: "ok" });
    }
  }

  function setActiveNotesFor(idx, updater) {
    const setter = isDefault ? setDefaultNotes : setCustomNotes;
    setter((prev) => {
      const next = prev.map((s) => new Set(s));
      updater(next[idx]);
      return next;
    });
  }

  const inputNumber = useCallback(
    (n) => {
      if (activeSelected == null || activeGiven[activeSelected]) return;
      if (notesMode) {
        setActiveNotesFor(activeSelected, (set) => {
          if (set.has(n)) set.delete(n);
          else set.add(n);
        });
      } else {
        setActiveValue(activeSelected, activeValues[activeSelected] === n ? 0 : n);
        setActiveNotesFor(activeSelected, (set) => set.clear());
      }
    },
    [activeSelected, activeGiven, activeValues, notesMode, isDefault]
  );

  // Handwriting always writes the real value, regardless of notes mode —
  // matches "writing a number" rather than pencilling a candidate.
  const handleDigitFromInk = useCallback(
    (idx, n) => {
      if (activeGiven[idx]) return;
      setActiveSelected(idx);
      if (isDefault) {
        setDefaultValues((prev) => { const next = [...prev]; next[idx] = n; return next; });
        setDefaultNotes((prev) => { const next = prev.map((s) => new Set(s)); next[idx].clear(); return next; });
        setDefaultStatus({ msg: "", type: "ok" });
        setDefaultWrong(new Set());
      } else {
        setCustomValues((prev) => { const next = [...prev]; next[idx] = n; return next; });
        setCustomNotes((prev) => { const next = prev.map((s) => new Set(s)); next[idx].clear(); return next; });
        setCustomStatus({ msg: "", type: "ok" });
      }
    },
    [activeGiven, isDefault]
  );

  function eraseCell() {
    if (activeSelected == null || activeGiven[activeSelected]) return;
    setActiveValue(activeSelected, 0);
    setActiveNotesFor(activeSelected, (set) => set.clear());
  }

  function clearWhiteboard() {
    setCustomValues(new Array(81).fill(0));
    setCustomNotes(Array.from({ length: 81 }, () => new Set()));
    setCustomSelected(null);
    setCustomStatus({ msg: "", type: "ok" });
  }

  useEffect(() => {
    function handler(e) {
      if (activeSelected == null) return;
      if (e.key >= "1" && e.key <= "9") inputNumber(parseInt(e.key, 10));
      else if (e.key === "Backspace" || e.key === "Delete") eraseCell();
      else if (e.key === "ArrowUp" && activeSelected >= 9) setActiveSelected(activeSelected - 9);
      else if (e.key === "ArrowDown" && activeSelected < 72) setActiveSelected(activeSelected + 9);
      else if (e.key === "ArrowLeft" && activeSelected % 9 !== 0) setActiveSelected(activeSelected - 1);
      else if (e.key === "ArrowRight" && activeSelected % 9 !== 8) setActiveSelected(activeSelected + 1);
    }
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [activeSelected, inputNumber]);

  function handleCheck() {
    if (isDefault) {
      const conflicts = findConflicts(defaultValues);
      if (conflicts.size > 0) {
        setDefaultStatus({ msg: "Some numbers repeat in a row, column, or box — fix the highlighted cells.", type: "err" });
        setDefaultWrong(new Set());
        return;
      }
      const wrong = new Set();
      for (let i = 0; i < 81; i++) {
        if (!defaultGivenMask[i] && defaultValues[i] !== 0 && defaultValues[i] !== defaultSolutionArr[i]) wrong.add(i);
      }
      setDefaultWrong(wrong);
      const filled = defaultValues.filter((v, i) => !defaultGivenMask[i] && v !== 0).length;
      const total = 81 - defaultGivenMask.filter(Boolean).length;
      if (wrong.size > 0) setDefaultStatus({ msg: `${wrong.size} cell${wrong.size > 1 ? "s" : ""} don't match the solution.`, type: "err" });
      else if (filled === total) setDefaultStatus({ msg: "Solved! Nicely done.", type: "win" });
      else setDefaultStatus({ msg: "No mistakes so far — keep going.", type: "ok" });
      return;
    }

    // Whiteboard: no fixed clues/solution to compare against — check
    // duplicates directly, then confirm the board can still be completed.
    const conflicts = findConflicts(customValues);
    if (conflicts.size > 0) {
      setCustomStatus({ msg: "Some numbers repeat in a row, column, or box — fix the highlighted cells.", type: "err" });
      return;
    }
    const filledCount = customValues.filter((v) => v !== 0).length;
    if (filledCount === 0) {
      setCustomStatus({ msg: "The board is empty — write in a puzzle to check it.", type: "err" });
      return;
    }
    const { solved, status } = solveSudoku(customValues);
    if (status === "unsolvable") {
      setCustomStatus({ msg: "This isn't solvable as written — one of your numbers conflicts with the rest of the grid.", type: "err" });
      return;
    }
    if (status === "timeout") {
      setCustomStatus({ msg: "Couldn't verify this in time — double check the numbers you've entered.", type: "err" });
      return;
    }
    if (filledCount === 81) {
      setCustomStatus({ msg: "Solved! Nicely done.", type: "win" });
    } else {
      setCustomStatus({ msg: "No conflicts — this can still be completed into a valid Sudoku. Keep going.", type: "ok" });
    }
  }

  return (
    <div className="wrap">
      <div className="eyebrow">
        <span className="dot" aria-hidden="true"></span> LEARNING TERMINAL — SUDOKU
      </div>
      <h1>Sudoku Practice</h1>
      <p className="sub">
        Practice the default puzzle, or use the open board below as a whiteboard for
        any puzzle you've found elsewhere.
      </p>

      <div className="sudoku-tabs">
        <button
          type="button"
          className={"sudoku-tab" + (tab === "default" ? " active" : "")}
          onClick={() => setTab("default")}
        >
          Default puzzle
        </button>
        <button
          type="button"
          className={"sudoku-tab" + (tab === "custom" ? " active" : "")}
          onClick={() => setTab("custom")}
        >
          Your puzzle
        </button>
      </div>

      {!isDefault && (
        <p className="sudoku-hint">
          Write in whatever puzzle you've got — no minimum number of clues. Fill in
          the rest as you solve; Check flags conflicts and tells you if it's still solvable.
        </p>
      )}

      <div className={"sudoku-status" + (activeStatus.type === "err" ? " err" : activeStatus.type === "win" ? " win" : "")}>
        {activeStatus.msg}
      </div>

      <div className="sudoku-board-wrap">
        <Board
          values={activeValues}
          given={activeGiven}
          notes={activeNotes}
          selected={activeSelected}
          wrongCells={activeWrong}
        />
        <InkOverlay given={activeGiven} onSelect={setActiveSelected} onDigit={handleDigitFromInk} />
      </div>

      <div className="sudoku-toolbar">
        <button
          type="button"
          className={"chip" + (notesMode ? " active" : "")}
          data-lvl="beginner"
          onClick={() => setNotesMode((v) => !v)}
        >
          Notes: {notesMode ? "on" : "off"}
        </button>
        <button type="button" className="chip" onClick={eraseCell}>
          Erase
        </button>
        {!isDefault && (
          <button type="button" className="chip" onClick={clearWhiteboard}>
            Clear board
          </button>
        )}
        <button type="button" className="chip" onClick={handleCheck}>
          Check
        </button>
      </div>

      <Numpad onNumber={inputNumber} />

      <p className="sudoku-model-note">
        Tip: tap a cell to select it and type, or press-and-drag directly on a cell
        with a finger, mouse, or stylus to handwrite the digit.
      </p>
    </div>
  );
}