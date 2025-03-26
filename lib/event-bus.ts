// Simple event bus for cross-component communication
type EventCallback = (...args: any[]) => void

class EventBus {
  private events: Record<string, EventCallback[]> = {}

  on(event: string, callback: EventCallback) {
    if (!this.events[event]) {
      this.events[event] = []
    }
    this.events[event].push(callback)
  }

  off(event: string, callback: EventCallback) {
    if (!this.events[event]) return
    this.events[event] = this.events[event].filter((cb) => cb !== callback)
  }

  emit(event: string, ...args: any[]) {
    if (!this.events[event]) return
    this.events[event].forEach((callback) => {
      try {
        callback(...args)
      } catch (e) {
        console.error(`Error in event handler for ${event}:`, e)
      }
    })
  }
}

// Create a singleton instance
export const eventBus = new EventBus()

