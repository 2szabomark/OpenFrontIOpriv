import { Player, Tick } from "./Game";
import { Contract, ContractManager, ContractTerms, ContractType } from "./Contract";
import { ContractImpl } from "./ContractImpl";

export class ContractManagerImpl implements ContractManager {
  private contracts: Contract[] = [];
  private nextContractID = 1;

  constructor() {}

  createContract(
    party1: Player,
    party2: Player,
    terms: ContractTerms,
    currentTick: Tick,
  ): Contract | null {
    if (party1 === party2) {
      console.warn("Cannot create contract with yourself");
      return null;
    }

    if (!party1.isAlive() || !party2.isAlive()) {
      console.warn("Cannot create contract with dead player");
      return null;
    }

    // Party2 pays upfront gold to Party1
    if (terms.goldPayment > 0n) {
      if (party2.gold() < terms.goldPayment) {
        console.warn("Insufficient gold for contract");
        return null;
      }
      const payment = party2.removeGold(terms.goldPayment);
      party1.addGold(payment);
    }

    // Create contract
    const contract = new ContractImpl(
      this.nextContractID++,
      party1,
      party2,
      terms,
      currentTick,
    );

    this.contracts.push(contract);
    return contract;
  }

  getActiveContracts(): Contract[] {
    return this.contracts.filter((c) => c.isActive());
  }

  getContractsForPlayer(player: Player): Contract[] {
    return this.contracts.filter(
      (c) =>
        c.isActive() && (c.party1() === player || c.party2() === player),
    );
  }

  hasNonAggressionPact(player1: Player, player2: Player): boolean {
    return this.contracts.some(
      (c) =>
        c.isActive() &&
        c.terms().type === ContractType.NonAggression &&
        ((c.party1() === player1 && c.party2() === player2) ||
          (c.party1() === player2 && c.party2() === player1)),
    );
  }

  canUseRailroads(user: Player, owner: Player): boolean {
    return this.contracts.some(
      (c) =>
        c.isActive() &&
        c.terms().type === ContractType.ResourceLease &&
        c.terms().allowRailroadUse === true &&
        c.party1() === owner &&
        c.party2() === user,
    );
  }

  canUsePorts(user: Player, owner: Player): boolean {
    return this.contracts.some(
      (c) =>
        c.isActive() &&
        c.terms().type === ContractType.ResourceLease &&
        c.terms().allowPortUse === true &&
        c.party1() === owner &&
        c.party2() === user,
    );
  }

  executeContracts(currentTick: Tick): void {
    for (const contract of this.contracts) {
      if (contract.isActive()) {
        contract.executeTick(currentTick);
      }
    }
  }

  cleanupExpired(currentTick: Tick): void {
    for (const contract of this.contracts) {
      if (contract.isActive() && contract.isExpired(currentTick)) {
        contract.expire();
      }
    }

    // Remove expired contracts from list
    this.contracts = this.contracts.filter((c) => c.isActive());
  }
}
