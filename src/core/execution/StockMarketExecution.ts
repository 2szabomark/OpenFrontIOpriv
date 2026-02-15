import { Execution, Game, Player } from "../game/Game";
import { GameUpdateType, InvestmentData } from "../game/GameUpdates";

export class StockMarketExecution implements Execution {
  private active = true;
  private mg: Game | null = null;
  private lastDividendTick = 0;
  private readonly DIVIDEND_INTERVAL = 50;
  private readonly DIVIDEND_RATE = 0.02;

  constructor() {}

  activeDuringSpawnPhase(): boolean {
    return true; // Stock market operates during spawn phase
  }

  init(mg: Game, ticks: number): void {
    this.mg = mg;
  }

  tick(ticks: number): void {
    if (!this.mg) {
      return;
    }

    // Track if dividends were paid this tick
    const shouldPayDividends =
      ticks - this.lastDividendTick >= this.DIVIDEND_INTERVAL;

    // Pay dividends periodically
    this.mg.stockMarket().payDividends(ticks);

    // If dividends were paid, generate investment updates for all players
    if (shouldPayDividends) {
      this.lastDividendTick = ticks;

      // Generate InvestmentUpdate for each player with investments
      for (const player of this.mg.players()) {
        const investments = this.mg.stockMarket().getInvestments(player);
        if (investments.length > 0) {
          const investmentData: InvestmentData[] = investments.map((inv) => {
            const currentValue = this.mg!.stockMarket().calculatePlayerValue(
              inv.target(),
            );
            return {
              id: inv.id(),
              investorID: inv.investor().id(),
              targetID: inv.target().id(),
              principal: inv.investmentAmount(),
              createdAtTick: inv.createdAt(),
              currentValue: BigInt(currentValue),
              returns: inv.calculateReturn(currentValue),
            };
          });

          const totalDividends = BigInt(
            Math.floor(
              investments.reduce(
                (sum, inv) => sum + Number(inv.investmentAmount()),
                0,
              ) * this.DIVIDEND_RATE,
            ),
          );

          this.mg.addUpdate({
            type: GameUpdateType.InvestmentUpdate,
            playerID: player.id(),
            investments: investmentData,
            dividendsPaid: totalDividends,
          });
        }
      }
    }
  }

  isActive(): boolean {
    return this.active;
  }
}
