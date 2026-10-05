import mongoose from 'mongoose';
import fs from 'fs';
import axios from 'axios';
import dotenv from 'dotenv';
import path from 'path';
import { Session } from './models/Session.js';
import { Movie } from './models/Movie.js';
import { Member } from './models/Member.js';

// Compatibilidade de diretório para CJS / TSX
const currentDir = typeof __dirname !== 'undefined' ? __dirname : path.resolve(process.cwd(), 'src');

// Carrega variáveis de ambiente
dotenv.config({ path: path.resolve(currentDir, '../.env') });
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const TMDB_API_KEY = process.env.TMDB_API_KEY || '909fb675e8861720c7844b3062672f83';
const TMDB_BASE_URL = process.env.TMDB_BASE_URL || 'https://api.themoviedb.org/3';

async function connectDB() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error('MONGODB_URI não encontrada nas variáveis de ambiente!');
  }
  console.log('🔄 Conectando ao MongoDB...');
  await mongoose.connect(uri, { serverSelectionTimeoutMS: 10000 });
  console.log('📦 Conectado ao MongoDB com sucesso!');
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// Normalizador e limpador de títulos para busca precisa no TMDB
function cleanMovieTitle(raw: string): { title: string; year?: number } {
  let cleaned = raw
    .replace(/\s*\((?:dub|leg|dublado|legendado|versão do diretor|versao do diretor)\)/gi, '')
    .replace(/\s*\[.*?\]/g, '')
    .trim();

  // Remove aspas
  cleaned = cleaned.replace(/^["']|["']$/g, '').trim();

  // Detecta ano entre parênteses ex: (1975)
  const yearMatch = cleaned.match(/\((\d{4})\)/);
  let year: number | undefined;
  if (yearMatch) {
    year = parseInt(yearMatch[1], 10);
    cleaned = cleaned.replace(/\(\d{4}\)/, '').trim();
  }

  // Tratamentos para títulos específicos das planilhas
  const aliasMap: Record<string, string> = {
    'stalone cobra': 'Cobra',
    'frankweenie': 'Frankenweenie',
    'homem da terra': 'O Homem da Terra',
    'mirai do futuro': 'Mirai',
    'euro trip': 'Eurotrip: Passaporte para a Confusão',
    'mib 1': 'MIB - Homens de Preto',
    'bad boys': 'Bad Boys',
    'bad boys 2': 'Bad Boys II',
    'la la land': 'La La Land: Cantando Estações',
    'saneamento basico': 'Saneamento Básico, O Filme',
    'escola do rock': 'Escola de Rock',
    'che o argentino': 'Che: O Argentino',
    'sniper americano': 'Sniper Americano',
    'rocky 4': 'Rocky IV',
    'harry potter e a pedra filosofal': 'Harry Potter e a Pedra Filosofal',
    'missão impossivel': 'Missão: Impossível',
    'seven': 'Seven: Os Sete Crimes Capitais',
    'segredo dos seus olhos': 'O Segredo dos Seus Olhos',
    'as caça-fantasmas': 'Caça-Fantasmas',
    'edward mãos de tesoura': 'Edward Mãos de Tesoura',
    'pokémon o filme': 'Pokémon: O Filme - Mewtwo Contra-Ataca',
    'batman - o homem morcego': 'Batman',
    'como treinar o seu dragão': 'Como Treinar o Seu Dragão',
    'ace ventura 2': 'Ace Ventura: Um Maluco na África',
    'eles não usam black-tie': 'Eles Não Usam Black-tie',
    'batman (1989)': 'Batman',
    'flamin hot': 'Flamin\' Hot: O Sabor do Sucesso',
    'o grinch': 'O Grinch',
    'coherence': 'Coherence',
  };

  const lower = cleaned.toLowerCase();
  if (aliasMap[lower]) {
    cleaned = aliasMap[lower];
  }

  return { title: cleaned, year };
}

async function getMovieByImdb(imdbId: string) {
  try {
    const res = await axios.get(`${TMDB_BASE_URL}/find/${imdbId}`, {
      params: {
        api_key: TMDB_API_KEY,
        external_source: 'imdb_id',
        language: 'pt-BR',
      },
      timeout: 10000,
    });
    return res.data.movie_results?.[0] || null;
  } catch (error: any) {
    console.error(`❌ Erro ao buscar IMDb ${imdbId}:`, error.message);
    return null;
  }
}

async function getMovieByTitle(rawTitle: string) {
  const { title, year } = cleanMovieTitle(rawTitle);
  try {
    const params: any = {
      api_key: TMDB_API_KEY,
      query: title,
      language: 'pt-BR',
    };
    if (year) {
      params.primary_release_year = year;
    }

    const res = await axios.get(`${TMDB_BASE_URL}/search/movie`, {
      params,
      timeout: 10000,
    });

    if (res.data.results && res.data.results.length > 0) {
      return res.data.results[0];
    }

    // Fallback sem ano caso não tenha encontrado
    if (year) {
      const resFallback = await axios.get(`${TMDB_BASE_URL}/search/movie`, {
        params: { api_key: TMDB_API_KEY, query: title, language: 'pt-BR' },
        timeout: 10000,
      });
      return resFallback.data.results?.[0] || null;
    }

    return null;
  } catch (error: any) {
    console.error(`❌ Erro ao buscar Título "${rawTitle}":`, error.message);
    return null;
  }
}

// Gera ID determinístico para filmes que não forem encontrados no TMDB
function generateFallbackTmdbId(title: string): number {
  let hash = 0;
  for (let i = 0; i < title.length; i++) {
    hash = (hash << 5) - hash + title.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash) + 10000000;
}

async function upsertMovie(tmdbData: any, rawTitle?: string) {
  if (tmdbData && tmdbData.id) {
    const posterUrl = tmdbData.poster_path
      ? `https://image.tmdb.org/t/p/w500${tmdbData.poster_path}`
      : '';
    const releaseYear = tmdbData.release_date
      ? parseInt(tmdbData.release_date.split('-')[0], 10) || 2000
      : 2000;

    return await Movie.findOneAndUpdate(
      { tmdbId: tmdbData.id },
      {
        tmdbId: tmdbData.id,
        title: tmdbData.title || rawTitle || 'Sem Título',
        originalTitle: tmdbData.original_title || '',
        posterUrl,
        overview: tmdbData.overview || '',
        releaseYear,
      },
      { upsert: true, new: true }
    );
  }

  if (rawTitle) {
    const clean = cleanMovieTitle(rawTitle);
    const fallbackId = generateFallbackTmdbId(clean.title);
    return await Movie.findOneAndUpdate(
      { $or: [{ tmdbId: fallbackId }, { title: clean.title }] },
      {
        tmdbId: fallbackId,
        title: clean.title,
        originalTitle: clean.title,
        posterUrl: '',
        overview: '',
        releaseYear: clean.year || 2024,
      },
      { upsert: true, new: true }
    );
  }

  return null;
}

async function upsertMember(name: string) {
  const cleanName = name.replace(/\s+/g, ' ').trim();
  // Padroniza nomes
  const nameMap: Record<string, string> = {
    'felipe p.': 'Felipe P',
    'felipe p': 'Felipe P',
    'ricado': 'Ricardo',
    'thiago': 'Tiago',
    'tiago': 'Tiago',
  };
  const normalized = nameMap[cleanName.toLowerCase()] || cleanName;

  return await Member.findOneAndUpdate(
    { name: { $regex: new RegExp(`^${normalized}$`, 'i') } },
    { name: normalized },
    { upsert: true, new: true }
  );
}

// Mapas de conversão de meses
const monthMapAbrev: Record<string, number> = {
  jan: 0, fev: 1, mar: 2, abr: 3, mai: 4, jun: 5,
  jul: 6, ago: 7, set: 8, out: 9, nov: 10, dez: 11,
};

const monthMapCompleto: Record<string, number> = {
  janeiro: 0, fevereiro: 1, 'março': 2, marco: 2, abril: 3,
  maio: 4, junho: 5, julho: 6, agosto: 7, setembro: 8,
  outubro: 9, novembro: 10, dezembro: 11,
};

async function processCSV() {
  await connectDB();

  // =========================================================================
  // FASE 1: Tabela 1 - Legado (Data, Nome, Pagina)
  // =========================================================================
  console.log('\n🚀 [Fase 1/2] Processando Tabela 1 (Legado)...');
  const defaultMember = await upsertMember('Acervo Histórico');
  const tabela1Path = path.resolve(__dirname, 'tabela1.csv');

  if (fs.existsSync(tabela1Path)) {
    const fileContent = fs.readFileSync(tabela1Path, 'utf-8');
    const lines = fileContent.split(/\r?\n/).filter((l) => l.trim().length > 0);
    let countTab1 = 0;

    for (const rawLine of lines) {
      const parts = rawLine.split(',').map((p) => p.trim());
      if (parts.length < 3 || parts[0].toLowerCase().includes('cine') || parts[0].toLowerCase() === 'data') {
        continue;
      }

      const dateStr = parts[0];
      const movieTitle = parts[1];
      const pageUrl = parts[2];

      const imdbMatch = pageUrl.match(/tt\d+/);
      const imdbId = imdbMatch ? imdbMatch[0] : null;

      let tmdbData = null;
      if (imdbId) {
        tmdbData = await getMovieByImdb(imdbId);
        await sleep(100);
      }

      if (!tmdbData && movieTitle) {
        tmdbData = await getMovieByTitle(movieTitle);
        await sleep(100);
      }

      const movie = await upsertMovie(tmdbData, movieTitle);
      if (movie) {
        let exhibitionDate = new Date();
        if (dateStr) {
          const dateParts = dateStr.toLowerCase().replace('.', '').split('-');
          if (dateParts.length === 2) {
            const month = monthMapAbrev[dateParts[0]] ?? 0;
            const year = 2000 + parseInt(dateParts[1], 10);
            exhibitionDate = new Date(year, month, 15, 12, 0, 0);
          }
        }

        await Session.findOneAndUpdate(
          { movieId: movie._id, memberId: defaultMember._id, exhibitionDate },
          {
            movieId: movie._id,
            memberId: defaultMember._id,
            drawnCategory: 'Sessão Clássica',
            exhibitionDate,
            tier: 'Unranked',
          },
          { upsert: true }
        );

        countTab1++;
        console.log(`✅ [Tab 1 - #${countTab1}] Salvo: ${movie.title} (${dateStr})`);
      }
    }
    console.log(`🏁 Tabela 1 concluída: ${countTab1} filmes sincronizados com sucesso!`);
  } else {
    console.warn('⚠️ Arquivo tabela1.csv não encontrado.');
  }

  // =========================================================================
  // FASE 2: Tabela 2 - Atual (Semana, Tema, Filme, Pessoa)
  // =========================================================================
  console.log('\n🚀 [Fase 2/2] Processando Tabela 2 (Atual)...');
  const tabela2Path = path.resolve(__dirname, 'tabela2.csv');

  if (fs.existsSync(tabela2Path)) {
    const fileContent = fs.readFileSync(tabela2Path, 'utf-8');
    const lines = fileContent.split(/\r?\n/).filter((l) => l.trim().length > 0);
    let currentMonth = 0;
    let countTab2 = 0;

    for (const rawLine of lines) {
      const parts = rawLine.split(',').map((p) => p.trim());
      if (parts.length === 0) continue;

      const firstCol = parts[0]?.toLowerCase() || '';

      if (monthMapCompleto[firstCol] !== undefined) {
        currentMonth = monthMapCompleto[firstCol];
        console.log(`📅 Bloco do Mês: ${parts[0]}`);
        continue;
      }

      if (firstCol === 'semana' || firstCol === 'meses') {
        continue;
      }

      const semanaStr = parts[0] || '';
      const tema = parts[1] || 'Tema Livre';
      const filme = parts[2] || '';
      const pessoa = parts[3] || '';

      if (filme && pessoa && pessoa !== 'Pessoa') {
        const tmdbData = await getMovieByTitle(filme);
        await sleep(100);

        const movie = await upsertMovie(tmdbData, filme);
        if (movie) {
          const member = await upsertMember(pessoa);

          const dayMatch = semanaStr.match(/\d+/);
          const day = dayMatch ? parseInt(dayMatch[0], 10) : 1;
          const exhibitionDate = new Date(2024, currentMonth, day, 12, 0, 0);

          await Session.findOneAndUpdate(
            { movieId: movie._id, memberId: member._id, exhibitionDate },
            {
              movieId: movie._id,
              memberId: member._id,
              drawnCategory: tema,
              exhibitionDate,
              tier: 'Unranked',
            },
            { upsert: true }
          );

          countTab2++;
          console.log(`✅ [Tab 2 - #${countTab2}] Salvo: "${movie.title}" indicado por ${member.name} (${semanaStr})`);
        }
      }
    }
    console.log(`🏁 Tabela 2 concluída: ${countTab2} sessões sincronizadas com sucesso!`);
  } else {
    console.warn('⚠️ Arquivo tabela2.csv não encontrado.');
  }

  console.log('\n🎉 Toda a base legada e atual foi importada e sincronizada com sucesso no MongoDB!');
  await mongoose.disconnect();
  process.exit(0);
}

processCSV().catch((err) => {
  console.error('❌ Erro durante a migração:', err);
  process.exit(1);
});
