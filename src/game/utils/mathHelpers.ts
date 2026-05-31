export function rotatedVelocity(
  ox: number,
  oy: number,
  tx: number,
  ty: number,
  speed: number,
  angleOffset = 0,
): { vx: number; vy: number } {
  const dx = tx - ox
  const dy = ty - oy
  const len = Math.sqrt(dx * dx + dy * dy) || 1
  const cos = Math.cos(angleOffset)
  const sin = Math.sin(angleOffset)
  return {
    vx: ((dx / len) * cos - (dy / len) * sin) * speed,
    vy: ((dx / len) * sin + (dy / len) * cos) * speed,
  }
}
