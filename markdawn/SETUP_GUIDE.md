# CellBall React Native - セットアップガイド

このガイドでは、CellBall React Native アプリケーションの初期セットアップと実行方法を説明します。

## 前提条件

以下がインストールされていることを確認してください：

- **Node.js** 16.x 以上
- **npm** 8.x 以上
- **Expo CLI**（グローバルインストール推奨ですが、npxでも可）
- **Android Studio & Android SDK**（Android エミュレータを使用する場合）
- **Expo Go アプリ**（実機で動作確認する場合）

## インストール手順

### 1. プロジェクトディレクトリへ移動

`ash
cd penanto_baseball_game
``n
### 2. 依存パッケージのインストール

`ash
pm install
``n
**トラブルシューティング**:
- 依存関係の解決に失敗する場合やキャッシュの問題がある場合：
  `ash
  npm cache clean --force
  rm -rf node_modules package-lock.json
  npm install
  ``n
### 3. TypeScript 型チェック実行

開発前に型エラーがないことを確認します。

`ash
pm run type-check
``n
**期待される結果**: Found 0 errors.`n
## アプリケーションの実行

### 開発サーバーの起動

`ash
npx expo start
``n
または

`ash
pm start
``n
### 実行オプション

- **Android エミュレータで実行**: ターミナルで  を押す。
- **iOS シミュレータで実行**: ターミナルで i を押す (macOSのみ)。
- **実機で実行**: 表示された QR コードをスマートフォンのカメラ (iOS) または Expo Go アプリ (Android) でスキャンする。

## 開発のヒント

- **ホットリロード**: コードを保存すると自動的にアプリに変更が反映されます。
- **デバッグメニュー**: 実機をシェイクするか、エミュレータで Ctrl+M (Android) / Cmd+D (iOS) を押すとデバッグメニューが開きます。
- **データベース確認**: SQLite データベースファイルはアプリのサンドボックス内に作成されます。開発中は初期化ロジックにより、起動時にデータがリセットまたはロードされる場合があります (App.tsx 参照)。
