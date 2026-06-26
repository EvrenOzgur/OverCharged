export class AutoSpinStore {
    isActive = $state(false);
    remaining = $state(0);
    stopOnBonus = $state(true);
    isInfinite = $state(false);

    start(count: number, stopOnBonus: boolean) {
        this.isActive = true;
        this.isInfinite = count === -1;
        this.remaining = count;
        this.stopOnBonus = stopOnBonus;
    }

    stop() {
        this.isActive = false;
        this.remaining = 0;
        this.isInfinite = false;
    }

    decrement() {
        if (!this.isActive) return;

        if (!this.isInfinite) {
            if (this.remaining > 0) {
                this.remaining--;
            }
            if (this.remaining === 0) {
                this.stop();
            }
        }
    }
}

export const autoSpinStore = new AutoSpinStore();
