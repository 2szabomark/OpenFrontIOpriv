import { Player, Tick } from "./Game";

export interface Investment {
  id(): number;
  investor(): Player;
  target(): Player;
  investmentAmount(): bigint; // Gold invested
  initialValue(): number; // Target's value at investment time
  createdAt(): Tick;

  // Calculate current return based on target's current value
  calculateReturn(currentTargetValue: number): bigint;

  // Sell the investment back
  liquidate(): bigint;

  isActive(): boolean;
  delete(): void;
}

export interface StockMarket {
  // Calculate a player's total value (for stock valuation)
  calculatePlayerValue(player: Player): number;

  // Invest in a player
  invest(investor: Player, target: Player, amount: bigint): Investment | null;

  // Get all investments for a player (as investor)
  getInvestments(investor: Player): Investment[];

  // Get all investments in a player (as target)
  getInvestmentsIn(target: Player): Investment[];

  // Calculate periodic dividends for all investments
  payDividends(tick: Tick): void;

  // Get player's share value
  getSharePrice(player: Player): number;

  // Liquidate an investment
  liquidateInvestment(investment: Investment): bigint;
}

export interface InvestmentUpdate {
  id: number;
  investorID: string;
  targetID: string;
  investmentAmount: bigint;
  initialValue: number;
  currentValue: number;
  currentReturn: bigint;
  createdAt: Tick;
}
