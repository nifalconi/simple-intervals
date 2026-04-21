// Editor — edit a routine: name, tasks (drag to reorder), per-routine settings.

import { useEffect, useRef, useState, type CSSProperties, type PointerEvent as ReactPointerEvent } from "react";
import { Icon } from "./icons.tsx";
import {
  fmtTime,
  totalDuration,
  uid,
  type Routine,
  type Task,
  type SoundKitId,
} from "./store.ts";
import { SOUND_KITS, playCue } from "./lib/intervals-audio.ts";
import { requestPermission, notificationsSupported } from "./lib/notifications.ts";

function DragHandle() {
  return (
    <svg viewBox="0 0 10 16" fill="currentColor">
      <circle cx="2" cy="3" r="1.2" /><circle cx="8" cy="3" r="1.2" />
      <circle cx="2" cy="8" r="1.2" /><circle cx="8" cy="8" r="1.2" />
      <circle cx="2" cy="13" r="1.2" /><circle cx="8" cy="13" r="1.2" />
    </svg>
  );
}

interface TaskRowProps {
  task: Task;
  idx: number;
  onChange: (t: Task) => void;
  onDelete: () => void;
  canDelete: boolean;
  onDragStart: (e: ReactPointerEvent<HTMLDivElement>, idx: number) => void;
  dragging: boolean;
  translate: number;
}

function TaskRow({ task, idx, onChange, onDelete, canDelete, onDragStart, dragging, translate }: TaskRowProps) {
  const mins = Math.floor(task.duration / 60);
  const secs = task.duration % 60;

  const style: CSSProperties = {};
  if (dragging) {
    style.transform = `translateY(${translate}px)`;
    style.transition = "none";
  } else if (translate) {
    style.transform = `translateY(${translate}px)`;
  }

  return (
    <div
      className={"task-row" + (dragging ? " dragging" : "")}
      style={style}
      data-task-idx={idx}
    >
      <div
        className="drag-handle"
        onPointerDown={(e) => onDragStart(e, idx)}
        title="Drag to reorder"
      >
        <DragHandle />
      </div>
      <span className="task-num">{String(idx + 1).padStart(2, "0")}</span>
      <div className="task-name-wrap">
        <input
          className="task-name-input"
          value={task.name}
          placeholder="Task name"
          onChange={e => onChange({ ...task, name: e.target.value })}
        />
      </div>
      <div className="task-time">
        <input
          type="number" min={0} max={99}
          value={mins}
          onChange={e => {
            const v = Math.max(0, Math.min(99, parseInt(e.target.value || "0", 10)));
            onChange({ ...task, duration: v * 60 + secs });
          }}
        />
        <span className="sep">m</span>
        <input
          type="number" min={0} max={59}
          value={secs}
          onChange={e => {
            const v = Math.max(0, Math.min(59, parseInt(e.target.value || "0", 10)));
            onChange({ ...task, duration: mins * 60 + v });
          }}
        />
        <span className="sep">s</span>
      </div>
      <button className="task-del" onClick={onDelete} disabled={!canDelete} title="Delete task">
        <Icon.Trash />
      </button>
    </div>
  );
}

interface DragState {
  fromIdx: number;
  toIdx: number;
  deltaY: number;
  rowH: number;
  startY: number;
}

interface EditorProps {
  routine: Routine;
  onBack: () => void;
  onSave: (r: Routine) => void;
  onDelete: () => void;
  onRun: (id: string) => void;
}

export default function Editor({ routine, onBack, onSave, onDelete, onRun }: EditorProps) {
  const [r, setR] = useState<Routine>(routine);
  const set = (patch: Partial<Routine>) => setR(p => ({ ...p, ...patch }));
  const setS = (patch: Partial<Routine["settings"]>) =>
    setR(p => ({ ...p, settings: { ...p.settings, ...patch } }));

  // autosave
  const saveRef = useRef(onSave);
  saveRef.current = onSave;
  useEffect(() => { saveRef.current(r); }, [r]);

  const updateTask = (idx: number, t: Task) =>
    setR(p => ({ ...p, tasks: p.tasks.map((x, i) => (i === idx ? t : x)) }));
  const deleteTask = (idx: number) =>
    setR(p => ({ ...p, tasks: p.tasks.filter((_, i) => i !== idx) }));
  const addTask = () =>
    setR(p => ({
      ...p,
      tasks: [...p.tasks, { id: uid(), name: `Task ${p.tasks.length + 1}`, duration: 30 }],
    }));

  const [drag, setDrag] = useState<DragState | null>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const [notifyHint, setNotifyHint] = useState<string | null>(null);

  const onToggleNotify = async () => {
    const next = !r.settings.notifyOnTaskStart;
    if (!next) {
      setS({ notifyOnTaskStart: false });
      return;
    }
    if (!notificationsSupported()) {
      setNotifyHint("Notifications not supported on this device.");
      setTimeout(() => setNotifyHint(null), 3500);
      return;
    }
    const ok = await requestPermission();
    if (!ok) {
      setNotifyHint("Permission denied. Enable in browser settings.");
      setTimeout(() => setNotifyHint(null), 3500);
      return;
    }
    setS({ notifyOnTaskStart: true });
  };

  const onDragStart = (e: ReactPointerEvent<HTMLDivElement>, idx: number) => {
    e.preventDefault();
    const row = (e.currentTarget as HTMLElement).closest(".task-row") as HTMLElement | null;
    if (!row) return;
    const rowH = row.offsetHeight + 1;
    const startY = e.clientY;
    setDrag({ fromIdx: idx, toIdx: idx, deltaY: 0, rowH, startY });

    const onMove = (ev: PointerEvent) => {
      const dy = ev.clientY - startY;
      setDrag(prev => {
        if (!prev) return prev;
        const moved = Math.round(dy / prev.rowH);
        const toIdx = Math.max(0, Math.min(r.tasks.length - 1, prev.fromIdx + moved));
        return { ...prev, deltaY: dy, toIdx };
      });
    };
    const onUp = () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      setDrag(prev => {
        if (!prev) return null;
        if (prev.fromIdx !== prev.toIdx) {
          setR(cur => {
            const arr = [...cur.tasks];
            const [m] = arr.splice(prev.fromIdx, 1);
            arr.splice(prev.toIdx, 0, m);
            return { ...cur, tasks: arr };
          });
        }
        return null;
      });
    };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
  };

  const translateFor = (idx: number): number => {
    if (!drag) return 0;
    const { fromIdx, toIdx, deltaY, rowH } = drag;
    if (idx === fromIdx) return deltaY;
    if (fromIdx < toIdx && idx > fromIdx && idx <= toIdx) return -rowH;
    if (fromIdx > toIdx && idx < fromIdx && idx >= toIdx) return rowH;
    return 0;
  };

  return (
    <div className="app">
      <div className="back-row">
        <button className="text-btn" onClick={onBack}>
          <Icon.Back /> Back
        </button>
        <span style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: "var(--ink-faint)" }}>
          AUTOSAVED
        </span>
      </div>

      <input
        className="title-input"
        value={r.name}
        placeholder="Routine name"
        onChange={e => set({ name: e.target.value })}
      />
      <p style={{ color: "var(--ink-soft)", fontSize: 13, margin: "6px 0 0", fontFamily: "var(--font-mono)" }}>
        {r.tasks.length} task{r.tasks.length === 1 ? "" : "s"} · {fmtTime(totalDuration(r))} total
      </p>

      <div className="settings-title" style={{ marginTop: 24 }}>Tasks · drag to reorder</div>
      <div className="tasks-list" ref={listRef}>
        {r.tasks.map((t, i) => (
          <TaskRow
            key={t.id}
            task={t}
            idx={i}
            onChange={(nt) => updateTask(i, nt)}
            onDelete={() => deleteTask(i)}
            canDelete={r.tasks.length > 1}
            onDragStart={onDragStart}
            dragging={drag?.fromIdx === i}
            translate={translateFor(i)}
          />
        ))}
      </div>

      <button className="add-task-btn" onClick={addTask}>
        <Icon.Plus /> Add task
      </button>

      <div className="settings-title">Settings for this routine</div>

      <div className="settings-block">
        <h4>Rest between tasks</h4>
        <div className="setting-row">
          <div className="label">
            <span className="name">Enable rest</span>
            <span className="hint">Pause between each task</span>
          </div>
          <button
            className={"toggle " + (r.settings.restEnabled ? "on" : "")}
            onClick={() => setS({ restEnabled: !r.settings.restEnabled })}
          />
        </div>
        {r.settings.restEnabled && (
          <div className="setting-row">
            <div className="label">
              <span className="name">Rest duration</span>
              <span className="hint">Seconds between tasks</span>
            </div>
            <div className="stepper">
              <button onClick={() => setS({ restDuration: Math.max(3, r.settings.restDuration - 5) })}>−</button>
              <span className="val">{r.settings.restDuration}s</span>
              <button onClick={() => setS({ restDuration: Math.min(120, r.settings.restDuration + 5) })}>+</button>
            </div>
          </div>
        )}
      </div>

      <div className="settings-block">
        <h4>Sound cues</h4>
        <div className="setting-row">
          <div className="label">
            <span className="name">Sound pack</span>
            <span className="hint">Tap to preview</span>
          </div>
          <div className="seg">
            {(Object.keys(SOUND_KITS) as SoundKitId[]).map(k => (
              <button
                key={k}
                className={r.settings.soundKit === k ? "sel" : ""}
                onClick={() => { setS({ soundKit: k }); playCue(k, "start", 0.4); }}
              >{SOUND_KITS[k].name.split(" ")[0]}</button>
            ))}
          </div>
        </div>
        <div className="setting-row">
          <div className="label"><span className="name">Start cue</span></div>
          <button className={"toggle " + (r.settings.startCue ? "on" : "")}
            onClick={() => setS({ startCue: !r.settings.startCue })} />
        </div>
        <div className="setting-row">
          <div className="label"><span className="name">Halfway ping</span></div>
          <button className={"toggle " + (r.settings.halfwayCue ? "on" : "")}
            onClick={() => setS({ halfwayCue: !r.settings.halfwayCue })} />
        </div>
        <div className="setting-row">
          <div className="label"><span className="name">End cue</span></div>
          <button className={"toggle " + (r.settings.endCue ? "on" : "")}
            onClick={() => setS({ endCue: !r.settings.endCue })} />
        </div>
        <div className="setting-row">
          <div className="label">
            <span className="name">3-2-1 countdown</span>
            <span className="hint">Beep on final 3 seconds</span>
          </div>
          <button className={"toggle " + (r.settings.countdown321 ? "on" : "")}
            onClick={() => setS({ countdown321: !r.settings.countdown321 })} />
        </div>
        <div className="setting-row">
          <div className="label">
            <span className="name">Task notifications</span>
            <span className="hint">OS popup when each task starts</span>
          </div>
          <button className={"toggle " + (r.settings.notifyOnTaskStart ? "on" : "")}
            onClick={onToggleNotify} />
        </div>
        {notifyHint && (
          <div style={{ fontSize: 12, color: "var(--ink-soft)", padding: "6px 0 0" }}>
            {notifyHint}
          </div>
        )}
      </div>

      <button className="danger-btn" onClick={onDelete}>
        Delete routine
      </button>

      <div className="cta-row">
        <button className="cta" onClick={() => onRun(r.id)} disabled={r.tasks.length === 0}>
          <Icon.Play /> Start routine
        </button>
      </div>
    </div>
  );
}
