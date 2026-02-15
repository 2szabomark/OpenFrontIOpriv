import { Execution, Game, Player, PlayerID } from "../game/Game";

export class InvestExecution implements Execution {
  private active = false; // One-shot execution

  constructor(
    private investor: Player,
    private targetID: PlayerID,
    private amount: bigint,
  ) {}

  activeDuringSpawnPhase(): boolean {
    return true;
  }

  init(mg: Game, ticks: number): void {
    if (!mg.hasPlayer(this.targetID)) {
      console.warn(`Target player ${this.targetID} not found`);
      return;
    }

    const target = mg.player(this.targetID);
    mg.stockMarket().invest(this.investor, target, this.amount);
  }

  tick(ticks: number): void {
    // One-shot execution, nothing to do
  }

  isActive(): boolean {
    return this.active;
  }
}
