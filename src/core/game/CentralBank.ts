import { Player, Tick } from "./Game";

export interface Loan {
  id(): number;
  borrower(): Player;
  principal(): bigint; // Original loan amount
  remaining(): bigint; // Amount still owed
  interestRate(): number; // Decimal (e.g., 0.05 = 5%)
  periodicPayment(): bigint; // Payment per tick (5% of remaining)
  createdAt(): Tick;
  missedPayments(): number; // Consecutive missed payments

  // Make payment (returns actual amount paid)
  makePayment(): bigint;

  // Check if loan is in default
  isInDefault(): boolean;

  // Mark payment as missed
  missPayment(): void;

  isActive(): boolean;
  payOff(): void;
}

export interface CentralBank {
  // Get current interest rate (changes by game phase)
  getInterestRate(currentTick: Tick, totalTicks: Tick): number;

  // Request a loan (max based on territory size)
  requestLoan(player: Player, amount: bigint, currentTick: Tick): Loan | null;

  // Get all active loans for a player
  getLoans(player: Player): Loan[];

  // Process all loans (collect payments, handle defaults)
  processLoans(currentTick: Tick): void;

  // Handle loan default consequences
  handleDefault(loan: Loan): void;

  // Calculate max loan amount for a player
  calculateMaxLoan(player: Player): bigint;

  // Get all active loans
  getAllLoans(): Loan[];
}

export interface LoanUpdate {
  id: number;
  borrowerID: string;
  principal: bigint;
  remaining: bigint;
  interestRate: number;
  periodicPayment: bigint;
  createdAt: Tick;
  missedPayments: number;
  isInDefault: boolean;
}

export enum GamePhase {
  Early = "Early", // Ticks 0-33%
  Mid = "Mid", // Ticks 33%-66%
  Late = "Late", // Ticks 66%-100%
}
