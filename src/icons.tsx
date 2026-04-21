// Tiny stroked icons for Simple Intervals.
import type { SVGProps } from "react";

type P = SVGProps<SVGSVGElement>;

export const Icon = {
  Plus: (p: P) => (
    <svg className="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" {...p}>
      <path d="M12 5v14M5 12h14" />
    </svg>
  ),
  Minus: (p: P) => (
    <svg className="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" {...p}>
      <path d="M5 12h14" />
    </svg>
  ),
  Play: (p: P) => (
    <svg className="icon" viewBox="0 0 24 24" fill="currentColor" stroke="none" {...p}>
      <path d="M8 5.5v13a.5.5 0 0 0 .77.42l10.4-6.5a.5.5 0 0 0 0-.85L8.77 5.08A.5.5 0 0 0 8 5.5z" />
    </svg>
  ),
  Pause: (p: P) => (
    <svg className="icon" viewBox="0 0 24 24" fill="currentColor" stroke="none" {...p}>
      <rect x="6" y="5" width="4" height="14" rx="1.2" />
      <rect x="14" y="5" width="4" height="14" rx="1.2" />
    </svg>
  ),
  Skip: (p: P) => (
    <svg className="icon" viewBox="0 0 24 24" fill="currentColor" stroke="none" {...p}>
      <path d="M5 5.5v13a.5.5 0 0 0 .77.42l9-5.5a.5.5 0 0 0 0-.85l-9-5.5A.5.5 0 0 0 5 5.5z" />
      <rect x="17" y="5" width="2.5" height="14" rx="1" />
    </svg>
  ),
  Prev: (p: P) => (
    <svg className="icon" viewBox="0 0 24 24" fill="currentColor" stroke="none" {...p}>
      <path d="M19 5.5v13a.5.5 0 0 1-.77.42l-9-5.5a.5.5 0 0 1 0-.85l9-5.5A.5.5 0 0 1 19 5.5z" />
      <rect x="4.5" y="5" width="2.5" height="14" rx="1" />
    </svg>
  ),
  Restart: (p: P) => (
    <svg className="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" {...p}>
      <path d="M3 12a9 9 0 1 0 3-6.7" />
      <path d="M3 4v5h5" />
    </svg>
  ),
  X: (p: P) => (
    <svg className="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" {...p}>
      <path d="M6 6l12 12M18 6 6 18" />
    </svg>
  ),
  Back: (p: P) => (
    <svg className="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" {...p}>
      <path d="M15 18l-6-6 6-6" />
    </svg>
  ),
  Trash: (p: P) => (
    <svg className="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" {...p}>
      <path d="M3 6h18" />
      <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
      <path d="M6 6l1 14a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-14" />
    </svg>
  ),
  History: (p: P) => (
    <svg className="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" {...p}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </svg>
  ),
  Settings: (p: P) => (
    <svg className="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" {...p}>
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 0 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 0 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 0 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 0 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z" />
    </svg>
  ),
  Check: (p: P) => (
    <svg className="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" {...p}>
      <path d="M20 6L9 17l-5-5" />
    </svg>
  ),
};
