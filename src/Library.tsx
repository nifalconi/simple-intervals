// Library — home screen listing all routines.

import { Icon } from "./icons.tsx";
import { fmtTime, totalDuration, type AppState } from "./store.ts";

interface LibraryProps {
  state: AppState;
  onOpen: (id: string) => void;
  onNew: () => void;
  onRun: (id: string) => void;
  onHistory: () => void;
  onSettings: () => void;
}

export default function Library({ state, onOpen, onNew, onRun, onHistory, onSettings }: LibraryProps) {
  return (
    <div className="app">
      <div className="topbar">
        <div className="brand">
          <div className="brand-dot" aria-hidden />
          Simple Intervals
        </div>
        <div className="topbar-actions">
          <button className="icon-btn" title="History" onClick={onHistory}>
            <Icon.History />
          </button>
          <button className="icon-btn" title="Settings" onClick={onSettings}>
            <Icon.Settings />
          </button>
        </div>
      </div>

      <div className="section-head">
        <div>
          <h1>Intervals</h1>
          <p>{state.routines.length} saved · tap to edit, play to start</p>
        </div>
      </div>

      {state.routines.length > 0 && (
        <div className="routine-list">
          {state.routines.map(r => {
            const total = totalDuration(r);
            return (
              <button key={r.id} className="routine-row anim-in" onClick={() => onOpen(r.id)}>
                <div className="body">
                  <span className="nm">{r.name}</span>
                  <span className="meta">
                    <span><b>{r.tasks.length}</b> task{r.tasks.length === 1 ? "" : "s"}</span>
                    <span><b>{fmtTime(total)}</b></span>
                    {r.settings.restEnabled && <span><b>{r.settings.restDuration}s</b> rest</span>}
                  </span>
                </div>
                <span
                  className="play-btn"
                  onClick={(e) => { e.stopPropagation(); onRun(r.id); }}
                  aria-label="Start"
                >
                  <Icon.Play />
                </span>
                <span className="chev"><Icon.Back style={{ transform: "rotate(180deg)" }} /></span>
              </button>
            );
          })}
        </div>
      )}

      <button className="add-row" onClick={onNew}>
        <Icon.Plus /> New routine
      </button>
    </div>
  );
}
