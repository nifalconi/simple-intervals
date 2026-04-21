// History — completed routines list with aggregate stats.

import { Icon } from "./icons.tsx";
import { fmtTime, type AppState } from "./store.ts";

interface HistoryProps {
  state: AppState;
  onBack: () => void;
  onClear: () => void;
}

function fmtDate(ts: number): string {
  const d = new Date(ts);
  const today = new Date();
  const diff = Math.round(
    (today.setHours(0, 0, 0, 0) - new Date(ts).setHours(0, 0, 0, 0)) / 86400000
  );
  const time = d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  if (diff === 0) return "Today · " + time;
  if (diff === 1) return "Yesterday · " + time;
  return d.toLocaleDateString([], { month: "short", day: "numeric" }) + " · " + time;
}

export default function History({ state, onBack, onClear }: HistoryProps) {
  const h = state.history;
  const totalSec = h.reduce((a, e) => a + e.duration, 0);
  const totalTasks = h.reduce((a, e) => a + e.tasks, 0);

  return (
    <div className="app">
      <div className="back-row">
        <button className="text-btn" onClick={onBack}><Icon.Back /> Back</button>
      </div>

      <div className="section-head">
        <div>
          <h1>History</h1>
          <p>Completed routines · last 50</p>
        </div>
      </div>

      <div className="stat-row">
        <div className="stat">
          <div className="v">{h.length}</div>
          <div className="l">Sessions</div>
        </div>
        <div className="stat">
          <div className="v">{fmtTime(totalSec)}</div>
          <div className="l">Total time</div>
        </div>
        <div className="stat">
          <div className="v">{totalTasks}</div>
          <div className="l">Tasks done</div>
        </div>
      </div>

      {h.length === 0 ? (
        <div className="empty">
          <p>No runs yet. Start a routine to see it here.</p>
        </div>
      ) : (
        <div>
          {h.map(e => (
            <div key={e.id} className="history-item">
              <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                <div>
                  <div style={{ fontWeight: 600 }}>{e.routineName}</div>
                  <div className="meta">{fmtDate(e.at)} · {e.tasks} tasks</div>
                </div>
              </div>
              <div className="meta" style={{ color: "var(--ink)" }}><b>{fmtTime(e.duration)}</b></div>
            </div>
          ))}
          <button className="danger-btn" onClick={onClear}>Clear history</button>
        </div>
      )}
    </div>
  );
}
