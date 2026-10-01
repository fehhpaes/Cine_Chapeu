<div align="center">
  <img src="./frontend/public/favicon.svg" alt="Logo Cine Chapéu" width="120" />
  <h1>Cine Chapéu • Clube de Cinema</h1>
  <p><strong>Uma plataforma web completa, responsiva e cinematográfica desenvolvida para gerenciar sessões, debates e premiações de um clube de cinema entre amigos.</strong></p>

  <p>
    <img src="https://img.shields.io/badge/React-18-61DAFB?style=for-the-badge&logo=react&logoColor=black" alt="React 18" />
    <img src="https://img.shields.io/badge/TypeScript-5-3178C6?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript" />
    <img src="https://img.shields.io/badge/Tailwind_CSS-3.4-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white" alt="Tailwind CSS" />
    <img src="https://img.shields.io/badge/Node.js-18+-339933?style=for-the-badge&logo=node.js&logoColor=white" alt="Node.js" />
    <img src="https://img.shields.io/badge/MongoDB-Atlas-47A248?style=for-the-badge&logo=mongodb&logoColor=white" alt="MongoDB" />
    <img src="https://img.shields.io/badge/Vercel-Serverless-000000?style=for-the-badge&logo=vercel&logoColor=white" alt="Vercel" />
  </p>
</div>

---

## 🌟 Principais Funcionalidades

- **Catálogo Inteligente:** Histórico completo de sessões com integração em tempo real à API do TMDB (The Movie Database), realizando o resgate automático de metadados, pôsteres em alta resolução, diretores, gêneros e sinopses.
- **Roleta de Sorteio ("A Roleta do Chapéu"):** Sistema de sorteio com física, efeitos sonoros e desaceleração animada para eleger o amigo responsável e o tema cinematográfico da próxima sessão.
- **Tier List Dinâmica:** Motor interativo para classificação de filmes por faixas de notas, com suporte a filtros de períodos customizados (temporadas/anos), modo genérico com upload de imagens e exportação em alta qualidade (PNG).
- **Evento do Oscar:** Módulo completo de premiação anual composto por categorias personalizadas, período de votação confidencial para os integrantes e um **Dashboard do Apresentador** interativo com revelação ao vivo de indicados e vencedores.
- **Segurança (Admin PIN):** Acesso de leitura público e transparente para todos os membros, associado a uma proteção rígida via `authMiddleware` (PIN global) para operações de mutação (cadastro, edição, apuração e sorteios).

---

## 🛠️ Tecnologias Utilizadas

### **Frontend**
- **Framework:** [React 18](https://react.dev/) com [Vite](https://vitejs.dev/) & [TypeScript](https://www.typescriptlang.org/)
- **Estilização:** [Tailwind CSS](https://tailwindcss.com/) (Tema dark cinematográfico com acentos em dourado Oscar)
- **Tipografia:** Google Fonts ([Cinzel](https://fonts.google.com/specimen/Cinzel) & [Outfit](https://fonts.google.com/specimen/Outfit))
- **Ícones & Interatividade:** [Lucide React](https://lucide.dev/)
- **Comunicação:** [Axios](https://axios-http.com/)
- **Exportação Gráfica:** [html-to-image](https://github.com/bubkoo/html-to-image)
- **Roteamento:** [React Router Dom v6](https://reactrouter.com/)

### **Backend**
- **Runtime:** [Node.js](https://nodejs.org/) & [Express](https://expressjs.com/) com TypeScript
- **Banco de Dados:** [MongoDB](https://www.mongodb.com/) & [Mongoose](https://mongoosejs.com/) (Schemas tipados, índices e population aninhada)
- **Integração de Cinema:** API REST do [TMDB](https://www.themoviedb.org/documentation/api)
- **Arquitetura:** Clean Layers (Routes, Controllers, Services, Models, Middlewares)

### **Infraestrutura & Deploy**
- **Serverless Hosting:** [Vercel](https://vercel.com/) com rotas de API em Serverless Functions (`vercel.json`)
- **Database Cloud:** [MongoDB Atlas](https://www.mongodb.com/atlas)

---

## ⚙️ Como Executar Localmente

### 1. Pré-requisitos
- **Node.js** (versão 18 ou superior)
- **npm** ou **yarn**
- Instância do **MongoDB** local ou cluster no **MongoDB Atlas**

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
ADMIN_PIN=2019
```

#### **Frontend (`frontend/.env`):**
```env
VITE_API_URL=http://localhost:5000/api
VITE_GOOGLE_DRIVE_URL=https://drive.google.com/drive/folders/seu_id_aqui
```

---

### 3. Instalação e Execução

#### **Passo 1: Iniciar o Backend**
```bash
cd backend
npm install

# (Opcional) Popular o banco de dados com dados de teste:
npm run seed

# Iniciar servidor em modo desenvolvimento:
npm run dev
```
> O backend estará acessível em `http://localhost:5000/api`.

#### **Passo 2: Iniciar o Frontend**
```bash
cd frontend
npm install

# Iniciar aplicação Vite:
npm run dev
```
> O frontend estará acessível em `http://localhost:5173`.

---

## 🚀 Deploy

O projeto está otimizado para deploy contínuo na plataforma **Vercel** através de arquitetura Serverless:
- O arquivo [`vercel.json`](./vercel.json) roteia automaticamente as requisições `/api/*` para as funções serverless e serve a SPA estática no frontend com suporte a HTML5 History API (React Router).
- Basta conectar o repositório GitHub à Vercel e configurar as variáveis de ambiente na dashboard.

---

<div align="center">
  <sub>Desenvolvido com 🍿 para amigos cinéfilos • Cine Chapéu</sub>
</div>
