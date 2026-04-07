import React, { useState } from 'react';
import { motion } from 'framer-motion';
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
  Crosshair
} from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs) {
  return twMerge(clsx(inputs));
}

// Dados do League of Legends
const lolData = {
  game: "league",
  version: "26.5",
  title: '"First Stand" Preparations',
  date: "9 de Março de 2026",
  overview: "Foco no balanceamento para o torneio internacional First Stand, com ajustes pesados em mid laners e caçadores para garantir diversidade competitiva.",
  buffs: [
    { 
      name: "Mel", 
      icon: "https://ddragon.leagueoflegends.com/cdn/img/champion/splash/Mel_0.jpg", 
      ability: "Q / R",
      changes: "Dano do Q e base da Ultimate (R) aumentados", 
      detail: "Q: 10-26 → 12-28 | R: 150-350 → 175-400" 
    },
    { 
      name: "Garen", 
      icon: "https://ddragon.leagueoflegends.com/cdn/14.24.1/img/champion/Garen.png", 
      ability: "Q / E",
      changes: "Duração da velocidade do Q e escalonamento do E aumentados", 
      detail: "Q Velocidade: 1.5-3.5s → 2.0-4.0s | E: Dano por nível aumentado" 
    },
    { 
      name: "Lillia", 
      icon: "https://ddragon.leagueoflegends.com/cdn/14.24.1/img/champion/Lillia.png", 
      ability: "P / Q / R",
      changes: "Cura da passiva e dano do Q/R aumentados", 
      detail: "Passiva: 12% AP → 15% AP | R Cooldown: 150-110s → 130-90s" 
    }
  ],
  nerfs: [
    { 
      name: "Taliyah", 
      icon: "https://ddragon.leagueoflegends.com/cdn/14.24.1/img/champion/Taliyah.png", 
      ability: "Q",
      changes: "Dano base do Q reduzido", 
      detail: "Q Dano: 60-160 → 55-155 (redução de 5 em todos os níveis)" 
    },
    { 
      name: "Azir", 
      icon: "https://ddragon.leagueoflegends.com/cdn/14.24.1/img/champion/Azir.png", 
      ability: "Base",
      changes: "Crescimento de vida reduzido", 
      detail: "Vida por nível: 110 → 100" 
    },
    { 
      name: "Varus", 
      icon: "https://ddragon.leagueoflegends.com/cdn/14.24.1/img/champion/Varus.png", 
      ability: "Q",
      changes: "Dano máximo do Q escalonado reduzido", 
      detail: "Escalamento de AD: 150-190% → 140-180%" 
    }
  ],
  items: [
    { name: "Hubris", icon: "https://ddragon.leagueoflegends.com/cdn/14.24.1/img/item/6696.png", type: "Item", description: "Custo de ouro reduzido de 3000 para 2800." },
    { name: "Locket of the Iron Solari", icon: "https://ddragon.leagueoflegends.com/cdn/14.24.1/img/item/3190.png", type: "Item", description: "Escudo inicial aumentado para proteger melhor contra ganks." }
  ],
  system: [
    { title: "Modo Brawl", description: "Retorno do modo 2v2v2v2 com novos mapas e aprimoramentos." },
    { title: "Last Hit Indicators", description: "Nova opção visual para indicar quando um súdito pode ser abatido." }
  ]
};

// Dados Mockados do Valorant
const valorantData = {
  game: "valorant",
  version: "10.02",
  title: "Episode 10 Act 2 Checkpoint",
  date: "7 de Abril de 2026",
  overview: "Ajustes focados em duelistas e balanceamento econômico de armas para mudar o ritmo de invasões nos bomb sites.",
  buffs: [
    { 
      name: "Cypher", 
      icon: "https://media.valorant-api.com/agents/117ed9e3-49f3-6512-3ccf-0cada7e3823b/displayicon.png", 
      ability: "Fio-Armadilha (C)",
      changes: "Custo de créditos reduzido e alcance visual aumentado", 
      detail: "Custo: 200 → 150 créditos | Distância de ativação +10%" 
    },
    { 
      name: "Deadlock", 
      icon: "https://media.valorant-api.com/agents/cc8b64c8-4b25-4ff9-6e7f-37b4da43d235/displayicon.png", 
      ability: "Sensor Sônico (Q)",
      changes: "Duração do atordoamento (stun) aumentada", 
      detail: "Stun: 1.5s → 2.1s" 
    }
  ],
  nerfs: [
    { 
      name: "Iso", 
      icon: "https://media.valorant-api.com/agents/0e38b510-41a8-5780-5e8f-568b2a4f2d6c/displayicon.png", 
      ability: "Fluxo Protetor (E)",
      changes: "Duração do escudo basal reduzida", 
      detail: "Tempo de proteção inicial: 12s → 8s" 
    },
    { 
      name: "Jett", 
      icon: "https://media.valorant-api.com/agents/add6443a-41bd-e414-f6ad-e58d267f4e95/displayicon.png", 
      ability: "Brisa de Impulso (E)",
      changes: "Janela de tempo para o dash reduzida", 
      detail: "Janela de ativação após preparo: 12s → 7.5s" 
    }
  ],
  items: [
    { name: "Outlaw", icon: "https://media.valorant-api.com/weapons/5f0aaf7a-4289-3998-d5ff-eb9a5cf7ef5c/displayicon.png", type: "Arma", description: "Preço aumentado para reduzir frequência de compra em ecos. 2400 → 2600" },
    { name: "Classic", icon: "https://media.valorant-api.com/weapons/29a0cfab-485b-f5d5-779a-b59f85e204a8/displayicon.png", type: "Arma", description: "Espalhamento de balas do clique direito (Burst) aumentado no pulo." }
  ],
  system: [
    { title: "Rotação Definitiva", description: "Mapa Pearl retorna ao Competitivo, enquanto Split é rotacionado para fora." },
    { title: "Detecção Anti-Cheat", description: "Novas medidas comportamentais implementadas contra uso de macros de movimento." }
  ]
};

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

export default function App() {
  const [selectedGame, setSelectedGame] = useState('lol');
  const [isUpdating, setIsUpdating] = useState(false);

  const data = selectedGame === 'lol' ? lolData : valorantData;
  const isLol = selectedGame === 'lol';

  // Cores dinâmicas para o tema de fundo
  const orbColor1 = isLol ? 'bg-blue-600/10' : 'bg-red-600/10';
  const orbColor2 = isLol ? 'bg-purple-600/10' : 'bg-orange-600/10';
  
  // Imagem de fundo do Banner (Mel pro LoL, Jett genérico pro Valorant)
  const bannerImage = isLol 
    ? "https://ddragon.leagueoflegends.com/cdn/img/champion/splash/Mel_0.jpg"
    : "https://media.valorant-api.com/agents/add6443a-41bd-e414-f6ad-e58d267f4e95/displayicon.png";

  const handleUpdate = () => {
    setIsUpdating(true);
    // Simular busca de novas notas de patch (ex: via web scraping do bot_patch.py futuramente)
    setTimeout(() => {
      setIsUpdating(false);
    }, 2000);
  };

  const scrollToSection = (e, id) => {
    e.preventDefault();
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen bg-black text-zinc-300 font-sans selection:bg-blue-500/30 smooth-scroll">
      {/* Esferas de Fundo Animadas */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none transition-colors duration-1000">
        <div className={cn("absolute top-[-10%] left-[-10%] w-[40%] h-[40%] blur-[120px] rounded-full transition-colors duration-1000", orbColor1)} />
        <div className={cn("absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] blur-[120px] rounded-full transition-colors duration-1000", orbColor2)} />
      </div>

      {/* Menu Superior (Header) */}
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

          <div className="hidden md:flex items-center gap-8 text-base font-medium">
            <div className="flex bg-zinc-900 rounded-full p-1 border border-zinc-800 mr-4">
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
            
            <button 
              onClick={handleUpdate}
              disabled={isUpdating}
              className={cn(
                "flex items-center gap-2 text-white px-5 py-2.5 rounded-full font-bold transition-all active:scale-95",
                isLol ? "bg-blue-600 hover:bg-blue-500" : "bg-red-600 hover:bg-red-500",
                isUpdating && "opacity-75 cursor-not-allowed"
              )}
            >
              <RefreshCw className={cn("w-5 h-5", isUpdating && "animate-spin")} />
              {isUpdating ? "Checando..." : "Atualizar Notas"}
            </button>
          </div>
        </div>
      </nav>

      <main id="inicio" className="max-w-7xl mx-auto px-6 py-12 relative z-10 scroll-m-24">
        {/* Banner Principal */}
        <div className="mb-16">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            key={data.game} // Força a re-animição de fade quando trocar de jogo
            className="relative p-12 rounded-[2.5rem] bg-gradient-to-br from-zinc-900 to-zinc-950 border border-zinc-800 shadow-2xl overflow-hidden group"
          >
            {/* O mask-gradient (estilos CSS no fim do arquivo) cria o efeito de desfoque/transição na imagem */}
            <div 
              className={cn(
                "absolute top-0 right-0 w-1/2 h-full bg-cover bg-center opacity-30 mask-gradient transition-all duration-1000",
                isLol ? "" : "bg-contain bg-no-repeat bg-right" // Agentes de val. tem recortes
              )} 
              style={{ backgroundImage: `url('${bannerImage}')`}}
            />
            
            <div className="relative h-full flex flex-col justify-center max-w-2xl">
              <span className={cn(
                "inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-bold tracking-widest uppercase mb-6 border",
                isLol ? "bg-blue-500/10 text-blue-400 border-blue-500/20" : "bg-red-500/10 text-red-400 border-red-500/20"
              )}>
                Patch v{data.version}
              </span>
              <h1 className="text-6xl md:text-8xl font-black text-white mb-6 leading-[1.1] tracking-tight">
                {data.title}
              </h1>
              <p className="text-xl md:text-2xl text-zinc-400 leading-relaxed mb-8">
                {data.overview}
              </p>
              <div className="flex items-center gap-6">
                <button className="flex items-center gap-3 bg-zinc-800 border border-zinc-700 text-white px-8 py-4 rounded-2xl font-bold hover:bg-zinc-700 transition-all active:scale-95">
                  <Info className="w-6 h-6" /> Notas Completas
                </button>
                <span className="text-base font-medium">{data.date}</span>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Grade de Mudanças em Personagens (Buffs e Nerfs) */}
        <div id="personagens" className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-16 scroll-m-24">
          
          {/* Seção de Buffs */}
          <Card className="border-green-500/20">
            <SectionTitle title={isLol ? "🟢 Campeões Buffados" : "🟢 Agentes Buffados"} icon={ArrowUpCircle} color="bg-green-500/20" />
            <div className="space-y-6">
              {data.buffs.map((char, i) => (
                <div key={i} className="flex items-start gap-6 p-5 rounded-2xl hover:bg-white/5 transition-colors border border-transparent hover:border-zinc-800">
                  <div className="w-20 h-20 rounded-2xl overflow-hidden border-2 border-green-500/40 shadow-xl shrink-0 bg-zinc-800">
                    <img src={char.icon} alt={char.name} className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-2xl font-bold text-white">{char.name}</h3>
                      <span className="text-xs font-bold px-3 py-1 rounded-full bg-green-500/10 text-green-400 border border-green-500/20 uppercase tracking-widest text-center">
                        {char.ability}
                      </span>
                    </div>
                    <p className="text-lg text-green-400 font-semibold mb-2">{char.changes}</p>
                    <div className="p-3 rounded-xl bg-zinc-950/50 border border-zinc-800 mt-2">
                      <p className="text-sm text-zinc-400 font-mono flex items-center gap-3">
                        <span className="w-1.5 h-4 bg-green-500/50 rounded-full" />
                        {char.detail}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Seção de Nerfs */}
          <Card className="border-red-500/20">
            <SectionTitle title={isLol ? "🔴 Campeões Nerfados" : "🔴 Agentes Nerfados"} icon={ArrowDownCircle} color="bg-red-500/20" />
            <div className="space-y-6">
              {data.nerfs.map((char, i) => (
                <div key={i} className="flex items-start gap-6 p-5 rounded-2xl hover:bg-white/5 transition-colors border border-transparent hover:border-zinc-800">
                  <div className="w-20 h-20 rounded-2xl overflow-hidden border-2 border-red-500/40 shadow-xl shrink-0 bg-zinc-800">
                    <img src={char.icon} alt={char.name} className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-2xl font-bold text-white">{char.name}</h3>
                      <span className="text-xs font-bold px-3 py-1 rounded-full bg-red-500/10 text-red-400 border border-red-500/20 uppercase tracking-widest text-center">
                        {char.ability}
                      </span>
                    </div>
                    <p className="text-lg text-red-400 font-semibold mb-2">{char.changes}</p>
                    <div className="p-3 rounded-xl bg-zinc-950/50 border border-zinc-800 mt-2">
                      <p className="text-sm text-zinc-400 font-mono flex items-center gap-3">
                        <span className="w-1.5 h-4 bg-red-500/50 rounded-full" />
                        {char.detail}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Camada Inferior (Itens/Armas e Sistemas) */}
        <div id="itens" className="grid grid-cols-1 md:grid-cols-3 gap-8 scroll-m-24">
           
           {/* Section de Itens ou Armas */}
           <Card className="md:col-span-2">
            <SectionTitle 
              title={isLol ? "🧰 Modificações de Itens" : "🔫 Ajustes Econômicos de Armas"} 
              icon={isLol ? Sword : Crosshair} 
              color={isLol ? "bg-amber-500/20" : "bg-red-500/20"} 
            />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {data.items.map((item, i) => (
                <div key={i} className="flex items-center gap-5 p-5 rounded-2xl bg-zinc-950/50 border border-zinc-800">
                  <div className="w-16 h-16 rounded-xl bg-zinc-800 p-1.5 shrink-0 flex items-center justify-center overflow-hidden">
                    <img 
                      src={item.icon} 
                      alt={item.name} 
                      className={cn("w-full h-full", isLol ? "object-contain" : "object-contain scale-125")} // Ajuste pro render de armas ficar melhor
                    />
                  </div>
                  <div>
                    <h4 className="text-base font-bold text-white mb-1">{item.name}</h4>
                    <span className={cn(
                      "text-xs font-black uppercase tracking-tighter",
                      isLol ? "text-amber-500" : "text-red-400"
                    )}>
                      {item.type}
                    </span>
                    <p className="text-sm text-zinc-400 mt-2 leading-relaxed">{item.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Section de Mudanças no Sistema do Jogo */}
          <Card>
            <SectionTitle title="🗺️ Atualizações de Sistema" icon={Shield} color={isLol ? "bg-blue-500/20" : "bg-purple-500/20"} />
            <div className="space-y-8">
              {data.system.map((sys, i) => (
                <div key={i}>
                  <h4 className="font-bold text-white text-lg mb-3 flex items-center gap-2">
                    <div className={cn("w-2 h-2 rounded-full", isLol ? "bg-blue-500" : "bg-purple-500")} /> 
                    {sys.title}
                  </h4>
                  <p className="text-sm leading-relaxed text-zinc-400">{sys.description}</p>
                </div>
              ))}
              <div className="pt-6 border-t border-zinc-800">
                <a href="#" className="flex items-center justify-between group">
                  <span className="text-sm font-bold text-white hover:text-white transition-colors uppercase tracking-widest">
                    Correções de Bugs
                  </span>
                  <ExternalLink className="w-5 h-5 text-zinc-600 group-hover:text-white" />
                </a>
              </div>
            </div>
          </Card>
        </div>
      </main>

      {/* Rodapé */}
      <footer className="border-t border-zinc-800/50 py-16 mt-20 relative z-10 transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-10">
          <div className="text-base text-zinc-500">
            © 2026 Gaming Bots Automation. Informações resgatadas pelo bot v2.
          </div>
          <div className="flex gap-10 text-base font-medium">
            <a href="#" className="hover:text-white transition-colors">Privacidade</a>
            <a href="#" className="hover:text-white transition-colors">Termos</a>
            <a href="#" className="hover:text-white transition-colors">Suporte TI</a>
          </div>
        </div>
      </footer>

      {/* Regras globais base para alguns efeitos que fogem do scope do tailwind v4 na box */}
      <style dangerouslySetInnerHTML={{ __html: `
        html {
          scroll-behavior: smooth;
        }
        .mask-gradient {
          mask-image: linear-gradient(to left, black, transparent);
          -webkit-mask-image: linear-gradient(to left, black, transparent);
        }
      `}} />
    </div>
  );
}
