import { Execution, Game } from "../game/Game";
import { GameUpdateType, MarketPriceData } from "../game/GameUpdates";

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

    // Generate market update for clients
    const marketData = this.mg.market().getAllMarketData();
    const prices: MarketPriceData[] = marketData.map((data) => ({
      resource: data.resource,
      price: data.price,
      supply: data.supply,
      demand: data.demand,
    }));

    const currentEvent = this.mg.market().getCurrentEvent();
    const lastEvent = currentEvent
      ? {
          resource: currentEvent.resource,
          eventType: currentEvent.type,
          multiplier: currentEvent.priceImpact,
        }
      : undefined;

    this.mg.addUpdate({
      type: GameUpdateType.MarketUpdate,
      prices,
      lastEvent,
    });
  }

  isActive(): boolean {
    return this.active;
  }
}
