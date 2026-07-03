#!/usr/bin/env bash
#
# Gera a build de produção e empacota um .zip pronto para upload no itch.io.
# O itch.io exige que o index.html esteja na RAIZ do zip — é exatamente
# o que este script faz ao zipar o conteúdo de dist/ (e não a pasta dist/).
#
# Uso:
#   ./scripts/build-itch.sh            # build + zip
#   ./scripts/build-itch.sh --no-build # apenas re-empacota o dist/ existente

set -euo pipefail

# Raiz do projeto (um nível acima de scripts/), independente de onde é chamado.
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

DIST_DIR="dist"
ZIP_NAME="chinela-destroyer.zip"

if [[ "${1:-}" != "--no-build" ]]; then
  echo "==> Rodando build de produção (npm run build)..."
  npm run build
else
  echo "==> Pulando build (--no-build); re-empacotando dist/ existente."
fi

if [[ ! -f "$DIST_DIR/index.html" ]]; then
  echo "ERRO: $DIST_DIR/index.html não encontrado. A build falhou?" >&2
  exit 1
fi

echo "==> Empacotando $DIST_DIR/ em $ZIP_NAME..."
# Remove um zip antigo dentro do dist para não empacotá-lo dentro de si mesmo.
rm -f "$DIST_DIR/$ZIP_NAME"

# Zipa a partir de dentro do dist para que index.html fique na raiz do zip.
# O zip final é gravado no ROOT do projeto (não dentro do dist).
rm -f "$ROOT_DIR/$ZIP_NAME"
( cd "$DIST_DIR" && zip -r -q "$ROOT_DIR/$ZIP_NAME" . -x "$ZIP_NAME" )

SIZE="$(du -h "$ROOT_DIR/$ZIP_NAME" | cut -f1)"
echo ""
echo "==> Pronto! -> $ROOT_DIR/$ZIP_NAME ($SIZE)"
echo "    Faça upload no itch.io e marque 'This file will be played in the browser'."
