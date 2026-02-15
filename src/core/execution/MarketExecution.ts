import { Execution, Game } from "../game/Game";

export class MarketExecution implements Execution {
  private active = true;
  private mg: Game | null = null;

  constructor() {}

  activeDuringSpawnPhase(): boolean {
    return true; // Market operates during spawn phase
  }

  init(mg: Game, ticks: number): void {
    this.mg = mg;
  }

  tick(ticks: number): void {
    if (!this.mg) {
      return;
    }

    // Update market prices based on supply and demand
    this.mg.market().updatePrices(this.mg);
  }

  isActive(): boolean {
    return this.active;
  }
}
