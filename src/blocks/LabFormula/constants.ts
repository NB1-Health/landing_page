// Fixed small icons keyed by a closed set of source types — matching the mockup's own
// fixed ICON map, not per-job CMS content (every "sample" job always gets the same
// droplet icon, every "quest" job the same questionnaire icon).

export const SOURCE_ICONS: Record<'sample' | 'quest', string> = {
  sample:
    '<svg viewBox="0 0 12 12" fill="currentColor" aria-hidden="true"><path d="M6 1c2 2.4 3 4 3 5.4A3 3 0 0 1 3 6.4C3 5 4 3.4 6 1z"/></svg>',
  quest:
    '<svg viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="1.3" aria-hidden="true"><rect x="2" y="1.5" width="8" height="9" rx="1.4"/><line x1="4" y1="4.3" x2="8" y2="4.3"/><line x1="4" y1="6.3" x2="8" y2="6.3"/><line x1="4" y1="8.3" x2="6.5" y2="8.3"/></svg>',
}
