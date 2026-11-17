// Same live-JSON assignment/invalidation fixture used by Teamboard's tests.
export const live = (target) => new Proxy(target, {
  get: (t, k) => t[k] !== null && typeof t[k] === 'object' ? live(t[k]) : t[k],
  set: (t, k, v) => { gone(t[k]); t[k] = v !== null && typeof v === 'object' ? JSON.parse(JSON.stringify(v)) : v; return true },
  deleteProperty: (t, k) => { gone(t[k]); delete t[k]; return true },
})
function gone(value) {
  if (value === null || typeof value !== 'object') return
  for (const key of Object.keys(value)) delete value[key]
}
