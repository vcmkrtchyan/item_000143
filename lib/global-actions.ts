// Global actions that can be accessed from anywhere
let restoreActivityFn: (() => boolean) | null = null

export const globalActions = {
  setRestoreActivityFn: (fn: () => boolean) => {
    restoreActivityFn = fn
  },

  restoreActivity: () => {
    console.log("Global restore activity called")
    if (restoreActivityFn) {
      return restoreActivityFn()
    }
    return false
  },
}

