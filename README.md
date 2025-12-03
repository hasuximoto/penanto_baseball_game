# SimBaseBall React Native Project

Excel VBA で実装された野球ゲーム「SimBaseBall」の React Native (Expo) 移植プロジェクトです。

## 📚 ドキュメント一覧

プロジェクトの詳細については、`markdawn/` ディレクトリ内の以下のドキュメントを参照してください。

- **[PROJECT_STATUS.md](markdawn/PROJECT_STATUS.md)**
  - プロジェクトの現在のステータス、完了した機能、全体的なアーキテクチャの概要。
  - **最初に読むべきドキュメントです。**

- **[SETUP_GUIDE.md](markdawn/SETUP_GUIDE.md)**
  - 開発環境のセットアップ、依存パッケージのインストール、アプリの実行方法。

- **[MIGRATION_LOG.md](markdawn/MIGRATION_LOG.md)**
  - VBA/XML から React Native/SQLite への移行プロセスの詳細記録。
  - データ解析、DBスキーマ設計、データ移行の技術的詳細。

- **[TECHNICAL_DOCS.md](markdawn/TECHNICAL_DOCS.md)**
  - 技術的な詳細ドキュメント。
  - VBAモジュールとTypeScriptファイルの対応関係。
  - Excel数式 (VLOOKUP, RANK等) のTypeScript実装ロジック解説。

## 🚀 クイックスタート

```bash
# 依存パッケージのインストール
npm install

# 開発サーバーの起動
npx expo start
```

## 📁 プロジェクト構造

```
src/
  ├── types/       # TypeScript 型定義
  ├── redux/       # Redux 状態管理
  ├── services/    # ビジネスロジック (GameEngine, DB, etc.)
  ├── screens/     # UI 画面
  ├── navigation/  # ルーティング設定
  └── data/        # 初期データ
```
