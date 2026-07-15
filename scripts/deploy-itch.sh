#!/usr/bin/env bash
#
# Builda o projeto e publica direto no itch.io usando o butler (CLI oficial).
# Não abre navegador nem precisa de upload manual.
#
# Autenticação: exporte BUTLER_API_KEY (pegue em https://itch.io/user/settings/api-keys,
# seção "API keys" -> gerar uma nova) ou coloque no .env do projeto.
#
# Uso:
#   ./scripts/deploy-itch.sh            # build + upload
#   ./scripts/deploy-itch.sh --no-build # apenas re-envia o dist/ existente

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

BUTLER="$ROOT_DIR/.butler/butler"
DIST_DIR="dist"
ITCH_TARGET="deustavo/chinela-destroyer:html5"

if [[ ! -x "$BUTLER" ]]; then
  echo "ERRO: butler não encontrado em $BUTLER." >&2
  echo "Baixe em https://itch.io/docs/butler/installing.html" >&2
  exit 1
fi

# Carrega BUTLER_API_KEY do .env se não estiver no ambiente.
if [[ -z "${BUTLER_API_KEY:-}" && -f "$ROOT_DIR/.env" ]]; then
  BUTLER_API_KEY="$(grep -E '^BUTLER_API_KEY=' "$ROOT_DIR/.env" | cut -d '=' -f2- || true)"
fi

if [[ -z "${BUTLER_API_KEY:-}" ]]; then
  echo "ERRO: BUTLER_API_KEY não definida." >&2
  echo "Gere uma em https://itch.io/user/settings/api-keys e exporte:" >&2
  echo "  export BUTLER_API_KEY=sua-chave" >&2
  echo "ou adicione BUTLER_API_KEY=sua-chave no .env do projeto." >&2
  exit 1
fi
export BUTLER_API_KEY

if [[ "${1:-}" != "--no-build" ]]; then
  echo "==> Rodando build de produção (npm run build)..."
  npm run build
else
  echo "==> Pulando build (--no-build); enviando dist/ existente."
fi

if [[ ! -f "$DIST_DIR/index.html" ]]; then
  echo "ERRO: $DIST_DIR/index.html não encontrado. A build falhou?" >&2
  exit 1
fi

echo "==> Publicando $DIST_DIR/ em $ITCH_TARGET..."
"$BUTLER" push "$DIST_DIR" "$ITCH_TARGET"

echo ""
echo "==> Pronto! Build publicada em https://deustavo.itch.io/chinela-destroyer"
