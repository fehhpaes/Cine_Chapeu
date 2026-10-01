# 🎩 Cine Chapéu

Sistema Full-Stack de registro de sessões de cinema, sorteio de membros por roleta ("A Roleta do Chapéu") e premiação anual com categorias no estilo Oscar ("O Oscar do Grupo").

---

## 🚀 Tecnologias Utilizadas

### Backend
- **Node.js** & **Express** com **TypeScript**
- **Mongoose / MongoDB** (Mapeamento de documentos com schemas e índices)
- **Axios** (Integração com API externa do TMDB)
- **Clean Architecture Principles**: Separação em Models, Use Cases/Services, Controllers e Rotas.

### Frontend
- **React 18** com **Vite** e **TypeScript**
- **Tailwind CSS** (Tema dark cinematográfico com acentos em dourado Oscar)
- **Lucide Icons**
- **React Router Dom v6**
- **Axios** (Comunicação com a API REST)

---

## 🏛️ Arquitetura & Modelagem de Dados

### 1. `Member` (Amigos do Grupo)
```typescript
{
  name: string;
  active: boolean;      // Define elegibilidade para a roleta
  avatarUrl: string;
  createdAt: Date;
}
```

### 2. `Movie` (Cache TMDB)
```typescript
{
  tmdbId: number;
  title: string;
  originalTitle: string;
  director: string;
  posterUrl: string;
  releaseYear: number;
  genres: string[];
  runtime: number;
}
```

### 3. `Session` (Sessões Assistidas)
```typescript
{
  movieId: ObjectId(Movie);
  memberId: ObjectId(Member);
  drawnCategory: string;
  exhibitionDate: Date;
  notes: string;
}
```

### 4. `Award` (O Oscar do Grupo)
```typescript
{
  year: number;
  categoryName: string;
  nominees: [ObjectId(Session)];
  winner: ObjectId(Session);
}
```

---

## 🌟 Principais Funcionalidades

1. **A Roleta do Chapéu (Sorteio)**:
   - Endpoint `/api/members/draw` que seleciona aleatoriamente um membro com `active: true`.
   - Roleta animada no frontend que desacelera até o vencedor com efeito visual de celebração e botão direto para cadastrar sessão.

2. **Integração TMDB & Cadastro de Sessão**:
   - Busca em tempo real de filmes pelo nome no TMDB (`/api/sessions/tmdb-search?q=...`).
   - Salva ou atualiza automaticamente os metadados do filme na coleção `Movies` antes de registrar a `Session`.

3. **Catálogo & Filtros Dinâmicos**:
   - Grid de pôsteres com visual cinematográfico, badges de tema, data e membro responsável.
   - Filtros combinados em tempo real por **Título do Filme**, **Membro Responsável**, **Ano de Exibição** e **Categoria Sorteada**.

4. **O Oscar do Grupo (Awards com Populate Aninhado Profundo)**:
   - Consulta profunda no Mongoose:
     `nominees` e `winner` $\rightarrow$ populam `Session.movieId` (Filme, Pôster, Diretor) e `Session.memberId` (Nome e Avatar).
   - Exibição por blocos de categorias destacando visualmente o filme vencedor com dourado pulsante e coroa.

---

## 🛠️ Como Executar o Projeto

### 1. Pré-requisitos
- Node.js (versão 18+)
- MongoDB rodando localmente (`mongodb://localhost:27017`) ou string do MongoDB Atlas

### 2. Backend
```bash
cd backend
npm install

# Copie o arquivo de variáveis de ambiente
cp .env.example .env

# (Opcional) Popular o banco de dados com dados de teste realistas:
npm run seed

# Iniciar servidor de desenvolvimento:
npm run dev
```
O servidor iniciará em `http://localhost:5000`.

### 3. Frontend
```bash
cd frontend
npm install

# Iniciar servidor Vite:
npm run dev
```
Acesse a aplicação em `http://localhost:5173`.
