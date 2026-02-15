import { Player, Tick } from "./Game";

export enum ContractType {
  Trade = "Trade", // Exchange resources periodically
  NonAggression = "Non-Aggression", // Cannot attack each other
  ResourceLease = "Resource Lease", // Pay gold to use railroads/ports
  Protection = "Protection", // Defender protects client from attacks
}

export interface ContractTerms {
  type: ContractType;
  goldPayment: bigint; // Upfront payment from party2 to party1
  periodicPayment?: bigint; // Optional recurring payment per tick
  duration: Tick; // How long contract lasts
  // Trade-specific
  foodPerTick?: number;
  oilPerTick?: number;
  // Resource Lease-specific
  allowRailroadUse?: boolean;
  allowPortUse?: boolean;
}

export interface Contract {
  id(): number;
  party1(): Player; // The provider/seller
  party2(): Player; // The buyer/client
  terms(): ContractTerms;
  createdAt(): Tick;
  expiresAt(): Tick;

  isActive(): boolean;
  isExpired(currentTick: Tick): boolean;

  // Execute contract obligations each tick
  executeTick(currentTick: Tick): void;

  // End contract (can't be broken early per user requirements)
  expire(): void;
}

export interface ContractManager {
  // Create a contract (requires both parties to accept)
  createContract(
    party1: Player,
    party2: Player,
    terms: ContractTerms,
    currentTick: Tick,
  ): Contract | null;

  // Get all active contracts
  getActiveContracts(): Contract[];

  // Get contracts for a player
  getContractsForPlayer(player: Player): Contract[];

  // Check if two players have a non-aggression pact
  hasNonAggressionPact(player1: Player, player2: Player): boolean;

  // Check if player can use another's railroads/ports
  canUseRailroads(user: Player, owner: Player): boolean;
  canUsePorts(user: Player, owner: Player): boolean;

  // Execute all contracts (called each tick)
  executeContracts(currentTick: Tick): void;

  // Clean up expired contracts
  cleanupExpired(currentTick: Tick): void;
}

export interface ContractUpdate {
  id: number;
  party1ID: string;
  party2ID: string;
  type: ContractType;
  goldPayment: bigint;
  periodicPayment?: bigint;
  duration: Tick;
  createdAt: Tick;
  expiresAt: Tick;
  isActive: boolean;
}
