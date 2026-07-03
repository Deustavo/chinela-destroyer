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
  mode       text not null
);

-- Índice para ordenar rápido por modo + pontuação
create index if not exists scores_mode_score_idx
  on public.scores (mode, score desc);

-- Liga o Row Level Security
alter table public.scores enable row level security;

-- Qualquer um (anon) pode LER o ranking
create policy "public read scores"
  on public.scores for select
  to anon
  using (true);

-- Qualquer um (anon) pode INSERIR, desde que os dados sejam válidos
create policy "public insert valid scores"
  on public.scores for insert
  to anon
  with check (
    char_length(btrim(name)) between 1 and 20
    and score >= 0
    and score <= 1000000
    and mode in ('normal', 'semFim')
  );

-- (Sem policies de UPDATE/DELETE => ninguém pode editar/apagar via anon.)
```

## 3. Pegar as credenciais

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
  A proteção real é o RLS acima: anon só lê e insere linhas válidas.
- Como é um jogo client-side, um usuário determinado ainda consegue forjar uma
  pontuação chamando a API na mão. As regras de `with check` limitam valores
  absurdos, mas não impedem trapaça total. Para isso seria preciso um backend
  próprio validando o replay da partida — fora do escopo atual.
- Para deploy (itch.io / Vercel), configure as mesmas variáveis de ambiente no
  ambiente de build.
