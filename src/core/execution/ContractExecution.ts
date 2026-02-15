import { Execution, Game } from "../game/Game";

export class ContractExecution implements Execution {
  private active = true;
  private mg: Game | null = null;

  constructor() {}

  activeDuringSpawnPhase(): boolean {
    return true; // Contracts operate during spawn phase
  }

  init(mg: Game, ticks: number): void {
    this.mg = mg;
  }

  tick(ticks: number): void {
    if (!this.mg) {
      return;
    }

    // Execute all active contracts
    this.mg.contractManager().executeContracts(ticks);

    // Clean up expired contracts
    this.mg.contractManager().cleanupExpired(ticks);
  }

  isActive(): boolean {
    return this.active;
  }
}
