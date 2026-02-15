import { Execution, Game, Player } from "../game/Game";

export class RequestLoanExecution implements Execution {
  private active = false; // One-shot execution

  constructor(
    private player: Player,
    private amount: bigint,
  ) {}

  activeDuringSpawnPhase(): boolean {
    return true;
  }

  init(mg: Game, ticks: number): void {
    mg.centralBank().requestLoan(this.player, this.amount, ticks);
  }

  tick(ticks: number): void {
    // One-shot execution, nothing to do
  }

  isActive(): boolean {
    return this.active;
  }
}
