import { Execution, Game, Player, PlayerID } from "../game/Game";
import { ContractTerms, ContractType } from "../game/Contract";

export class CreateContractExecution implements Execution {
  private active = false; // One-shot execution

  constructor(
    private party1: Player,
    private party2ID: PlayerID,
    private terms: ContractTerms,
  ) {}

  activeDuringSpawnPhase(): boolean {
    return true;
  }

  init(mg: Game, ticks: number): void {
    if (!mg.hasPlayer(this.party2ID)) {
      console.warn(`Party 2 player ${this.party2ID} not found`);
      return;
    }

    const party2 = mg.player(this.party2ID);
    mg.contractManager().createContract(this.party1, party2, this.terms, ticks);
  }

  tick(ticks: number): void {
    // One-shot execution, nothing to do
  }

  isActive(): boolean {
    return this.active;
  }
}
