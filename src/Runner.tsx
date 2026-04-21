// Runner — live interval timer with focus and list view modes.

import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { Icon } from "./icons.tsx";
import { fmtTime, type HistoryEntryInput, type Routine } from "./store.ts";
import { playCue, type CueName } from "./lib/intervals-audio.ts";
import { notify } from "./lib/notifications.ts";
import type { DisplayStyle, RunViewMode } from "./constants.ts";

type SeqStep =
  | { kind: "task"; name: string; duration: number; taskIndex: number }
  | { kind: "rest"; name: string; duration: number; taskIndex?: undefined };

function buildSequence(routine: Routine): SeqStep[] {
  const seq: SeqStep[] = [];
  routine.tasks.forEach((t, i) => {
    seq.push({ kind: "task", name: t.name, duration: t.duration, taskIndex: i });
    if (
      routine.settings.restEnabled &&
      i < routine.tasks.length - 1 &&
      routine.settings.restDuration > 0
    ) {
      seq.push({ kind: "rest", name: "Rest", duration: routine.settings.restDuration });
    }
  });
  return seq;
}

interface RunnerProps {
  routine: Routine;
  onExit: () => void;
  soundOn: boolean;
  displayStyle?: DisplayStyle;
  viewMode?: RunViewMode;
  onComplete: (entry: HistoryEntryInput) => void;
}

interface CueFlags {
  half?: boolean;
  c3?: boolean;
  c2?: boolean;
  c1?: boolean;
}

export default function Runner({
  routine,
  onExit,
  soundOn,
  displayStyle = "consume",
  viewMode = "focus",
  onComplete,
}: RunnerProps) {
  const seq = useMemo(() => buildSequence(routine), [routine]);
  const [idx, setIdx] = useState<number>(0);
  const [remaining, setRemaining] = useState<number>(seq[0]?.duration ?? 0);
  const [paused, setPaused] = useState<boolean>(false);
  const [finished, setFinished] = useState<boolean>(false);

  const lastTickRef = useRef<number>(0);
  const cueFlagsRef = useRef<CueFlags>({});
  const startedAtRef = useRef<number>(Date.now());
  const listScrollRef = useRef<HTMLDivElement>(null);
  const listInnerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!listScrollRef.current || !listInnerRef.current) return;
    const inner = listInnerRef.current;
    const items = inner.querySelectorAll<HTMLDivElement>(".run-list-item");
    const el = items[idx];
    if (!el) return;
    const offset = Math.max(0, el.offsetTop - 8);
    inner.style.transform = `translateY(${-offset}px)`;
  }, [idx]);

  const s = routine.settings;
  const current = seq[idx];
  const next = seq[idx + 1];

  const play = useCallback((cue: CueName) => {
    if (!soundOn) return;
    playCue(s.soundKit, cue, 0.5);
  }, [soundOn, s.soundKit]);

  useEffect(() => {
    cueFlagsRef.current = {};
    if (!current) return;
    setRemaining(current.duration);
    if (current.kind === "task" && s.startCue) play("start");
    else if (current.kind === "rest") play("restStart");
    if (current.kind === "task" && s.notifyOnTaskStart) {
      notify(current.name, {
        body: `Task ${current.taskIndex + 1} of ${routine.tasks.length} · ${routine.name}`,
        tag: `simple-intervals-${routine.id}`,
        silent: true,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idx]);

  useEffect(() => {
    if (finished || paused || !current) return;
    lastTickRef.current = performance.now();
    let raf: number;
    const tick = (now: number) => {
      const dt = (now - lastTickRef.current) / 1000;
      lastTickRef.current = now;
      setRemaining(prev => {
        const nx = prev - dt;
        const f = cueFlagsRef.current;
        if (!f.half && current.kind === "task" && s.halfwayCue && prev > current.duration / 2 && nx <= current.duration / 2) {
          play("halfway"); f.half = true;
        }
        if (current.kind === "task" && s.countdown321) {
          if (!f.c3 && prev > 3 && nx <= 3) { play("countdown"); f.c3 = true; }
          if (!f.c2 && prev > 2 && nx <= 2) { play("countdown"); f.c2 = true; }
          if (!f.c1 && prev > 1 && nx <= 1) { play("countdown"); f.c1 = true; }
        }
        if (nx <= 0) {
          if (current.kind === "task" && s.endCue) play("end");
          const nextIdx = idx + 1;
          setTimeout(() => {
            if (nextIdx >= seq.length) {
              setFinished(true);
              if (soundOn) playCue(s.soundKit, "end", 0.6);
            } else setIdx(nextIdx);
          }, 0);
          return 0;
        }
        return nx;
      });
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [idx, paused, finished, current, s, play, seq.length, soundOn]);

  useEffect(() => {
    if (finished) {
      const elapsed = Math.round((Date.now() - startedAtRef.current) / 1000);
      onComplete({
        routineId: routine.id,
        routineName: routine.name,
        duration: elapsed,
        tasks: routine.tasks.length,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [finished]);

  if (finished) {
    return (
      <div className="run-root">
        <div className="run-head">
          <div className="name">{routine.name}</div>
          <button className="icon-btn" onClick={onExit}><Icon.X /></button>
        </div>
        <div className="finished">
          <div className="celebrate">🎉</div>
          <h2>Done!</h2>
          <p>You crushed {routine.tasks.length} tasks · {fmtTime(Math.round((Date.now() - startedAtRef.current) / 1000))}</p>
          <button className="cta" onClick={onExit} style={{ marginTop: 20 }}>
            <Icon.Check /> Back to intervals
          </button>
        </div>
      </div>
    );
  }

  if (!current) return null;
  const p = 1 - remaining / current.duration;

  const nextTask = seq.slice(idx + 1).find(x => x.kind === "task");

  const taskPips = routine.tasks.map((_, i) => {
    const seqIdx = seq.findIndex(x => x.kind === "task" && x.taskIndex === i);
    const prevStep = seq[idx - 1];
    const status: "done" | "current" | "pending" =
      seqIdx < idx ? "done"
      : seqIdx === idx ? "current"
      : (current.kind === "rest" && prevStep && prevStep.kind === "task" && prevStep.taskIndex === i) ? "done"
      : "pending";
    return { status, pVal: status === "current" ? p : 0 };
  });

  const controls = (
    <div className="run-controls">
      <button className="ctrl" onClick={() => setIdx(i => Math.max(0, i - 1))} title="Previous" disabled={idx === 0}>
        <Icon.Prev />
      </button>
      <button className="ctrl" onClick={() => {
        setRemaining(current.duration);
        cueFlagsRef.current = {};
      }} title="Restart task">
        <Icon.Restart />
      </button>
      <button
        className="ctrl primary"
        onClick={() => setPaused(pv => !pv)}
        title={paused ? "Resume" : "Pause"}
      >
        {paused ? <Icon.Play /> : <Icon.Pause />}
      </button>
      <button className="ctrl" onClick={() => {
        if (idx >= seq.length - 1) setFinished(true);
        else setIdx(i => i + 1);
      }} title="Skip">
        <Icon.Skip />
      </button>
      <button className="ctrl" onClick={() => {
        setIdx(0);
        setRemaining(seq[0]?.duration ?? 0);
        setFinished(false);
        setPaused(false);
        cueFlagsRef.current = {};
        startedAtRef.current = Date.now();
      }} title="Restart routine">
        <svg className="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 12a9 9 0 1 0 3-6.7" /><path d="M3 4v5h5" /><circle cx="12" cy="12" r="1.5" fill="currentColor" />
        </svg>
      </button>
    </div>
  );

  const head = (
    <>
      <div className="run-head">
        <div className="name">{routine.name}</div>
        <button className="icon-btn" onClick={onExit}><Icon.X /></button>
      </div>
      <div className="progress-overall">
        {taskPips.map((pp, i) => (
          <div
            key={i}
            className={"pip " + pp.status}
            style={{ "--p": String(pp.pVal) } as CSSProperties}
          />
        ))}
      </div>
    </>
  );

  if (viewMode === "list") {
    return (
      <div className="run-root">
        {head}
        <div className="run-list" ref={listScrollRef}>
          <div className="run-list-inner" ref={listInnerRef}>
            {seq.map((step, i) => {
              const isCurrent = i === idx;
              const isDone = i < idx;
              const isRest = step.kind === "rest";
              const stepNextTask = isRest ? seq.slice(i + 1).find(x => x.kind === "task") : null;
              const displayName = isRest && stepNextTask
                ? `Prepare to: ${stepNextTask.name}`
                : step.name;

              const classes = [
                "run-list-item",
                "style-" + displayStyle,
                isDone ? "done" : "",
                isCurrent ? "current" : "pending",
                isRest ? "rest" : "",
                isCurrent && paused ? "paused" : "",
              ].filter(Boolean).join(" ");

              return (
                <div
                  key={i}
                  className={classes}
                  onClick={isCurrent ? () => setPaused(pv => !pv) : undefined}
                >
                  {isCurrent && (
                    <div
                      className="fill"
                      style={{ "--p": String(displayStyle === "drain" ? (1 - p) : p) } as CSSProperties}
                    />
                  )}
                  <div className="l-body">
                    <span className="l-sub">
                      {isRest ? "Rest" : `Task ${String(step.taskIndex + 1).padStart(2, "0")}`}
                    </span>
                    <span className="l-nm">{displayName}</span>
                  </div>
                  <div className="l-timer">
                    {fmtTime(isCurrent ? remaining : step.duration)}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        {controls}
      </div>
    );
  }

  const focusLabel = current.kind === "rest"
    ? (nextTask ? "Prepare to" : "Rest")
    : `Task ${current.taskIndex + 1} of ${routine.tasks.length}`;
  const focusTitle = current.kind === "rest" && nextTask
    ? nextTask.name
    : current.name;

  return (
    <div className="run-root">
      {head}
      <div className="run-stack">
        <div
          className={
            "current-card " +
            (current.kind === "rest" ? "rest " : "") +
            "style-" + displayStyle +
            (paused ? " paused" : "")
          }
          onClick={() => setPaused(pv => !pv)}
        >
          <div
            className="fill"
            style={{ "--p": String(displayStyle === "drain" ? (1 - p) : p) } as CSSProperties}
          />
          <div className="content">
            <div>
              <div className="task-label">
                <span className="dot" />
                {focusLabel}
              </div>
              <h2 className="task-title">{focusTitle}</h2>
            </div>
            <div className="task-timer">{fmtTime(remaining)}</div>
          </div>
        </div>
        {next && current.kind !== "rest" && (
          <div className="upnext-card">
            <div>
              <div className="lbl">Up next</div>
              <div className="nm">
                {next.kind === "rest" && nextTask ? `Rest · then ${nextTask.name}` : next.name}
              </div>
            </div>
            <div className="dur">{fmtTime(next.duration)}</div>
          </div>
        )}
      </div>
      {controls}
    </div>
  );
}
