// The frame around a goal while it's being dragged up or down. Each piece of the row draws its own edges
// (drawn inside it, so nothing shifts), and together they make one box around the name and the week:
// the name draws left, top and bottom; each day top and bottom; the last day the right edge too.
const FRAME = 'var(--color-primary)'
export const frameEdges = (edges: { left?: boolean; right?: boolean }) =>
  [
    `inset 0 2px 0 ${FRAME}`,
    `inset 0 -2px 0 ${FRAME}`,
    edges.left ? `inset 2px 0 0 ${FRAME}` : '',
    edges.right ? `inset -2px 0 0 ${FRAME}` : '',
  ]
    .filter(Boolean)
    .join(', ')
