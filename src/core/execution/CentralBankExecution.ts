import { Execution, Game, Player } from "../game/Game";
import { GameUpdateType, LoanData } from "../game/GameUpdates";

export class CentralBankExecution implements Execution {
  private active = true;
  private mg: Game | null = null;
  private lastLoanCount = 0;

  constructor() {}

  activeDuringSpawnPhase(): boolean {
    return true; // Central bank operates during spawn phase
  }

  init(mg: Game, ticks: number): void {
    this.mg = mg;
    this.lastLoanCount = this.mg.centralBank().getAllLoans().length;
  }

  tick(ticks: number): void {
    if (!this.mg) {
      return;
    }

    // Process all loans (collect payments, handle defaults)
    this.mg.centralBank().processLoans(ticks);

    // Check if loan count changed (new loan or paid off)
    const currentLoanCount = this.mg.centralBank().getAllLoans().length;
    const loansChanged = currentLoanCount !== this.lastLoanCount;
    this.lastLoanCount = currentLoanCount;

    // Generate loan updates for players with loans when loans change
    if (loansChanged) {
      const playersWithLoans = new Set<Player>();
      for (const loan of this.mg.centralBank().getAllLoans()) {
        playersWithLoans.add(loan.borrower());
      }

      for (const player of playersWithLoans) {
        const loans = this.mg.centralBank().getLoans(player);
        const loanData: LoanData[] = loans.map((loan) => ({
          id: loan.id(),
          borrowerID: loan.borrower().id(),
          principal: loan.principal(),
          remainingBalance: loan.remaining(),
          interestRate: loan.interestRate(),
          createdAtTick: loan.createdAt(),
          missedPayments: loan.missedPayments(),
          isDefaulted: loan.isInDefault(),
        }));

        const currentInterestRate = this.mg.centralBank().getInterestRate(
          ticks,
          this.mg.config().winningConditionTicks(),
        );
        const maxLoanAmount = this.mg.centralBank().calculateMaxLoan(player);

        this.mg.addUpdate({
          type: GameUpdateType.LoanUpdate,
          playerID: player.id(),
          loans: loanData,
          currentInterestRate,
          maxLoanAmount,
        });
      }
    }
  }

  isActive(): boolean {
    return this.active;
  }
}
