import mongoose from 'mongoose';
import fs from 'fs';
import csv from 'csv-parser';
import axios from 'axios';
import dotenv from 'dotenv';
import path from 'path';
import { Session } from './models/Session.js';
import { Movie } from './models/Movie.js';
import { Member } from './models/Member.js';

// Compatibilidade de diretório para CJS / TSX
const currentDir = typeof __dirname !== 'undefined' ? __dirname : path.resolve(process.cwd(), 'src');
dotenv.config({ path: path.resolve(currentDir, '../.env') });
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const TMDB_API_KEY = process.env.TMDB_API_KEY || '909fb675e8861720c7844b3062672f83';
const TMDB_BASE_URL = process.env.TMDB_BASE_URL || 'https://api.themoviedb.org/3';

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function connectDB() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error('MONGODB_URI não encontrada nas variáveis de ambiente!');
  }
  console.log('🔄 Conectando ao MongoDB Atlas...');
  await mongoose.connect(uri, { serverSelectionTimeoutMS: 10000 });
  console.log('📦 Conectado ao MongoDB Atlas com sucesso!');
}

function cleanMovieTitle(raw: string): { title: string; year?: number } {
  let cleaned = raw
    .replace(/\s*\((?:dub|leg|dublado|legendado|versão do diretor|versao do diretor)\)/gi, '')
    .replace(/\s*\[.*?\]/g, '')
    .trim();

  cleaned = cleaned.replace(/^["']|["']$/g, '').trim();

  const yearMatch = cleaned.match(/\((\d{4})\)/);
  let year: number | undefined;
  if (yearMatch) {
    year = parseInt(yearMatch[1], 10);
    cleaned = cleaned.replace(/\(\d{4}\)/, '').trim();
  }

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
    'homem aranha: sem volta para casa': 'Homem-Aranha: Sem Volta Para Casa',
    'trovão tropical': 'Trovão Tropical',
    'a chave magica': 'A Chave Mágica',
    'adeus lenin': 'Adeus, Lenin!',
    'kung fu futebol clube': 'Kung Futebol Clube',
    'onde os fracos não tem vez': 'Onde os Fracos Não Têm Vez',
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
  } catch (error) {
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

    if (year) {
      const resFallback = await axios.get(`${TMDB_BASE_URL}/search/movie`, {
        params: { api_key: TMDB_API_KEY, query: title, language: 'pt-BR' },
        timeout: 10000,
      });
      return resFallback.data.results?.[0] || null;
    }

    return null;
  } catch (error) {
    return null;
  }
}

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

const monthMapAbrev: Record<string, number> = {
  jan: 0, fev: 1, mar: 2, abr: 3, mai: 4, jun: 5,
  jul: 6, ago: 7, set: 8, out: 9, nov: 10, dez: 11,
  abril: 3, maio: 4, junho: 5, julho: 6,
};

const monthMapCompleto: Record<string, number> = {
  janeiro: 0, fevereiro: 1, 'março': 2, marco: 2, abril: 3,
  maio: 4, junho: 5, julho: 6, agosto: 7, setembro: 8,
  outubro: 9, novembro: 10, dezembro: 11,
};

function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"' || char === "'") {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current.trim());
  return result;
}

async function processCSV() {
  await connectDB();

  // =========================================================================
  // FASE 1: TABELA LEGADO (Acervo Histórico)
  // =========================================================================
  console.log('\n🚀 Processando Tabela 1 (Legado)...');
  const defaultMember = await upsertMember('Acervo Histórico');
  const monthCounterT1: Record<string, number> = {};
  const tabela1Path = path.resolve(currentDir, 'tabela1.csv');

  if (fs.existsSync(tabela1Path)) {
    const content = fs.readFileSync(tabela1Path, 'utf-8');
    const lines = content.split(/\r?\n/).filter((l) => l.trim().length > 0);
    let countT1 = 0;

    for (const rawLine of lines) {
      const parts = parseCSVLine(rawLine);
      if (parts.length < 3) continue;

      const dateStr = parts[0].toLowerCase();
      const movieTitle = parts[1];
      const pageUrl = parts[2];

      const imdbMatch = pageUrl.match(/tt\d+/);
      const imdbId = imdbMatch ? imdbMatch[0] : null;

      if (!imdbId) continue;

      const tmdbData = await getMovieByImdb(imdbId);
      const movie = await upsertMovie(tmdbData, movieTitle);

      if (movie) {
        let exhibitionDate = new Date();

        if (dateStr) {
          if (!monthCounterT1[dateStr]) monthCounterT1[dateStr] = 1;
          else monthCounterT1[dateStr]++;

          const weekNum = monthCounterT1[dateStr];
          const dateMatch = dateStr.match(/([a-zá-ú]+)[\.\-\/]*(\d{2})/i);

          if (dateMatch) {
            const monthToken = dateMatch[1].toLowerCase().replace('.', '');
            const month = monthMapAbrev[monthToken] ?? monthMapCompleto[monthToken] ?? 0;
            const year = 2000 + parseInt(dateMatch[2], 10);
            const lastDayOfMonth = new Date(year, month + 1, 0).getDate();
            const day = Math.min(1 + (weekNum - 1) * 7, lastDayOfMonth);
            exhibitionDate = new Date(year, month, day, 12, 0, 0);
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

        countT1++;
        console.log(`✅ [Legado - #${countT1}] ${movie.title} (${exhibitionDate.getFullYear()}) -> ${exhibitionDate.toLocaleDateString('pt-BR')}`);
      }
      await sleep(250); // Anti-rate limit
    }
    console.log(`🏁 Tabela 1 concluída: ${countT1} filmes importados com sucesso!\n`);
  } else {
    console.log('⚠️ Ficheiro tabela1.csv não encontrado.');
  }

  await sleep(1500);

  // =========================================================================
  // FASE 2: TABELAS ATUAIS (Por Ano: 2024, 2025, 2026...)
  // =========================================================================
  const tabelasAtuais = [
    { file: 'tabela2_2024.csv', fallback: 'tabela2.csv', year: 2024 },
    { file: 'tabela2_2025.csv', fallback: '', year: 2025 },
    { file: 'tabela2_2026.csv', fallback: '', year: 2026 },
  ];

  for (const tabela of tabelasAtuais) {
    let targetPath = path.resolve(currentDir, tabela.file);

    if (!fs.existsSync(targetPath) && tabela.fallback) {
      const fallbackPath = path.resolve(currentDir, tabela.fallback);
      if (fs.existsSync(fallbackPath)) {
        targetPath = fallbackPath;
      }
    }

    if (!fs.existsSync(targetPath)) {
      console.log(`⚠️ Ficheiro ${tabela.file} não encontrado. Saltando...`);
      continue;
    }

    console.log(`🚀 Processando ${path.basename(targetPath)} (Ano base: ${tabela.year})...`);
    const content = fs.readFileSync(targetPath, 'utf-8');
    const lines = content.split(/\r?\n/).filter((l) => l.trim().length > 0);

    let currentMonth = 0;
    let semanaIdx = 0;
    let filmeIdx = 2;
    let pessoaIdx = 3;
    let temaIdx = 1;
    let tipoIdx = -1;
    let legDubIdx = -1;
    let countYear = 0;

    for (const rawLine of lines) {
      const parts = parseCSVLine(rawLine);
      if (parts.length === 0) continue;

      // 1. Detetor universal de Mês: vasculha todas as colunas da linha
      const monthFound = parts.find((p) => {
        const clean = p.toLowerCase().trim();
        return monthMapCompleto[clean] !== undefined;
      });

      if (monthFound) {
        currentMonth = monthMapCompleto[monthFound.toLowerCase().trim()];
        console.log(`📅 [${tabela.year}] Bloco do Mês: ${monthFound}`);
        continue;
      }

      // 2. Detecta linha de cabeçalho das colunas e mapeia os índices dinamicamente
      const lowerParts = parts.map((p) => p.toLowerCase().trim());
      const hasSemana = lowerParts.some((p) => p.includes('semana'));
      const hasFilme = lowerParts.some((p) => p.includes('filme') || p.includes('nome'));

      if (hasSemana && hasFilme) {
        semanaIdx = lowerParts.findIndex((p) => p.includes('semana'));
        filmeIdx = lowerParts.findIndex((p) => p.includes('filme') || p.includes('nome'));
        pessoaIdx = lowerParts.findIndex((p) => p.includes('pessoa'));
        temaIdx = lowerParts.findIndex((p) => p.includes('tema'));
        tipoIdx = lowerParts.findIndex((p) => p.includes('tipo'));
        legDubIdx = lowerParts.findIndex((p) => p.includes('leg') || p.includes('dub'));
        continue;
      }

      // 3. Processa linha de dados da sessão
      const movieName = parts[filmeIdx]?.trim() || '';
      const pessoaName = pessoaIdx >= 0 ? parts[pessoaIdx]?.trim() : '';
      const semanaStr = semanaIdx >= 0 ? parts[semanaIdx]?.trim() : '';
      const temaStr = temaIdx >= 0 && parts[temaIdx]?.trim() ? parts[temaIdx].trim() : 'Tema Livre';

      if (!movieName || movieName.toLowerCase() === 'descanso' || movieName.toLowerCase() === 'nome do filme' || movieName.toLowerCase() === 'filme') {
        continue;
      }

      if (pessoaName && pessoaName.toLowerCase() !== 'pessoa') {
        const tmdbData = await getMovieByTitle(movieName);
        const movie = await upsertMovie(tmdbData, movieName);

        if (movie) {
          const member = await upsertMember(pessoaName);
          const dayMatch = semanaStr.match(/\d+/);
          const day = dayMatch ? parseInt(dayMatch[0], 10) : 1;
          const exhibitionDate = new Date(tabela.year, currentMonth, day, 12, 0, 0);

          const extraNotes: string[] = [];
          if (tipoIdx >= 0 && parts[tipoIdx]?.trim()) {
            extraNotes.push(`Tipo: ${parts[tipoIdx].trim()}`);
          }
          if (legDubIdx >= 0 && parts[legDubIdx]?.trim()) {
            extraNotes.push(`Formato: ${parts[legDubIdx].trim()}`);
          }

          await Session.findOneAndUpdate(
            { movieId: movie._id, memberId: member._id, exhibitionDate },
            {
              movieId: movie._id,
              memberId: member._id,
              drawnCategory: temaStr,
              exhibitionDate,
              tier: 'Unranked',
              notes: extraNotes.join(' | '),
            },
            { upsert: true }
          );

          countYear++;
          console.log(`✅ [${tabela.year} - #${countYear}] ${movie.title} por ${member.name} -> ${exhibitionDate.toLocaleDateString('pt-BR')}`);
        }
        await sleep(250); // Anti-rate limit
      }
    }
    console.log(`🏁 ${tabela.file} concluída: ${countYear} sessões sincronizadas com sucesso!\n`);
    await sleep(1500);
  }

  console.log('🎉 Toda a base legada e as tabelas anuais foram importadas com sucesso no MongoDB Atlas!');
  await mongoose.disconnect();
  process.exit(0);
}

processCSV().catch((err) => {
  console.error('❌ Erro durante a migração:', err);
  process.exit(1);
});
