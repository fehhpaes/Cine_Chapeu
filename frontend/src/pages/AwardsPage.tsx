import React, { useState, useEffect } from 'react';
import { Trophy, Calendar, Loader2, Award as AwardIcon, Plus, Lock, Sparkles } from 'lucide-react';
import { Award, OscarCeremony } from '../types/index.ts';
import { awardsApi, ceremoniesApi } from '../api/client.ts';
import { AwardCategoryCard } from '../components/AwardCategoryCard.tsx';
import { CreateAwardModal } from '../components/CreateAwardModal.tsx';
import { useAuth } from '../context/AuthContext.tsx';

export const AwardsPage: React.FC = () => {
  const { isAdmin } = useAuth();
  const [availableYears, setAvailableYears] = useState<number[]>([]);
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [awards, setAwards] = useState<Award[]>([]);
  const [ceremony, setCeremony] = useState<OscarCeremony | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState<boolean>(false);

  useEffect(() => {
    loadYears();
  }, []);

  useEffect(() => {
    if (selectedYear) {
      loadAwards(selectedYear);
    }
  }, [selectedYear]);

  const loadYears = async () => {
    try {
      const years = await awardsApi.getYears();
      setAvailableYears(years);
      if (years.length > 0) {
        setSelectedYear(years[0]);
      }
    } catch (err) {
      console.error('Erro ao carregar anos do Oscar:', err);
    }
  };

  const loadAwards = async (year: number) => {
    try {
      setLoading(true);
      setError(null);
      const [data, ceremonyData] = await Promise.all([
        awardsApi.getByYear(year),
        ceremoniesApi.getByYear(year).catch(() => null),
      ]);
      setAwards(data);
      setCeremony(ceremonyData);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erro ao carregar categorias do Oscar.');
    } finally {
      setLoading(false);
    }
  };

  // Regra de Ouro: Se a data atual for MENOR que a votingEndDate, ocultar vencedores
  const isConcealed = Boolean(
    ceremony?.votingEndDate && new Date() < new Date(ceremony.votingEndDate)
  );

  const handleAwardCreated = async () => {
    await loadYears();
    if (selectedYear) {
      await loadAwards(selectedYear);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      
      {/* Cabeçalho do Oscar com Ação de Novo Prêmio */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12 border-b border-zinc-800 pb-8">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-amber-500/10 border border-amber-500/25 text-amber-400 text-xs font-semibold uppercase tracking-wider mb-3 font-display">
            <Trophy className="w-3.5 h-3.5 fill-current" />
            <span>Hall da Fama • Premiação Anual</span>
          </div>
          <h1 className="font-display text-4xl sm:text-5xl font-black text-amber-500 tracking-tight">
            O Oscar do Cine Chapéu
          </h1>
          <p className="text-sm text-zinc-400 mt-2 max-w-xl leading-relaxed">
            Consagração das melhores escolhas, momentos icônicos e atuações memoráveis do nosso clube.
          </p>
        </div>

        {/* Botão Admin Novo Prêmio */}
        {isAdmin && (
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-bold bg-amber-500 hover:bg-amber-400 text-zinc-950 shadow-lg shadow-amber-500/10 active:scale-95 transition-all"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>Novo Prêmio</span>
            </button>
          </div>
        )}
      </div>

      {/* Filtro de Ano (Pills Estilizadas) */}
      <div className="mb-10 flex flex-wrap items-center gap-2.5">
        <div className="flex items-center gap-2 text-zinc-400 text-xs font-medium mr-2">
          <Calendar className="w-4 h-4 text-amber-500" />
          <span>Edição do Ano:</span>
        </div>

        {availableYears.length > 0 ? (
          availableYears.map((year) => (
            <button
              key={year}
              onClick={() => setSelectedYear(year)}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                selectedYear === year
                  ? 'bg-amber-500 text-zinc-950 shadow-md font-extrabold'
                  : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-300'
              }`}
            >
              {year}
            </button>
          ))
        ) : (
          <span className="px-3 py-1.5 text-xs text-zinc-500 bg-zinc-900 border border-zinc-800 rounded-lg">
            Nenhum ano registrado ainda
          </span>
        )}
      </div>

      {error && (
        <div className="mb-8 p-4 rounded-xl bg-red-950/60 border border-red-500/30 text-red-300 text-xs text-center max-w-lg mx-auto">
          {error}
        </div>
      )}

      {/* Regra de Ouro: Aviso de Resultados em Sigilo durante Período de Votação */}
      {isConcealed && (
        <div className="mb-10 rounded-2xl bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-zinc-900 border border-amber-500/30 p-6 shadow-xl shadow-amber-500/5">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center shrink-0 text-amber-400">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-display font-bold text-base text-amber-400">
                  Envelopes Lacrados • Votação em Andamento
                </h3>
                <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  <Sparkles className="w-2.5 h-2.5" />
                  Sigilo Oficial
                </span>
              </div>
              <p className="text-xs text-zinc-300 mt-1 leading-relaxed">
                A votação de <strong>{selectedYear}</strong> está em andamento (ou sendo apurada). Os vencedores serão revelados no evento oficial do Oscar Cine Chapéu!
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Exibição das Categorias */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-24 text-amber-500 gap-3">
          <Loader2 className="w-8 h-8 animate-spin" />
          <span className="text-sm text-zinc-400 font-medium">Abrindo os envelopes do Oscar {selectedYear}...</span>
        </div>
      ) : awards.length === 0 ? (
        <div className="bg-zinc-900/60 rounded-2xl p-12 text-center border border-zinc-800 max-w-lg mx-auto my-12">
          <AwardIcon className="w-12 h-12 text-zinc-600 mx-auto mb-4" />
          <h3 className="font-display font-bold text-lg text-zinc-200 mb-2">
            Nenhuma premiação para a edição de {selectedYear}
          </h3>
          <p className="text-xs text-zinc-400 mb-6">
            Cadastre as categorias e registre os vencedores dos envelopes dourados.
          </p>
          {isAdmin && (
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold bg-amber-500 hover:bg-amber-400 text-zinc-950 transition-all"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>Criar Primeira Categoria</span>
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-12">
          {awards.map((award) => (
            <AwardCategoryCard key={award._id} award={award} concealWinner={isConcealed} />
          ))}
        </div>
      )}

      {/* Modal de Criação de Novo Prêmio (Admin) */}
      <CreateAwardModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onAwardCreated={handleAwardCreated}
        initialYear={selectedYear}
      />

    </div>
  );
};

export default AwardsPage;
