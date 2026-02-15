import { html, LitElement } from "lit";
import { customElement, property, state } from "lit/decorators.js";
import { EventBus } from "../../../core/EventBus";
import { GameView, PlayerView } from "../../../core/game/GameView";
import { ResourceType } from "../../../core/game/Market";
import {
  SendBuyResourceIntentEvent,
  SendSellResourceIntentEvent,
} from "../../Transport";
import { renderNumber, translateText } from "../../Utils";

interface MarketPriceDisplay {
  resource: string;
  price: number;
  supply: number;
  demand: number;
}

@customElement("market-modal")
export class MarketModal extends LitElement {
  @property({ attribute: false }) eventBus: EventBus | null = null;
  @property({ type: Boolean }) open: boolean = false;
  @property({ attribute: false }) myPlayer: PlayerView | null = null;
  @property({ attribute: false }) gameView: GameView | null = null;

  @state() private prices: MarketPriceDisplay[] = [];
  @state() private selectedResource: ResourceType | null = null;
  @state() private buyAmount: number = 0;
  @state() private sellAmount: number = 0;
  @state() private lastEvent: { resource: string; eventType: string; multiplier: number } | null = null;

  createRenderRoot() {
    return this;
  }

  updated(changed: Map<string, unknown>) {
    if (changed.has("open") && this.open) {
      queueMicrotask(() =>
        (this.querySelector('[role="dialog"]') as HTMLElement | null)?.focus(),
      );
      this.loadMarketData();
    }
  }

  private loadMarketData() {
    if (!this.gameView) {
      return;
    }

    const marketPrices = this.gameView.marketPrices();
    this.prices = marketPrices.map((price) => ({
      resource: price.resource,
      price: price.price,
      supply: price.supply,
      demand: price.demand,
    }));

    const marketEvent = this.gameView.marketEvent();
    if (marketEvent) {
      this.lastEvent = marketEvent;
    }
  }

  private closeModal() {
    this.dispatchEvent(new CustomEvent("close"));
  }

  private buyResource() {
    if (!this.eventBus || !this.selectedResource || this.buyAmount <= 0) {
      return;
    }
    this.eventBus.emit(
      new SendBuyResourceIntentEvent(this.selectedResource, this.buyAmount),
    );
    this.buyAmount = 0;
    this.closeModal();
  }

  private sellResource() {
    if (!this.eventBus || !this.selectedResource || this.sellAmount <= 0) {
      return;
    }
    this.eventBus.emit(
      new SendSellResourceIntentEvent(this.selectedResource, this.sellAmount),
    );
    this.sellAmount = 0;
    this.closeModal();
  }

  private renderHeader() {
    return html`
      <div class="mb-4 flex items-center justify-between relative">
        <h2
          id="market-title"
          class="text-lg font-semibold tracking-tight text-zinc-100"
        >
          ${translateText("market.title")}
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

  private renderPrices() {
    return html`
      <div class="mb-4 space-y-2">
        <h3 class="text-sm font-semibold text-zinc-300 mb-2">
          ${translateText("market.current_prices")}
        </h3>
        ${this.prices.map(
          (price) => html`
            <div
              class="flex items-center justify-between p-2 bg-zinc-800 rounded border ${this.selectedResource === price.resource
                ? "border-indigo-500"
                : "border-zinc-700"} cursor-pointer hover:border-indigo-400 transition-colors"
              @click=${() => this.selectResource(price.resource as ResourceType)}
            >
              <div class="flex items-center gap-2">
                <span class="text-base">${this.getResourceIcon(price.resource)}</span>
                <span class="text-sm font-semibold text-zinc-100"
                  >${price.resource}</span
                >
              </div>
              <div class="flex items-center gap-4">
                <div class="text-right">
                  <div class="text-xs text-zinc-400">
                    ${translateText("market.price")}
                  </div>
                  <div class="text-sm font-bold text-yellow-400">
                    ${renderNumber(price.price)}
                  </div>
                </div>
                <div class="text-right">
                  <div class="text-xs text-zinc-400">
                    ${translateText("market.supply")}
                  </div>
                  <div class="text-xs text-zinc-300">${renderNumber(price.supply)}</div>
                </div>
                <div class="text-right">
                  <div class="text-xs text-zinc-400">
                    ${translateText("market.demand")}
                  </div>
                  <div class="text-xs text-zinc-300">${renderNumber(price.demand)}</div>
                </div>
              </div>
            </div>
          `,
        )}
      </div>
      ${this.lastEvent
        ? html`
            <div
              class="mb-4 p-2 rounded ${this.lastEvent.eventType === "shortage"
                ? "bg-red-900/30 border border-red-700"
                : "bg-green-900/30 border border-green-700"}"
            >
              <span class="text-sm font-semibold">
                ${this.lastEvent.eventType === "shortage"
                  ? translateText("market.shortage")
                  : translateText("market.boom")}:
              </span>
              <span class="text-sm">
                ${this.lastEvent.resource}
                (${(this.lastEvent.multiplier * 100).toFixed(0)}%)
              </span>
            </div>
          `
        : ""}
    `;
  }

  private renderTrading() {
    if (!this.selectedResource) {
      return html`
        <div class="text-center text-sm text-zinc-400 py-4">
          ${translateText("market.select_resource")}
        </div>
      `;
    }

    const currentPrice = this.prices.find((p) => p.resource === this.selectedResource)?.price ?? 0;
    const playerFood = this.myPlayer?.food() ?? 0;
    const playerOil = this.myPlayer?.oil() ?? 0;
    const playerGold = Number(this.myPlayer?.gold() ?? 0);
    const availableToSell = this.selectedResource === ResourceType.Food ? playerFood : playerOil;

    return html`
      <div class="space-y-4">
        <h3 class="text-sm font-semibold text-zinc-300">
          ${translateText("market.trade")} ${this.selectedResource}
        </h3>

        <!-- Buy Section -->
        <div class="p-3 bg-zinc-800 rounded border border-zinc-700">
          <div class="flex items-center justify-between mb-2">
            <span class="text-sm font-semibold text-green-400">
              ${translateText("market.buy")}
            </span>
            <span class="text-xs text-zinc-400">
              ${translateText("market.gold_available")}: ${renderNumber(playerGold)}
            </span>
          </div>
          <div class="flex gap-2">
            <input
              type="number"
              min="0"
              max="100"
              .value=${String(this.buyAmount)}
              @input=${(e: Event) =>
                (this.buyAmount = Number((e.target as HTMLInputElement).value))}
              class="flex-1 px-2 py-1 bg-zinc-900 border border-zinc-600 rounded text-sm text-zinc-100 focus:outline-none focus:border-indigo-500"
              placeholder="${translateText("market.amount")}"
            />
            <button
              @click=${() => this.buyResource()}
              class="px-4 py-1 bg-green-600 hover:bg-green-500 rounded text-sm font-semibold transition-colors"
            >
              ${translateText("market.buy")}
            </button>
          </div>
          <div class="text-xs text-zinc-400 mt-1">
            ${translateText("market.total_cost")}: ${renderNumber(this.buyAmount * currentPrice)}
          </div>
        </div>

        <!-- Sell Section -->
        <div class="p-3 bg-zinc-800 rounded border border-zinc-700">
          <div class="flex items-center justify-between mb-2">
            <span class="text-sm font-semibold text-orange-400">
              ${translateText("market.sell")}
            </span>
            <span class="text-xs text-zinc-400">
              ${translateText("market.available")}: ${renderNumber(availableToSell)}
            </span>
          </div>
          <div class="flex gap-2">
            <input
              type="number"
              min="0"
              max="${availableToSell}"
              .value=${String(this.sellAmount)}
              @input=${(e: Event) =>
                (this.sellAmount = Number((e.target as HTMLInputElement).value))}
              class="flex-1 px-2 py-1 bg-zinc-900 border border-zinc-600 rounded text-sm text-zinc-100 focus:outline-none focus:border-indigo-500"
              placeholder="${translateText("market.amount")}"
            />
            <button
              @click=${() => this.sellResource()}
              class="px-4 py-1 bg-orange-600 hover:bg-orange-500 rounded text-sm font-semibold transition-colors"
            >
              ${translateText("market.sell")}
            </button>
          </div>
          <div class="text-xs text-zinc-400 mt-1">
            ${translateText("market.total_revenue")}: ${renderNumber(Math.floor(this.sellAmount * currentPrice * 0.95))}
          </div>
        </div>
      </div>
    `;
  }

  private selectResource(resource: ResourceType) {
    this.selectedResource = resource;
  }

  private getResourceIcon(resource: string): string {
    return resource === "Food" ? "🌾" : "🛢️";
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
          aria-labelledby="market-title"
          class="relative w-full max-w-md max-h-[80vh] overflow-y-auto bg-zinc-900 rounded-lg shadow-xl p-6 border border-zinc-700"
          @click=${(e: MouseEvent) => e.stopPropagation()}
        >
          ${this.renderHeader()} ${this.renderPrices()} ${this.renderTrading()}
        </div>
      </div>
    `;
  }
}
