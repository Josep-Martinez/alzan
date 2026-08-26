export const COMPACT_PREVIEW_ACTION_BREAKPOINT = 600;

export const isCompactPreviewLayout = (viewportWidth: number): boolean =>
  viewportWidth < COMPACT_PREVIEW_ACTION_BREAKPOINT;
