# CellBall - 技術ドキュメント & 開発ガイド

**最終更新日**: 2025年11月29日

---

## 📚 目次

1. [VBA から React Native へのマッピング](#1-vba-から-react-native-へのマッピング)
2. [数式変換ロジック詳細](#2-数式変換ロジック詳細)
3. [開発ガイド](#3-開発ガイド)

---

## 1. VBA から React Native へのマッピング

### 1.1 モジュール対応表

| VBA モジュール | React Native (TypeScript) | 説明 |
|---------------|---------------------------|------|
| `Module_main.bas` | `src/services/gameEngine.ts` | ゲーム進行、イニング処理、勝敗判定 |
| `Module_file.bas` | `src/services/databaseManager.ts` | データのセーブ・ロード (SQLite/AsyncStorage) |
| `Module_other.bas` | `src/services/tradeEngine.ts` | トレード、FA、契約更改 |
| `Module_off.bas` | `src/redux/slices/teamSlice.ts` | オフシーズン処理、チーム編成 |

### 1.2 フォーム/画面対応表

| VBA フォーム (`.frm`) | React Native Screen (`src/screens/`) |
|---------------------|-----------------------------------|
| `main_menu.frm` | `MainMenuScreen.tsx` |
| `player_data.frm` | `PlayerDetailScreen.tsx` (予定) |
| `team_info.frm` | `TeamInfoScreen.tsx` (予定) |
| `siai_kekka.frm` | `GameResultScreen.tsx` (予定) |

---

## 2. 数式変換ロジック詳細

Excel で使用されていた主要な計算ロジックの TypeScript 実装について解説します。

### 2.1 統計計算 (`src/services/formulaCalculations.ts`)

#### 打率 (Batting Average)
- **Excel**: `=HITS/AT_BATS`
- **TS**:
  ```typescript
  export const calculateBattingAverage = (hits: number, atBats: number): number => {
    if (atBats === 0) return 0;
    return hits / atBats;
  };
  ```

#### 防御率 (ERA)
- **Excel**: `=(ER * 9) / IP`
- **TS**:
  ```typescript
  export const calculateERA = (earnedRuns: number, inningsPitched: number): number => {
    if (inningsPitched === 0) return 0;
    return (earnedRuns * 9) / inningsPitched;
  };
  ```

### 2.2 複雑な関数

#### RANK (順位付け)
Excel の `RANK` 関数は、データセット全体との比較が必要です。
TypeScript では、対象配列を受け取り、ソートしてインデックスを返す形で実装します。

```typescript
export const calculateRank = (value: number, dataset: number[], order: 'asc' | 'desc' = 'desc'): number => {
  const sorted = [...dataset].sort((a, b) => order === 'desc' ? b - a : a - b);
  return sorted.indexOf(value) + 1;
};
```

---

## 3. 開発ガイド

### 3.1 環境構築

1. **Node.js**: v16 以上推奨
2. **パッケージインストール**:
   ```bash
   npm install
   ```
3. **Expo サーバー起動**:
   ```bash
   npx expo start
   ```

### 3.2 ディレクトリ構造のルール

- **`src/components/`**: 再利用可能な UI コンポーネント（ボタン、カード等）。
- **`src/screens/`**: 1つの画面全体を表すコンポーネント。`navigation` から呼び出される。
- **`src/redux/slices/`**: Redux Toolkit の Slice ファイル。機能単位で分割。
- **`src/services/`**: UI に依存しないビジネスロジック。純粋な TypeScript クラス/関数。

### 3.3 データベース変更手順

スキーマを変更する場合：
1. `src/services/databaseManager.ts` の `initDB` メソッド内の `CREATE TABLE` 文を修正。
2. 既存のアプリデータを削除（アンインストール）して再実行するか、マイグレーションロジックを追加する。

### 3.4 新しい画面の追加

1. `src/screens/` に新しいコンポーネントファイルを作成 (例: `NewScreen.tsx`)。
2. `src/navigation/RootNavigator.tsx` (または該当する Navigator) にスクリーンを登録。
3. 必要な画面から `navigation.navigate('NewScreen')` で遷移。
