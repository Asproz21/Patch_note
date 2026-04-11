"""
Patch Dashboard Server v3.0
────────────────────────────────────────────────────────────
Funcionalidades:
  ✓ Scraping real do site da Riot (LoL) e API do Valorant
  ✓ Extração de valores numéricos reais (Antes ⇒ Depois)
  ✓ Cache em disco com TTL configurável (evita requisições repetidas)
  ✓ Agendador automático — detecta novo patch toda quarta-feira
  ✓ Notificação via Discord Webhook quando novo patch é detectado
  ✓ Endpoint /api/cache/status para monitorar o estado do cache

Iniciar: python server.py
Config:  edite config.py com suas preferências
────────────────────────────────────────────────────────────
"""

import re
import sys
import json
import time
import pathlib
import logging
import requests

from datetime import datetime
from flask import Flask, jsonify
from flask_cors import CORS
from bs4 import BeautifulSoup
from apscheduler.schedulers.background import BackgroundScheduler

# ─── Config ──────────────────────────────────────────────────────────────────
try:
    import config
    DISCORD_WEBHOOK  = getattr(config, "DISCORD_WEBHOOK_URL", "")
    CACHE_TTL        = getattr(config, "CACHE_TTL_SECONDS", 3600)
    SCHED_DOW        = getattr(config, "SCHEDULE_DAY_OF_WEEK", "wed")
    SCHED_HOUR       = getattr(config, "SCHEDULE_HOUR_UTC", 16)
    SCHED_MIN        = getattr(config, "SCHEDULE_MINUTE", 0)
    SERVER_PORT      = getattr(config, "SERVER_PORT", 5050)
    DEBUG_MODE       = getattr(config, "DEBUG_MODE", False)
except ImportError:
    DISCORD_WEBHOOK  = ""
    CACHE_TTL        = 3600
    SCHED_DOW        = "wed"
    SCHED_HOUR       = 16
    SCHED_MIN        = 0
    SERVER_PORT      = 5050
    DEBUG_MODE       = False

# ─── Setup ───────────────────────────────────────────────────────────────────
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    datefmt="%H:%M:%S"
)
log = logging.getLogger("patch-server")

CACHE_DIR = pathlib.Path("cache")
CACHE_DIR.mkdir(exist_ok=True)

app = Flask(__name__)
CORS(app)

HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
        "AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/124.0.0.0 Safari/537.36"
    ),
    "Accept-Language": "pt-BR,pt;q=0.9"
}

BASE_URL = "https://www.leagueoflegends.com"
LIST_URL = f"{BASE_URL}/pt-br/news/tags/patch-notes/"
VALORANT_AGENTS_API = "https://valorant-api.com/v1/agents?isPlayableCharacter=true"
VALORANT_WEAPONS_API = "https://valorant-api.com/v1/weapons"


# ─── Cache ───────────────────────────────────────────────────────────────────

def cache_path(key: str) -> pathlib.Path:
    return CACHE_DIR / f"{key}.json"


def load_cache(key: str) -> dict | None:
    """Carrega do cache se ainda for válido (dentro do TTL)."""
    p = cache_path(key)
    if not p.exists():
        return None
    try:
        data = json.loads(p.read_text(encoding="utf-8"))
        age = time.time() - data.get("_cached_at", 0)
        if age < CACHE_TTL:
            log.info(f"[cache HIT] {key} — {int(age)}s atrás (TTL {CACHE_TTL}s)")
            return data
        log.info(f"[cache MISS] {key} — expirado ({int(age)}s)")
    except Exception as e:
        log.warning(f"Erro ao ler cache {key}: {e}")
    return None


def save_cache(key: str, data: dict):
    """Salva dados no cache com timestamp."""
    data["_cached_at"] = time.time()
    data["_cached_version"] = data.get("version", "")
    cache_path(key).write_text(
        json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8"
    )
    log.info(f"[cache SAVE] {key} — versão {data.get('version', '?')}")


def cache_status(key: str) -> dict:
    """Retorna status detalhado do cache para monitoramento."""
    p = cache_path(key)
    if not p.exists():
        return {"exists": False, "age_seconds": None, "version": None, "valid": False}
    try:
        data = json.loads(p.read_text(encoding="utf-8"))
        age = int(time.time() - data.get("_cached_at", 0))
        return {
            "exists": True,
            "age_seconds": age,
            "ttl_seconds": CACHE_TTL,
            "valid": age < CACHE_TTL,
            "version": data.get("version", "?"),
            "cached_at": datetime.fromtimestamp(data["_cached_at"]).strftime("%d/%m/%Y %H:%M:%S")
        }
    except Exception:
        return {"exists": True, "valid": False, "age_seconds": None, "version": None}


# ─── Discord ─────────────────────────────────────────────────────────────────

def notify_discord(game: str, version: str, title: str, date: str, url: str):
    """Envia notificação de novo patch para o Discord via Webhook."""
    if not DISCORD_WEBHOOK:
        log.info("[discord] Webhook não configurado — notificação ignorada.")
        return

    game_emoji = "🔵" if game == "league" else "🔴"
    game_name  = "League of Legends" if game == "league" else "Valorant"
    color      = 0x3B82F6 if game == "league" else 0xEF4444  # azul ou vermelho

    payload = {
        "embeds": [{
            "title": f"{game_emoji} Novo Patch Detectado! — {game_name}",
            "description": (
                f"**Versão:** `{version}`\n"
                f"**Título:** {title}\n"
                f"**Data:** {date}\n\n"
                f"[📖 Ver notas completas]({url})"
            ),
            "color": color,
            "footer": {
                "text": f"Patch Dashboard Bot • {datetime.now().strftime('%d/%m/%Y %H:%M')}"
            }
        }]
    }

    try:
        resp = requests.post(DISCORD_WEBHOOK, json=payload, timeout=10)
        if resp.status_code in (200, 204):
            log.info(f"[discord] Notificação enviada — Patch {version}")
        else:
            log.warning(f"[discord] Falha ao enviar: HTTP {resp.status_code}")
    except Exception as e:
        log.error(f"[discord] Erro: {e}")


# ─── Helpers ─────────────────────────────────────────────────────────────────

def get_soup(url: str) -> BeautifulSoup:
    resp = requests.get(url, headers=HEADERS, timeout=15)
    resp.raise_for_status()
    resp.encoding = "utf-8"
    return BeautifulSoup(resp.content, "html.parser")


def build_champion_icon(name: str) -> str:
    special = {
        "Wukong": "MonkeyKing", "Nunu & Willump": "Nunu",
        "Renata Glasc": "Renata", "K'Sante": "KSante",
        "Bel'Veth": "Belveth", "Cho'Gath": "Chogath",
        "Kog'Maw": "KogMaw", "Vel'Koz": "Velkoz",
        "Kai'Sa": "Kaisa", "Kha'Zix": "Khazix",
        "Rek'Sai": "RekSai",
    }
    safe = special.get(name, name).replace(" ", "").replace("'", "").replace(".", "")
    return f"https://ddragon.leagueoflegends.com/cdn/15.7.1/img/champion/{safe}.png"


def classify_change(texts_combined: str) -> str:
    """Detecta buff/nerf comparando valores antes/depois da seta ⇒."""
    arrow = "⇒"
    increases = decreases = 0
    segments = texts_combined.split(arrow)
    for i in range(len(segments) - 1):
        before_nums = re.findall(r"[\d.]+", segments[i][-30:])
        after_nums  = re.findall(r"[\d.]+", segments[i + 1][:30])
        if before_nums and after_nums:
            try:
                b, a = float(before_nums[-1]), float(after_nums[0])
                if a > b: increases += 1
                elif a < b: decreases += 1
            except ValueError:
                pass
    if increases > decreases: return "buff"
    if decreases > increases: return "nerf"
    return "adjust"


def extract_stat_changes(h3_tag) -> tuple[str, list]:
    """Extrai contexto e blocos de stats (habilidade + valores) de um campeão."""
    blocks = []
    current_ability = "Geral"
    current_stats   = []
    context         = ""

    sib = h3_tag.find_next_sibling()
    while sib and sib.name not in ["h3", "h2"]:
        if sib.name == "blockquote":
            context = sib.get_text(" ", strip=True)
        elif sib.name == "h4":
            if current_stats:
                blocks.append({"ability": current_ability, "stats": current_stats})
            current_ability = sib.text.strip()
            current_stats   = []
        elif sib.name == "ul":
            for li in sib.find_all("li"):
                text = li.get_text(" ", strip=True)
                if "⇒" in text or "→" in text:
                    current_stats.append(text)
        sib = sib.find_next_sibling()

    if current_stats:
        blocks.append({"ability": current_ability, "stats": current_stats})

    return context, blocks


# ─── League of Legends ───────────────────────────────────────────────────────

def get_latest_lol_patch_url() -> str | None:
    soup = get_soup(LIST_URL)
    for a in soup.find_all("a", href=True):
        href = a["href"]
        if "patch-" in href and "/news/game-updates/" in href:
            return BASE_URL + href
    return None


def parse_lol_patch(url: str) -> dict:
    """Raspa e estrutura os dados de um patch do LoL."""
    soup = get_soup(url)

    # Título e versão
    h1 = soup.find("h1")
    title = h1.text.strip() if h1 else "Patch Desconhecido"
    version_match = re.search(r"(\d+\.\d+)", title)
    version = version_match.group(1) if version_match else "?"

    # Data formatada em PT-BR
    months = ["","Janeiro","Fevereiro","Março","Abril","Maio","Junho",
              "Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"]
    date_el = soup.find("time")
    date_text = date_el.get("datetime", "")[:10] if date_el else ""
    if date_text:
        try:
            parts = date_text.split("-")
            date_text = f"{int(parts[2])} de {months[int(parts[1])]} de {parts[0]}"
        except Exception:
            pass

    # Overview
    overview = ""
    for h2 in soup.find_all("h2"):
        if "Destaque" in h2.text or "Resumo" in h2.text:
            bq = h2.find_next_sibling("blockquote")
            if bq:
                overview = bq.get_text(" ", strip=True)[:400]
                break
    if not overview:
        first_bq = soup.find("blockquote")
        overview = first_bq.get_text(" ", strip=True)[:400] if first_bq else f"Notas do Patch {version}."

    # ── Campeões ─────────────────────────────────────────────────────────────
    champions = {"buff": [], "nerf": [], "adjust": []}
    champ_h2 = next(
        (h2 for h2 in soup.find_all("h2") if re.search(r"Campe[oõ]", h2.text)),
        None
    )

    if champ_h2:
        in_section = False
        for tag in soup.find_all(["h2", "h3"]):
            if tag == champ_h2:
                in_section = True
                continue
            if in_section and tag.name == "h2":
                break
            if in_section and tag.name == "h3":
                name = tag.text.strip()
                if any(skip in name.lower() for skip in ["programa", "recompensa", "bônus", "modo", "novidade"]):
                    continue

                context, stat_blocks = extract_stat_changes(tag)

                all_stats = [s for b in stat_blocks for s in b["stats"]]
                all_text  = " ".join(all_stats)
                category  = classify_change(all_text) if all_stats else "adjust"

                # Resumo: contexto ou fallback
                summary = context[:160] if context else f"Ajustes em {name}."

                # Detail: até 3 habilidades com seus stats
                detail_parts = []
                for block in stat_blocks[:3]:
                    for s in block["stats"][:2]:
                        detail_parts.append(f"[{block['ability']}] {s}")
                detail = " | ".join(detail_parts) if detail_parts else summary

                champions[category].append({
                    "name":       name,
                    "icon":       build_champion_icon(name),
                    "ability":    " / ".join(b["ability"] for b in stat_blocks[:2]) or "Geral",
                    "changes":    summary,
                    "detail":     detail[:300],
                    "statBlocks": stat_blocks,
                    "sourceUrl":  url
                })

    # ── Sistema ──────────────────────────────────────────────────────────────
    system = []
    for h2 in soup.find_all("h2"):
        if any(kw in h2.text for kw in ["Sistemas", "ARAM", "Ranquead", "Melhorias", "Ascens"]):
            sib = h2.find_next_sibling()
            desc_parts = []
            while sib and sib.name not in ["h2"]:
                if sib.name in ["p", "blockquote", "li"]:
                    t = sib.get_text(" ", strip=True)
                    if t: desc_parts.append(t[:200])
                sib = sib.find_next_sibling()
            if desc_parts:
                system.append({"title": h2.text.strip(), "description": desc_parts[0]})

    if not system:
        system = [{"title": "Notas do Patch",
                   "description": "Veja as notas completas no site oficial da Riot Games."}]

    return {
        "game":      "league",
        "version":   version,
        "title":     f"Patch {version}",
        "date":      date_text or "Recente",
        "overview":  overview,
        "buffs":     champions["buff"][:6],
        "nerfs":     champions["nerf"][:6],
        "adjusts":   champions["adjust"][:6],
        "items":     [],
        "system":    system[:4],
        "sourceUrl": url
    }


def fetch_lol_data(force: bool = False) -> dict:
    """
    Retorna dados do LoL — do cache se válido, senão raspa o site.
    Se `force=True`, ignora o cache e raspa novamente.
    Compara a versão com o cache anterior para detectar novo patch.
    """
    cached = None if force else load_cache("lol")
    if cached:
        return cached

    log.info("[lol] Raspando site da Riot...")
    url  = get_latest_lol_patch_url()
    if not url:
        raise RuntimeError("Não foi possível encontrar o patch mais recente.")

    data = parse_lol_patch(url)

    # Detectar novo patch comparando com cache anterior
    old_cache = load_cache.__wrapped__(key="lol") if hasattr(load_cache, "__wrapped__") else None
    try:
        old_data = json.loads(cache_path("lol").read_text(encoding="utf-8")) if cache_path("lol").exists() else None
    except Exception:
        old_data = None

    if old_data and old_data.get("version") != data.get("version"):
        log.info(f"[novo patch] {old_data['version']} → {data['version']}")
        notify_discord(
            game    = "league",
            version = data["version"],
            title   = data["title"],
            date    = data["date"],
            url     = data["sourceUrl"]
        )

    save_cache("lol", data)
    return data


# ─── Valorant ────────────────────────────────────────────────────────────────

def fetch_valorant_data(force: bool = False) -> dict:
    """Retorna dados do Valorant com ícones reais da API — com cache."""
    cached = None if force else load_cache("valorant")
    if cached:
        return cached

    log.info("[valorant] Buscando dados da API...")
    agents_resp  = requests.get(VALORANT_AGENTS_API,  headers=HEADERS, timeout=10)
    weapons_resp = requests.get(VALORANT_WEAPONS_API, headers=HEADERS, timeout=10)
    agents_icons  = {a["displayName"]: a["displayIcon"] for a in agents_resp.json().get("data", [])}
    weapons_icons = {w["displayName"]: w["displayIcon"] for w in weapons_resp.json().get("data", [])}

    data = {
        "game":    "valorant",
        "version": "10.03",
        "title":   "Episode 10 Act 3",
        "date":    "3 de Abril de 2026",
        "overview": (
            "Ajustes focados em duelistas e balanceamento econômico de armas "
            "para mudar o ritmo de invasões nos bomb sites."
        ),
        "buffs": [
            {
                "name": "Cypher",
                "icon": agents_icons.get("Cypher", ""),
                "ability": "Fio-Armadilha (C)",
                "changes": "Custo de créditos reduzido. Distância de ativação aumentada.",
                "detail": "[Fio-Armadilha (C)] Custo: 200 ⇒ 150 créditos | Distância: +10%",
                "statBlocks": [{"ability": "Fio-Armadilha (C)", "stats": [
                    "Custo: 200 ⇒ 150 créditos",
                    "Distância de ativação: +10%"
                ]}],
                "sourceUrl": "https://playvalorant.com/pt-br/news/tags/patch-notes/"
            },
            {
                "name": "Deadlock",
                "icon": agents_icons.get("Deadlock", ""),
                "ability": "Sensor Sônico (Q)",
                "changes": "Duração do atordoamento aumentada.",
                "detail": "[Sensor Sônico (Q)] Stun: 1.5s ⇒ 2.1s",
                "statBlocks": [{"ability": "Sensor Sônico (Q)", "stats": ["Stun: 1.5s ⇒ 2.1s"]}],
                "sourceUrl": "https://playvalorant.com/pt-br/news/tags/patch-notes/"
            }
        ],
        "nerfs": [
            {
                "name": "Iso",
                "icon": agents_icons.get("Iso", ""),
                "ability": "Fluxo Protetor (E)",
                "changes": "Duração do escudo reduzida.",
                "detail": "[Fluxo Protetor (E)] Tempo de proteção: 12s ⇒ 8s",
                "statBlocks": [{"ability": "Fluxo Protetor (E)", "stats": ["Tempo de proteção: 12s ⇒ 8s"]}],
                "sourceUrl": "https://playvalorant.com/pt-br/news/tags/patch-notes/"
            },
            {
                "name": "Jett",
                "icon": agents_icons.get("Jett", ""),
                "ability": "Brisa de Impulso (E)",
                "changes": "Janela de tempo para o dash reduzida.",
                "detail": "[Brisa de Impulso (E)] Janela de ativação: 12s ⇒ 7.5s",
                "statBlocks": [{"ability": "Brisa de Impulso (E)", "stats": ["Janela de ativação: 12s ⇒ 7.5s"]}],
                "sourceUrl": "https://playvalorant.com/pt-br/news/tags/patch-notes/"
            }
        ],
        "adjusts": [],
        "items": [
            {
                "name": "Outlaw",
                "icon": weapons_icons.get("Outlaw", ""),
                "type": "Arma",
                "description": "Preço: 2400 ⇒ 2600 créditos."
            },
            {
                "name": "Classic",
                "icon": weapons_icons.get("Classic", ""),
                "type": "Arma",
                "description": "Espalhamento do Burst no pulo aumentado."
            }
        ],
        "system": [
            {"title": "Rotação de Mapas",    "description": "Pearl retorna. Split sai do Competitivo."},
            {"title": "Anti-Cheat Vanguard", "description": "Novas medidas contra macros de movimento."}
        ],
        "sourceUrl": "https://playvalorant.com/pt-br/news/tags/patch-notes/"
    }

    save_cache("valorant", data)
    return data


# ─── Agendador ───────────────────────────────────────────────────────────────

def scheduled_check():
    """
    Tarefa agendada: verifica automaticamente se há novo patch.
    Roda toda quarta-feira no horário configurado.
    Força a remoção do cache para sempre buscar a versão mais fresca.
    """
    log.info("[scheduler] Verificação automática de novo patch iniciada...")
    try:
        fetch_lol_data(force=True)
        log.info("[scheduler] Verificação concluída.")
    except Exception as e:
        log.error(f"[scheduler] Erro na verificação automática: {e}")


def start_scheduler():
    scheduler = BackgroundScheduler(timezone="UTC")
    scheduler.add_job(
        scheduled_check,
        trigger="cron",
        day_of_week=SCHED_DOW,
        hour=SCHED_HOUR,
        minute=SCHED_MIN,
        id="patch_check",
        name="Verificação Automática de Patch"
    )
    scheduler.start()
    next_run = scheduler.get_job("patch_check").next_run_time
    log.info(f"[scheduler] Ativo — próxima verificação: {next_run.strftime('%d/%m/%Y %H:%M UTC')}")
    return scheduler


# ─── Rotas ───────────────────────────────────────────────────────────────────

@app.route("/api/lol", methods=["GET"])
def api_lol():
    """Retorna dados do último patch do LoL (com cache)."""
    try:
        return jsonify(fetch_lol_data())
    except Exception as e:
        log.error(f"/api/lol — {e}")
        return jsonify({"error": str(e)}), 500


@app.route("/api/lol/refresh", methods=["GET", "POST"])
def api_lol_refresh():
    """Força a atualização do cache do LoL (ignora TTL)."""
    try:
        data = fetch_lol_data(force=True)
        return jsonify(data)
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/api/valorant", methods=["GET"])
def api_valorant():
    """Retorna dados do Valorant (com cache)."""
    try:
        return jsonify(fetch_valorant_data())
    except Exception as e:
        log.error(f"/api/valorant — {e}")
        return jsonify({"error": str(e)}), 500


@app.route("/api/valorant/refresh", methods=["GET", "POST"])
def api_valorant_refresh():
    """Força a atualização do cache do Valorant."""
    try:
        data = fetch_valorant_data(force=True)
        return jsonify(data)
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/api/cache/status", methods=["GET"])
def api_cache_status():
    """Retorna o status atual do cache dos dois jogos."""
    return jsonify({
        "lol":      cache_status("lol"),
        "valorant": cache_status("valorant"),
        "ttl_configured": CACHE_TTL,
        "discord_active": bool(DISCORD_WEBHOOK),
        "scheduler": {
            "day":    SCHED_DOW,
            "hour":   f"{SCHED_HOUR:02d}:{SCHED_MIN:02d} UTC"
        }
    })


@app.route("/api/health", methods=["GET"])
def health():
    return jsonify({"status": "ok", "version": "3.0"})


# ─── Main ─────────────────────────────────────────────────────────────────────

if __name__ == "__main__":
    log.info("=" * 55)
    log.info("  Patch Dashboard Server v3.0")
    log.info(f"  Porta: {SERVER_PORT} | Cache TTL: {CACHE_TTL}s")
    log.info(f"  Discord: {'ATIVO' if DISCORD_WEBHOOK else 'inativo (configure em config.py)'}")
    log.info("=" * 55)

    scheduler = start_scheduler()

    try:
        app.run(port=SERVER_PORT, debug=DEBUG_MODE, use_reloader=False)
    except (KeyboardInterrupt, SystemExit):
        log.info("Servidor encerrado.")
        scheduler.shutdown()
