import { describe, it, expect, beforeEach } from "vitest";
import {
  uid,
  fmtTime,
  totalDuration,
  addRoutine,
  updateRoutine,
  deleteRoutine,
  logRun,
  clearHistory,
  SEED,
  type AppState,
  type Routine,
} from "../store.ts";

describe("uid", () => {
  it("returns a non-empty string", () => {
    expect(typeof uid()).toBe("string");
    expect(uid().length).toBeGreaterThan(0);
  });
  it("returns a different value each call", () => {
    const a = uid();
    const b = uid();
    expect(a).not.toBe(b);
  });
});

describe("fmtTime", () => {
  it("formats zero as 00:00", () => {
    expect(fmtTime(0)).toBe("00:00");
  });
  it("formats seconds under a minute", () => {
    expect(fmtTime(7)).toBe("00:07");
    expect(fmtTime(45)).toBe("00:45");
  });
  it("formats minutes and seconds", () => {
    expect(fmtTime(90)).toBe("01:30");
    expect(fmtTime(125)).toBe("02:05");
  });
  it("formats hours when >= 60 minutes", () => {
    expect(fmtTime(3600)).toBe("1:00:00");
    expect(fmtTime(3725)).toBe("1:02:05");
  });
  it("rounds non-integer values", () => {
    expect(fmtTime(7.4)).toBe("00:07");
    expect(fmtTime(7.6)).toBe("00:08");
  });
  it("clamps negative values to 00:00", () => {
    expect(fmtTime(-5)).toBe("00:00");
  });
});

function makeRoutine(tasks: number[], restEnabled = false, restDuration = 0): Routine {
  return {
    id: "r1",
    name: "Test",
    emoji: "⚡",
    tasks: tasks.map((d, i) => ({ id: `t${i}`, name: `T${i}`, duration: d })),
    settings: {
      restEnabled,
      restDuration,
      soundKit: "beep",
      startCue: true,
      halfwayCue: true,
      endCue: true,
      countdown321: true,
      notifyOnTaskStart: false,
    },
  };
}

describe("totalDuration", () => {
  it("sums task durations when rest disabled", () => {
    const r = makeRoutine([30, 40, 20]);
    expect(totalDuration(r)).toBe(90);
  });
  it("adds rest between tasks when enabled", () => {
    const r = makeRoutine([30, 40, 20], true, 15);
    // 30 + 40 + 20 + 2 * 15 rests
    expect(totalDuration(r)).toBe(120);
  });
  it("handles single task with rest enabled (no rest added)", () => {
    const r = makeRoutine([30], true, 15);
    expect(totalDuration(r)).toBe(30);
  });
  it("handles empty tasks", () => {
    const r = makeRoutine([], true, 15);
    expect(totalDuration(r)).toBe(0);
  });
});

describe("SEED", () => {
  it("produces an AppState with routines and empty history", () => {
    const s = SEED();
    expect(Array.isArray(s.routines)).toBe(true);
    expect(s.routines.length).toBeGreaterThan(0);
    expect(s.history).toEqual([]);
  });
});

describe("addRoutine", () => {
  let state: AppState;
  beforeEach(() => { state = { routines: [], history: [] }; });

  it("appends a new routine and returns new state + id", () => {
    const { state: next, id } = addRoutine(state);
    expect(next.routines.length).toBe(1);
    expect(next.routines[0].id).toBe(id);
    expect(next.routines[0].tasks.length).toBe(1);
    expect(next.routines[0].name).toBe("New routine");
  });
  it("does not mutate input", () => {
    const { state: next } = addRoutine(state);
    expect(state.routines.length).toBe(0);
    expect(next).not.toBe(state);
  });
});

describe("updateRoutine", () => {
  it("updates a routine by id", () => {
    const r = makeRoutine([30]);
    const s: AppState = { routines: [r], history: [] };
    const next = updateRoutine(s, r.id, { ...r, name: "Renamed" });
    expect(next.routines[0].name).toBe("Renamed");
  });
  it("leaves other routines alone", () => {
    const r1 = { ...makeRoutine([30]), id: "a" };
    const r2 = { ...makeRoutine([40]), id: "b" };
    const s: AppState = { routines: [r1, r2], history: [] };
    const next = updateRoutine(s, "a", { ...r1, name: "A-new" });
    expect(next.routines.find(r => r.id === "b")?.name).toBe(r2.name);
  });
});

describe("deleteRoutine", () => {
  it("removes the routine with matching id", () => {
    const r1 = { ...makeRoutine([30]), id: "a" };
    const r2 = { ...makeRoutine([40]), id: "b" };
    const s: AppState = { routines: [r1, r2], history: [] };
    const next = deleteRoutine(s, "a");
    expect(next.routines.map(r => r.id)).toEqual(["b"]);
  });
});

describe("logRun", () => {
  it("prepends a history entry with id and timestamp", () => {
    const s: AppState = { routines: [], history: [] };
    const next = logRun(s, { routineId: "r1", routineName: "R1", duration: 120, tasks: 3 });
    expect(next.history.length).toBe(1);
    expect(next.history[0].routineId).toBe("r1");
    expect(typeof next.history[0].id).toBe("string");
    expect(typeof next.history[0].at).toBe("number");
  });
  it("caps history at 50 entries", () => {
    let s: AppState = { routines: [], history: [] };
    for (let i = 0; i < 55; i++) {
      s = logRun(s, { routineId: "r", routineName: "R", duration: 10, tasks: 1 });
    }
    expect(s.history.length).toBe(50);
  });
  it("places newest entry first", () => {
    let s: AppState = { routines: [], history: [] };
    s = logRun(s, { routineId: "r", routineName: "first", duration: 10, tasks: 1 });
    s = logRun(s, { routineId: "r", routineName: "second", duration: 20, tasks: 2 });
    expect(s.history[0].routineName).toBe("second");
  });
});

describe("clearHistory", () => {
  it("empties history but preserves routines", () => {
    const r = makeRoutine([30]);
    const s: AppState = {
      routines: [r],
      history: [{ id: "h", routineId: "x", routineName: "X", duration: 1, tasks: 1, at: 1 }],
    };
    const next = clearHistory(s);
    expect(next.history).toEqual([]);
    expect(next.routines).toEqual(s.routines);
  });
});
