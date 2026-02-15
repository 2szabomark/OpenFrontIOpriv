import { Execution, Game } from "../game/Game";

export class StockMarketExecution implements Execution {
  private active = true;
  private mg: Game | null = null;

  constructor() {}

  activeDuringSpawnPhase(): boolean {
    return true; // Stock market operates during spawn phase
  }

  init(mg: Game, ticks: number): void {
    this.mg = mg;
  }

  tick(ticks: number): void {
    if (!this.mg) {
      return;
    }

    // Pay dividends periodically
    this.mg.stockMarket().payDividends(ticks);
  }

  isActive(): boolean {
    return this.active;
  }
}
