export type Ok<T> = { ok: true; data: T }
export type Err<E = any> = { ok: false; error: E }
export type Result<T, E = any> = Ok<T> | Err<E>

export const ok = <T>(data: T): Ok<T> => ({ ok: true, data })
export const err = <E>(error: E): Err<E> => ({ ok: false, error })
