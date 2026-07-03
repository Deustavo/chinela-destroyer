# Ranking online (Supabase) — passo a passo

O ranking online usa o [Supabase](https://supabase.com) (Postgres + API REST). O
front acessa a API direto do navegador usando a **anon key** (chave pública). O
que protege a tabela é o **Row Level Security (RLS)**, não o segredo da chave.

Enquanto as variáveis `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` estiverem
vazias, o jogo funciona normalmente e a tela de Ranking mostra
"Ranking online indisponível" — nada quebra.

## 1. Criar o projeto

1. Crie uma conta em https://supabase.com e clique em **New project**.
2. Escolha nome, senha do banco e região (de preferência perto do Brasil, ex.
   `South America (São Paulo)`).
3. Espere o provisionamento terminar (~1 min).

## 2. Criar a tabela e as regras (SQL)

No painel do projeto, vá em **SQL Editor → New query**, cole o SQL abaixo e clique
em **Run**:

```sql
-- Tabela de pontuações
create table if not exists public.scores (
  id         bigint generated always as identity primary key,
  created_at timestamptz not null default now(),
  name       text not null,
  score      integer not null,
  mode       text not null,
  nonce      text            -- nonce de uso único carregado pelo token da partida
);

-- Índice para ordenar rápido por modo + pontuação
create index if not exists scores_mode_score_idx
  on public.scores (mode, score desc);

-- Cada token de partida só pode inserir uma vez (bloqueia replay)
create unique index if not exists scores_nonce_key
  on public.scores (nonce);

-- Liga o Row Level Security
alter table public.scores enable row level security;

-- Qualquer um (anon) pode LER o ranking
create policy "public read scores"
  on public.scores for select
  to anon
  using (true);

-- IMPORTANTE: NÃO existe policy de INSERT para o anon. O cliente não consegue
-- inserir direto em /rest/v1/scores — todo score passa pela Edge Function
-- `submit-score` (seção 3), que insere com a service_role key (fura o RLS).
-- (Sem policies de UPDATE/DELETE => ninguém edita/apaga via anon.)
```

> Se você já tinha rodado a versão antiga deste SQL (com a policy de insert do
> anon), rode o migration [supabase/migrations/0002_gateway_scores.sql](supabase/migrations/0002_gateway_scores.sql)
> no SQL Editor — ele remove a policy antiga e adiciona a coluna `nonce`.

## 3. Publicar as Edge Functions (a proteção anti-trapaça)

O que impede um usuário de forjar pontuações não é o SQL acima — é a Edge
Function. O cliente pede um **token assinado** ao começar a partida (`start-run`)
e devolve esse token ao enviar o score (`submit-score`). O servidor usa o
timestamp embutido no token pra **rejeitar scores altos demais para o tempo
decorrido**, além de bloquear replay (nonce de uso único) e valores absurdos. O
segredo de assinatura mora só no servidor — nunca vai no bundle.

Tudo roda no **plano gratuito** do Supabase (Edge Functions = serverless, sem
servidor pra pagar/manter). Você precisa do [CLI do Supabase](https://supabase.com/docs/guides/cli):

```bash
# 1. Login e vincule o projeto (o ref está em Project Settings → General)
supabase login
supabase link --project-ref SEU_PROJECT_REF

# 2. Defina o segredo de assinatura (uma string longa e aleatória qualquer)
supabase secrets set SCORE_SIGNING_SECRET="$(openssl rand -hex 32)"

# 3. Publique as duas functions
supabase functions deploy start-run
supabase functions deploy submit-score
```

As functions já vêm com `verify_jwt = false` em
[supabase/config.toml](supabase/config.toml) (a anon key é pública, então a
verificação de JWT não agregaria segurança — quem protege é o token HMAC). As
variáveis `SUPABASE_URL` e `SUPABASE_SERVICE_ROLE_KEY` que a `submit-score` usa
são injetadas automaticamente pelo Supabase no runtime — você **não** precisa
configurá-las.

## 3b. Pegar as credenciais do cliente

No painel: **Project Settings → API**.

- **Project URL** → cole em `VITE_SUPABASE_URL`
- **Project API keys → `anon` `public`** → cole em `VITE_SUPABASE_ANON_KEY`

No arquivo `.env` do projeto:

```env
VITE_SUPABASE_URL=https://SEU-PROJETO.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOi... (a anon public key)
```

Reinicie o `npm run dev` para o Vite recarregar o `.env`.

## 4. Testar

1. Jogue e **bata seu recorde pessoal** (no modo Normal ou Sem Fim).
2. Na tela de Game Over deve aparecer o campo para digitar o nome → **Enviar**.
3. Volte ao menu → **Ranking** → alterne entre **Normal** e **Sem Fim** para ver
   as pontuações.

## Notas de segurança

- A anon key é pública por design (vai no bundle, igual ao `VITE_STORAGE_SECRET`).
  Ela só permite **ler** o ranking — não dá mais pra inserir com ela.
- Todo score passa pela Edge Function `submit-score`, que valida no servidor:
  1. **assinatura HMAC** do token de partida (segredo só existe no servidor);
  2. **plausibilidade tempo × score** — rejeita altura alta demais para o tempo
     decorrido desde o início da partida (ceiling generoso de ~120 unidades/s,
     bem acima do máximo físico do jogo, então jogador legítimo nunca é barrado);
  3. **replay** — o `nonce` de uso único impede reenviar o mesmo token;
  4. **valores** — nome (1–20 chars), score (0–5.000.000), modo válido.
- Para deploy (itch.io / Vercel), configure as mesmas variáveis de ambiente no
  ambiente de build. As Edge Functions você publica uma vez com o CLI (seção 3);
  não dependem do ambiente de build do front.
