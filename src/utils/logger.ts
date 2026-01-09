export function getErrorMessage(err: unknown): string {
    if (!err) return 'Ocurrió un error.'
    if (typeof err === 'string') return err
    if (err instanceof Error) return err.message
    try {
      return JSON.stringify(err)
    } catch {
      return 'Ocurrió un error.'
    }
  }
  
  export function logError(context: string, err: unknown, extra?: Record<string, any>) {
    if (__DEV__) {
      // eslint-disable-next-line no-console
      console.error(`[${context}]`, err, extra ?? {})
    }
  }
  
  export function logInfo(context: string, extra?: Record<string, any>) {
    if (__DEV__) {
      // eslint-disable-next-line no-console
      console.log(`[${context}]`, extra ?? {})
    }
  }  