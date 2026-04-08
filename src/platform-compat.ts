function fillWithPseudoRandomValues(view: Uint8Array) {
  for (let i = 0; i < view.length; i += 1) {
    view[i] = Math.floor(Math.random() * 256)
  }
}

export function getRandomValuesCompat<T extends ArrayBufferView>(typedArray: T): T {
  if (globalThis.crypto?.getRandomValues) {
    return globalThis.crypto.getRandomValues(typedArray)
  }
  fillWithPseudoRandomValues(
    new Uint8Array(typedArray.buffer, typedArray.byteOffset, typedArray.byteLength)
  )
  return typedArray
}

function randomUuidFromBytes(bytes: Uint8Array) {
  // RFC4122 version 4 UUID bit masks
  bytes[6] = (bytes[6] & 0x0f) | 0x40
  bytes[8] = (bytes[8] & 0x3f) | 0x80

  const hex = [...bytes].map((byte) => byte.toString(16).padStart(2, '0')).join('')
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`
}

export function randomUuidCompat() {
  if (globalThis.crypto?.randomUUID) {
    return globalThis.crypto.randomUUID()
  }
  const bytes = getRandomValuesCompat(new Uint8Array(16))
  return randomUuidFromBytes(bytes)
}
