# CellBall - 移行ログ (VBA/XML to React Native)

**作成日**: 2025年11月29日
**ステータス**: ✅ 移行完了

このドキュメントは、Excel VBA および XML データから React Native アプリケーションへの移行プロセス、特にデータとロジックの変換に関する詳細を記録したものです。

---

## 🔄 移行プロセス概要

### 1. XML データ解析と抽出
- **ソース**: `CellBall.xml` (ODF形式, 533MB)
- **手法**: Python (`xml.etree.ElementTree`) を使用したストリーミング解析 (`iterparse`)。
- **成果**:
  - 選手データ、チームデータ、初期設定値の抽出。
  - 投手データと野手データの構造的差異（ヘッダー行の違い）の解決。
  - `src/data/players_data_fixed.json` 等の中間JSONファイルの生成。

### 2. SQLite データベース構築
- **目的**: アプリ内での高速なデータアクセスと永続化。
- **スキーマ設計**:
  - `players`: 選手基本情報 (ID, 名前, ポジションID等)
  - `player_stats`: 成績情報 (打率, 防御率等)
  - `teams`: チーム情報
  - `team_rosters`: チーム所属情報
  - `game_results`: 試合結果ログ
  - `game_states`: 中断データ保存用
- **実装**: `src/services/databaseManager.ts` にて初期化、マイグレーション、CRUD操作を実装。

### 3. Excel 数式の TypeScript 変換
- **課題**: Excel 独自の関数 (`VLOOKUP`, `RANK`, `CHOOSE` 等) をアプリ内で再現する必要があった。
- **対応**:
  - **解析**: `src/services/formulaExtractor.ts` を作成し、XML内の数式パターンを解析。
  - **実装**: `src/services/formulaCalculations.ts` に等価なロジックを実装。
    - `calculateBattingAverage`: 打率計算
    - `calculateERA`: 防御率計算
    - `calculateSluggingPercentage`: 長打率計算
    - その他、複合スコア計算ロジック

---

## 📝 データ移行の詳細

### 選手データの正規化
- **ポジション**: 文字列（"投", "捕"等）から ID管理（1:投手, 2:捕手...）へ変換。
- **変化球**: 文字列配列から、IDと値を持つオブジェクト配列へ変換。
- **マスタデータ作成**: `positions.json`, `pitch_types.json` を生成。

### データベース初期化フロー
1. アプリ起動 (`App.tsx`)
2. `DatabaseManager.initializeDB()` 呼び出し
3. テーブル存在確認 → なければ作成 (`CREATE TABLE...`)
4. 初期データ (JSON) のインポート (`INSERT INTO...`)
5. Redux ストアへのロード

---

## 🔍 技術的課題と解決策

### 課題: 巨大な XML ファイルの処理
- **問題**: 500MB超の XML を一度に読み込むとメモリ不足になる。
- **解決策**: Python の `iterparse` を使用し、イベント駆動で必要なタグのみを処理することでメモリ使用量を抑制。

### 課題: 投手/野手データの混在
- **問題**: 同じシート内で投手と野手が混在し、ヘッダー行が異なる（1行目:野手, 2行目:投手）。
- **解決策**: 行ごとのデータ特徴（球種データの有無など）を動的に判定し、適用するヘッダー定義を切り替えるロジックを実装。

### 課題: Excel 固有関数の再現
- **問題**: `RANK` 関数などはデータセット全体に依存するため、単純な関数変換では難しい。
- **解決策**: 必要なデータセット（全選手の成績など）を引数として受け取り、メモリ上でソート・順位付けを行うロジックとして実装。
