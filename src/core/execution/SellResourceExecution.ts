import { Execution, Game, Player } from "../game/Game";
import { ResourceType } from "../game/Market";

export class SellResourceExecution implements Execution {
  private active = false; // One-shot execution

  constructor(
    private player: Player,
    private resource: ResourceType,
    private amount: number,
  ) {}

  activeDuringSpawnPhase(): boolean {
    return true;
  }

  init(mg: Game, ticks: number): void {
    mg.market().sell(this.player, this.resource, this.amount);
  }

  tick(ticks: number): void {
    // One-shot execution, nothing to do
  }

  isActive(): boolean {
    return this.active;
  }
}
