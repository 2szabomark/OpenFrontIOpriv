import { Game, MessageType, Player, Tick, UnitType } from "./Game";
import { CentralBank, GamePhase, Loan } from "./CentralBank";
import { LoanImpl } from "./LoanImpl";

export class CentralBankImpl implements CentralBank {
  private loans: Loan[] = [];
  private nextLoanID = 1;

  constructor(private mg: Game) {}

  getInterestRate(currentTick: Tick, totalTicks: Tick): number {
    // Interest rates based on game phase
    const phase = this.getGamePhase(currentTick, totalTicks);

    switch (phase) {
      case GamePhase.Early:
        return 0.02; // 2% - Easy money early game
      case GamePhase.Mid:
        return 0.05; // 5% - Standard rates
      case GamePhase.Late:
        return 0.08; // 8% - Expensive money late game
    }
  }

  private getGamePhase(currentTick: Tick, totalTicks: Tick): GamePhase {
    const progress = currentTick / totalTicks;
    if (progress < 0.33) return GamePhase.Early;
    if (progress < 0.66) return GamePhase.Mid;
    return GamePhase.Late;
  }

  calculateMaxLoan(player: Player): bigint {
    // Max loan = Territory size × 1000 gold
    return BigInt(player.numTilesOwned() * 1000);
  }

  requestLoan(player: Player, amount: bigint, currentTick: Tick): Loan | null {
    if (!player.isAlive()) {
      console.warn("Dead player cannot request loan");
      return null;
    }

    const maxLoan = this.calculateMaxLoan(player);
    if (amount > maxLoan) {
      console.warn(`Loan amount ${amount} exceeds max ${maxLoan}`);
      return null;
    }

    if (amount <= 0n) {
      console.warn("Loan amount must be positive");
      return null;
    }

    // Check if player already has too many loans
    const existingLoans = this.getLoans(player).filter((l) => l.isActive());
    if (existingLoans.length >= 3) {
      console.warn("Player already has maximum number of loans");
      return null;
    }

    // Give gold to player
    player.addGold(amount);

    // Create loan
    const interestRate = this.getInterestRate(currentTick, 10000); // Assume 10000 tick games
    const loan = new LoanImpl(
      this.nextLoanID++,
      player,
      amount,
      interestRate,
      currentTick,
    );

    this.loans.push(loan);

    this.mg.displayMessage(
      "economy.loan_granted",
      MessageType.INFO,
      player.id(),
      amount,
      { amount: Number(amount), rate: (interestRate * 100).toFixed(1) },
    );

    return loan;
  }

  getLoans(player: Player): Loan[] {
    return this.loans.filter((l) => l.isActive() && l.borrower() === player);
  }

  processLoans(currentTick: Tick): void {
    for (const loan of this.loans) {
      if (!loan.isActive()) {
        continue;
      }

      // Try to collect payment
      loan.makePayment();

      // Check for default
      if (loan.isInDefault()) {
        this.handleDefault(loan);
      }
    }

    // Clean up paid-off loans
    this.loans = this.loans.filter((l) => l.isActive());
  }

  handleDefault(loan: Loan): void {
    const player = loan.borrower();
    if (!player.isAlive()) {
      loan.payOff();
      return;
    }

    const missedPayments = loan.missedPayments();

    // Progressive penalties based on missed payments
    if (missedPayments === 3) {
      // First default: Reduce troops by 20%
      const troopReduction = Math.floor(player.troops() * 0.2);
      player.removeTroops(troopReduction);

      this.mg.displayMessage(
        "economy.loan_default_troops",
        MessageType.WARNING,
        player.id(),
        undefined,
        { troops: troopReduction },
      );
    } else if (missedPayments === 5) {
      // Second warning: Shut down random buildings
      const structures = player
        .units()
        .filter((u) => u.info().territoryBound && u.isActive());

      if (structures.length > 0) {
        // Shut down 25% of buildings
        const numToShutdown = Math.max(1, Math.floor(structures.length * 0.25));
        for (let i = 0; i < numToShutdown && i < structures.length; i++) {
          structures[i].delete();
        }

        this.mg.displayMessage(
          "economy.loan_default_buildings",
          MessageType.WARNING,
          player.id(),
          undefined,
          { count: numToShutdown },
        );
      }
    } else if (missedPayments >= 7) {
      // Final penalty: Economy failure - lose everything
      this.handleEconomyFailure(player);
      loan.payOff();
    }
  }

  private handleEconomyFailure(player: Player): void {
    this.mg.displayMessage(
      "economy.economy_failure",
      MessageType.ERROR,
      player.id(),
      undefined,
      { name: player.displayName() },
    );

    // Convert all territory to TerraNullius
    const tiles = Array.from(player.tiles());
    for (const tile of tiles) {
      this.mg.terraNullius().conquer(tile);
    }

    // Delete all units (except nukes in flight)
    player.units().forEach((u) => {
      if (
        u.type() !== UnitType.AtomBomb &&
        u.type() !== UnitType.HydrogenBomb &&
        u.type() !== UnitType.MIRV &&
        u.type() !== UnitType.MIRVWarhead
      ) {
        u.delete();
      }
    });

    // Remove all gold and troops
    player.removeGold(player.gold());
    player.setTroops(0);
  }

  getAllLoans(): Loan[] {
    return this.loans.filter((l) => l.isActive());
  }
}
