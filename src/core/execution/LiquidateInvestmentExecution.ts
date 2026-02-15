import { Execution, Game, Player } from "../game/Game";

export class LiquidateInvestmentExecution implements Execution {
  private active = false; // One-shot execution

  constructor(
    private player: Player,
    private investmentID: number,
  ) {}

  activeDuringSpawnPhase(): boolean {
    return true;
  }

  init(mg: Game, ticks: number): void {
    const investments = mg.stockMarket().getInvestments(this.player);
    const investment = investments.find((inv) => inv.id() === this.investmentID);

    if (!investment) {
      console.warn(`Investment ${this.investmentID} not found`);
      return;
    }

    mg.stockMarket().liquidateInvestment(investment);
  }

  tick(ticks: number): void {
    // One-shot execution, nothing to do
  }

  isActive(): boolean {
    return this.active;
  }
}
