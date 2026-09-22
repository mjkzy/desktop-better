/**
 * The kind of a toast.
 *
 * - `progress`: an operation that is running. It stays until it is replaced.
 * - `success`: an operation that completed.
 * - `info`: a change that Desktop detected.
 */
export type ToastKind = 'progress' | 'success' | 'info'

/** A short message in the bottom right corner of the window */
export interface IToast {
  /** A toast with the same ID replaces this toast */
  readonly id: string
  readonly kind: ToastKind
  readonly message: string
}
