import { Game, Player, Tick, UnitType } from "./Game";
import { GameImpl } from "./GameImpl";
import { Investment, StockMarket } from "./Investment";
import { InvestmentImpl } from "./InvestmentImpl";

export class StockMarketImpl implements StockMarket {
  private investments: Investment[] = [];
  private nextInvestmentID = 1;
  private lastDividendTick = 0;
  private readonly DIVIDEND_INTERVAL = 50; // Pay dividends every 50 ticks
  private readonly DIVIDEND_RATE = 0.02; // 2% return per dividend period

  constructor(private mg: GameImpl) {}

  calculatePlayerValue(player: Player): number {
    // Value = (Territory × 100) + (Gold / 100) + (Units × 50)
    const territoryValue = player.numTilesOwned() * 100;
    const goldValue = Number(player.gold()) / 100;

    // Count unit values
    let unitValue = 0;
    for (const unit of player.units()) {
      const unitInfo = this.mg.unitInfo(unit.type());
      const unitCost = Number(unitInfo.cost(this.mg, player)) / 1000;
      unitValue += unitCost * unit.level();
    }

    return Math.floor(territoryValue + goldValue + unitValue);
  }

  invest(investor: Player, target: Player, amount: bigint): Investment | null {
    if (investor === target) {
      console.warn("Cannot invest in yourself");
      return null;
    }

    if (!investor.isAlive() || !target.isAlive()) {
      console.warn("Cannot invest in dead player");
      return null;
    }

    // Check if investor has enough gold
    if (investor.gold() < amount) {
      console.warn("Insufficient gold for investment");
      return null;
    }

    // Remove gold from investor
    investor.removeGold(amount);

    // Create investment
    const targetValue = this.calculatePlayerValue(target);
    const investment = new InvestmentImpl(
      this.nextInvestmentID++,
      investor,
      target,
      amount,
      targetValue,
      this.mg.ticks(),
      this.mg,
    );

    this.investments.push(investment);
    return investment;
  }

  getInvestments(investor: Player): Investment[] {
    return this.investments.filter(
      (inv) => inv.isActive() && inv.investor() === investor,
    );
  }

  getInvestmentsIn(target: Player): Investment[] {
    return this.investments.filter(
      (inv) => inv.isActive() && inv.target() === target,
    );
  }

  payDividends(tick: Tick): void {
    if (tick - this.lastDividendTick < this.DIVIDEND_INTERVAL) {
      return;
    }

    this.lastDividendTick = tick;

    // Pay dividends to all active investments
    for (const investment of this.investments) {
      if (!investment.isActive()) {
        continue;
      }

      // Fixed dividend based on investment amount
      const dividend = BigInt(
        Math.floor(Number(investment.investmentAmount()) * this.DIVIDEND_RATE),
      );

      if (dividend > 0n && investment.investor().isAlive()) {
        investment.investor().addGold(dividend);
      }
    }

    // Clean up inactive investments
    this.investments = this.investments.filter((inv) => inv.isActive());
  }

  getSharePrice(player: Player): number {
    // Share price = Player value / 100 (assuming 100 shares per player)
    return Math.floor(this.calculatePlayerValue(player) / 100);
  }

  liquidateInvestment(investment: Investment): bigint {
    if (!investment.isActive()) {
      return 0n;
    }

    const returnAmount = investment.liquidate();

    if (returnAmount > 0n && investment.investor().isAlive()) {
      investment.investor().addGold(returnAmount);
    }

    return returnAmount;
  }

  getAllInvestments(): Investment[] {
    return this.investments.filter((inv) => inv.isActive());
  }
}
