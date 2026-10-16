// High-performance, zero-allocation synchronous bus for camera heading and compass updates
type HeadingListener = (headingDeg: number) => void;

class CompassBus {
  private listeners: HeadingListener[] = [];
  private currentHeading: number = 0;

  public subscribe(listener: HeadingListener): () => void {
    this.listeners.push(listener);
    // Synchronously send initial value to newly subscribed listener
    try {
      listener(this.currentHeading);
    } catch (e) {
      console.error('Error in compass listener initialization:', e);
    }

    return () => {
      const idx = this.listeners.indexOf(listener);
      if (idx !== -1) {
        this.listeners.splice(idx, 1);
      }
    };
  }

  public emit(headingDeg: number): void {
    this.currentHeading = headingDeg;
    const len = this.listeners.length;
    for (let i = 0; i < len; i++) {
      try {
        this.listeners[i](headingDeg);
      } catch (e) {
        console.error('Error in compass listener:', e);
      }
    }
  }

  public getHeading(): number {
    return this.currentHeading;
  }
}

export const compassBus = new CompassBus();
