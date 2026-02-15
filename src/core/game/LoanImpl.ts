import { Player, Tick } from "./Game";
import { Loan } from "./CentralBank";

export class LoanImpl implements Loan {
  private active = true;
  private _remaining: bigint;
  private _missedPayments = 0;

  constructor(
    private _id: number,
    private _borrower: Player,
    private _principal: bigint,
    private _interestRate: number,
    private _createdAt: Tick,
  ) {
    this._remaining = _principal;
  }

  id(): number {
    return this._id;
  }

  borrower(): Player {
    return this._borrower;
  }

  principal(): bigint {
    return this._principal;
  }

  remaining(): bigint {
    return this._remaining;
  }

  interestRate(): number {
    return this._interestRate;
  }

  periodicPayment(): bigint {
    // 5% of remaining balance per tick + interest
    const basePayment = this._remaining / 20n; // 5%
    const interest = BigInt(
      Math.floor(Number(this._remaining) * this._interestRate),
    );
    return basePayment + interest;
  }

  createdAt(): Tick {
    return this._createdAt;
  }

  missedPayments(): number {
    return this._missedPayments;
  }

  makePayment(): bigint {
    if (!this.active || this._remaining <= 0n) {
      return 0n;
    }

    const payment = this.periodicPayment();
    const actualPayment = this._borrower.removeGold(payment);

    if (actualPayment > 0n) {
      this._remaining -= actualPayment;
      this._missedPayments = 0; // Reset missed payments on successful payment

      if (this._remaining <= 0n) {
        this._remaining = 0n;
        this.active = false;
      }
    } else {
      // Couldn't pay
      this.missPayment();
    }

    return actualPayment;
  }

  isInDefault(): boolean {
    return this._missedPayments >= 3; // Default after 3 consecutive missed payments
  }

  missPayment(): void {
    this._missedPayments++;
  }

  isActive(): boolean {
    return this.active && this._remaining > 0n;
  }

  payOff(): void {
    this._remaining = 0n;
    this.active = false;
  }
}
