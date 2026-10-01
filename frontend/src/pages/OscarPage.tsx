import React, { useState, useEffect } from 'react';
import { Trophy, Calendar, RefreshCw, Award as AwardIcon } from 'lucide-react';
import { Award } from '../types/index.ts';
import { awardsApi } from '../api/client.ts';
import { AwardCategoryCard } from '../components/AwardCategoryCard.tsx';

export const OscarPage: React.FC = () => {
  const [availableYears, setAvailableYears] = useState<number[]>([]);
  const [selectedYear, setSelectedYear] = useState<number>(2024);
  const [awards, setAwards] = useState<Award[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

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
      const data = await awardsApi.getByYear(year);
      setAwards(data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erro ao carregar categorias do Oscar.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      
      {/* Hero do Oscar */}
      <div className="text-center max-w-3xl mx-auto mb-10">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-gold-500/15 border border-gold-500/30 text-gold-400 text-xs font-bold uppercase tracking-widest mb-4">
          <Trophy className="w-4 h-4 text-gold-400 fill-current" />
          <span>Grande Premiação Anual</span>
        </div>
        <h1 className="text-3xl sm:text-6xl font-black font-cinematic gold-gradient-text">
          O Oscar do Cine Chapéu
        </h1>
        <p className="text-sm sm:text-base text-slate-300 mt-3">
          As melhores escolhas, as maiores surpresas e as performances inesquecíveis consagradas pelo grupo.
        </p>

        {/* Seletor de Ano da Cerimônia */}
        <div className="mt-8 inline-flex items-center gap-3 p-1.5 rounded-2xl bg-cinema-900 border border-gold-500/30 shadow-xl">
          <div className="flex items-center gap-2 px-3 py-1.5 text-gold-400 text-xs font-bold">
            <Calendar className="w-4 h-4" />
            <span>Ano da Edição:</span>
          </div>
          <div className="flex items-center gap-1.5">
            {availableYears.length > 0 ? (
              availableYears.map((year) => (
                <button
                  key={year}
                  onClick={() => setSelectedYear(year)}
                  className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${
                    selectedYear === year
                      ? 'bg-gradient-to-r from-gold-500 to-amber-600 text-cinema-950 shadow-md shadow-gold-500/30 scale-105'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  {year}
                </button>
              ))
            ) : (
              <span className="px-4 py-2 text-xs text-slate-500 font-medium">
                Nenhum ano cadastrado
              </span>
            )}
          </div>
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 rounded-2xl bg-red-950/60 border border-red-500/40 text-red-300 text-sm text-center max-w-xl mx-auto">
          {error}
        </div>
      )}

      {/* Categorias e Vencedores */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 text-gold-400 gap-3">
          <RefreshCw className="w-8 h-8 animate-spin" />
          <span className="text-sm font-medium">Abrindo os envelopes do Oscar {selectedYear}...</span>
        </div>
      ) : awards.length === 0 ? (
        <div className="glass-panel rounded-3xl p-12 text-center border border-white/10 max-w-lg mx-auto">
          <AwardIcon className="w-12 h-12 text-slate-500 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-white mb-1">
            Nenhuma premiação para o ano {selectedYear}
          </h3>
          <p className="text-xs text-slate-400">
            Ainda não foram registradas categorias ou indicados para esta edição.
          </p>
        </div>
      ) : (
        <div className="space-y-8">
          {awards.map((award) => (
            <AwardCategoryCard key={award._id} award={award} />
          ))}
        </div>
      )}

    </div>
  );
};
