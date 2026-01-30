export function hexToRgba(hex: string, alpha: number) {
  const clean = hex.replace('#', '')

  // Soporta #RGB y #RRGGBB
  const normalized =
    clean.length === 3
      ? clean.split('').map((c) => c + c).join('')
      : clean

  if (normalized.length !== 6) {
    // fallback seguro
    return `rgba(0, 0, 0, ${alpha})`
  }

  const r = parseInt(normalized.substring(0, 2), 16)
  const g = parseInt(normalized.substring(2, 4), 16)
  const b = parseInt(normalized.substring(4, 6), 16)

  const a = Math.max(0, Math.min(1, alpha))

  return `rgba(${r}, ${g}, ${b}, ${a})`
}
