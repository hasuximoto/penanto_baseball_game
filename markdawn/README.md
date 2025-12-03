# CellBall - React Native Baseball Game

Excel VBA で実装された野球ゲーム「CellBall」を React Native + TypeScript に移行したプロジェクトです。

## プロジェクト概要

### 概要
本プロジェクトは、Excel マクロで実装された複雑な野球ゲーム（50+ VBA モジュール、30+ 関数）を、最新の React Native フレームワークを使用して Android アプリに転換したものです。

### 主な特徴
- **完全な型安全性**: TypeScript with strict mode
- **状態管理**: Redux Toolkit による集中化された状態管理
- **ナビゲーション**: React Navigation による複数スクリーン対応
- **データ永続化**: AsyncStorage による ゲームセーブ機能
- **マルチプラットフォーム**: React Native + Expo で iOS/Android 対応

## 技術スタック

### フロントエンド
- **React Native**: UI フレームワーク
- **TypeScript**: 型安全な開発
- **Redux Toolkit**: 状態管理
- **React Navigation**: ナビゲーション
- **AsyncStorage**: ローカルストレージ

### 開発ツール
- **Expo CLI**: プロジェクト管理・ビルド
- **TypeScript**: 型チェック
- **Jest**: ユニットテスト
- **ESLint**: コード品質管理

## ディレクトリ構成

```
src/
├── App.tsx                 # アプリケーションエントリーポイント
├── types/
│   └── index.ts           # TypeScript 型定義（44 インターフェース）
├── redux/
│   ├── store.ts           # Redux ストア設定
│   └── slices/
│       ├── gameSlice.ts   # ゲーム状態管理（13 リデューサー）
│       ├── teamSlice.ts   # チーム状態管理（7 リデューサー）
│       ├── playerSlice.ts # 選手状態管理（7 リデューサー）
│       └── uiSlice.ts     # UI 状態管理（8 リデューサー）
├── services/
│   ├── gameEngine.ts      # ゲーム実行エンジン（試合シミュレーション）
│   ├── dataManager.ts     # データ永続化管理
│   └── tradeEngine.ts     # オフシーズン処理（FA・トレード・ドラフト）
├── screens/
│   ├── MainMenuScreen.tsx # メインメニュー画面
│   ├── GameScreen.tsx     # 試合画面（実装予定）
│   ├── StoveLeagueScreen.tsx # オフシーズン画面（実装予定）
│   └── PlayerDataScreen.tsx # 選手情報画面（実装予定）
├── navigation/
│   └── RootNavigator.tsx  # ナビゲーション設定
└── utils/
    ├── calculations.ts    # 計算ユーティリティ
    ├── constants.ts       # ゲーム定数
    ├── storage.ts         # AsyncStorage ラッパー
    └── helpers.ts         # ヘルパー関数
```

## インストール & セットアップ

### 必須環境
- Node.js 14+
- npm または yarn
- Android SDK（Android 開発用）
- Expo CLI

### インストール手順

```bash
# 1. 依存パッケージのインストール
npm install

# 2. TypeScript 型チェック
npm run type-check

# 3. 開発サーバー起動
npm run start

# 4. Android エミュレーターで実行
npm run android

# 5. iOS シミュレーターで実行（macOS のみ）
npm run ios
```

## 主要機能

### 1. ゲーム実行エンジン (`src/services/gameEngine.ts`)

**基本機能**
- 9 イニングの試合シミュレーション
- 各打席での打者・投手の成績に基づいた確率計算
- 走塁ロジック（進塁・得点判定）
- MVP 自動決定

**実装例**
```typescript
const gameEngine = new GameEngine();
const result = await gameEngine.executeGame(homeTeamId, awayTeamId, gameState);
```

### 2. データ管理 (`src/services/dataManager.ts`)

**主な機能**
- ゲームセーブ/ロード機能
- オートセーブ
- 選手統計記録
- シーズンデータ出力/インポート

### 3. オフシーズン処理 (`src/services/tradeEngine.ts`)

**実装機能**
- FA（フリーエージェント）処理
- トレード実行
- ドラフト指名
- チーム給与管理

### 4. 状態管理 (Redux Slices)

**gameSlice** - ゲーム状態
- ゲームステータス
- イニング・スコア管理
- 試合可能フラグ

**teamSlice** - チーム情報
- チーム成績
- プレイヤーロスター
- 順位表

**playerSlice** - 選手情報
- 選手フィルタリング
- 選手選択
- 統計表示

**uiSlice** - UI 状態
- ローディング状態
- 通知メッセージ
- ダイアログ管理

## ゲーム定数

主なゲーム定数は `src/utils/constants.ts` に集約されています：

```typescript
// チーム
TEAMS: { eagles, marines, baystars, dragons, tigers, carp }

// ポジション
POSITIONS: { P, C, 1B, 2B, 3B, SS, LF, CF, RF, DH }

// ゲーム状態
GAME_STATUS: { BEFORE_GAME, GAME_PLAYING, GAME_ENDED, OFF_SEASON, ... }

// 試合パラメータ
GAME_PARAMETERS: {
  BATTING_AVERAGE_TO_HIT_RATE: 1.0,
  HOME_RUN_RATE_MULTIPLIER: 0.5,
  STRIKEOUT_BASE_RATE: 0.2,
  WALK_BASE_RATE: 0.08,
}
```

## VBA からの変換マッピング

### 主要な変換

| VBA 関数 | TypeScript 実装 | ファイル |
|---------|----------------|---------|
| Sub 試合実行() | `executeGame()` | gameEngine.ts |
| Sub 試合進行() | `simulateGame()` | gameEngine.ts |
| Sub ハーフイニング処理() | `simulateHalfInning()` | gameEngine.ts |
| Sub トレード処理() | `processTrading()` | tradeEngine.ts |
| Sub FA処理() | `processFreeAgency()` | tradeEngine.ts |
| Sub ドラフト処理() | `executeDraft()` | tradeEngine.ts |
| Range データセーブ | `saveGame()` / `saveSaveData()` | dataManager.ts / storage.ts |
| Range データロード | `loadGame()` / `loadSaveData()` | dataManager.ts / storage.ts |

## 計算ロジック

### 打率計算
```typescript
const average = Math.round((hits / atBats) * 1000) / 1000;
```

### 防御率計算
```typescript
const era = Math.round((earnedRuns / inningsPitched) * 100) / 100;
```

### 試合確率
```typescript
// ヒット確率 = 打率 × 1.0
const hitRate = playerStats.average * 1.0;

// ホームラン確率 = 打率 × 0.5
const homeRunRate = playerStats.average * 0.5;

// 三振確率 = 20% + 投手能力
const strikeOutRate = 0.2 + pitcherAbility;
```

## API ドキュメント

### GameEngine

```typescript
class GameEngine {
  // 試合を実行
  async executeGame(homeTeamId, awayTeamId, gameState): Promise<GameResult>
  
  // 試合をシミュレート
  private async simulateGame(teams, gameState): Promise<GameDetail>
  
  // ハーフイニングをシミュレート
  private async simulateHalfInning(inning, phase): Promise<InningResult>
  
  // 打席をシミュレート
  private async simulateAtBat(batter, pitcher): Promise<PlayResult>
}
```

### DataManager

```typescript
class DataManager {
  // ゲームを保存
  async saveGame(gameState): Promise<void>
  
  // ゲームを読み込み
  async loadGame(): Promise<GameState>
  
  // 選手統計を記録
  async recordPlayerStats(playerId, stats): Promise<void>
  
  // シーズンデータをエクスポート
  async exportSeasonData(): Promise<any>
}
```

### TradeEngine

```typescript
class TradeEngine {
  // トレードを実行
  async processTrading(tradeDeal, gameState): Promise<TradeResult>
  
  // FA を処理
  async processFreeAgency(faOffers, gameState): Promise<FreeAgentResult>
  
  // ドラフトを実行
  async executeDraft(draft, gameState): Promise<DraftResult>
  
  // チーム給与を計算
  calculateTeamPayroll(players): number
}
```

## ストレージスキーマ

AsyncStorage に保存されるデータ構造：

```typescript
// ゲーム状態
simbaseball_game_state: GameState

// セーブデータ
simbaseball_season_data: SaveData

// ゲーム設定
simbaseball_settings: GameSettings

// オートセーブ（複数保持、最新5つのみ）
simbaseball_autosave_<timestamp>: GameState
```

## テスト

### ユニットテスト実行
```bash
npm test
```

### 型チェック
```bash
npm run type-check
```

### リント
```bash
npm run lint
```

## トラブルシューティング

### よくある問題

**1. モジュールが見つからないエラー**
```bash
# 解決策: 依存パッケージ再インストール
rm -rf node_modules
npm install
```

**2. TypeScript コンパイルエラー**
```bash
# 解決策: 型チェック実行
npm run type-check

# または手動コンパイル
npx tsc --noEmit
```

**3. AsyncStorage データが読み込めない**
```typescript
// 確認: AsyncStorage が正しく初期化されているか
const data = await loadGameState();
if (data === null) {
  console.log('No saved data found');
}
```

## パフォーマンス最適化

### メモ化
```typescript
const memoizedCalculation = useMemo(() => {
  return calculateGameStats(gameState);
}, [gameState]);
```

### リスト仮想化（大量データ表示時）
```typescript
<FlatList
  data={players}
  renderItem={renderPlayer}
  keyExtractor={item => item.id}
  initialNumToRender={20}
  maxToRenderPerBatch={20}
/>
```

### バッチ処理
```typescript
// 複数の Redux アクション
dispatch(batchActions([
  setGameStatus('playing'),
  incrementInning(),
  updateScores(homeScore, awayScore),
]));
```

## ビルド & デプロイ

### APK ビルド（Android）
```bash
# EAS Build を使用（推奨）
eas build --platform android

# または ローカルビルド
npm run build:android
```

### 本番ビルド設定
```bash
# 環境変数設定
export NODE_ENV=production

# ビルド
npm run build:production
```

## 今後の改善予定

- [ ] SQLite 統合（大規模データセット対応）
- [ ] ネットワーク同期機能
- [ ] マルチプレイヤーモード
- [ ] ゲーム AI 強化
- [ ] グラフィックス最適化
- [ ] オフライン対応強化
- [ ] 複数言語対応

## ライセンス

MIT License

## サポート

問題や質問がある場合は、GitHub Issues で報告してください。

## 参考資料

- [VBA to TypeScript Analysis](./VBA_TO_REACT_ANALYSIS.md)
- [VBA Function Mapping](./VBA_FUNCTION_MAPPING.ts)
- [Implementation Guide](./IMPLEMENTATION_GUIDE.md)
- [Migration Report](./MIGRATION_REPORT.md)

---

**最終更新**: 2024 年
**バージョン**: 1.0.0 (Alpha)
