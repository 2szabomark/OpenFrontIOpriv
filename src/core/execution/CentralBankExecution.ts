import { Execution, Game } from "../game/Game";

export class CentralBankExecution implements Execution {
  private active = true;
  private mg: Game | null = null;

  constructor() {}

  activeDuringSpawnPhase(): boolean {
    return true; // Central bank operates during spawn phase
  }

  init(mg: Game, ticks: number): void {
    this.mg = mg;
  }

  tick(ticks: number): void {
    if (!this.mg) {
      return;
    }

    // Process all loans (collect payments, handle defaults)
    this.mg.centralBank().processLoans(ticks);
  }

  isActive(): boolean {
    return this.active;
  }
}
