# ==============================================
# Configurações do Patch Dashboard Server
# ==============================================
# Copie este arquivo para config.py e preencha suas credenciais.
# NUNCA faça commit do config.py com dados reais!

# ─── Discord ────────────────────────────────
# URL do seu webhook do Discord
# Para criar: Canal Discord → Editar → Integrações → Webhooks → Novo Webhook → Copiar URL
DISCORD_WEBHOOK_URL = ""  # Ex: "https://discord.com/api/webhooks/XXXXX/XXXXX"

# ─── Cache ──────────────────────────────────
# Tempo em segundos para o cache ser considerado válido
# 3600 = 1 hora | 7200 = 2 horas | 86400 = 1 dia
CACHE_TTL_SECONDS = 3600

# ─── Agendador ──────────────────────────────
# Dia e hora (UTC) para checar novo patch automaticamente
# LoL: geralmente às quartas-feiras às 13h BRT (16h UTC)
SCHEDULE_DAY_OF_WEEK = "wed"       # seg/ter/qua/qui/sex/sab/dom
SCHEDULE_HOUR_UTC = 16             # Hora em UTC (16 = 13h BRT)
SCHEDULE_MINUTE = 0

# ─── Servidor ───────────────────────────────
SERVER_PORT = 5050
DEBUG_MODE = False
