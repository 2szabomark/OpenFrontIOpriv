import { Execution, Game, Player } from "../game/Game";
import { GameUpdateType, ContractData } from "../game/GameUpdates";

export class ContractExecution implements Execution {
  private active = true;
  private mg: Game | null = null;
  private lastContractCount = 0;

  constructor() {}

  activeDuringSpawnPhase(): boolean {
    return true; // Contracts operate during spawn phase
  }

  init(mg: Game, ticks: number): void {
    this.mg = mg;
    this.lastContractCount = this.mg.contractManager().getActiveContracts().length;
  }

  tick(ticks: number): void {
    if (!this.mg) {
      return;
    }

    // Execute all active contracts
    this.mg.contractManager().executeContracts(ticks);

    // Clean up expired contracts
    this.mg.contractManager().cleanupExpired(ticks);

    // Check if contract count changed (new contract or expired)
    const currentContractCount = this.mg.contractManager().getActiveContracts().length;
    const contractsChanged = currentContractCount !== this.lastContractCount;
    this.lastContractCount = currentContractCount;

    // Generate contract updates for affected players when contracts change
    if (contractsChanged) {
      const playersWithContracts = new Set<Player>();
      for (const contract of this.mg.contractManager().getActiveContracts()) {
        playersWithContracts.add(contract.party1());
        playersWithContracts.add(contract.party2());
      }

      for (const player of playersWithContracts) {
        const contracts = this.mg.contractManager().getContractsForPlayer(player);
        const contractData: ContractData[] = contracts.map((contract) => ({
          id: contract.id(),
          party1ID: contract.party1().id(),
          party2ID: contract.party2().id(),
          contractType: contract.terms().type,
          createdAtTick: contract.createdAt(),
          expiresAtTick: contract.expiresAt(),
          upfrontPayment: contract.terms().upfrontPayment,
          periodicPayment: contract.terms().periodicPayment,
          periodicPaymentInterval: contract.terms().periodicPaymentInterval,
          isActive: contract.isActive(),
        }));

        this.mg.addUpdate({
          type: GameUpdateType.ContractUpdate,
          playerID: player.id(),
          contracts: contractData,
        });
      }
    }
  }

  isActive(): boolean {
    return this.active;
  }
}
