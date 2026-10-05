import mongoose, { model, Schema } from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { Session } from './models/Session.js';

const currentDir = typeof __dirname !== 'undefined' ? __dirname : path.resolve(process.cwd(), 'src');
dotenv.config({ path: path.resolve(currentDir, '../.env') });
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const Member = mongoose.models.Member || model('Member', new Schema({ name: String }));
const Movie = mongoose.models.Movie || model('Movie', new Schema({ tmdbId: Number, title: String }, { strict: false }));

async function limparBanco() {
  try {
    const uri = process.env.MONGODB_URI;
    if (!uri) {
      throw new Error('MONGODB_URI não encontrada nas variáveis de ambiente!');
    }

    console.log('🔄 Conectando ao MongoDB Atlas...');
    await mongoose.connect(uri, { serverSelectionTimeoutMS: 10000 });
    console.log('📦 Conectado ao MongoDB Atlas...');

    const deletedSessions = await Session.deleteMany({});
    console.log(`🧹 Sessões apagadas: ${deletedSessions.deletedCount}`);

    const deletedMovies = await Movie.deleteMany({});
    console.log(`🧹 Filmes apagados: ${deletedMovies.deletedCount}`);

    const deletedMembers = await Member.deleteMany({});
    console.log(`🧹 Membros apagados: ${deletedMembers.deletedCount}`);

    console.log('✨ Banco de dados zerado com sucesso! Pronto para nova importação.');
    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('❌ Erro ao limpar o banco:', error);
    process.exit(1);
  }
}

limparBanco();
