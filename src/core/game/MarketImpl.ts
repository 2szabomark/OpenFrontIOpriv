import { PseudoRandom } from "../PseudoRandom";
import { Game, Player } from "./Game";
import { Market, MarketEvent, MarketPrice, ResourceType } from "./Market";

export class MarketImpl implements Market {
  private foodPrice: number = 100; // Base price: 100 gold per food
  private oilPrice: number = 150; // Base price: 150 gold per oil

  private foodSupply: number = 0;
  private oilSupply: number = 0;

  private foodDemand: number = 0;
  private oilDemand: number = 0;

  private lastFoodSupply: number = 0;
  private lastOilSupply: number = 0;

  private currentEvent: MarketEvent | null = null;
  private random: PseudoRandom;

  private readonly BASE_FOOD_PRICE = 100;
  private readonly BASE_OIL_PRICE = 150;
  private readonly TRANSACTION_FEE = 0.05; // 5% fee
  private readonly MAX_TRADE_VOLUME_PER_TICK = 100; // Max units traded per player per tick

  private playerLastTrade = new Map<string, { tick: number; volume: number }>();

  constructor(seed: number) {
    this.random = new PseudoRandom(seed);
  }

  getPrice(resource: ResourceType): number {
    let basePrice = resource === ResourceType.Food ? this.foodPrice : this.oilPrice;

    // Apply event multiplier if active
    if (this.currentEvent && this.currentEvent.resource === resource) {
      basePrice *= this.currentEvent.priceImpact;
    }

    return Math.floor(basePrice);
  }

  getMarketData(resource: ResourceType): MarketPrice {
    if (resource === ResourceType.Food) {
      return {
        resource: ResourceType.Food,
        price: this.getPrice(ResourceType.Food),
        supply: this.foodSupply,
        demand: this.foodDemand,
      };
    } else {
      return {
        resource: ResourceType.Oil,
        price: this.getPrice(ResourceType.Oil),
        supply: this.oilSupply,
        demand: this.oilDemand,
      };
    }
  }

  buy(player: Player, resource: ResourceType, amount: number): number {
    // Check trade volume limits
    const tick = Date.now(); // In real game, use game.ticks()
    const lastTrade = this.playerLastTrade.get(player.id());
    if (lastTrade && lastTrade.tick === tick) {
      if (lastTrade.volume + amount > this.MAX_TRADE_VOLUME_PER_TICK) {
        amount = Math.max(0, this.MAX_TRADE_VOLUME_PER_TICK - lastTrade.volume);
      }
    }

    if (amount <= 0) return 0;

    const price = this.getPrice(resource);
    const totalCost = BigInt(Math.floor(price * amount * (1 + this.TRANSACTION_FEE)));

    // Check if player has enough gold
    if (player.gold() < totalCost) {
      // Buy what they can afford
      amount = Math.floor(Number(player.gold()) / (price * (1 + this.TRANSACTION_FEE)));
      if (amount <= 0) return 0;
    }

    const actualCost = BigInt(Math.floor(price * amount * (1 + this.TRANSACTION_FEE)));
    player.removeGold(actualCost);

    if (resource === ResourceType.Food) {
      player.addFood(amount);
      this.foodDemand += amount;
    } else {
      player.addOil(amount);
      this.oilDemand += amount;
    }

    // Track trade volume
    this.playerLastTrade.set(player.id(), {
      tick,
      volume: (lastTrade?.volume || 0) + amount,
    });

    return amount;
  }

  sell(player: Player, resource: ResourceType, amount: number): bigint {
    // Check trade volume limits
    const tick = Date.now(); // In real game, use game.ticks()
    const lastTrade = this.playerLastTrade.get(player.id());
    if (lastTrade && lastTrade.tick === tick) {
      if (lastTrade.volume + amount > this.MAX_TRADE_VOLUME_PER_TICK) {
        amount = Math.max(0, this.MAX_TRADE_VOLUME_PER_TICK - lastTrade.volume);
      }
    }

    if (amount <= 0) return 0n;

    // Check if player has enough resources
    const available = resource === ResourceType.Food ? player.food() : player.oil();
    amount = Math.min(amount, available);

    if (amount <= 0) return 0n;

    const price = this.getPrice(resource);
    const revenue = BigInt(Math.floor(price * amount * (1 - this.TRANSACTION_FEE)));

    if (resource === ResourceType.Food) {
      player.removeFood(amount);
      this.foodSupply += amount;
    } else {
      player.removeOil(amount);
      this.oilSupply += amount;
    }

    player.addGold(revenue);

    // Track trade volume
    this.playerLastTrade.set(player.id(), {
      tick,
      volume: (lastTrade?.volume || 0) + amount,
    });

    return revenue;
  }

  updatePrices(game: Game): void {
    // Calculate total production (supply)
    this.lastFoodSupply = this.foodSupply;
    this.lastOilSupply = this.oilSupply;

    this.foodSupply = 0;
    this.oilSupply = 0;

    for (const player of game.allPlayers()) {
      this.foodSupply += player.food();
      this.oilSupply += player.oil();
    }

    // Calculate supply/demand ratio and adjust prices
    this.adjustPrice(ResourceType.Food);
    this.adjustPrice(ResourceType.Oil);

    // Reset demand counters
    this.foodDemand = 0;
    this.oilDemand = 0;

    // Decay event duration
    if (this.currentEvent) {
      this.currentEvent.duration--;
      if (this.currentEvent.duration <= 0) {
        this.currentEvent = null;
      }
    }

    // Random chance for market event (5% per tick)
    if (!this.currentEvent && this.random.next() < 0.05) {
      this.triggerRandomEvent();
    }
  }

  private adjustPrice(resource: ResourceType): void {
    const supply = resource === ResourceType.Food ? this.foodSupply : this.oilSupply;
    const lastSupply = resource === ResourceType.Food ? this.lastFoodSupply : this.lastOilSupply;
    const demand = resource === ResourceType.Food ? this.foodDemand : this.oilDemand;

    const basePrice = resource === ResourceType.Food ? this.BASE_FOOD_PRICE : this.BASE_OIL_PRICE;

    // Calculate supply/demand ratio
    let priceMultiplier = 1.0;

    if (demand > 0 && supply > 0) {
      const ratio = demand / supply;
      // High demand vs low supply = higher prices
      // Low demand vs high supply = lower prices
      priceMultiplier = 0.5 + ratio * 0.5; // Range: 0.5x to 2.0x
    } else if (demand > 0 && supply === 0) {
      priceMultiplier = 2.0; // Extreme shortage
    } else if (supply > lastSupply * 1.5) {
      priceMultiplier = 0.7; // Oversupply
    }

    // Clamp to ±50% change per tick for stability
    priceMultiplier = Math.max(0.5, Math.min(1.5, priceMultiplier));

    // Update price with smoothing
    const currentPrice = resource === ResourceType.Food ? this.foodPrice : this.oilPrice;
    const targetPrice = basePrice * priceMultiplier;
    const newPrice = currentPrice * 0.9 + targetPrice * 0.1; // 10% adjustment per tick

    if (resource === ResourceType.Food) {
      this.foodPrice = Math.max(50, Math.min(300, newPrice)); // Clamp to 50-300 gold
    } else {
      this.oilPrice = Math.max(75, Math.min(450, newPrice)); // Clamp to 75-450 gold
    }
  }

  triggerRandomEvent(): void {
    const isShortage = this.random.next() < 0.5;
    const resource = this.random.next() < 0.5 ? ResourceType.Food : ResourceType.Oil;

    if (isShortage) {
      this.currentEvent = {
        type: "shortage",
        resource,
        message: `${resource} shortage! Prices surge!`,
        priceImpact: 1.5 + this.random.next() * 0.5, // 1.5x to 2.0x
        duration: 10 + Math.floor(this.random.next() * 20), // 10-30 ticks
      };
    } else {
      this.currentEvent = {
        type: "boom",
        resource,
        message: `${resource} boom! Prices drop!`,
        priceImpact: 0.5 + this.random.next() * 0.2, // 0.5x to 0.7x
        duration: 10 + Math.floor(this.random.next() * 20), // 10-30 ticks
      };
    }
  }

  getAllMarketData(): MarketPrice[] {
    return [
      this.getMarketData(ResourceType.Food),
      this.getMarketData(ResourceType.Oil),
    ];
  }

  getCurrentEvent(): MarketEvent | null {
    return this.currentEvent;
  }
}
