import { Execution, Game, Player, Unit } from "../game/Game";

export class OilRigExecution implements Execution {
  private active = true;
  private mg: Game;

  constructor(
    private oilRig: Unit,
    private owner: Player,
  ) {}

  activeDuringSpawnPhase(): boolean {
    return true;
  }

  init(mg: Game, ticks: number): void {
    this.mg = mg;
  }

  tick(ticks: number): void {
    if (!this.oilRig.isActive()) {
      this.active = false;
      return;
    }

    // Don't generate oil during construction
    if (this.oilRig.isUnderConstruction()) {
      return;
    }

    // Calculate oil generation
    let oilGeneration = this.mg.config().oilRigOilGeneration();

    // Apply level multiplier (upgraded oil rigs generate more)
    oilGeneration *= this.oilRig.level();

    this.owner.addOil(oilGeneration);
  }

  isActive(): boolean {
    return this.active;
  }
}
