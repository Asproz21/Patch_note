import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowUpCircle, 
  ArrowDownCircle, 
  Shield, 
  Sword, 
  Sparkles, 
  Info, 
  ExternalLink,
  Target,
  RefreshCw,
  Crosshair,
  AlertCircle,
  Zap
} from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs) {
  return twMerge(clsx(inputs));
}

const API_BASE = "/api";

// Dados de fallback caso o servidor não esteja rodando
const lolFallback = {
  game: "league", version: "26.7", title: "Patch 26.7",
  date: "31 de Março de 2026",
  overview: "Inicializando conexão com o servidor... Clique em 'Atualizar Notas' ou inicie o servidor Python.",
  buffs: [], nerfs: [], adjusts: [], items: [], system: []
};
const valorantFallback = {
  game: "valorant", version: "10.03", title: "Episode 10 Act 3",
  date: "3 de Abril de 2026",
  overview: "Inicializando conexão com o servidor... Clique em 'Atualizar Notas' ou inicie o servidor Python.",
  buffs: [], nerfs: [], adjusts: [], items: [], system: []
};

// ─── Sub-componentes ─────────────────────────────────────────────────────────

const Card = ({ children, className }) => (
  <motion.div 
    initial={{ opacity: 0, y: 20 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true }}
    className={cn("bg-zinc-900/50 border border-zinc-800 backdrop-blur-md rounded-2xl p-6 overflow-hidden", className)}
  >
    {children}
  </motion.div>
);

const SectionTitle = ({ title, icon: Icon, color }) => (
  <div className="flex items-center gap-3 mb-6">
    <div className={cn("p-2 rounded-lg bg-opacity-20", color)}>
      <Icon className={cn("w-6 h-6", color.replace('bg-', 'text-'))} />
    </div>
    <h2 className="text-2xl font-bold text-white tracking-tight">{title}</h2>
  </div>
);

const ChampionCard = ({ char, borderColor, textColor, barColor }) => {
  const [imgError, setImgError] = useState(false);
  const hasStatBlocks = char.statBlocks && char.statBlocks.length > 0 &&
    char.statBlocks.some(b => b.stats && b.stats.length > 0);

  return (
    <div className="flex flex-col gap-4 p-5 rounded-2xl hover:bg-white/5 transition-colors border border-transparent hover:border-zinc-800">
      {/* Header: ícone + nome + contexto */}
      <div className="flex items-center gap-4">
        <div className={cn("w-14 h-14 rounded-xl overflow-hidden border-2 shadow-xl shrink-0 bg-zinc-800", borderColor)}>
          {!imgError ? (
            <img
              src={char.icon}
              alt={char.name}
              className="w-full h-full object-cover"
              onError={() => setImgError(true)}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-zinc-500 text-xl font-bold">
              {char.name[0]}
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 justify-between">
            <h3 className="text-xl font-bold text-white truncate">{char.name}</h3>
            {char.sourceUrl && (
              <a
                href={char.sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="shrink-0 text-zinc-600 hover:text-white transition-colors"
                title="Ver notas completas"
              >
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            )}
          </div>
          <p className={cn("text-xs font-semibold mt-1 leading-snug", textColor)}>
            {char.changes}
          </p>
        </div>
      </div>

      {/* Blocos de stats por habilidade */}
      {hasStatBlocks ? (
        <div className="space-y-2">
          {char.statBlocks.map((block, bi) => (
            block.stats && block.stats.length > 0 && (
              <div key={bi} className="rounded-xl border border-zinc-800/80 overflow-hidden bg-zinc-950/60">
                {/* Badge da habilidade */}
                <div className="px-3 py-1.5 border-b border-zinc-800/60 flex items-center gap-2 bg-zinc-900/40">
                  <span className={cn("w-1.5 h-1.5 rounded-full shrink-0", barColor)} />
                  <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">{block.ability}</span>
                </div>
                {/* Stats individuais */}
                <div className="px-3 py-2 space-y-2">
                  {block.stats.map((stat, si) => {
                    const arrow = stat.includes('\u21d2') ? '\u21d2' : '\u2192';
                    const arrowIdx = stat.indexOf(arrow);
                    const colonIdx = stat.indexOf(':');

                    if (arrowIdx > -1 && colonIdx > -1) {
                      const statName = stat.slice(0, colonIdx).trim();
                      const beforeVal = stat.slice(colonIdx + 1, arrowIdx).trim();
                      const afterVal = stat.slice(arrowIdx + arrow.length).trim();
                      return (
                        <div key={si} className="flex items-baseline gap-2 flex-wrap">
                          <span className="text-xs text-zinc-500 font-medium shrink-0 min-w-0">{statName}:</span>
                          <span className="text-xs font-mono text-zinc-600 line-through">{beforeVal}</span>
                          <span className="text-xs text-zinc-500">&rarr;</span>
                          <span className={cn("text-xs font-mono font-bold", textColor)}>{afterVal}</span>
                        </div>
                      );
                    }
                    return (
                      <p key={si} className="text-xs font-mono text-zinc-400">{stat}</p>
                    );
                  })}
                </div>
              </div>
            )
          ))}
        </div>
      ) : (
        <div className="p-3 rounded-xl bg-zinc-950/50 border border-zinc-800">
          <p className="text-xs text-zinc-400 font-mono">{char.detail}</p>
        </div>
      )}
    </div>
  );
};

const StatusBadge = ({ status, cacheInfo, game }) => {
  const configs = {
    idle:    { text: "Servidor conectado", dot: "bg-green-400", text_color: "text-green-400" },
    loading: { text: "Sincronizando...",  dot: "bg-yellow-400 animate-pulse", text_color: "text-yellow-400" },
    error:   { text: "Servidor offline",  dot: "bg-red-400", text_color: "text-red-400" },
  };
  
  const cfg = configs[status] || configs.idle;
  const gameCache = cacheInfo?.[game];
  
  return (
    <div className="flex flex-col items-end gap-1">
      <div className="flex items-center gap-2">
        <span className={cn("w-2 h-2 rounded-full", cfg.dot)} />
        <span className={cn("text-xs font-bold uppercase tracking-widest", cfg.text_color)}>{cfg.text}</span>
      </div>
      {gameCache?.exists && status !== 'error' && (
        <span className="text-[10px] text-zinc-500 font-medium">
          Cache {gameCache.valid ? "válido" : "expirado"}: {gameCache.cached_at}
        </span>
      )}
    </div>
  );
};

// ─── App Principal ───────────────────────────────────────────────────────────

export default function App() {
  const [selectedGame, setSelectedGame] = useState('lol');
  const [lolData, setLolData] = useState(lolFallback);
  const [valorantData, setValorantData] = useState(valorantFallback);
  const [fetchStatus, setFetchStatus] = useState('idle'); // 'idle' | 'loading' | 'error'
  const [lastUpdated, setLastUpdated] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [cacheInfo, setCacheInfo] = useState(null);

  const data = selectedGame === 'lol' ? (lolData || lolFallback) : (valorantData || valorantFallback);
  const isLol = selectedGame === 'lol';

  // Garantir arrays válidos para evitar crashes
  const buffs = data?.buffs || [];
  const nerfs = data?.nerfs || [];
  const adjusts = data?.adjusts || [];
  const items = data?.items || [];
  const system = data?.system || [];

  // Cores dinâmicas para o tema de fundo
  const orbColor1 = isLol ? 'bg-blue-600/10' : 'bg-red-600/10';
  const orbColor2 = isLol ? 'bg-purple-600/10' : 'bg-orange-600/10';

  // Imagem de fundo do Banner
  const bannerImage = isLol
    ? (lolData.buffs[0]?.icon || "https://ddragon.leagueoflegends.com/cdn/img/champion/splash/Mel_0.jpg")
    : "https://media.valorant-api.com/agents/add6443a-41bd-e414-f6ad-e58d267f4e95/displayicon.png";

  // Busca o status do cache do servidor
  const fetchCacheStatus = useCallback(async () => {
    try {
      const resp = await fetch(`${API_BASE}/cache/status`);
      if (resp.ok) {
        const json = await resp.json();
        setCacheInfo(json);
      }
    } catch (err) {
      console.warn("Erro ao buscar status do cache:", err);
    }
  }, []);

  // Busca os dados de ambos os jogos do servidor Python
  const fetchAllData = useCallback(async (force = false) => {
    setFetchStatus('loading');
    setErrorMsg('');
    try {
      const method = force ? 'POST' : 'GET';
      const lolUrl = force ? `${API_BASE}/lol/refresh` : `${API_BASE}/lol`;
      const valUrl = force ? `${API_BASE}/valorant/refresh` : `${API_BASE}/valorant`;

      const [lolRes, valRes] = await Promise.all([
        fetch(lolUrl, { method }),
        fetch(valUrl, { method })
      ]);

      if (!lolRes.ok || !valRes.ok) throw new Error("Resposta inválida do servidor.");

      const [lolJson, valJson] = await Promise.all([lolRes.json(), valRes.json()]);

      if (lolJson.error) throw new Error(lolJson.error);
      if (valJson.error) throw new Error(valJson.error);

      setLolData(lolJson);
      setValorantData(valJson);
      setLastUpdated(new Date());
      setFetchStatus('idle');
      fetchCacheStatus(); // Atualiza info de cache após carregar
    } catch (err) {
      console.error("Erro ao buscar dados:", err);
      setErrorMsg(err.message || "Não foi possível conectar ao servidor local (porta 5050).");
      setFetchStatus('error');
    }
  }, [fetchCacheStatus]);

  // Busca os dados ao montar o componente e inicia polling de cache
  useEffect(() => {
    fetchAllData();
    const interval = setInterval(fetchCacheStatus, 30000); // Checa cache a cada 30s
    return () => clearInterval(interval);
  }, [fetchAllData, fetchCacheStatus]);

  const scrollToSection = (e, id) => {
    e.preventDefault();
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  };

  // ─── Renderização dos buffs/nerfs ───────────────────────────────────────────

  const BuffsSection = () => (
    <Card className="border-green-500/20">
      <SectionTitle
        title={isLol ? "🟢 Campeões Buffados" : "🟢 Agentes Buffados"}
        icon={ArrowUpCircle}
        color="bg-green-500/20"
      />
      {buffs.length > 0 ? (
        <div className="space-y-6">
          {buffs.map((char, i) => (
            <ChampionCard
              key={i}
              char={char}
              borderColor="border-green-500/40"
              textColor="text-green-400"
              barColor="bg-green-500/50"
            />
          ))}
        </div>
      ) : (
        <EmptyState label="Nenhum buff encontrado" />
      )}
    </Card>
  );

  const NerfsSection = () => (
    <Card className="border-red-500/20">
      <SectionTitle
        title={isLol ? "🔴 Campeões Nerfados" : "🔴 Agentes Nerfados"}
        icon={ArrowDownCircle}
        color="bg-red-500/20"
      />
      {nerfs.length > 0 ? (
        <div className="space-y-6">
          {nerfs.map((char, i) => (
            <ChampionCard
              key={i}
              char={char}
              borderColor="border-red-500/40"
              textColor="text-red-400"
              barColor="bg-red-500/50"
            />
          ))}
        </div>
      ) : (
        <EmptyState label="Nenhum nerf encontrado" />
      )}
    </Card>
  );

  const EmptyState = ({ label }) => (
    <div className="flex flex-col items-center justify-center py-12 gap-4 text-zinc-600">
      <AlertCircle className="w-10 h-10" />
      <p className="text-base font-medium">{label}</p>
      {fetchStatus === 'error' && (
        <p className="text-xs text-center max-w-xs text-red-400/70">
          {errorMsg}
        </p>
      )}
    </div>
  );

  // ─── JSX Principal ──────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-black text-zinc-300 font-sans selection:bg-blue-500/30">

      {/* Esferas de Fundo Animadas */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none transition-colors duration-1000">
        <div className={cn("absolute top-[-10%] left-[-10%] w-[40%] h-[40%] blur-[120px] rounded-full transition-colors duration-1000", orbColor1)} />
        <div className={cn("absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] blur-[120px] rounded-full transition-colors duration-1000", orbColor2)} />
      </div>

      {/* Menu Superior */}
      <nav className="sticky top-0 z-50 border-b border-zinc-800/50 bg-black/80 backdrop-blur-xl transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className={cn(
              "w-12 h-12 rounded-xl flex items-center justify-center shadow-lg transition-colors duration-500",
              isLol ? "bg-gradient-to-br from-blue-500 to-purple-600 shadow-blue-500/20" : "bg-gradient-to-br from-red-600 to-orange-500 shadow-red-500/20"
            )}>
              {isLol ? <Sparkles className="w-7 h-7 text-white" /> : <Target className="w-7 h-7 text-white" />}
            </div>
            <span className="text-2xl font-bold text-white tracking-tighter uppercase transition-colors">
              {isLol ? "LEAGUE BOTS" : "VALORANT BOTS"}
            </span>
          </div>

          <div className="hidden md:flex items-center gap-6 text-base font-medium">
            {/* Toggle de jogo */}
            <div className="flex bg-zinc-900 rounded-full p-1 border border-zinc-800">
              <button
                onClick={() => setSelectedGame('lol')}
                className={cn("px-4 py-1.5 rounded-full text-sm font-bold transition-all", isLol ? "bg-zinc-800 text-white" : "text-zinc-500 hover:text-white")}
              >
                League of Legends
              </button>
              <button
                onClick={() => setSelectedGame('valorant')}
                className={cn("px-4 py-1.5 rounded-full text-sm font-bold transition-all", !isLol ? "bg-zinc-800 text-white" : "text-zinc-500 hover:text-white")}
              >
                Valorant
              </button>
            </div>

            <a href="#inicio" onClick={(e) => scrollToSection(e, 'inicio')} className="hover:text-white transition-colors">Patch</a>
            <a href="#personagens" onClick={(e) => scrollToSection(e, 'personagens')} className="hover:text-white transition-colors">
              {isLol ? "Campeões" : "Agentes"}
            </a>
            <a href="#itens" onClick={(e) => scrollToSection(e, 'itens')} className="hover:text-white transition-colors">
              {isLol ? "Itens" : "Armas"}
            </a>

            {/* Status indicator */}
            <StatusBadge status={fetchStatus} cacheInfo={cacheInfo} game={selectedGame} />

            {/* Botão Atualizar — agora busca dados reais */}
            <button
              onClick={() => fetchAllData(true)}
              disabled={fetchStatus === 'loading'}
              className={cn(
                "flex items-center gap-2 text-white px-5 py-2.5 rounded-full font-bold transition-all active:scale-95",
                isLol ? "bg-blue-600 hover:bg-blue-500" : "bg-red-600 hover:bg-red-500",
                fetchStatus === 'loading' && "opacity-75 cursor-not-allowed"
              )}
              title="Forçar busca de novas notas no site da Riot"
            >
              <RefreshCw className={cn("w-5 h-5", fetchStatus === 'loading' && "animate-spin")} />
              {fetchStatus === 'loading' ? "Buscando..." : "Forçar Refresh"}
            </button>
          </div>
        </div>
      </nav>

      {/* Banner de erro */}
      <AnimatePresence>
        {fetchStatus === 'error' && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="bg-red-900/30 border-b border-red-500/20 relative z-40"
          >
            <div className="max-w-7xl mx-auto px-6 py-3 flex items-center gap-3">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
              <p className="text-sm text-red-300">
                <strong>Servidor offline:</strong> {errorMsg} Inicie o servidor com: <code className="bg-red-500/20 px-2 py-0.5 rounded text-xs">python server.py</code>
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <main id="inicio" className="max-w-7xl mx-auto px-6 py-12 relative z-10 scroll-m-24">

        {/* Banner Principal */}
        <div className="mb-16">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            key={data.game + data.version}
            className="relative p-12 rounded-[2.5rem] bg-gradient-to-br from-zinc-900 to-zinc-950 border border-zinc-800 shadow-2xl overflow-hidden group"
          >
            <div
              className={cn(
                "absolute top-0 right-0 w-1/2 h-full bg-cover bg-center opacity-30 mask-gradient transition-all duration-1000",
                isLol ? "" : "bg-contain bg-no-repeat bg-right"
              )}
              style={{ backgroundImage: `url('${bannerImage}')` }}
            />

            <div className="relative h-full flex flex-col justify-center max-w-2xl">
              <div className="flex items-center gap-3 mb-6">
                <span className={cn(
                  "inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-bold tracking-widest uppercase border",
                  isLol ? "bg-blue-500/10 text-blue-400 border-blue-500/20" : "bg-red-500/10 text-red-400 border-red-500/20"
                )}>
                  Patch v{data.version}
                </span>
                {/* Badge ao vivo */}
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-green-500/10 text-green-400 border border-green-500/20">
                  <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
                  AO VIVO
                </span>
              </div>
              <h1 className="text-6xl md:text-8xl font-black text-white mb-6 leading-[1.1] tracking-tight">
                {data.title}
              </h1>
              <p className="text-lg md:text-xl text-zinc-400 leading-relaxed mb-8 line-clamp-3">
                {data.overview}
              </p>
              <div className="flex items-center gap-6 flex-wrap">
                {data.sourceUrl && (
                  <a
                    href={data.sourceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 bg-zinc-800 border border-zinc-700 text-white px-8 py-4 rounded-2xl font-bold hover:bg-zinc-700 transition-all active:scale-95"
                  >
                    <ExternalLink className="w-5 h-5" /> Notas Completas
                  </a>
                )}
                <div className="flex flex-col gap-0.5">
                  <span className="text-base font-medium text-zinc-300">{data.date}</span>
                  {lastUpdated && (
                    <span className="text-xs text-zinc-600">
                      Atualizado às {lastUpdated.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Grade de Campeões / Agentes */}
        <div id="personagens" className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8 scroll-m-24">
          <BuffsSection />
          <NerfsSection />
        </div>

        {/* Ajustes (se houver) */}
        {adjusts.length > 0 && (
          <div className="mb-8">
            <Card className="border-yellow-500/20">
              <SectionTitle
                title={isLol ? "🟡 Campeões Ajustados" : "🟡 Agentes Ajustados"}
                icon={Zap}
                color="bg-yellow-500/20"
              />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {adjusts.map((char, i) => (
                  <ChampionCard
                    key={i}
                    char={char}
                    borderColor="border-yellow-500/40"
                    textColor="text-yellow-400"
                    barColor="bg-yellow-500/50"
                  />
                ))}
              </div>
            </Card>
          </div>
        )}

        {/* Camada Inferior (Itens/Armas e Sistemas) */}
        <div id="itens" className="grid grid-cols-1 md:grid-cols-3 gap-8 scroll-m-24">

          {/* Seção de Itens ou Armas */}
          <Card className="md:col-span-2">
            <SectionTitle
              title={isLol ? "🧰 Modificações de Itens" : "🔫 Ajustes Econômicos de Armas"}
              icon={isLol ? Sword : Crosshair}
              color={isLol ? "bg-amber-500/20" : "bg-red-500/20"}
            />
            {items.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {items.map((item, i) => (
                  <div key={i} className="flex items-center gap-5 p-5 rounded-2xl bg-zinc-950/50 border border-zinc-800">
                    <div className="w-16 h-16 rounded-xl bg-zinc-800 p-1.5 shrink-0 flex items-center justify-center overflow-hidden">
                      {item.icon ? (
                        <img
                          src={item.icon}
                          alt={item.name}
                          className={cn("w-full h-full", isLol ? "object-contain" : "object-contain scale-125")}
                          onError={(e) => { e.target.style.display = 'none'; }}
                        />
                      ) : (
                        <Sword className="w-8 h-8 text-zinc-600" />
                      )}
                    </div>
                    <div>
                      <h4 className="text-base font-bold text-white mb-1">{item.name}</h4>
                      <span className={cn("text-xs font-black uppercase tracking-tighter", isLol ? "text-amber-500" : "text-red-400")}>
                        {item.type}
                      </span>
                      <p className="text-sm text-zinc-400 mt-2 leading-relaxed">{item.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 gap-3 text-zinc-600">
                <Sword className="w-10 h-10" />
                <p className="text-base font-medium">Nenhum item/arma alterado neste patch</p>
              </div>
            )}
          </Card>

          {/* Seção de Mudanças no Sistema */}
          <Card>
            <SectionTitle
              title="🗺️ Atualizações de Sistema"
              icon={Shield}
              color={isLol ? "bg-blue-500/20" : "bg-purple-500/20"}
            />
            <div className="space-y-8">
              {system.length > 0 ? (
                system.map((sys, i) => (
                  <div key={i}>
                    <h4 className="font-bold text-white text-lg mb-3 flex items-center gap-2">
                      <div className={cn("w-2 h-2 rounded-full shrink-0", isLol ? "bg-blue-500" : "bg-purple-500")} />
                      {sys.title}
                    </h4>
                    <p className="text-sm leading-relaxed text-zinc-400">{sys.description}</p>
                  </div>
                ))
              ) : (
                <p className="text-zinc-600 text-sm">Nenhuma mudança de sistema registrada.</p>
              )}
              {data.sourceUrl && (
                <div className="pt-6 border-t border-zinc-800">
                  <a
                    href={data.sourceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between group"
                  >
                    <span className="text-sm font-bold text-white hover:text-white transition-colors uppercase tracking-widest">
                      Notas Completas & Bugs
                    </span>
                    <ExternalLink className="w-5 h-5 text-zinc-600 group-hover:text-white" />
                  </a>
                </div>
              )}
            </div>
          </Card>
        </div>
      </main>

      {/* Rodapé */}
      <footer className="border-t border-zinc-800/50 py-16 mt-20 relative z-10 transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-10">
          <div className="text-base text-zinc-500">
            © 2026 Gaming Bots Automation. Dados ao vivo via server.py v2.0
          </div>
          <div className="flex gap-10 text-base font-medium">
            <a href="#" className="hover:text-white transition-colors">Privacidade</a>
            <a href="#" className="hover:text-white transition-colors">Termos</a>
            <a href="#" className="hover:text-white transition-colors">Suporte TI</a>
          </div>
        </div>
      </footer>

      {/* Estilos globais */}
      <style dangerouslySetInnerHTML={{ __html: `
        html { scroll-behavior: smooth; }
        .mask-gradient {
          mask-image: linear-gradient(to left, black, transparent);
          -webkit-mask-image: linear-gradient(to left, black, transparent);
        }
      `}} />
    </div>
  );
}
