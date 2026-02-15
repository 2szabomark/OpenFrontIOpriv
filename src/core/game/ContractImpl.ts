import { Player, Tick } from "./Game";
import { Contract, ContractTerms, ContractType } from "./Contract";

export class ContractImpl implements Contract {
  private active = true;

  constructor(
    private _id: number,
    private _party1: Player,
    private _party2: Player,
    private _terms: ContractTerms,
    private _createdAt: Tick,
  ) {}

  id(): number {
    return this._id;
  }

  party1(): Player {
    return this._party1;
  }

  party2(): Player {
    return this._party2;
  }

  terms(): ContractTerms {
    return this._terms;
  }

  createdAt(): Tick {
    return this._createdAt;
  }

  expiresAt(): Tick {
    return this._createdAt + this._terms.duration;
  }

  isActive(): boolean {
    return this.active;
  }

  isExpired(currentTick: Tick): boolean {
    return currentTick >= this.expiresAt();
  }

  executeTick(currentTick: Tick): void {
    if (!this.active || this.isExpired(currentTick)) {
      return;
    }

    // Check if both parties are still alive
    if (!this._party1.isAlive() || !this._party2.isAlive()) {
      this.expire();
      return;
    }

    switch (this._terms.type) {
      case ContractType.Trade:
        this.executeTrade();
        break;
      case ContractType.ResourceLease:
        this.executeResourceLease();
        break;
      case ContractType.NonAggression:
        // Non-aggression is passive - just prevents attacks
        break;
      case ContractType.Protection:
        // Protection is reactive - handled in attack logic
        break;
    }
  }

  private executeTrade(): void {
    // Exchange resources periodically
    if (this._terms.foodPerTick && this._terms.foodPerTick > 0) {
      // Party1 gives food to Party2
      const foodToTransfer = Math.min(this._party1.food(), this._terms.foodPerTick);
      if (foodToTransfer > 0) {
        this._party1.removeFood(foodToTransfer);
        this._party2.addFood(foodToTransfer);
      }
    }

    if (this._terms.oilPerTick && this._terms.oilPerTick > 0) {
      // Party1 gives oil to Party2
      const oilToTransfer = Math.min(this._party1.oil(), this._terms.oilPerTick);
      if (oilToTransfer > 0) {
        this._party1.removeOil(oilToTransfer);
        this._party2.addOil(oilToTransfer);
      }
    }

    // Periodic payment from Party2 to Party1
    if (this._terms.periodicPayment && this._terms.periodicPayment > 0n) {
      const payment = this._party2.removeGold(this._terms.periodicPayment);
      this._party1.addGold(payment);
    }
  }

  private executeResourceLease(): void {
    // Periodic payment from Party2 to Party1 for using resources
    if (this._terms.periodicPayment && this._terms.periodicPayment > 0n) {
      const payment = this._party2.removeGold(this._terms.periodicPayment);
      this._party1.addGold(payment);
    }
  }

  expire(): void {
    this.active = false;
  }
}
