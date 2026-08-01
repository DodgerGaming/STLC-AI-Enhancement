export function formatPeso(amount, { decimals = 2 } = {}) {
  const value = Number(amount) || 0
  return `₱${value.toLocaleString('en-PH', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })}`
}

export function formatNumber(amount, decimals = 0) {
  const value = Number(amount) || 0
  return value.toLocaleString('en-PH', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })
}
