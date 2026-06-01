# SupportAI Hub

SupportAI Hub é uma central interna de suporte técnico com IA, RAG e tickets simples. O projeto é inspirado apenas no conceito de uma central de perguntas e respostas com base própria; não usa código, layout, textos ou estrutura proprietária do KoalaQA.

## Stack

- Next.js 16 com App Router
- TypeScript
- Tailwind CSS
- Neon PostgreSQL
- pgvector para busca semântica com cosine similarity
- Drizzle ORM
- DeepSeek Chat Completions
- Deploy compatível com Vercel

## Funcionalidades

- Login em `/login` com usuários cadastrados na tabela `users`.
- Proteção de rotas internas por cookie de sessão assinado.
- Dashboard com totais de artigos, documentos, tickets abertos, perguntas sem resposta e últimos atendimentos.
- Cadastro de sistemas/produtos em `/systems`.
- CRUD básico de artigos em `/knowledge` e `/knowledge/new` com chunking e embeddings.
- Upload de PDF, TXT e Markdown em `/documents` com extração de texto, chunking e embeddings.
- Chat RAG em `/chat`, com busca dos 5 a 8 chunks mais relevantes no pgvector e resposta via DeepSeek.
- Fontes exibidas em cada resposta da IA.
- Feedback positivo/negativo e registro de perguntas sem resposta.
- Tickets simples em `/tickets` e `/tickets/[id]` com comentários, status e prioridade.
- Insights em `/insights` para transformar perguntas sem resposta em artigos.
- Configuração de modelo, temperatura, tokens e prompt base em `/settings/ai`.

## Variáveis de ambiente

Copie `.env.example` para `.env` e ajuste:

```bash
cp .env.example .env
```

| Variável | Descrição |
| --- | --- |
| `DATABASE_URL` | String de conexão PostgreSQL do Neon com SSL. |
| `DEEPSEEK_API_KEY` | Chave da API DeepSeek. |
| `DEEPSEEK_MODEL` | Modelo de chat, por padrão `deepseek-chat`. |
| `APP_SECRET` | Segredo longo para assinar cookies de sessão. |
| `ADMIN_EMAIL` | E-mail do admin criado pelo seed. |
| `ADMIN_PASSWORD` | Senha do admin criado pelo seed. |

## Habilitar pgvector no Neon

1. Crie um projeto PostgreSQL no Neon.
2. Copie a connection string pooled ou direct para `DATABASE_URL`.
3. A migration já executa `CREATE EXTENSION IF NOT EXISTS vector;`.
4. Se sua organização restringir extensões, habilite `vector` no painel SQL do Neon executando:

```sql
CREATE EXTENSION IF NOT EXISTS vector;
```

## Instalação local

```bash
npm install
npm run db:migrate
npm run db:seed
npm run dev
```

Acesse `http://localhost:3000/login` e entre com o usuário seedado. Por padrão:

- E-mail: `admin@supportai.local`
- Senha: `Admin@123456`

## Comandos úteis

```bash
npm run dev        # desenvolvimento
npm run build      # build de produção
npm run start      # servidor de produção local
npm run typecheck  # checagem TypeScript
npm run lint       # ESLint
npm run db:migrate # aplica SQL em migrations/
npm run db:seed    # cria admin, sistemas de exemplo e configuração de IA
```

## Deploy na Vercel

1. Envie o repositório para GitHub/GitLab/Bitbucket.
2. Importe o projeto na Vercel.
3. Configure as variáveis `DATABASE_URL`, `DEEPSEEK_API_KEY`, `DEEPSEEK_MODEL` e `APP_SECRET`.
4. Execute `npm run db:migrate` e `npm run db:seed` em ambiente seguro antes do primeiro acesso. Você pode rodar localmente apontando para o banco Neon de produção.
5. Faça o deploy. O app não depende de servidor persistente e usa rotas/server actions compatíveis com serverless.

## Como o RAG funciona

1. Artigos e documentos são quebrados em chunks por `lib/chunking.ts`.
2. Cada chunk recebe um embedding determinístico de 1536 dimensões em `lib/embeddings.ts`.
3. Os vetores são salvos em `document_chunks.embedding vector(1536)`.
4. A função SQL `match_document_chunks` usa o operador `<=>` do pgvector para distância de cosseno.
5. O chat busca até 8 chunks relevantes por sistema, monta contexto e chama a API DeepSeek.
6. Se a similaridade for baixa, a resposta informa falta de base suficiente e sugere abrir ticket.

> Observação: o gerador de embeddings local é leve e serverless-friendly. Em produção, você pode trocar `createEmbedding` por um provedor dedicado de embeddings mantendo a mesma dimensão ou ajustando a migration.

## Segurança e operação

- Senhas são armazenadas com `scrypt` e salt por usuário.
- Cookies de sessão são `httpOnly`, `sameSite=lax` e assinados com `APP_SECRET`.
- Inputs principais são validados com Zod.
- O prompt instrui a IA a responder em português do Brasil, não inventar e usar apenas fontes recuperadas.
