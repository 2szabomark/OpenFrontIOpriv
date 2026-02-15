import { Food, Game, Oil, Player } from "./Game";

export enum ResourceType {
  Food = "Food",
  Oil = "Oil",
}

export interface MarketPrice {
  resource: ResourceType;
  price: number; // Price in gold per unit
  supply: number; // Total available in market
  demand: number; // Total consumed last tick
}

export interface Market {
  // Get current price for a resource
  getPrice(resource: ResourceType): number;

  // Get market data for a resource
  getMarketData(resource: ResourceType): MarketPrice;

  // Buy resources (returns actual amount bought)
  buy(player: Player, resource: ResourceType, amount: number): number;

  // Sell resources (returns actual gold received)
  sell(player: Player, resource: ResourceType, amount: number): bigint;

  // Update market prices based on supply/demand (called each tick)
  updatePrices(game: Game): void;

  // Trigger market events (shortages, booms)
  triggerRandomEvent(): void;

  // Get all market data for UI
  getAllMarketData(): MarketPrice[];
}

export interface MarketUpdate {
  food: MarketPrice;
  oil: MarketPrice;
  lastEvent?: MarketEvent;
}

export interface MarketEvent {
  type: "shortage" | "boom";
  resource: ResourceType;
  message: string;
  priceImpact: number; // Multiplier (e.g., 1.5 for +50%, 0.7 for -30%)
  duration: number; // Ticks remaining
}
