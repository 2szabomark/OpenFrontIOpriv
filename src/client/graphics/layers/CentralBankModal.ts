import { html, LitElement } from "lit";
import { customElement, property, state } from "lit/decorators.js";
import { EventBus } from "../../../core/EventBus";
import { PlayerID } from "../../../core/game/Game";
import { GameView, PlayerView } from "../../../core/game/GameView";
import { SendRequestLoanIntentEvent } from "../../Transport";
import { renderNumber, translateText } from "../../Utils";

interface LoanDisplay {
  id: number;
  borrowerID: PlayerID;
  principal: bigint;
  remainingBalance: bigint;
  interestRate: number;
  createdAtTick: number;
  missedPayments: number;
  isDefaulted: boolean;
}

@customElement("central-bank-modal")
export class CentralBankModal extends LitElement {
  @property({ attribute: false }) eventBus: EventBus | null = null;
  @property({ type: Boolean }) open: boolean = false;
  @property({ attribute: false }) myPlayer: PlayerView | null = null;
  @property({ attribute: false }) gameView: GameView | null = null;

  @state() private loans: LoanDisplay[] = [];
  @state() private currentInterestRate: number = 0.05;
  @state() private maxLoanAmount: bigint = 0n;
  @state() private loanAmount: number = 0;

  createRenderRoot() {
    return this;
  }

  updated(changed: Map<string, unknown>) {
    if (changed.has("open") && this.open) {
      queueMicrotask(() =>
        (this.querySelector('[role="dialog"]') as HTMLElement | null)?.focus(),
      );
      this.loadLoanData();
    }
  }

  private loadLoanData() {
    if (!this.gameView || !this.myPlayer) {
      return;
    }

    const loans = this.gameView.loans();

    // Find bank info
    const bankInfo = loans.find((item: any) => item.bankInfo !== undefined)?.bankInfo;
    if (bankInfo) {
      this.currentInterestRate = bankInfo.interestRate || 0.05;
      this.maxLoanAmount = bankInfo.maxLoanAmount || 10000n;
    }

    // Load player's loans
    this.loans = loans
      .filter((loan: any) => loan.borrowerID === this.myPlayer?.id())
      .map((loan: any) => ({
        id: loan.id,
        borrowerID: loan.borrowerID,
        principal: loan.principal,
        remainingBalance: loan.remainingBalance,
        interestRate: loan.interestRate,
        createdAtTick: loan.createdAtTick,
        missedPayments: loan.missedPayments,
        isDefaulted: loan.missedPayments >= 5,
      }));
  }

  private closeModal() {
    this.dispatchEvent(new CustomEvent("close"));
  }

  private requestLoan() {
    if (!this.eventBus || this.loanAmount <= 0) {
      return;
    }
    this.eventBus.emit(new SendRequestLoanIntentEvent(this.loanAmount));
    this.loanAmount = 0;
    this.closeModal();
  }

  private renderHeader() {
    return html`
      <div class="mb-4 flex items-center justify-between relative">
        <h2 class="text-lg font-semibold tracking-tight text-zinc-100">
          ${translateText("central_bank.title")}
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

  private renderBankInfo() {
    return html`
      <div class="mb-4 p-3 bg-zinc-800 rounded border border-zinc-700">
        <h3 class="text-sm font-semibold text-zinc-300 mb-2">
          ${translateText("central_bank.current_rates")}
        </h3>
        <div class="space-y-1 text-sm">
          <div class="flex items-center justify-between">
            <span class="text-zinc-400">
              ${translateText("central_bank.interest_rate")}:
            </span>
            <span class="text-yellow-400 font-semibold">
              ${(this.currentInterestRate * 100).toFixed(1)}%
            </span>
          </div>
          <div class="flex items-center justify-between">
            <span class="text-zinc-400">
              ${translateText("central_bank.max_loan")}:
            </span>
            <span class="text-green-400 font-semibold">
              ${renderNumber(Number(this.maxLoanAmount))}
            </span>
          </div>
          <div class="flex items-center justify-between">
            <span class="text-zinc-400">
              ${translateText("central_bank.your_gold")}:
            </span>
            <span class="text-zinc-100 font-semibold">
              ${renderNumber(Number(this.myPlayer?.gold() ?? 0))}
            </span>
          </div>
        </div>
      </div>
    `;
  }

  private renderLoans() {
    if (this.loans.length === 0) {
      return html`
        <div class="mb-4">
          <h3 class="text-sm font-semibold text-zinc-300 mb-2">
            ${translateText("central_bank.your_loans")}
          </h3>
          <div class="text-center text-sm text-zinc-400 py-4">
            ${translateText("central_bank.no_loans")}
          </div>
        </div>
      `;
    }

    return html`
      <div class="mb-4 space-y-2">
        <h3 class="text-sm font-semibold text-zinc-300 mb-2">
          ${translateText("central_bank.your_loans")}
        </h3>
        ${this.loans.map(
          (loan) => html`
            <div
              class="p-3 bg-zinc-800 rounded border ${loan.isDefaulted
                ? "border-red-700"
                : "border-zinc-700"}"
            >
              <div class="flex items-center justify-between mb-2">
                <div>
                  <div class="text-sm font-semibold text-zinc-100">
                    ${translateText("central_bank.loan")} #${loan.id}
                  </div>
                  <div class="text-xs text-zinc-400">
                    ${translateText("central_bank.principal")}:
                    ${renderNumber(Number(loan.principal))}
                  </div>
                </div>
                <div class="text-right">
                  <div
                    class="text-sm font-bold ${loan.isDefaulted
                      ? "text-red-400"
                      : "text-yellow-400"}"
                  >
                    ${renderNumber(Number(loan.remainingBalance))}
                  </div>
                  <div class="text-xs text-zinc-400">
                    ${(loan.interestRate * 100).toFixed(1)}%
                    ${translateText("central_bank.interest")}
                  </div>
                </div>
              </div>
              ${loan.missedPayments > 0
                ? html`
                    <div
                      class="mt-2 p-2 ${loan.isDefaulted
                        ? "bg-red-900/30 border-red-700"
                        : "bg-orange-900/30 border-orange-700"} border rounded"
                    >
                      <div class="text-xs font-semibold">
                        ${loan.isDefaulted
                          ? translateText("central_bank.defaulted")
                          : translateText("central_bank.missed_payments")}:
                        ${loan.missedPayments}
                      </div>
                      ${loan.missedPayments >= 3 && loan.missedPayments < 5
                        ? html`<div class="text-xs text-zinc-300">
                            ${translateText("central_bank.penalty_troops")}
                          </div>`
                        : ""}
                      ${loan.missedPayments >= 5 && loan.missedPayments < 7
                        ? html`<div class="text-xs text-zinc-300">
                            ${translateText("central_bank.penalty_buildings")}
                          </div>`
                        : ""}
                      ${loan.missedPayments >= 7
                        ? html`<div class="text-xs text-zinc-300">
                            ${translateText("central_bank.penalty_economy")}
                          </div>`
                        : ""}
                    </div>
                  `
                : ""}
              <div class="mt-2 text-xs text-zinc-400">
                ${translateText("central_bank.payment")}: ${renderNumber(
                  Math.ceil(Number(loan.remainingBalance) * 0.05),
                )} + ${translateText("central_bank.interest")} / tick
              </div>
            </div>
          `,
        )}
      </div>
    `;
  }

  private renderRequestLoan() {
    return html`
      <div class="space-y-3">
        <h3 class="text-sm font-semibold text-zinc-300">
          ${translateText("central_bank.request_loan")}
        </h3>
        <div class="p-3 bg-zinc-800 rounded border border-zinc-700">
          <div class="flex gap-2 mb-2">
            <input
              type="number"
              min="0"
              max="${Number(this.maxLoanAmount)}"
              .value=${String(this.loanAmount)}
              @input=${(e: Event) =>
                (this.loanAmount = Number((e.target as HTMLInputElement).value))}
              class="flex-1 px-2 py-1 bg-zinc-900 border border-zinc-600 rounded text-sm text-zinc-100 focus:outline-none focus:border-indigo-500"
              placeholder="${translateText("central_bank.amount")}"
            />
            <button
              @click=${() => this.requestLoan()}
              ?disabled=${this.loanAmount <= 0 ||
              this.loanAmount > Number(this.maxLoanAmount)}
              class="px-4 py-1 bg-indigo-600 hover:bg-indigo-500 disabled:bg-zinc-700 disabled:cursor-not-allowed rounded text-sm font-semibold transition-colors"
            >
              ${translateText("central_bank.request")}
            </button>
          </div>
          <div class="space-y-1 text-xs text-zinc-400">
            <div>
              ${translateText("central_bank.interest_rate")}:
              ${(this.currentInterestRate * 100).toFixed(1)}%
            </div>
            <div>
              ${translateText("central_bank.payment")}: 5% +
              ${translateText("central_bank.interest")} / tick
            </div>
            <div class="text-orange-400">
              ${translateText("central_bank.warning")}
            </div>
          </div>
        </div>
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
          aria-labelledby="central-bank-title"
          class="relative w-full max-w-lg max-h-[80vh] overflow-y-auto bg-zinc-900 rounded-lg shadow-xl p-6 border border-zinc-700"
          @click=${(e: MouseEvent) => e.stopPropagation()}
        >
          ${this.renderHeader()} ${this.renderBankInfo()} ${this.renderLoans()}
          ${this.renderRequestLoan()}
        </div>
      </div>
    `;
  }
}
