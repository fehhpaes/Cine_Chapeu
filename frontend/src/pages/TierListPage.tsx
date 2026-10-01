import React, { useState, useEffect, useRef } from 'react';
import {
  Layers,
  Loader2,
  Trash2,
  HelpCircle,
  Film,
  Sparkles,
  Download,
  Plus,
  Edit2,
  Calendar,
  Image as ImageIcon,
  Check,
  X,
  Palette,
  ArrowUp,
  ArrowDown,
  Save,
  Upload,
  Clock,
} from 'lucide-react';
import { toPng } from 'html-to-image';
import { Session, TierRow, CustomTierItem, CustomPeriod } from '../types/index.ts';
import { sessionsApi, tierConfigApi, periodsApi } from '../api/client.ts';
import { useAuth } from '../context/AuthContext.tsx';

const PRESET_COLORS = [
  '#ef4444', // Vermelho (S)
  '#f97316', // Laranja (A)
  '#f59e0b', // Âmbar (B)
  '#eab308', // Amarelo (C)
  '#22c55e', // Verde (D)
  '#10b981', // Esmeralda
  '#06b6d4', // Ciano
  '#3b82f6', // Azul
  '#8b5cf6', // Roxo
  '#ec4899', // Rosa
  '#52525b', // Zinco (Lixeira)
  '#18181b', // Preto
];

const DEFAULT_TIER_ROWS: TierRow[] = [
  { name: 'S', color: '#ef4444', order: 0 },
  { name: 'A', color: '#f97316', order: 1 },
  { name: 'B', color: '#f59e0b', order: 2 },
  { name: 'C', color: '#eab308', order: 3 },
  { name: 'D', color: '#22c55e', order: 4 },
  { name: 'Lixeira', color: '#52525b', order: 5 },
];

export const TierListPage: React.FC = () => {
  const { isAdmin } = useAuth();

  // Modo de Exibição: Filmes do Clube vs Genérico / Livre
  const [mode, setMode] = useState<'sessions' | 'generic'>('sessions');

  // Configuração dos Tiers
  const [tierRows, setTierRows] = useState<TierRow[]>(DEFAULT_TIER_ROWS);
  const [isEditingStructure, setIsEditingStructure] = useState<boolean>(false);
  const [isSavingConfig, setIsSavingConfig] = useState<boolean>(false);

  // Sessões (Modo Filmes)
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [isUpdatingTier, setIsUpdatingTier] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  // Filtros Temporais e Períodos Salvos
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [availableYears, setAvailableYears] = useState<number[]>([]);
  const [savedPeriods, setSavedPeriods] = useState<CustomPeriod[]>([]);
  const [activeFilter, setActiveFilter] = useState<'all' | 'year' | string>('all'); // 'all', 'year' ou _id do período
  
  // Modal de Criação de Novo Período
  const [isCreatePeriodModalOpen, setIsCreatePeriodModalOpen] = useState<boolean>(false);
  const [newPeriodName, setNewPeriodName] = useState<string>('');
  const [newPeriodStartDate, setNewPeriodStartDate] = useState<string>('');
  const [newPeriodEndDate, setNewPeriodEndDate] = useState<string>('');
  const [isCreatingPeriod, setIsCreatingPeriod] = useState<boolean>(false);

  // Itens Customizados (Modo Genérico)
  const [customItems, setCustomItems] = useState<CustomTierItem[]>(() => {
    const saved = localStorage.getItem('cine_chapeu_generic_tierlist');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return [];
      }
    }
    return [];
  });

  const [newItemTitle, setNewItemTitle] = useState<string>('');
  const [newItemImage, setNewItemImage] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Drag & drop state
  const [draggedItem, setDraggedItem] = useState<{ id: string; type: 'session' | 'custom' } | null>(null);
  const [activeDropZone, setActiveDropZone] = useState<string | null>(null);

  // Quick Menu Modal state
  const [selectedSessionForMenu, setSelectedSessionForMenu] = useState<Session | null>(null);
  const [selectedCustomForMenu, setSelectedCustomForMenu] = useState<CustomTierItem | null>(null);

  // Exportação de Imagem
  const boardRef = useRef<HTMLDivElement>(null);
  const [isExporting, setIsExporting] = useState<boolean>(false);

  // Carrega configurações e dados iniciais
  useEffect(() => {
    loadTierConfig();
    loadFilterOptions();
  }, []);

  // Recarrega os períodos salvos sempre que o ano selecionado mudar
  useEffect(() => {
    loadPeriods(selectedYear);
  }, [selectedYear]);

  // Recarrega sessões quando o filtro ativo, ano ou modo mudarem
  useEffect(() => {
    if (mode === 'sessions') {
      loadSessions();
    }
  }, [activeFilter, selectedYear, mode, savedPeriods]);

  // Salva itens customizados no localStorage
  useEffect(() => {
    if (mode === 'generic') {
      localStorage.setItem('cine_chapeu_generic_tierlist', JSON.stringify(customItems));
    }
  }, [customItems, mode]);

  const showToast = (msg: string) => {
    setSuccessToast(msg);
    setTimeout(() => setSuccessToast(null), 3000);
  };

  const loadTierConfig = async () => {
    try {
      const config = await tierConfigApi.get();
      if (config && config.rows && config.rows.length > 0) {
        setTierRows(config.rows);
      }
    } catch (err) {
      console.warn('Usando configuração padrão de tiers:', err);
    }
  };

  const loadFilterOptions = async () => {
    try {
      const opts = await sessionsApi.getFilterOptions();
      if (opts.years && opts.years.length > 0) {
        setAvailableYears(opts.years);
        setSelectedYear(opts.years[0]);
      } else {
        setAvailableYears([new Date().getFullYear()]);
      }
    } catch (err) {
      console.error('Erro ao carregar opções de ano:', err);
    }
  };

  const loadPeriods = async (year: number) => {
    try {
      const periods = await periodsApi.getByYear(year);
      setSavedPeriods(periods);
    } catch (err) {
      console.error('Erro ao carregar períodos salvos:', err);
    }
  };

  const loadSessions = async () => {
    try {
      setLoading(true);
      setError(null);

      let params: { startDate?: string; endDate?: string; year?: number } = {};

      if (activeFilter === 'year') {
        params.year = selectedYear;
      } else if (activeFilter === 'all') {
        // Sem restrição de data
      } else {
        // É um ID de período salvo
        const currentPeriod = savedPeriods.find((p) => p._id === activeFilter);
        if (currentPeriod) {
          params.startDate = currentPeriod.startDate;
          params.endDate = currentPeriod.endDate;
        } else {
          // Fallback para ano se o período não existir mais
          params.year = selectedYear;
        }
      }

      const data = await sessionsApi.getAll(params);
      setSessions(data);
    } catch (err: any) {
      console.error('Erro ao carregar sessões para a Tier List:', err);
      setError('Não foi possível carregar as sessões.');
    } finally {
      setLoading(false);
    }
  };

  // Criar Novo Período
  const handleCreatePeriod = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPeriodName.trim() || !newPeriodStartDate || !newPeriodEndDate) {
      setError('Preencha todos os campos do período.');
      return;
    }

    try {
      setIsCreatingPeriod(true);
      setError(null);

      const created = await periodsApi.create({
        name: newPeriodName.trim(),
        year: selectedYear,
        startDate: newPeriodStartDate,
        endDate: newPeriodEndDate,
      });

      // Recarrega períodos e ativa o recém-criado
      await loadPeriods(selectedYear);
      setActiveFilter(created._id);
      setIsCreatePeriodModalOpen(false);
      setNewPeriodName('');
      setNewPeriodStartDate('');
      setNewPeriodEndDate('');
      showToast(`Período "${created.name}" criado com sucesso!`);
    } catch (err: any) {
      console.error('Erro ao cadastrar período:', err);
      setError(err.response?.data?.message || 'Erro ao criar período.');
    } finally {
      setIsCreatingPeriod(false);
    }
  };

  // Excluir Período
  const handleDeletePeriod = async (e: React.MouseEvent, periodId: string) => {
    e.stopPropagation();
    try {
      await periodsApi.delete(periodId);
      if (activeFilter === periodId) {
        setActiveFilter('year');
      }
      await loadPeriods(selectedYear);
      showToast('Período removido com sucesso!');
    } catch (err) {
      console.error('Erro ao excluir período:', err);
      setError('Falha ao remover período.');
    }
  };

  // Salvar estrutura de Tiers
  const handleSaveTierConfig = async () => {
    try {
      setIsSavingConfig(true);
      const updated = await tierConfigApi.update(tierRows);
      setTierRows(updated.rows);
      setIsEditingStructure(false);
      showToast('Estrutura dos Tiers salva com sucesso!');
    } catch (err: any) {
      console.error('Erro ao salvar configuração dos tiers:', err);
      setError('Falha ao salvar layout dos tiers.');
    } finally {
      setIsSavingConfig(false);
    }
  };

  // Adicionar Linha de Tier
  const handleAddTierRow = () => {
    const newName = `Tier ${tierRows.length + 1}`;
    const nextOrder = tierRows.length;
    const color = PRESET_COLORS[nextOrder % PRESET_COLORS.length];
    setTierRows([...tierRows, { name: newName, color, order: nextOrder }]);
  };

  // Remover Linha de Tier
  const handleRemoveTierRow = (index: number) => {
    const removedRow = tierRows[index];
    const newRows = tierRows.filter((_, i) => i !== index).map((r, i) => ({ ...r, order: i }));
    setTierRows(newRows);

    if (removedRow) {
      setSessions((prev) =>
        prev.map((s) => (s.tier === removedRow.name ? { ...s, tier: 'Unranked' } : s))
      );
      setCustomItems((prev) =>
        prev.map((c) => (c.tier === removedRow.name ? { ...c, tier: 'Unranked' } : c))
      );
    }
  };

  // Reordenar Linha
  const handleMoveTierRow = (index: number, direction: 'up' | 'down') => {
    if ((direction === 'up' && index === 0) || (direction === 'down' && index === tierRows.length - 1)) {
      return;
    }
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    const newRows = [...tierRows];
    const temp = newRows[index];
    newRows[index] = newRows[targetIndex];
    newRows[targetIndex] = temp;

    setTierRows(newRows.map((r, i) => ({ ...r, order: i })));
  };

  // Atualizar Tier de Sessão
  const handleUpdateSessionTier = async (sessionId: string, newTier: string) => {
    if (!isAdmin) {
      setError('Apenas administradores com PIN podem classificar filmes do clube.');
      return;
    }

    const previousSessions = [...sessions];

    setSessions((prev) =>
      prev.map((s) => (s._id === sessionId ? { ...s, tier: newTier } : s))
    );

    try {
      setIsUpdatingTier(true);
      await sessionsApi.updateTier(sessionId, newTier);
    } catch (err: any) {
      console.error('Erro ao atualizar tier:', err);
      setSessions(previousSessions);
      setError('Falha ao atualizar classificação.');
    } finally {
      setIsUpdatingTier(false);
      setSelectedSessionForMenu(null);
    }
  };

  // Atualizar Tier de Item Customizado
  const handleUpdateCustomItemTier = (itemId: string, newTier: string) => {
    setCustomItems((prev) =>
      prev.map((item) => (item.id === itemId ? { ...item, tier: newTier } : item))
    );
    setSelectedCustomForMenu(null);
  };

  // Criar Item Customizado no Modo Genérico
  const handleAddCustomItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemTitle.trim() && !newItemImage) return;

    const newItem: CustomTierItem = {
      id: `custom_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      title: newItemTitle.trim() || 'Item Sem Nome',
      imageUrl: newItemImage || undefined,
      tier: 'Unranked',
    };

    setCustomItems([newItem, ...customItems]);
    setNewItemTitle('');
    setNewItemImage('');
    if (fileInputRef.current) fileInputRef.current.value = '';
    showToast('Item customizado adicionado aos Não Ranqueados!');
  };

  // Upload de Imagem Local para Base64
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setNewItemImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Drag & Drop
  const handleDragStart = (e: React.DragEvent, id: string, type: 'session' | 'custom') => {
    if (type === 'session' && !isAdmin) {
      e.preventDefault();
      return;
    }
    e.dataTransfer.setData('text/plain', JSON.stringify({ id, type }));
    e.dataTransfer.effectAllowed = 'move';
    setDraggedItem({ id, type });
  };

  const handleDragEnd = () => {
    setDraggedItem(null);
    setActiveDropZone(null);
  };

  const handleDragOver = (e: React.DragEvent, tierName: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (activeDropZone !== tierName) {
      setActiveDropZone(tierName);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setActiveDropZone(null);
    }
  };

  const handleDrop = async (e: React.DragEvent, targetTier: string) => {
    e.preventDefault();
    setActiveDropZone(null);

    let raw = e.dataTransfer.getData('text/plain');
    let itemData: { id: string; type: 'session' | 'custom' } | null = null;

    if (raw) {
      try {
        itemData = JSON.parse(raw);
      } catch (err) {
        if (draggedItem) itemData = draggedItem;
      }
    } else if (draggedItem) {
      itemData = draggedItem;
    }

    if (itemData) {
      if (itemData.type === 'session') {
        if (isAdmin) {
          await handleUpdateSessionTier(itemData.id, targetTier);
        }
      } else if (itemData.type === 'custom') {
        handleUpdateCustomItemTier(itemData.id, targetTier);
      }
    }

    setDraggedItem(null);
  };

  // Exportar PNG com html-to-image
  const handleExportImage = async () => {
    if (!boardRef.current) return;

    try {
      setIsExporting(true);
      const dataUrl = await toPng(boardRef.current, {
        cacheBust: true,
        backgroundColor: '#09090b',
        pixelRatio: 2,
      });

      const link = document.createElement('a');
      link.download = `cine-chapeu-tierlist-${mode === 'sessions' ? 'filmes' : 'livre'}.png`;
      link.href = dataUrl;
      link.click();
      showToast('Imagem exportada com sucesso!');
    } catch (err) {
      console.error('Erro ao gerar imagem:', err);
      setError('Não foi possível gerar a imagem da Tier List.');
    } finally {
      setIsExporting(false);
    }
  };

  // Descobre o nome do período ativo para a marca d'água
  const getActiveFilterLabel = () => {
    if (activeFilter === 'all') return 'TODOS OS FILMES';
    if (activeFilter === 'year') return `ANO INTEIRO ${selectedYear}`;
    const period = savedPeriods.find((p) => p._id === activeFilter);
    return period ? `${period.name.toUpperCase()} • ${selectedYear}` : `ANO ${selectedYear}`;
  };

  // Itens Não Ranqueados
  const unrankedSessions = sessions.filter((s) => !s.tier || s.tier === 'Unranked');
  const unrankedCustomItems = customItems.filter((c) => !c.tier || c.tier === 'Unranked');

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      
      {/* Toast de Sucesso */}
      {successToast && (
        <div className="fixed bottom-6 right-6 z-50 px-4 py-3 rounded-lg bg-amber-500 text-zinc-950 font-bold text-xs shadow-xl flex items-center gap-2 animate-in slide-in-from-bottom-5">
          <Check className="w-4 h-4 stroke-[3]" />
          <span>{successToast}</span>
        </div>
      )}

      {/* Cabeçalho */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8 border-b border-zinc-800 pb-8">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-amber-500/10 border border-amber-500/25 text-amber-400 text-xs font-semibold uppercase tracking-wider mb-3 font-display">
            <Layers className="w-3.5 h-3.5" />
            <span>Classificação Definitiva • Tier List</span>
          </div>
          <h1 className="font-display text-4xl sm:text-5xl font-black text-amber-500 tracking-tight">
            Tier List do Cine Chapéu
          </h1>
          <p className="text-sm text-zinc-400 mt-2 max-w-xl leading-relaxed">
            Organize, personalize as linhas e exporte a imagem oficial de classificação do clube.
          </p>
        </div>

        {/* Botões de Ação Superior */}
        <div className="flex flex-wrap items-center gap-3">
          {isUpdatingTier && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-semibold">
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              <span>Salvando...</span>
            </div>
          )}

          <button
            onClick={handleExportImage}
            disabled={isExporting}
            className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-xs font-extrabold bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-zinc-950 shadow-lg shadow-amber-500/20 active:scale-95 transition-all disabled:opacity-50"
          >
            {isExporting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Gerando Imagem...</span>
              </>
            ) : (
              <>
                <Download className="w-4 h-4 stroke-[2.5]" />
                <span>Salvar como Imagem</span>
              </>
            )}
          </button>

          {isAdmin && (
            <button
              onClick={() => setIsEditingStructure(!isEditingStructure)}
              className={`flex items-center gap-2 px-3.5 py-2.5 rounded-lg text-xs font-semibold border transition-all ${
                isEditingStructure
                  ? 'bg-amber-500/15 border-amber-500 text-amber-400'
                  : 'bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border-zinc-800'
              }`}
            >
              <Edit2 className="w-3.5 h-3.5" />
              <span>{isEditingStructure ? 'Concluir Edição' : 'Editar Categorias'}</span>
            </button>
          )}
        </div>
      </div>

      {/* ============================================================ */}
      {/* BARRA DE FILTROS DINÂMICOS & PERÍODOS NOMEADOS */}
      {/* ============================================================ */}
      <div className="flex flex-col gap-4 mb-8 bg-zinc-900/60 p-4 rounded-xl border border-zinc-800">
        
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          
          {/* Toggle de Modos: Filmes vs Modo Livre */}
          <div className="flex items-center gap-1.5 p-1 bg-zinc-950 rounded-lg border border-zinc-800 self-start">
            <button
              onClick={() => setMode('sessions')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-md text-xs font-bold transition-all ${
                mode === 'sessions'
                  ? 'bg-amber-500 text-zinc-950 shadow-sm'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <Film className="w-3.5 h-3.5" />
              <span>Filmes do Chapéu</span>
            </button>
            <button
              onClick={() => setMode('generic')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-md text-xs font-bold transition-all ${
                mode === 'generic'
                  ? 'bg-amber-500 text-zinc-950 shadow-sm'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Modo Livre (Genérico)</span>
            </button>
          </div>

          {/* Filtros Temporais Dinâmicos */}
          {mode === 'sessions' && (
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-1.5 text-zinc-400 text-xs font-medium mr-1">
                <Calendar className="w-3.5 h-3.5 text-amber-500" />
                <span>Edição:</span>
              </div>

              {/* Botão Todos os Filmes */}
              <button
                onClick={() => setActiveFilter('all')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  activeFilter === 'all'
                    ? 'bg-amber-500 text-zinc-950 font-bold shadow-sm'
                    : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
                }`}
              >
                Todos os Filmes
              </button>

              {/* Seletor de Ano */}
              <select
                value={selectedYear}
                onChange={(e) => {
                  const yr = Number(e.target.value);
                  setSelectedYear(yr);
                  if (activeFilter !== 'all') {
                    setActiveFilter('year');
                  }
                }}
                className="px-2.5 py-1.5 bg-zinc-800 text-zinc-200 border border-zinc-700 rounded-lg text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-amber-500"
              >
                {availableYears.map((yr) => (
                  <option key={yr} value={yr}>
                    Ano {yr}
                  </option>
                ))}
              </select>

              {/* Botão Ano Inteiro */}
              <button
                onClick={() => setActiveFilter('year')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  activeFilter === 'year'
                    ? 'bg-amber-500 text-zinc-950 font-bold shadow-sm'
                    : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
                }`}
              >
                Ano Inteiro ({selectedYear})
              </button>

              {/* Pills dos Períodos Nomeados Salvos do Ano */}
              {savedPeriods.map((period) => {
                const isActive = activeFilter === period._id;
                return (
                  <div
                    key={period._id}
                    onClick={() => setActiveFilter(period._id)}
                    className={`group inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-all border ${
                      isActive
                        ? 'bg-amber-500 text-zinc-950 font-bold border-amber-400 shadow-sm'
                        : 'bg-zinc-800 text-zinc-300 border-zinc-700 hover:bg-zinc-700'
                    }`}
                  >
                    <Clock className="w-3.5 h-3.5" />
                    <span>{period.name}</span>
                    {isAdmin && (
                      <button
                        type="button"
                        onClick={(e) => handleDeletePeriod(e, period._id)}
                        title="Excluir período"
                        className={`p-0.5 rounded transition-opacity ${
                          isActive
                            ? 'text-zinc-950/70 hover:text-zinc-950'
                            : 'opacity-0 group-hover:opacity-100 text-zinc-400 hover:text-red-400'
                        }`}
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                );
              })}

              {/* Botão + Novo Período */}
              {isAdmin && (
                <button
                  onClick={() => {
                    setNewPeriodStartDate(`${selectedYear}-01-01`);
                    setNewPeriodEndDate(`${selectedYear}-12-31`);
                    setIsCreatePeriodModalOpen(true);
                  }}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold bg-amber-500/15 hover:bg-amber-500/25 text-amber-400 border border-amber-500/30 transition-all"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Novo Período</span>
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Painel de Edição de Estrutura de Categorias */}
      {isEditingStructure && (
        <div className="mb-8 p-5 bg-zinc-900 border border-amber-500/30 rounded-xl shadow-xl animate-in fade-in duration-200">
          <div className="flex items-center justify-between pb-3 mb-4 border-b border-zinc-800">
            <div className="flex items-center gap-2 text-amber-500 font-display font-bold text-base">
              <Palette className="w-4 h-4" />
              <span>Gerenciar Linhas da Tier List</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleAddTierRow}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold bg-zinc-800 hover:bg-zinc-700 text-amber-400 border border-zinc-700 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Adicionar Linha</span>
              </button>
              <button
                onClick={handleSaveTierConfig}
                disabled={isSavingConfig}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold bg-amber-500 hover:bg-amber-400 text-zinc-950 shadow transition-all disabled:opacity-50"
              >
                {isSavingConfig ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Save className="w-3.5 h-3.5" />
                )}
                <span>Salvar Layout</span>
              </button>
            </div>
          </div>

          <div className="space-y-3">
            {tierRows.map((row, index) => (
              <div
                key={index}
                className="flex flex-col sm:flex-row sm:items-center gap-3 p-2.5 rounded-lg bg-zinc-950 border border-zinc-800"
              >
                {/* Visual Preview */}
                <div
                  className="w-14 h-9 rounded flex items-center justify-center font-display font-black text-sm text-zinc-950 shadow"
                  style={{ backgroundColor: row.color }}
                >
                  {row.name}
                </div>

                {/* Input de Nome */}
                <input
                  type="text"
                  value={row.name}
                  onChange={(e) => {
                    const newRows = [...tierRows];
                    newRows[index].name = e.target.value;
                    setTierRows(newRows);
                  }}
                  className="px-3 py-1.5 bg-zinc-900 border border-zinc-700 rounded text-xs text-zinc-100 focus:outline-none focus:ring-1 focus:ring-amber-500 sm:w-48"
                  placeholder="Nome do Tier"
                />

                {/* Paleta de Cores */}
                <div className="flex items-center gap-1 flex-wrap flex-1">
                  {PRESET_COLORS.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => {
                        const newRows = [...tierRows];
                        newRows[index].color = c;
                        setTierRows(newRows);
                      }}
                      className={`w-6 h-6 rounded-full transition-transform ${
                        row.color === c ? 'scale-125 ring-2 ring-white z-10' : 'hover:scale-110'
                      }`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                  {/* Seletor Customizado HTML5 */}
                  <input
                    type="color"
                    value={row.color}
                    onChange={(e) => {
                      const newRows = [...tierRows];
                      newRows[index].color = e.target.value;
                      setTierRows(newRows);
                    }}
                    className="w-7 h-7 p-0 bg-transparent border-none rounded cursor-pointer ml-1"
                    title="Cor personalizada"
                  />
                </div>

                {/* Controles de Ordem e Exclusão */}
                <div className="flex items-center gap-1 self-end sm:self-center">
                  <button
                    onClick={() => handleMoveTierRow(index, 'up')}
                    disabled={index === 0}
                    className="p-1 rounded hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 disabled:opacity-30"
                    title="Mover para cima"
                  >
                    <ArrowUp className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleMoveTierRow(index, 'down')}
                    disabled={index === 0 ? false : index === tierRows.length - 1}
                    className="p-1 rounded hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 disabled:opacity-30"
                    title="Mover para baixo"
                  >
                    <ArrowDown className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleRemoveTierRow(index)}
                    className="p-1 rounded hover:bg-red-950/60 text-zinc-500 hover:text-red-400 transition-colors ml-1"
                    title="Excluir linha"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Formulário de Adicionar Itens no Modo Genérico */}
      {mode === 'generic' && (
        <div className="mb-8 p-5 rounded-xl bg-zinc-900 border border-zinc-800 shadow-md">
          <div className="flex items-center gap-2 mb-3 text-amber-500 font-display font-bold text-sm">
            <Plus className="w-4 h-4" />
            <span>Adicionar Novo Item Customizado</span>
          </div>

          <form onSubmit={handleAddCustomItem} className="flex flex-col sm:flex-row items-center gap-3">
            <input
              type="text"
              placeholder="Nome ou Título do Item (Ex: Batman, Pizza de Calabresa, The Last of Us...)"
              value={newItemTitle}
              onChange={(e) => setNewItemTitle(e.target.value)}
              className="w-full sm:flex-1 px-3.5 py-2 rounded-lg bg-zinc-950 border border-zinc-800 text-xs text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:ring-1 focus:ring-amber-500"
            />

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <label className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border border-zinc-700 text-xs font-medium cursor-pointer transition-colors">
                <Upload className="w-3.5 h-3.5 text-amber-500" />
                <span>{newItemImage ? 'Imagem Pronta' : 'Enviar Imagem'}</span>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
              </label>

              <button
                type="submit"
                className="px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-zinc-950 text-xs font-bold shadow-sm transition-all"
              >
                Adicionar à Lista
              </button>
            </div>
          </form>

          {newItemImage && (
            <div className="mt-3 flex items-center gap-2">
              <img src={newItemImage} alt="Preview" className="w-8 h-10 object-cover rounded border border-zinc-700" />
              <span className="text-[11px] text-zinc-400">Imagem carregada com sucesso</span>
              <button
                type="button"
                onClick={() => {
                  setNewItemImage('');
                  if (fileInputRef.current) fileInputRef.current.value = '';
                }}
                className="text-[11px] text-red-400 hover:underline ml-2"
              >
                Remover imagem
              </button>
            </div>
          )}
        </div>
      )}

      {error && (
        <div className="mb-6 p-4 rounded-xl bg-red-950/60 border border-red-500/30 text-red-300 text-xs text-center max-w-lg mx-auto">
          {error}
        </div>
      )}

      {/* ============================================================ */}
      {/* QUADRO PRINCIPAL DA TIER LIST (Área capturada para exportar PNG) */}
      {/* ============================================================ */}
      <div
        ref={boardRef}
        id="tierlist-board"
        className="p-3 sm:p-5 rounded-2xl bg-zinc-950 border border-zinc-800/90 shadow-2xl space-y-3"
      >
        {/* Marca d'água de topo no PNG */}
        <div className="flex items-center justify-between px-2 py-1 text-zinc-500 text-[10px] font-display font-semibold tracking-wider uppercase border-b border-zinc-900 pb-2">
          <span>🎩 CINE CHAPÉU • TIER LIST OFICIAL</span>
          <span>{mode === 'sessions' ? getActiveFilterLabel() : 'MODO LIVRE'}</span>
        </div>

        {/* Linhas de Tiers Renderizadas Dinamicamente */}
        <div className="rounded-xl overflow-hidden border border-zinc-800 shadow-xl bg-zinc-950 divide-y divide-zinc-800">
          {tierRows.map((tier) => {
            const isDropActive = activeDropZone === tier.name;

            // Filtra itens deste Tier
            const tierSessions =
              mode === 'sessions' ? sessions.filter((s) => s.tier === tier.name) : [];
            const tierCustomItems =
              mode === 'generic' ? customItems.filter((c) => c.tier === tier.name) : [];

            return (
              <div
                key={tier.name}
                onDragOver={(e) => handleDragOver(e, tier.name)}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, tier.name)}
                className={`flex flex-row items-stretch min-h-[110px] md:min-h-[125px] transition-all duration-200 bg-zinc-900/30 ${
                  isDropActive ? 'ring-2 ring-amber-500 bg-amber-500/10' : ''
                }`}
              >
                {/* Bloco Lateral com Cor e Nome da Categoria */}
                <div
                  className="w-20 sm:w-28 md:w-32 flex-shrink-0 flex flex-col items-center justify-center p-2 select-none shadow-md text-zinc-950"
                  style={{ backgroundColor: tier.color }}
                >
                  <span className="font-display text-xl sm:text-2xl md:text-3xl font-black text-zinc-950 text-center leading-tight tracking-tight break-words max-w-full px-1">
                    {tier.name}
                  </span>
                  <span className="text-[9px] sm:text-[10px] text-zinc-950/80 font-bold mt-1 text-center">
                    {mode === 'sessions'
                      ? `${tierSessions.length} ${tierSessions.length === 1 ? 'filme' : 'filmes'}`
                      : `${tierCustomItems.length} ${tierCustomItems.length === 1 ? 'item' : 'itens'}`}
                  </span>
                </div>

                {/* Container de Itens (Dropzone) */}
                <div className="flex-1 p-2.5 sm:p-3 flex items-center flex-wrap gap-2.5 overflow-x-auto min-h-full">
                  {mode === 'sessions' ? (
                    tierSessions.length === 0 ? (
                      <div className="text-xs text-zinc-600 font-medium italic pl-3 select-none">
                        Arraste filmes para o Tier {tier.name}
                      </div>
                    ) : (
                      tierSessions.map((session) => (
                        <div
                          key={session._id}
                          draggable={isAdmin}
                          onDragStart={(e) => handleDragStart(e, session._id, 'session')}
                          onDragEnd={handleDragEnd}
                          onClick={() => isAdmin && setSelectedSessionForMenu(session)}
                          title={
                            isAdmin
                              ? `${session.movieId?.title} (${session.memberId?.name}) - Clique para reclassificar`
                              : `${session.movieId?.title} (${session.memberId?.name})`
                          }
                          className={`group relative aspect-[2/3] w-16 sm:w-20 md:w-24 flex-shrink-0 rounded-lg overflow-hidden bg-zinc-900 border border-zinc-800 shadow-md ${
                            isAdmin ? 'cursor-grab active:cursor-grabbing hover:scale-105 hover:z-20 hover:border-amber-500 hover:shadow-amber-500/20' : 'cursor-default'
                          } transition-all ${
                            draggedItem?.id === session._id ? 'opacity-30 scale-95' : 'opacity-100'
                          }`}
                        >
                          {session.movieId?.posterUrl ? (
                            <img
                              src={session.movieId.posterUrl}
                              alt={session.movieId.title}
                              className="w-full h-full object-cover pointer-events-none"
                            />
                          ) : (
                            <div className="w-full h-full flex flex-col items-center justify-center p-1 bg-zinc-900 text-zinc-500 text-center">
                              <Film className="w-5 h-5 mb-0.5" />
                              <span className="text-[8px] line-clamp-2">{session.movieId?.title}</span>
                            </div>
                          )}

                          <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/70 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-1.5 pointer-events-none">
                            <span className="text-[10px] font-bold text-zinc-100 leading-tight line-clamp-2 font-display">
                              {session.movieId?.title}
                            </span>
                            <span className="text-[8px] text-amber-400 truncate mt-0.5">
                              {session.memberId?.name}
                            </span>
                          </div>
                        </div>
                      ))
                    )
                  ) : (
                    /* Modo Genérico */
                    tierCustomItems.length === 0 ? (
                      <div className="text-xs text-zinc-600 font-medium italic pl-3 select-none">
                        Arraste itens para o Tier {tier.name}
                      </div>
                    ) : (
                      tierCustomItems.map((item) => (
                        <div
                          key={item.id}
                          draggable
                          onDragStart={(e) => handleDragStart(e, item.id, 'custom')}
                          onDragEnd={handleDragEnd}
                          onClick={() => setSelectedCustomForMenu(item)}
                          title={`${item.title} - Clique para reclassificar`}
                          className={`group relative aspect-[2/3] w-16 sm:w-20 md:w-24 flex-shrink-0 rounded-lg overflow-hidden bg-zinc-900 border border-zinc-800 shadow-md cursor-grab active:cursor-grabbing hover:scale-105 hover:z-20 hover:border-amber-500 transition-all ${
                            draggedItem?.id === item.id ? 'opacity-30 scale-95' : 'opacity-100'
                          }`}
                        >
                          {item.imageUrl ? (
                            <img
                              src={item.imageUrl}
                              alt={item.title}
                              className="w-full h-full object-cover pointer-events-none"
                            />
                          ) : (
                            <div className="w-full h-full flex flex-col items-center justify-center p-2 bg-zinc-900 text-center">
                              <span className="text-xs font-bold text-zinc-200 line-clamp-3 font-display">
                                {item.title}
                              </span>
                            </div>
                          )}

                          <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/70 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-1.5 pointer-events-none">
                            <span className="text-[10px] font-bold text-zinc-100 leading-tight line-clamp-2 font-display">
                              {item.title}
                            </span>
                          </div>
                        </div>
                      ))
                    )
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Rodapé da Imagem do Clube */}
        <div className="text-center pt-2 text-[10px] text-zinc-600 font-sans">
          Cine Chapéu • Classificação gerada em {new Date().toLocaleDateString('pt-BR')}
        </div>
      </div>

      {/* ============================================================ */}
      {/* SEÇÃO DE ITENS NÃO RANQUEADOS (UNRANKED) */}
      {/* ============================================================ */}
      <div
        onDragOver={(e) => handleDragOver(e, 'Unranked')}
        onDragLeave={handleDragLeave}
        onDrop={(e) => handleDrop(e, 'Unranked')}
        className={`mt-10 rounded-xl border p-5 transition-all ${
          activeDropZone === 'Unranked'
            ? 'bg-amber-500/10 border-amber-500 ring-2 ring-amber-500'
            : 'bg-zinc-900/60 border-zinc-800'
        }`}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-zinc-800 pb-3 mb-4">
          <div className="flex items-center gap-2">
            <HelpCircle className="w-4 h-4 text-zinc-400" />
            <h3 className="font-display font-bold text-sm sm:text-base text-zinc-200">
              {mode === 'sessions'
                ? `Filmes Não Ranqueados (${unrankedSessions.length})`
                : `Itens Não Ranqueados (${unrankedCustomItems.length})`}
            </h3>
          </div>
          <span className="text-xs text-zinc-500">
            Arraste os itens para a Tier List acima ou clique neles para classificar
          </span>
        </div>

        {mode === 'sessions' ? (
          loading ? (
            <div className="py-8 flex justify-center text-amber-500">
              <Loader2 className="w-6 h-6 animate-spin" />
            </div>
          ) : unrankedSessions.length === 0 ? (
            <div className="py-8 text-center text-xs text-zinc-500">
              <Sparkles className="w-6 h-6 text-amber-500 mx-auto mb-2" />
              Todos os filmes deste período já estão classificados na Tier List!
            </div>
          ) : (
            <div className="flex items-center flex-wrap gap-3 max-h-80 overflow-y-auto p-1">
              {unrankedSessions.map((session) => (
                <div
                  key={session._id}
                  draggable={isAdmin}
                  onDragStart={(e) => handleDragStart(e, session._id, 'session')}
                  onDragEnd={handleDragEnd}
                  onClick={() => isAdmin && setSelectedSessionForMenu(session)}
                  title={
                    isAdmin
                      ? `${session.movieId?.title} (${session.memberId?.name}) - Clique para classificar`
                      : `${session.movieId?.title} (${session.memberId?.name})`
                  }
                  className={`group relative aspect-[2/3] w-18 sm:w-20 md:w-24 flex-shrink-0 rounded-lg overflow-hidden bg-zinc-900 border border-zinc-800 shadow-md ${
                    isAdmin ? 'cursor-grab active:cursor-grabbing hover:scale-105 hover:z-20 hover:border-amber-500' : 'cursor-default'
                  } transition-all ${
                    draggedItem?.id === session._id ? 'opacity-30 scale-95' : 'opacity-100'
                  }`}
                >
                  {session.movieId?.posterUrl ? (
                    <img
                      src={session.movieId.posterUrl}
                      alt={session.movieId.title}
                      className="w-full h-full object-cover pointer-events-none"
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center p-1 bg-zinc-900 text-zinc-500 text-center">
                      <Film className="w-5 h-5 mb-0.5" />
                      <span className="text-[8px] line-clamp-2">{session.movieId?.title}</span>
                    </div>
                  )}

                  <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/70 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-1.5 pointer-events-none">
                    <span className="text-[10px] font-bold text-zinc-100 leading-tight line-clamp-2 font-display">
                      {session.movieId?.title}
                    </span>
                    <span className="text-[8px] text-amber-400 truncate mt-0.5">
                      {session.memberId?.name}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )
        ) : (
          /* Modo Genérico Unranked */
          unrankedCustomItems.length === 0 ? (
            <div className="py-8 text-center text-xs text-zinc-500">
              <Sparkles className="w-6 h-6 text-amber-500 mx-auto mb-2" />
              Nenhum item não ranqueado. Adicione novos itens no formulário acima!
            </div>
          ) : (
            <div className="flex items-center flex-wrap gap-3 max-h-80 overflow-y-auto p-1">
              {unrankedCustomItems.map((item) => (
                <div
                  key={item.id}
                  draggable
                  onDragStart={(e) => handleDragStart(e, item.id, 'custom')}
                  onDragEnd={handleDragEnd}
                  onClick={() => setSelectedCustomForMenu(item)}
                  title={`${item.title} - Clique para classificar`}
                  className={`group relative aspect-[2/3] w-18 sm:w-20 md:w-24 flex-shrink-0 rounded-lg overflow-hidden bg-zinc-900 border border-zinc-800 shadow-md cursor-grab active:cursor-grabbing hover:scale-105 hover:z-20 hover:border-amber-500 transition-all ${
                    draggedItem?.id === item.id ? 'opacity-30 scale-95' : 'opacity-100'
                  }`}
                >
                  {item.imageUrl ? (
                    <img
                      src={item.imageUrl}
                      alt={item.title}
                      className="w-full h-full object-cover pointer-events-none"
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center p-2 bg-zinc-900 text-center">
                      <span className="text-xs font-bold text-zinc-200 line-clamp-3 font-display">
                        {item.title}
                      </span>
                    </div>
                  )}

                  <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/70 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-1.5 pointer-events-none">
                    <span className="text-[10px] font-bold text-zinc-100 leading-tight line-clamp-2 font-display">
                      {item.title}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )
        )}
      </div>

      {/* ============================================================ */}
      {/* MODAL: CRIAR NOVO PERÍODO SALVO */}
      {/* ============================================================ */}
      {isCreatePeriodModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="relative w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-xl p-6 shadow-2xl">
            <button
              onClick={() => setIsCreatePeriodModalOpen(false)}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-2.5 mb-5">
              <div className="w-8 h-8 rounded-lg bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
                <Clock className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-display font-bold text-lg text-zinc-50">
                  Novo Período • Edição {selectedYear}
                </h3>
                <p className="text-[11px] text-zinc-400">
                  Defina um intervalo de datas com nome personalizado para o clube.
                </p>
              </div>
            </div>

            <form onSubmit={handleCreatePeriod} className="space-y-4">
              <div>
                <label className="block text-[11px] font-semibold text-zinc-300 mb-1 font-display">
                  Nome do Período *
                </label>
                <input
                  type="text"
                  placeholder="Ex: Temporada de Inverno, Férias de Julho, Maratona..."
                  value={newPeriodName}
                  onChange={(e) => setNewPeriodName(e.target.value)}
                  required
                  className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-xs text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:ring-1 focus:ring-amber-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-zinc-300 mb-1 font-display">
                    Data Inicial *
                  </label>
                  <input
                    type="date"
                    value={newPeriodStartDate}
                    onChange={(e) => setNewPeriodStartDate(e.target.value)}
                    required
                    className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-xs text-zinc-100 focus:outline-none focus:ring-1 focus:ring-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-zinc-300 mb-1 font-display">
                    Data Final *
                  </label>
                  <input
                    type="date"
                    value={newPeriodEndDate}
                    onChange={(e) => setNewPeriodEndDate(e.target.value)}
                    required
                    className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-xs text-zinc-100 focus:outline-none focus:ring-1 focus:ring-amber-500"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => setIsCreatePeriodModalOpen(false)}
                  className="px-3.5 py-2 rounded-lg text-xs font-semibold text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isCreatingPeriod}
                  className="px-4 py-2 rounded-lg text-xs font-bold bg-amber-500 hover:bg-amber-400 text-zinc-950 shadow-sm transition-all flex items-center gap-1.5 disabled:opacity-50"
                >
                  {isCreatingPeriod ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Salvando...</span>
                    </>
                  ) : (
                    <>
                      <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                      <span>Salvar Período</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* MODAIS RÁPIDOS DE CLIQUE (SELEÇÃO DIRETA DE TIER) */}
      {/* ============================================================ */}
      {/* Modal para Sessões */}
      {selectedSessionForMenu && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="relative w-full max-w-sm bg-zinc-900 border border-zinc-800 rounded-xl p-5 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 aspect-[2/3] rounded bg-zinc-950 overflow-hidden flex-shrink-0 border border-zinc-800">
                {selectedSessionForMenu.movieId?.posterUrl && (
                  <img
                    src={selectedSessionForMenu.movieId.posterUrl}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                )}
              </div>
              <div className="truncate">
                <h4 className="font-display font-bold text-sm text-zinc-100 truncate">
                  {selectedSessionForMenu.movieId?.title}
                </h4>
                <p className="text-[11px] text-zinc-400 truncate">
                  Trazido por {selectedSessionForMenu.memberId?.name}
                </p>
                <p className="text-[10px] text-amber-500 mt-0.5 font-medium">
                  Tier atual: {selectedSessionForMenu.tier || 'Unranked'}
                </p>
              </div>
            </div>

            <p className="text-xs text-zinc-400 mb-3 font-medium">
              Selecione o novo Tier para este filme:
            </p>

            <div className="grid grid-cols-3 gap-2 mb-4">
              {tierRows.map((tier) => (
                <button
                  key={tier.name}
                  onClick={() => handleUpdateSessionTier(selectedSessionForMenu._id, tier.name)}
                  className="py-2 px-3 rounded-lg text-xs font-black text-zinc-950 transition-all flex items-center justify-center hover:opacity-90 active:scale-95 shadow font-display"
                  style={{ backgroundColor: tier.color }}
                >
                  <span>{tier.name}</span>
                </button>
              ))}
            </div>

            <div className="flex items-center justify-between border-t border-zinc-800 pt-3">
              <button
                onClick={() => handleUpdateSessionTier(selectedSessionForMenu._id, 'Unranked')}
                className="text-xs text-zinc-400 hover:text-zinc-200 transition-colors flex items-center gap-1"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Desclassificar (Unranked)</span>
              </button>

              <button
                onClick={() => setSelectedSessionForMenu(null)}
                className="px-3 py-1.5 rounded-lg text-xs text-zinc-400 hover:bg-zinc-800 transition-colors"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal para Itens Genéricos */}
      {selectedCustomForMenu && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="relative w-full max-w-sm bg-zinc-900 border border-zinc-800 rounded-xl p-5 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 aspect-[2/3] rounded bg-zinc-950 overflow-hidden flex-shrink-0 border border-zinc-800 flex items-center justify-center">
                {selectedCustomForMenu.imageUrl ? (
                  <img
                    src={selectedCustomForMenu.imageUrl}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <ImageIcon className="w-5 h-5 text-zinc-600" />
                )}
              </div>
              <div className="truncate">
                <h4 className="font-display font-bold text-sm text-zinc-100 truncate">
                  {selectedCustomForMenu.title}
                </h4>
                <p className="text-[10px] text-amber-500 mt-0.5 font-medium">
                  Tier atual: {selectedCustomForMenu.tier || 'Unranked'}
                </p>
              </div>
            </div>

            <p className="text-xs text-zinc-400 mb-3 font-medium">
              Selecione o novo Tier para este item:
            </p>

            <div className="grid grid-cols-3 gap-2 mb-4">
              {tierRows.map((tier) => (
                <button
                  key={tier.name}
                  onClick={() => handleUpdateCustomItemTier(selectedCustomForMenu.id, tier.name)}
                  className="py-2 px-3 rounded-lg text-xs font-black text-zinc-950 transition-all flex items-center justify-center hover:opacity-90 active:scale-95 shadow font-display"
                  style={{ backgroundColor: tier.color }}
                >
                  <span>{tier.name}</span>
                </button>
              ))}
            </div>

            <div className="flex items-center justify-between border-t border-zinc-800 pt-3">
              <button
                onClick={() => {
                  setCustomItems((prev) => prev.filter((i) => i.id !== selectedCustomForMenu.id));
                  setSelectedCustomForMenu(null);
                }}
                className="text-xs text-red-400 hover:text-red-300 transition-colors flex items-center gap-1"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Excluir Item</span>
              </button>

              <button
                onClick={() => setSelectedCustomForMenu(null)}
                className="px-3 py-1.5 rounded-lg text-xs text-zinc-400 hover:bg-zinc-800 transition-colors"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default TierListPage;
