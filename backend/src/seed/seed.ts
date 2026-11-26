import dotenv from 'dotenv';
dotenv.config();

import mongoose from 'mongoose';
import { Member } from '../models/Member.js';
import { Movie } from '../models/Movie.js';
import { Session } from '../models/Session.js';
import { Award } from '../models/Award.js';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/cine_chapeu';

async function runSeed() {
  try {
    console.log('🌱 Iniciando processo de Seed para o Cine Chapéu...');
    await mongoose.connect(MONGODB_URI);

    // Limpar coleções antigas
    await Promise.all([
      Member.deleteMany({}),
      Movie.deleteMany({}),
      Session.deleteMany({}),
      Award.deleteMany({}),
    ]);
    console.log('🧹 Banco de dados limpo com sucesso.');

    // 1. Criar Membros (Grupo de Amigos)
    const members = await Member.create([
      {
        name: 'Felipe',
        active: true,
        avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&q=80',
      },
      {
        name: 'Beatriz',
        active: true,
        avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=200&q=80',
      },
      {
        name: 'Lucas',
        active: true,
        avatarUrl: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&w=200&q=80',
      },
      {
        name: 'Mariana',
        active: true,
        avatarUrl: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=200&q=80',
      },
      {
        name: 'Rodrigo',
        active: true,
        avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80',
      },
      {
        name: 'Camila',
        active: false, // Inativa temporariamente
        avatarUrl: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=200&q=80',
      },
    ]);
    console.log(`✅ ${members.length} membros criados.`);

    // 2. Criar Filmes no Cache
    const movies = await Movie.create([
      {
        tmdbId: 27205,
        title: 'A Origem',
        originalTitle: 'Inception',
        director: 'Christopher Nolan',
        posterUrl: 'https://image.tmdb.org/t/p/w500/9gk7adHYeDvHkCSEqAvQNLV5Uge.jpg',
        releaseYear: 2010,
        genres: ['Ficção Científica', 'Ação', 'Aventura'],
        runtime: 148,
      },
      {
        tmdbId: 157336,
        title: 'Interestelar',
        originalTitle: 'Interstellar',
        director: 'Christopher Nolan',
        posterUrl: 'https://image.tmdb.org/t/p/w500/gEU2QniE6E77NI6lCU6MxlNBvIx.jpg',
        releaseYear: 2014,
        genres: ['Ficção Científica', 'Drama', 'Aventura'],
        runtime: 169,
      },
      {
        tmdbId: 496243,
        title: 'Parasita',
        originalTitle: 'Gisaengchung',
        director: 'Bong Joon-ho',
        posterUrl: 'https://image.tmdb.org/t/p/w500/7IiTTgloJzvGI1TAYymCfbfl3vT.jpg',
        releaseYear: 2019,
        genres: ['Drama', 'Comédia', 'Suspense'],
        runtime: 132,
      },
      {
        tmdbId: 77,
        title: 'Amnésia',
        originalTitle: 'Memento',
        director: 'Christopher Nolan',
        posterUrl: 'https://image.tmdb.org/t/p/w500/yuNs09hvpHVU1cBTCAk9z9L2AhW.jpg',
        releaseYear: 2000,
        genres: ['Mistério', 'Suspense'],
        runtime: 113,
      },
      {
        id: 603,
        tmdbId: 603,
        title: 'Matrix',
        originalTitle: 'The Matrix',
        director: 'Lana Wachowski, Lilly Wachowski',
        posterUrl: 'https://image.tmdb.org/t/p/w500/f89U3ADr1oiB1s9GkdPOEpXUk5H.jpg',
        releaseYear: 1999,
        genres: ['Ficção Científica', 'Ação'],
        runtime: 136,
      },
      {
        tmdbId: 155,
        title: 'Batman: O Cavaleiro das Trevas',
        originalTitle: 'The Dark Knight',
        director: 'Christopher Nolan',
        posterUrl: 'https://image.tmdb.org/t/p/w500/i0xD490z4mQKLg1g7v7g3xLhC2B.jpg',
        releaseYear: 2008,
        genres: ['Ação', 'Crime', 'Drama'],
        runtime: 152,
      },
    ]);
    console.log(`✅ ${movies.length} filmes criados no cache.`);

    // 3. Criar Sessões
    const sessions = await Session.create([
      {
        movieId: movies[0]._id, // A Origem
        memberId: members[0]._id, // Felipe
        drawnCategory: 'Ficção Científica com Plot Twist',
        exhibitionDate: new Date('2024-03-15T20:00:00Z'),
        notes: 'Pipoca doce, discussão de 2 horas sobre o pião no final!',
      },
      {
        movieId: movies[1]._id, // Interestelar
        memberId: members[1]._id, // Beatriz
        drawnCategory: 'Viagem Espacial / Lágrimas',
        exhibitionDate: new Date('2024-05-22T20:00:00Z'),
        notes: 'Todo mundo chorou na cena das mensagens de vídeo.',
      },
      {
        movieId: movies[2]._id, // Parasita
        memberId: members[2]._id, // Lucas
        drawnCategory: 'Cinema Asiático Premiado',
        exhibitionDate: new Date('2024-07-10T20:00:00Z'),
        notes: 'Sessão com pizza e refrigerante. O plano do sótão chocou a todos.',
      },
      {
        movieId: movies[3]._id, // Amnésia
        memberId: members[3]._id, // Mariana
        drawnCategory: 'Filme com Narrativa Não-Linear',
        exhibitionDate: new Date('2024-09-05T20:00:00Z'),
        notes: 'Tivemos que anotar as pistas numa folha durante a sessão.',
      },
      {
        movieId: movies[4]._id, // Matrix
        memberId: members[4]._id, // Rodrigo
        drawnCategory: 'Clássico dos Anos 90',
        exhibitionDate: new Date('2024-11-18T20:00:00Z'),
        notes: 'A cena do lobby continua insuperável até hoje.',
      },
      {
        movieId: movies[5]._id, // Batman O Cavaleiro das Trevas
        memberId: members[0]._id, // Felipe
        drawnCategory: 'Melhor Vilão da História',
        exhibitionDate: new Date('2024-12-28T20:00:00Z'),
        notes: 'Sessão especial de fim de ano com direito a hambúrguer artesanal.',
      },
    ]);
    console.log(`✅ ${sessions.length} sessões registradas.`);

    // 4. Criar o Oscar do Grupo (Awards 2024)
    const awards = await Award.create([
      {
        year: 2024,
        categoryName: '🏆 Melhor Filme do Ano',
        nominees: [sessions[0]._id, sessions[1]._id, sessions[2]._id, sessions[5]._id],
        winner: sessions[2]._id, // Parasita venceu
      },
      {
        year: 2024,
        categoryName: '🤯 Maior Explodidor de Cabeça (Mind-Blowing)',
        nominees: [sessions[0]._id, sessions[3]._id, sessions[4]._id],
        winner: sessions[0]._id, // A Origem venceu
      },
      {
        year: 2024,
        categoryName: '🍿 Melhor Escolha de Membro',
        nominees: [sessions[1]._id, sessions[2]._id, sessions[5]._id],
        winner: sessions[1]._id, // Beatriz (Interestelar)
      },
      {
        year: 2024,
        categoryName: '🎭 Melhor Atuação / Personagem Icônico',
        nominees: [sessions[2]._id, sessions[5]._id],
        winner: sessions[5]._id, // Coringa em O Cavaleiro das Trevas
      },
    ]);
    console.log(`✅ ${awards.length} categorias do Oscar cadastradas para 2024.`);

    console.log('🎉 Seed finalizado com êxito total!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Erro durante a execução do seed:', error);
    process.exit(1);
  }
}

runSeed();
