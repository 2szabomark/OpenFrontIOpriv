import { html, LitElement } from "lit";
import { customElement, property, state } from "lit/decorators.js";
import { EventBus } from "../../../core/EventBus";
import { PlayerID } from "../../../core/game/Game";
import { GameView, PlayerView } from "../../../core/game/GameView";
import { SendCreateContractIntentEvent } from "../../Transport";
import { renderNumber, translateText } from "../../Utils";

interface ContractDisplay {
  id: number;
  party1ID: PlayerID;
  party2ID: PlayerID;
  party1Name: string;
  party2Name: string;
  contractType: string;
  createdAtTick: number;
  expiresAtTick: number;
  upfrontPayment: bigint;
  periodicPayment: bigint;
  periodicPaymentInterval: number;
  isActive: boolean;
}

@customElement("contracts-modal")
export class ContractsModal extends LitElement {
  @property({ attribute: false }) eventBus: EventBus | null = null;
  @property({ type: Boolean }) open: boolean = false;
  @property({ attribute: false }) myPlayer: PlayerView | null = null;
  @property({ attribute: false }) gameView: GameView | null = null;

  @state() private contracts: ContractDisplay[] = [];
  @state() private selectedPlayerID: PlayerID | null = null;
  @state() private contractType: string = "Trade";
  @state() private duration: number = 100;
  @state() private upfrontPayment: number = 0;
  @state() private periodicPayment: number = 0;
  @state() private periodicInterval: number = 10;

  private contractTypes = [
    "Trade",
    "Non-Aggression",
    "Resource Lease",
    "Protection",
  ];

  createRenderRoot() {
    return this;
  }

  updated(changed: Map<string, unknown>) {
    if (changed.has("open") && this.open) {
      queueMicrotask(() =>
        (this.querySelector('[role="dialog"]') as HTMLElement | null)?.focus(),
      );
    }
  }

  private closeModal() {
    this.dispatchEvent(new CustomEvent("close"));
  }

  private createContract() {
    if (!this.eventBus || !this.selectedPlayerID || this.duration <= 0) {
      return;
    }
    this.eventBus.emit(
      new SendCreateContractIntentEvent(
        this.selectedPlayerID,
        this.contractType,
        this.duration,
        this.upfrontPayment,
        this.periodicPayment,
        this.periodicInterval,
      ),
    );
    this.closeModal();
  }

  private renderHeader() {
    return html`
      <div class="mb-4 flex items-center justify-between relative">
        <h2 class="text-lg font-semibold tracking-tight text-zinc-100">
          ${translateText("contracts.title")}
        </h2>
        <button
          type="button"
          @click=${() => this.closeModal()}
          class="absolute -top-3 -right-3 flex h-7 w-7 items-center justify-center rounded-full bg-zinc-700 text-white shadow-sm hover:bg-red-500 transition-colors focus-visible:ring-2 focus-visible:ring-white/30 focus:outline-hidden"
          aria-label=${translateText("common.close")}
        >
          ✕
        </button>
      </div>
    `;
  }

  private renderContracts() {
    if (this.contracts.length === 0) {
      return html`
        <div class="text-center text-sm text-zinc-400 py-4">
          ${translateText("contracts.no_contracts")}
        </div>
      `;
    }

    return html`
      <div class="mb-4 space-y-2">
        <h3 class="text-sm font-semibold text-zinc-300 mb-2">
          ${translateText("contracts.active_contracts")}
        </h3>
        ${this.contracts.map(
          (contract) => html`
            <div class="p-3 bg-zinc-800 rounded border border-zinc-700">
              <div class="flex items-center justify-between mb-2">
                <div>
                  <div class="text-sm font-semibold text-zinc-100">
                    ${contract.contractType}
                  </div>
                  <div class="text-xs text-zinc-400">
                    ${translateText("contracts.with")}:
                    ${contract.party1ID === this.myPlayer?.id()
                      ? contract.party2Name
                      : contract.party1Name}
                  </div>
                </div>
                <div class="text-right">
                  <div class="text-xs text-zinc-400">
                    ${translateText("contracts.expires")}: Tick
                    ${contract.expiresAtTick}
                  </div>
                  <div
                    class="text-xs ${contract.isActive ? "text-green-400" : "text-red-400"}"
                  >
                    ${contract.isActive
                      ? translateText("contracts.active")
                      : translateText("contracts.expired")}
                  </div>
                </div>
              </div>
              <div class="flex items-center justify-between text-xs text-zinc-400">
                <div>
                  ${translateText("contracts.upfront")}:
                  ${renderNumber(Number(contract.upfrontPayment))}
                </div>
                <div>
                  ${translateText("contracts.periodic")}:
                  ${renderNumber(Number(contract.periodicPayment))} / ${contract.periodicPaymentInterval}
                  ticks
                </div>
              </div>
            </div>
          `,
        )}
      </div>
    `;
  }

  private renderCreateContract() {
    if (!this.gameView) return html``;

    const players = this.gameView
      .players()
      .filter((p) => p.isAlive() && p.id() !== this.myPlayer?.id());

    return html`
      <div class="space-y-3">
        <h3 class="text-sm font-semibold text-zinc-300">
          ${translateText("contracts.create_new")}
        </h3>

        <!-- Contract Type -->
        <div>
          <label class="block text-xs text-zinc-400 mb-1">
            ${translateText("contracts.type")}
          </label>
          <select
            .value=${this.contractType}
            @change=${(e: Event) =>
              (this.contractType = (e.target as HTMLSelectElement).value)}
            class="w-full px-2 py-1 bg-zinc-800 border border-zinc-600 rounded text-sm text-zinc-100 focus:outline-none focus:border-indigo-500"
          >
            ${this.contractTypes.map(
              (type) => html`<option value="${type}">${type}</option>`,
            )}
          </select>
        </div>

        <!-- Select Player -->
        <div>
          <label class="block text-xs text-zinc-400 mb-1">
            ${translateText("contracts.select_party")}
          </label>
          <select
            @change=${(e: Event) =>
              (this.selectedPlayerID = Number(
                (e.target as HTMLSelectElement).value,
              ))}
            class="w-full px-2 py-1 bg-zinc-800 border border-zinc-600 rounded text-sm text-zinc-100 focus:outline-none focus:border-indigo-500"
          >
            <option value="">-- ${translateText("contracts.select")} --</option>
            ${players.map(
              (player) =>
                html`<option value="${player.id()}">${player.name()}</option>`,
            )}
          </select>
        </div>

        <!-- Duration -->
        <div>
          <label class="block text-xs text-zinc-400 mb-1">
            ${translateText("contracts.duration")} (ticks)
          </label>
          <input
            type="number"
            min="1"
            .value=${String(this.duration)}
            @input=${(e: Event) =>
              (this.duration = Number((e.target as HTMLInputElement).value))}
            class="w-full px-2 py-1 bg-zinc-800 border border-zinc-600 rounded text-sm text-zinc-100 focus:outline-none focus:border-indigo-500"
          />
        </div>

        <!-- Upfront Payment -->
        <div>
          <label class="block text-xs text-zinc-400 mb-1">
            ${translateText("contracts.upfront_payment")}
          </label>
          <input
            type="number"
            min="0"
            .value=${String(this.upfrontPayment)}
            @input=${(e: Event) =>
              (this.upfrontPayment = Number(
                (e.target as HTMLInputElement).value,
              ))}
            class="w-full px-2 py-1 bg-zinc-800 border border-zinc-600 rounded text-sm text-zinc-100 focus:outline-none focus:border-indigo-500"
          />
        </div>

        <!-- Periodic Payment -->
        <div>
          <label class="block text-xs text-zinc-400 mb-1">
            ${translateText("contracts.periodic_payment")}
          </label>
          <div class="flex gap-2">
            <input
              type="number"
              min="0"
              .value=${String(this.periodicPayment)}
              @input=${(e: Event) =>
                (this.periodicPayment = Number(
                  (e.target as HTMLInputElement).value,
                ))}
              class="flex-1 px-2 py-1 bg-zinc-800 border border-zinc-600 rounded text-sm text-zinc-100 focus:outline-none focus:border-indigo-500"
              placeholder="Amount"
            />
            <input
              type="number"
              min="1"
              .value=${String(this.periodicInterval)}
              @input=${(e: Event) =>
                (this.periodicInterval = Number(
                  (e.target as HTMLInputElement).value,
                ))}
              class="w-20 px-2 py-1 bg-zinc-800 border border-zinc-600 rounded text-sm text-zinc-100 focus:outline-none focus:border-indigo-500"
              placeholder="Interval"
            />
          </div>
          <div class="text-xs text-zinc-400 mt-1">
            Every ${this.periodicInterval} ticks
          </div>
        </div>

        <button
          @click=${() => this.createContract()}
          ?disabled=${!this.selectedPlayerID}
          class="w-full px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:bg-zinc-700 disabled:cursor-not-allowed rounded text-sm font-semibold transition-colors"
        >
          ${translateText("contracts.create")}
        </button>
      </div>
    `;
  }

  render() {
    if (!this.open) return html``;

    return html`
      <div
        class="fixed inset-0 z-[1000] flex items-center justify-center bg-black/50 backdrop-blur-sm"
        @click=${(e: MouseEvent) => {
          if (e.target === e.currentTarget) this.closeModal();
        }}
      >
        <div
          role="dialog"
          tabindex="-1"
          aria-labelledby="contracts-title"
          class="relative w-full max-w-lg max-h-[80vh] overflow-y-auto bg-zinc-900 rounded-lg shadow-xl p-6 border border-zinc-700"
          @click=${(e: MouseEvent) => e.stopPropagation()}
        >
          ${this.renderHeader()} ${this.renderContracts()}
          ${this.renderCreateContract()}
        </div>
      </div>
    `;
  }
}
