# Private Repository での配布方法

## Option 1: Direct Binary Distribution（推奨）

### 1-1. バイナリ作成
```bash
cd cli
npm run build:release
cp dist/bin/index.js cchighway
chmod +x cchighway
```

### 1-2. 配布・インストール
```bash
# ユーザーがバイナリをダウンロード後
sudo cp cchighway /usr/local/bin/
# または
cp cchighway ~/.local/bin/  # PATHに~/.local/binを追加

# 動作確認
cchighway --version
```

## Option 2: npm Private Registry

### 2-1. GitHub Packages使用
```bash
# .npmrc に追加
@kishikawa1286:registry=https://npm.pkg.github.com

# package.json に追加
"publishConfig": {
  "registry": "https://npm.pkg.github.com"
}

# 公開
npm publish

# インストール（認証必要）
npm login --registry=https://npm.pkg.github.com
npm install -g @kishikawa1286/cchighway
```

## Option 3: Git直接インストール

### 3-1. npm git install
```bash
# Private repoから直接インストール（認証必要）
npm install -g git+https://github.com/Kishikawa1286/cchighway.git#main

# または特定のコミット
npm install -g git+https://github.com/Kishikawa1286/cchighway.git#v1.0.0
```

## Option 4: カスタムインストーラー

### 4-1. インストールスクリプト作成
```bash
#!/bin/bash
# install.sh
INSTALL_DIR="/usr/local/bin"
BINARY_URL="https://github.com/Kishikawa1286/cchighway/releases/download/v1.0.0/cchighway"

echo "Installing CCHighway..."
curl -L "$BINARY_URL" -o "$INSTALL_DIR/cchighway"
chmod +x "$INSTALL_DIR/cchighway"
echo "✅ Installation complete: cchighway --version"
```

### 4-2. 使用方法
```bash
curl -sSL https://raw.githubusercontent.com/Kishikawa1286/cchighway/main/install.sh | bash
```

## 推奨構成まとめ

### セキュリティレベル別
1. **Low（推奨）**: Public Tap + Private Main → 最も使いやすい
2. **Medium**: GitHub Packages → npm認証必要
3. **High**: Direct Binary → 手動配布
4. **Maximum**: Git直接 → 開発者向け