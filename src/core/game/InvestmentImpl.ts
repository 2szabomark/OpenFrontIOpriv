import { Player, Tick } from "./Game";
import { GameImpl } from "./GameImpl";
import { Investment } from "./Investment";

export class InvestmentImpl implements Investment {
  private active = true;

  constructor(
    private _id: number,
    private _investor: Player,
    private _target: Player,
    private _investmentAmount: bigint,
    private _initialValue: number,
    private _createdAt: Tick,
    private mg: GameImpl,
  ) {}

  id(): number {
    return this._id;
  }

  investor(): Player {
    return this._investor;
  }

  target(): Player {
    return this._target;
  }

  investmentAmount(): bigint {
    return this._investmentAmount;
  }

  initialValue(): number {
    return this._initialValue;
  }

  createdAt(): Tick {
    return this._createdAt;
  }

  calculateReturn(currentTargetValue: number): bigint {
    // Return = (Current Value - Initial Value) / Initial Value * Investment Amount
    // This gives the profit/loss based on how the target's value changed

    if (this._initialValue === 0) {
      return 0n; // Avoid division by zero
    }

    const valueChange = currentTargetValue - this._initialValue;
    const returnRatio = valueChange / this._initialValue;
    const returnAmount = Number(this._investmentAmount) * returnRatio;

    return BigInt(Math.floor(returnAmount));
  }

  liquidate(): bigint {
    if (!this.active) {
      return 0n;
    }

    const currentValue = this.mg.stockMarket().calculatePlayerValue(this._target);
    const totalReturn = this._investmentAmount + this.calculateReturn(currentValue);

    this.delete();
    return totalReturn;
  }

  isActive(): boolean {
    return this.active;
  }

  delete(): void {
    this.active = false;
  }
}
