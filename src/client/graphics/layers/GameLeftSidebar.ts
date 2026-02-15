import { Colord } from "colord";
import { html, LitElement } from "lit";
import { customElement, state } from "lit/decorators.js";
import { EventBus } from "../../../core/EventBus";
import { GameMode } from "../../../core/game/Game";
import { GameView } from "../../../core/game/GameView";
import { translateText } from "../../Utils";
import { ImmunityBarVisibleEvent } from "./ImmunityTimer";
import { Layer } from "./Layer";
import { SpawnBarVisibleEvent } from "./SpawnTimer";
import "./MarketModal";
import "./StockMarketModal";
import "./ContractsModal";
import "./CentralBankModal";
import leaderboardRegularIcon from "/images/LeaderboardIconRegularWhite.svg?url";
import leaderboardSolidIcon from "/images/LeaderboardIconSolidWhite.svg?url";
import teamRegularIcon from "/images/TeamIconRegularWhite.svg?url";
import teamSolidIcon from "/images/TeamIconSolidWhite.svg?url";

@customElement("game-left-sidebar")
export class GameLeftSidebar extends LitElement implements Layer {
  @state()
  private isLeaderboardShow = false;
  @state()
  private isTeamLeaderboardShow = false;
  @state()
  private isMarketShow = false;
  @state()
  private isStockMarketShow = false;
  @state()
  private isContractsShow = false;
  @state()
  private isCentralBankShow = false;
  @state()
  private isVisible = false;
  @state()
  private isPlayerTeamLabelVisible = false;
  @state()
  private playerTeam: string | null = null;
  @state()
  private spawnBarVisible = false;
  @state()
  private immunityBarVisible = false;

  private playerColor: Colord = new Colord("#FFFFFF");
  public game: GameView;
  public eventBus: EventBus;
  private _shownOnInit = false;

  createRenderRoot() {
    return this;
  }

  init() {
    this.isVisible = true;
    this.eventBus.on(SpawnBarVisibleEvent, (e) => {
      this.spawnBarVisible = e.visible;
    });
    this.eventBus.on(ImmunityBarVisibleEvent, (e) => {
      this.immunityBarVisible = e.visible;
    });
    if (this.isTeamGame) {
      this.isPlayerTeamLabelVisible = true;
    }
    // Make it visible by default on large screens
    if (window.innerWidth >= 1024) {
      // lg breakpoint
      this._shownOnInit = true;
    }
    this.requestUpdate();
  }

  tick() {
    if (!this.playerTeam && this.game.myPlayer()?.team()) {
      this.playerTeam = this.game.myPlayer()!.team();
      if (this.playerTeam) {
        this.playerColor = this.game
          .config()
          .theme()
          .teamColor(this.playerTeam);
        this.requestUpdate();
      }
    }

    if (this._shownOnInit && !this.game.inSpawnPhase()) {
      this._shownOnInit = false;
      this.isLeaderboardShow = true;
      this.requestUpdate();
    }

    if (!this.game.inSpawnPhase() && this.isPlayerTeamLabelVisible) {
      this.isPlayerTeamLabelVisible = false;
      this.requestUpdate();
    }
  }

  private get barOffset(): number {
    return (this.spawnBarVisible ? 7 : 0) + (this.immunityBarVisible ? 7 : 0);
  }

  private toggleLeaderboard(): void {
    console.error("🎯 toggleLeaderboard called, current state:", this.isLeaderboardShow);
    this.isLeaderboardShow = !this.isLeaderboardShow;
    console.error("🎯 toggleLeaderboard new state:", this.isLeaderboardShow);
  }

  private toggleTeamLeaderboard(): void {
    console.error("🎯 toggleTeamLeaderboard called, current state:", this.isTeamLeaderboardShow);
    this.isTeamLeaderboardShow = !this.isTeamLeaderboardShow;
    console.error("🎯 toggleTeamLeaderboard new state:", this.isTeamLeaderboardShow);
  }

  private toggleMarket(): void {
    console.error("🏪 toggleMarket called, current state:", this.isMarketShow);
    const newState = !this.isMarketShow;
    this.closeAllEconomicPanels();
    this.isMarketShow = newState;
    console.error("🏪 toggleMarket new state:", this.isMarketShow);
  }

  private toggleStockMarket(): void {
    console.error("📈 toggleStockMarket called, current state:", this.isStockMarketShow);
    const newState = !this.isStockMarketShow;
    this.closeAllEconomicPanels();
    this.isStockMarketShow = newState;
    console.error("📈 toggleStockMarket new state:", this.isStockMarketShow);
  }

  private toggleContracts(): void {
    console.error("📝 toggleContracts called, current state:", this.isContractsShow);
    const newState = !this.isContractsShow;
    this.closeAllEconomicPanels();
    this.isContractsShow = newState;
    console.error("📝 toggleContracts new state:", this.isContractsShow);
  }

  private toggleCentralBank(): void {
    console.error("🏦 toggleCentralBank called, current state:", this.isCentralBankShow);
    const newState = !this.isCentralBankShow;
    this.closeAllEconomicPanels();
    this.isCentralBankShow = newState;
    console.error("🏦 toggleCentralBank new state:", this.isCentralBankShow);
  }

  private closeAllEconomicPanels(): void {
    console.error("🔒 Closing all economic panels");
    this.isMarketShow = false;
    this.isStockMarketShow = false;
    this.isContractsShow = false;
    this.isCentralBankShow = false;
  }

  private get isTeamGame(): boolean {
    return this.game?.config().gameConfig().gameMode === GameMode.Team;
  }

  private getTranslatedPlayerTeamLabel(): string {
    if (!this.playerTeam) return "";
    const translationKey = `team_colors.${this.playerTeam.toLowerCase()}`;
    const translated = translateText(translationKey);
    return translated === translationKey ? this.playerTeam : translated;
  }

  render() {
    return html`
      <aside
        class=${`fixed top-0 min-[1200px]:top-4 left-0 min-[1200px]:left-4 z-1000 flex flex-col max-h-[calc(100vh-80px)] overflow-y-auto p-2 bg-gray-800/70 backdrop-blur-xs shadow-xs min-[1200px]:rounded-lg rounded-br-lg transition-all duration-300 ease-out transform ${
          this.isVisible ? "translate-x-0" : "hidden"
        }`}
        style="margin-top: ${this.barOffset}px;"
      >
        <div class="flex items-center gap-4 xl:gap-6 text-white">
          <div
            class="cursor-pointer p-0.5 bg-gray-700/50 hover:bg-gray-600 border rounded-md border-slate-500 transition-colors"
            @click=${this.toggleLeaderboard}
            role="button"
            tabindex="0"
            @keydown=${(e: KeyboardEvent) => {
              if (e.key === "Enter" || e.key === " " || e.code === "Space") {
                e.preventDefault();
                this.toggleLeaderboard();
              }
            }}
          >
            <img
              src=${this.isLeaderboardShow
                ? leaderboardSolidIcon
                : leaderboardRegularIcon}
              alt=${translateText("help_modal.icon_alt_player_leaderboard") ||
              "Player Leaderboard Icon"}
              width="20"
              height="20"
            />
          </div>
          ${this.isTeamGame
            ? html`
                <div
                  class="cursor-pointer p-0.5 bg-gray-700/50 hover:bg-gray-600 border rounded-md border-slate-500 transition-colors"
                  @click=${this.toggleTeamLeaderboard}
                  role="button"
                  tabindex="0"
                  @keydown=${(e: KeyboardEvent) => {
                    if (
                      e.key === "Enter" ||
                      e.key === " " ||
                      e.code === "Space"
                    ) {
                      e.preventDefault();
                      this.toggleTeamLeaderboard();
                    }
                  }}
                >
                  <img
                    src=${this.isTeamLeaderboardShow
                      ? teamSolidIcon
                      : teamRegularIcon}
                    alt=${translateText(
                      "help_modal.icon_alt_team_leaderboard",
                    ) || "Team Leaderboard Icon"}
                    width="20"
                    height="20"
                  />
                </div>
              `
            : null}
          <!-- Market Button -->
          <div
            class="cursor-pointer p-1 bg-gray-700/50 hover:bg-gray-600 border rounded-md border-slate-500 transition-colors"
            @click=${(e: Event) => {
              console.error("🖱️ Market icon clicked! Event:", e.type, "Target:", e.target);
              this.toggleMarket();
            }}
            role="button"
            tabindex="0"
            title="Market"
          >
            <span class="text-lg">🏪</span>
          </div>
          <!-- Stock Market Button -->
          <div
            class="cursor-pointer p-1 bg-gray-700/50 hover:bg-gray-600 border rounded-md border-slate-500 transition-colors"
            @click=${(e: Event) => {
              console.error("🖱️ Stock Market icon clicked! Event:", e.type, "Target:", e.target);
              this.toggleStockMarket();
            }}
            role="button"
            tabindex="0"
            title="Stock Market"
          >
            <span class="text-lg">📈</span>
          </div>
          <!-- Contracts Button -->
          <div
            class="cursor-pointer p-1 bg-gray-700/50 hover:bg-gray-600 border rounded-md border-slate-500 transition-colors"
            @click=${(e: Event) => {
              console.error("🖱️ Contracts icon clicked! Event:", e.type, "Target:", e.target);
              this.toggleContracts();
            }}
            role="button"
            tabindex="0"
            title="Contracts"
          >
            <span class="text-lg">📝</span>
          </div>
          <!-- Central Bank Button -->
          <div
            class="cursor-pointer p-1 bg-gray-700/50 hover:bg-gray-600 border rounded-md border-slate-500 transition-colors"
            @click=${(e: Event) => {
              console.error("🖱️ Central Bank icon clicked! Event:", e.type, "Target:", e.target);
              this.toggleCentralBank();
            }}
            role="button"
            tabindex="0"
            title="Central Bank"
          >
            <span class="text-lg">🏦</span>
          </div>
        </div>
        ${this.isPlayerTeamLabelVisible
          ? html`
              <div
                class="flex items-center w-full text-white mt-2"
                @contextmenu=${(e: Event) => e.preventDefault()}
              >
                ${translateText("help_modal.ui_your_team")}
                <span
                  style="--color: ${this.playerColor.toRgbString()}"
                  class="text-(--color)"
                >
                  &nbsp;${this.getTranslatedPlayerTeamLabel()} &#10687;
                </span>
              </div>
            `
          : null}
        <div
          class=${`block lg:flex flex-wrap ${this.isLeaderboardShow && this.isTeamLeaderboardShow ? "gap-2" : ""}`}
        >
          <leader-board .visible=${this.isLeaderboardShow}></leader-board>
          <team-stats
            class="flex-1"
            .visible=${this.isTeamLeaderboardShow && this.isTeamGame}
          ></team-stats>
        </div>
        <slot></slot>
        <!-- Economic Panels -->
        <market-modal
          .visible=${this.isMarketShow}
          .eventBus=${this.eventBus}
          .myPlayer=${this.game?.myPlayer()}
          .gameView=${this.game}
        ></market-modal>
        <stock-market-modal
          .visible=${this.isStockMarketShow}
          .eventBus=${this.eventBus}
          .myPlayer=${this.game?.myPlayer()}
          .gameView=${this.game}
        ></stock-market-modal>
        <contracts-modal
          .visible=${this.isContractsShow}
          .eventBus=${this.eventBus}
          .myPlayer=${this.game?.myPlayer()}
          .gameView=${this.game}
        ></contracts-modal>
        <central-bank-modal
          .visible=${this.isCentralBankShow}
          .eventBus=${this.eventBus}
          .myPlayer=${this.game?.myPlayer()}
          .gameView=${this.game}
        ></central-bank-modal>
      </aside>
    `;
  }
}
