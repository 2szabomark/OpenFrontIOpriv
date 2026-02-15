import { html, LitElement } from "lit";
import { customElement, property, state } from "lit/decorators.js";
import { EventBus } from "../../../core/EventBus";
import { PlayerID } from "../../../core/game/Game";
import { GameView, PlayerView } from "../../../core/game/GameView";
import {
  SendInvestIntentEvent,
  SendLiquidateInvestmentIntentEvent,
} from "../../Transport";
import { renderNumber, translateText } from "../../Utils";

interface InvestmentDisplay {
  id: number;
  investorID: PlayerID;
  targetID: PlayerID;
  targetName: string;
  principal: bigint;
  currentValue: bigint;
  returns: bigint;
  returnPercent: number;
}

@customElement("stock-market-modal")
export class StockMarketModal extends LitElement {
  @property({ attribute: false }) eventBus: EventBus | null = null;
  @property({ type: Boolean }) open: boolean = false;
  @property({ attribute: false }) myPlayer: PlayerView | null = null;
  @property({ attribute: false }) gameView: GameView | null = null;

  @state() private investments: InvestmentDisplay[] = [];
  @state() private selectedPlayerID: PlayerID | null = null;
  @state() private investAmount: number = 0;
  @state() private lastDividends: bigint = 0n;

  createRenderRoot() {
    return this;
  }

  updated(changed: Map<string, unknown>) {
    if (changed.has("open") && this.open) {
      queueMicrotask(() =>
        (this.querySelector('[role="dialog"]') as HTMLElement | null)?.focus(),
      );
      this.loadInvestmentData();
    }
  }

  private loadInvestmentData() {
    if (!this.gameView || !this.myPlayer) {
      return;
    }

    const investments = this.gameView.investments();
    this.investments = investments
      .filter((inv: any) => inv.investorID === this.myPlayer?.id())
      .map((inv: any) => {
        const targetPlayer = this.gameView?.playerByID(inv.targetID);
        return {
          id: inv.id,
          investorID: inv.investorID,
          targetID: inv.targetID,
          targetName: targetPlayer?.name() || "Unknown",
          principal: inv.principal,
          currentValue: inv.currentValue,
          returns: inv.currentValue - inv.principal,
          returnPercent: inv.principal > 0n
            ? (Number((inv.currentValue - inv.principal) * 100n) / Number(inv.principal))
            : 0,
        };
      });
  }

  private closeModal() {
    this.dispatchEvent(new CustomEvent("close"));
  }

  private invest() {
    if (!this.eventBus || !this.selectedPlayerID || this.investAmount <= 0) {
      return;
    }
    this.eventBus.emit(
      new SendInvestIntentEvent(this.selectedPlayerID, this.investAmount),
    );
    this.investAmount = 0;
    this.closeModal();
  }

  private liquidate(investmentID: number) {
    if (!this.eventBus) return;
    this.eventBus.emit(new SendLiquidateInvestmentIntentEvent(investmentID));
    this.closeModal();
  }

  private renderHeader() {
    return html`
      <div class="mb-4 flex items-center justify-between relative">
        <h2 class="text-lg font-semibold tracking-tight text-zinc-100">
          ${translateText("stock_market.title")}
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

  private renderInvestments() {
    if (this.investments.length === 0) {
      return html`
        <div class="text-center text-sm text-zinc-400 py-4">
          ${translateText("stock_market.no_investments")}
        </div>
      `;
    }

    return html`
      <div class="mb-4 space-y-2">
        <h3 class="text-sm font-semibold text-zinc-300 mb-2">
          ${translateText("stock_market.your_investments")}
        </h3>
        ${this.lastDividends > 0n
          ? html`
              <div class="mb-2 p-2 bg-green-900/30 border border-green-700 rounded">
                <span class="text-sm font-semibold text-green-400">
                  ${translateText("stock_market.dividends_received")}:
                  ${renderNumber(Number(this.lastDividends))}
                </span>
              </div>
            `
          : ""}
        ${this.investments.map(
          (inv) => html`
            <div
              class="p-3 bg-zinc-800 rounded border border-zinc-700 hover:border-zinc-600 transition-colors"
            >
              <div class="flex items-center justify-between mb-2">
                <div>
                  <div class="text-sm font-semibold text-zinc-100">
                    ${inv.targetName}
                  </div>
                  <div class="text-xs text-zinc-400">
                    ${translateText("stock_market.invested")}:
                    ${renderNumber(Number(inv.principal))}
                  </div>
                </div>
                <div class="text-right">
                  <div
                    class="text-sm font-bold ${inv.returns >= 0n
                      ? "text-green-400"
                      : "text-red-400"}"
                  >
                    ${inv.returns >= 0n ? "+" : ""}${renderNumber(Number(inv.returns))}
                  </div>
                  <div class="text-xs text-zinc-400">
                    (${inv.returnPercent >= 0 ? "+" : ""}${inv.returnPercent.toFixed(1)}%)
                  </div>
                </div>
              </div>
              <div class="flex items-center justify-between">
                <div class="text-xs text-zinc-400">
                  ${translateText("stock_market.current_value")}:
                  ${renderNumber(Number(inv.currentValue))}
                </div>
                <button
                  @click=${() => this.liquidate(inv.id)}
                  class="px-3 py-1 bg-orange-600 hover:bg-orange-500 rounded text-xs font-semibold transition-colors"
                >
                  ${translateText("stock_market.liquidate")}
                </button>
              </div>
            </div>
          `,
        )}
      </div>
    `;
  }

  private renderPlayers() {
    if (!this.gameView) return html``;

    const players = this.gameView
      .players()
      .filter((p) => p.isAlive() && p.id() !== this.myPlayer?.id());

    return html`
      <div class="space-y-3">
        <h3 class="text-sm font-semibold text-zinc-300">
          ${translateText("stock_market.invest_in_player")}
        </h3>
        <div class="max-h-48 overflow-y-auto space-y-2">
          ${players.map(
            (player) => html`
              <div
                class="p-2 bg-zinc-800 rounded border ${this.selectedPlayerID === player.id()
                  ? "border-indigo-500"
                  : "border-zinc-700"} cursor-pointer hover:border-indigo-400 transition-colors"
                @click=${() => this.selectPlayer(player.id())}
              >
                <div class="flex items-center justify-between">
                  <div class="text-sm font-semibold text-zinc-100">
                    ${player.name()}
                  </div>
                  <div class="text-xs text-zinc-400">
                    ${translateText("stock_market.territory")}:
                    ${player.numTilesOwned()}
                  </div>
                </div>
              </div>
            `,
          )}
        </div>
        ${this.selectedPlayerID
          ? html`
              <div class="p-3 bg-zinc-800 rounded border border-zinc-700">
                <div class="flex gap-2 mb-2">
                  <input
                    type="number"
                    min="0"
                    .value=${String(this.investAmount)}
                    @input=${(e: Event) =>
                      (this.investAmount = Number(
                        (e.target as HTMLInputElement).value,
                      ))}
                    class="flex-1 px-2 py-1 bg-zinc-900 border border-zinc-600 rounded text-sm text-zinc-100 focus:outline-none focus:border-indigo-500"
                    placeholder="${translateText("stock_market.amount")}"
                  />
                  <button
                    @click=${() => this.invest()}
                    class="px-4 py-1 bg-indigo-600 hover:bg-indigo-500 rounded text-sm font-semibold transition-colors"
                  >
                    ${translateText("stock_market.invest")}
                  </button>
                </div>
                <div class="text-xs text-zinc-400">
                  ${translateText("stock_market.gold_available")}:
                  ${renderNumber(Number(this.myPlayer?.gold() ?? 0))}
                </div>
              </div>
            `
          : ""}
      </div>
    `;
  }

  private selectPlayer(playerID: PlayerID) {
    this.selectedPlayerID = playerID;
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
          aria-labelledby="stock-market-title"
          class="relative w-full max-w-lg max-h-[80vh] overflow-y-auto bg-zinc-900 rounded-lg shadow-xl p-6 border border-zinc-700"
          @click=${(e: MouseEvent) => e.stopPropagation()}
        >
          ${this.renderHeader()} ${this.renderInvestments()}
          ${this.renderPlayers()}
        </div>
      </div>
    `;
  }
}
