# Homebrew配布セットアップガイド

## 1. GitHub Release作成

### 1-1. リリース準備
```bash
cd cli
./scripts/prepare-release.sh
```

### 1-2. GitHubでリリース作成
1. https://github.com/Kishikawa1286/cchighway/releases/new にアクセス
2. Tag version: `v1.0.0`
3. Release title: `CCHighway v1.0.0`
4. Description: リリースノートを記載
5. `releases/cchighway-1.0.0` ファイルをアップロード
6. "Publish release" をクリック

### 1-3. SHA256取得とFormula更新
```bash
# リリース後、SHA256を取得
curl -sL https://github.com/Kishikawa1286/cchighway/archive/refs/tags/v1.0.0.tar.gz | shasum -a 256

# 結果をcchighway.rbのsha256フィールドに設定
```

## 2. Homebrew Tap Repository作成

### 2-1. 新規リポジトリ作成
1. GitHub で新規リポジトリ作成: `homebrew-cchighway`
2. **Public に設定**（Privateだとbrew tapできない）
3. README.md は作成しない（後で追加）

#### Private Repository の場合の注意点
- **メインリポジトリ**: Private OK（GitHub Releasesは公開可能）
- **Tap リポジトリ**: 必ず Public（Formula配布用）
- **結果**: ソースは非公開、インストールは可能

### 2-2. Tap Repository セットアップ
```bash
# ローカルでTapリポジトリをクローン
git clone https://github.com/Kishikawa1286/homebrew-cchighway.git
cd homebrew-cchighway

# ファイルをコピー
cp ../cchighway/cli/cchighway.rb ./Formula/cchighway.rb
cp ../cchighway/cli/homebrew-tap-README.md ./README.md

# 初回コミット
git add .
git commit -m "Initial release: CCHighway v1.0.0"
git push origin main
```

## 3. インストールテスト

### 3-1. ローカルテスト
```bash
# Tapを追加
brew tap Kishikawa1286/cchighway

# インストール
brew install cchighway

# 動作確認
cchighway --version
cchighway status
```

### 3-2. アンインストール（テスト用）
```bash
brew uninstall cchighway
brew untap Kishikawa1286/cchighway
```

## 4. 更新手順（将来のバージョン用）

### 4-1. 新バージョンリリース
1. `package.json` のバージョンを更新
2. GitHub で新しいリリースを作成
3. 新しいSHA256を取得

### 4-2. Formula更新
```bash
cd homebrew-cchighway
# Formula/cchighway.rb を更新（url, sha256, version）
git add Formula/cchighway.rb
git commit -m "Update to v1.x.x"
git push origin main
```

### 4-3. ユーザー更新
```bash
brew update
brew upgrade cchighway
```

## 5. 配布完了後のユーザー向け使用方法

```bash
# インストール
brew tap Kishikawa1286/cchighway
brew install cchighway

# 使用開始
cchighway init    # 初期セットアップ
cchighway start   # サーバー起動
```

## トラブルシューティング

### Node.js依存関係の問題
```bash
# Homebrewでインストールされたものを確認
brew list node
brew info node
```

### Formula構文チェック
```bash
# Formulaの構文確認
brew audit --strict Formula/cchighway.rb
```

### インストールログ確認
```bash
# インストール時の詳細ログ
brew install --verbose cchighway
```
