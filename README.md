<div align="center">
  <img src="./frontend/public/favicon.svg" alt="Logo Cine Chapéu" width="120" />
  <h1>Cine Chapéu • Clube de Cinema</h1>
  <p><strong>Plataforma web completa, responsiva e cinematográfica desenvolvida para gerenciar sessões, sorteios com física animada, debates, premiações do Oscar e transmissões sincronizadas (Watch Party) de um clube de cinema entre amigos.</strong></p>

  <p>
    <img src="https://img.shields.io/badge/React-18.3-61DAFB?style=for-the-badge&logo=react&logoColor=black" alt="React 18" />
    <img src="https://img.shields.io/badge/TypeScript-5.7-3178C6?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript" />
    <img src="https://img.shields.io/badge/Tailwind_CSS-3.4-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white" alt="Tailwind CSS" />
    <img src="https://img.shields.io/badge/Node.js-20+-339933?style=for-the-badge&logo=node.js&logoColor=white" alt="Node.js" />
    <img src="https://img.shields.io/badge/Express-4.21-000000?style=for-the-badge&logo=express&logoColor=white" alt="Express" />
    <img src="https://img.shields.io/badge/MongoDB-Atlas-47A248?style=for-the-badge&logo=mongodb&logoColor=white" alt="MongoDB" />
    <img src="https://img.shields.io/badge/Vercel-Serverless-000000?style=for-the-badge&logo=vercel&logoColor=white" alt="Vercel" />
    <img src="https://img.shields.io/badge/GitHub_Actions-CI%2FCD-2088FF?style=for-the-badge&logo=github-actions&logoColor=white" alt="CI/CD" />
  </p>
</div>

---

## 🌟 Principais Funcionalidades

- 🎬 **Catálogo Inteligente:** Histórico completo de sessões com integração em tempo real à API do [TMDB (The Movie Database)](https://www.themoviedb.org/), realizando resgate automático de metadados, pôsteres em alta definição, diretores, elenco, gêneros, sinopses e duração.
- 🎩 **A Roleta do Chapéu:** Sistema de sorteio interativo renderizado em HTML5 Canvas com desaceleração física realista e efeitos sonoros gerados via Web Audio API para eleger o amigo responsável e a categoria temática da próxima sessão.
- 🍿 **Watch Party (Sessão Ao Vivo):** Módulo de transmissão em tempo real integrado via VDO.Ninja com baixa latência, permitindo ao administrador compartilhar a tela com áudio do sistema enquanto todos os membros assistem sincronizados no player cinematográfico nativo sem bloqueios de NAT/CGNAT.
- 🏆 **Oscar do Cine Chapéu:** Evento anual completo composto por cadastro de categorias personalizadas, período com janela confidencial de votação para os integrantes e o **Dashboard do Apresentador** — interface dinâmica e dramática com revelação progressiva de indicados e vencedores ao vivo.
- 📊 **Tier List Interativa:** Motor dinâmico para classificação visual dos filmes assistidos, com suporte a filtros por períodos e temporadas históricas (2024, 2025, 2026), modo genérico com upload de imagens e exportação em alta qualidade (PNG).
- 🔒 **Segurança Simples (Admin PIN):** Leitura 100% aberta e transparente para todos os membros acompanharem o clube, associada a proteção por PIN de Administrador no cabeçalho HTTP (`x-admin-pin`) para operações de mutação (cadastro, edição, exclusão, apuração de votos e sorteios).

---

## 🏛️ Arquitetura do Repositório

O projeto é organizado como um monorepo TypeScript claro e desacoplado:

```
Cine_Chapeu/
├── .github/
│   └── workflows/
│       └── ci-cd-release.yml   # Pipeline CI/CD com SemVer automático
├── api/
│   └── index.ts                # Adaptador Serverless para deploy na Vercel
├── backend/                    # API RESTful em Node.js + Express + Mongoose
│   ├── src/
│   │   ├── config/             # Configuração e pool de conexão com MongoDB Atlas
│   │   ├── controllers/        # Handlers HTTP desacoplados
│   │   ├── middlewares/        # Proteção por PIN de Administrador (authMiddleware)
│   │   ├── models/             # Schemas tipados Mongoose (Member, Movie, Session, Award, etc.)
│   │   ├── routes/             # Definição e agrupamento dos endpoints RESTful
│   │   ├── services/           # Regras de negócio, cálculos e integração TMDB
│   │   ├── seed/               # Carga inicial de dados para desenvolvimento
│   │   ├── importar_legado.ts  # Pipeline ETL para planilhas históricas CSV
│   │   └── limpar_banco.ts     # Utilitário para expurgo e reset de dados
│   ├── tsconfig.json
│   └── package.json
├── frontend/                   # SPA moderna em React 18 + Vite + Tailwind CSS
│   ├── src/
│   │   ├── api/                # Cliente Axios com interceptors de autenticação
│   │   ├── components/         # Modais, Cards, Filtros, Player e Roleta
│   │   ├── context/            # Contexto global de autenticação (AuthContext)
│   │   ├── pages/              # Telas (Home, Sorteio, Watch Party, Tier List, Oscar, Apresentador)
│   │   └── types/              # Interfaces TypeScript compartilhadas
│   ├── index.html
│   ├── vite.config.ts
│   └── package.json
├── vercel.json                 # Roteamento e Serverless Functions na Vercel
├── package.json                # Scripts globais do monorepo
└── README.md
```

---

## 🛠️ Tecnologias Utilizadas

### **Frontend**
- **Framework:** [React 18](https://react.dev/) com [Vite](https://vitejs.dev/) & [TypeScript](https://www.typescriptlang.org/)
- **Estilização:** [Tailwind CSS](https://tailwindcss.com/) (Tema dark cinematográfico com acentos em âmbar/dourado Oscar)
- **Tipografia:** Google Fonts ([Cinzel](https://fonts.google.com/specimen/Cinzel), [Outfit](https://fonts.google.com/specimen/Outfit) & [DM Sans](https://fonts.google.com/specimen/DM+Sans))
- **Ícones:** [Lucide React](https://lucide.dev/)
- **Comunicação HTTP:** [Axios](https://axios-http.com/)
- **Exportação Gráfica:** [html-to-image](https://github.com/bubkoo/html-to-image)
- **Roteamento:** [React Router Dom v6](https://reactrouter.com/)

### **Backend**
- **Runtime:** [Node.js](https://nodejs.org/) & [Express](https://expressjs.com/) com TypeScript
- **Banco de Dados:** [MongoDB Atlas](https://www.mongodb.com/atlas) & [Mongoose](https://mongoosejs.com/)
- **Catálogo de Filmes:** API REST do [The Movie Database (TMDB)](https://www.themoviedb.org/documentation/api)
- **Processamento de Dados:** [csv-parser](https://github.com/mafintosh/csv-parser) para migração de dados legados

### **Infraestrutura & Automação**
- **Hospedagem Serverless:** [Vercel](https://vercel.com/) com rotas `/api/*` mapeadas em Serverless Functions
- **CI/CD Pipeline:** [GitHub Actions](https://github.com/features/actions) com versionamento semântico automático (SemVer via Conventional Commits) e geração de Releases/Tags

---

## ⚙️ Como Executar Localmente

### 1. Pré-requisitos
- **Node.js** (versão 20 ou superior recomendada)
- **npm** (ou **yarn**)
- Cluster no **MongoDB Atlas** ou instância local do MongoDB

---

### 2. Configuração de Variáveis de Ambiente (`.env`)

#### **Backend (`backend/.env`):**
```env
PORT=5000
MONGODB_URI=mongodb+srv://<usuario>:<senha>@<cluster>.mongodb.net/cine_chapeu?retryWrites=true&w=majority
TMDB_API_KEY=sua_chave_da_api_tmdb
TMDB_TOKEN=seu_bearer_token_tmdb
TMDB_BASE_URL=https://api.themoviedb.org/3
FRONTEND_URL=http://localhost:5173
ADMIN_PIN=2026
```

#### **Frontend (`frontend/.env`):**
```env
VITE_API_URL=http://localhost:5000
VITE_GOOGLE_DRIVE_URL=https://drive.google.com/drive/folders/seu_id_aqui
```

---

### 3. Instalação e Execução

Você pode instalar e rodar os projetos a partir da raiz do monorepo ou entrando em cada diretório individualmente:

#### **Opção A: Rodando pela Raiz (Recomendado)**
```bash
# Instalar dependências da raiz, front e back
npm install
npm run build:frontend
npm run build:backend

# Iniciar o servidor da API (Porta 5000)
npm run dev:backend

# Em outro terminal, iniciar o Frontend Vite (Porta 5173)
npm run dev:frontend
```

#### **Opção B: Rodando Diretamente em Cada Pasta**

**Backend:**
```bash
cd backend
npm install

# (Opcional) Popular banco com dados iniciais:
npm run seed

# (Opcional) Importar planilhas históricas em CSV:
npm run import:legado

# Iniciar em modo de desenvolvimento (tsx watch):
npm run dev
```
> A API estará acessível em `http://localhost:5000/api` (Health check: `/api/health`).

**Frontend:**
```bash
cd frontend
npm install

# Iniciar em modo de desenvolvimento:
npm run dev
```
> O frontend estará acessível em `http://localhost:5173`.

---

## 📜 Scripts Disponíveis

### **Na Raiz (`/`)**
| Comando | Descrição |
| :--- | :--- |
| `npm run dev:frontend` | Inicia o servidor de desenvolvimento do Vite |
| `npm run dev:backend` | Inicia o servidor Express com `tsx watch` |
| `npm run build` | Compila o frontend para produção (`dist/`) |
| `npm run build:frontend` | Instala pacotes e compila o frontend |
| `npm run build:backend` | Instala pacotes e compila o TypeScript do backend |

### **No Backend (`/backend`)**
| Comando | Descrição |
| :--- | :--- |
| `npm run dev` | Executa a API com recarregamento a quente via `tsx` |
| `npm run build` | Compila o TypeScript para JavaScript CommonJS em `dist/` |
| `npm run start` | Executa o build de produção a partir de `dist/server.js` |
| `npm run seed` | Popula o MongoDB com dados iniciais de demonstração |
| `npm run import:legado` | Executa o pipeline ETL das tabelas históricas em CSV |
| `npm run limpar:banco` | Remove todos os dados de sessões, filmes e membros para testes limpos |

---

## 🚀 Deploy em Produção (Vercel)

A plataforma foi arquitetada nativamente para deploy contínuo na **Vercel**:
1. O arquivo [`vercel.json`](./vercel.json) direciona todas as requisições `/api/(.*)` para a Serverless Function em [`api/index.ts`](./api/index.ts).
2. As demais rotas são entregues como Single Page Application com fallback para `index.html`.
3. Basta importar o repositório na dashboard da Vercel e configurar as variáveis de ambiente (`MONGODB_URI`, `TMDB_API_KEY`, `TMDB_TOKEN`, `ADMIN_PIN`, etc.).

---

## 🔄 Integração Contínua (CI/CD)

O pipeline do GitHub Actions ([`.github/workflows/ci-cd-release.yml`](./.github/workflows/ci-cd-release.yml)) é acionado a cada push ou pull request na branch `main`:
- Validação estrita de tipagem e build do Frontend (`tsc && vite build`).
- Validação de tipagem e build do Backend (`tsc`).
- Cálculo automático de versão SemVer via **Conventional Commits**:
  - `feat:` incrementa versão **Minor** (ex: `1.4.0` -> `1.5.0`).
  - `fix:` incrementa versão **Patch** (ex: `1.4.0` -> `1.4.1`).
  - `BREAKING CHANGE:` ou `!:` incrementa versão **Major** (ex: `1.4.0` -> `2.0.0`).
- Criação automatizada de Git Tags e GitHub Releases com histórico de alterações.

---

<div align="center">
  <sub>Desenvolvido com 🍿 para amigos cinéfilos • Cine Chapéu</sub>
</div>
