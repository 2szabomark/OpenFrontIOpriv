import { Execution, Game, Player, TerrainType, Unit } from "../game/Game";

export class FarmExecution implements Execution {
  private active = true;
  private mg: Game;

  constructor(
    private farm: Unit,
    private owner: Player,
  ) {}

  activeDuringSpawnPhase(): boolean {
    return true;
  }

  init(mg: Game, ticks: number): void {
    this.mg = mg;
  }

  tick(ticks: number): void {
    if (!this.farm.isActive()) {
      this.active = false;
      return;
    }

    // Don't generate food during construction
    if (this.farm.isUnderConstruction()) {
      return;
    }

    // Calculate food generation based on terrain quality
    const farmTile = this.farm.tile();
    const terrainType = this.mg.terrainType(farmTile);
    let foodGeneration = this.mg.config().farmFoodGeneration();

    // Terrain bonuses
    switch (terrainType) {
      case TerrainType.Plains:
        foodGeneration *= 1.5; // Plains are best for farming
        break;
      case TerrainType.Highland:
        foodGeneration *= 1.0; // Normal generation
        break;
      case TerrainType.Mountain:
        foodGeneration *= 0.5; // Mountains are poor for farming
        break;
      case TerrainType.Lake:
      case TerrainType.Ocean:
        foodGeneration *= 0; // Can't farm on water (shouldn't happen)
        break;
    }

    // Apply level multiplier (upgraded farms generate more)
    foodGeneration *= this.farm.level();

    this.owner.addFood(foodGeneration);
  }

  isActive(): boolean {
    return this.active;
  }
}
