// A live JSON file as gugu's behaves to a program: an object assigned into it is copied in (writing to the object
// afterwards changes nothing in the file), and an object replaced or deleted in it is gone (reading it afterwards
// gives nothing).
export const live = (target) => new Proxy(target, {
  get: (t, k) => (t[k] !== null && typeof t[k] === 'object' ? live(t[k]) : t[k]),
  set: (t, k, v) => { gone(t[k]); t[k] = v !== null && typeof v === 'object' ? JSON.parse(JSON.stringify(v)) : v; return true },
  deleteProperty: (t, k) => { gone(t[k]); delete t[k]; return true },
})

function gone(value) {
  if (value === null || typeof value !== 'object') return
  for (const key of Object.keys(value)) delete value[key]
}
