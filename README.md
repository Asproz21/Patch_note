# 🎮 Riot Games Patch Dashboard

Um painel web moderno, responsivo e interativo para visualizar de forma clara e ágil as atualizações de patch notes dos principais jogos da Riot (**League of Legends** e **Valorant**).

## 📸 Como ficou:

### Dashboard - League of Legends
![Screen de League of Legends](assets/lol-preview.png)

### Dashboard - Valorant
![Screen do Valorant](assets/valorant-preview.png)

---

## 🚀 Funcionalidades

- **Múltiplos Jogos:** Troque instantaneamente entre as notas do League of Legends e Valorant através do mesmo dashboard. As cores e o layout são adaptados dependendo do jogo selecionado!
- **Smooth Scroll Automático:** Opções na barra de navegação para rolar instantaneamente até as seções de "Campeões/Agentes" e "Itens/Armas".
- **Visual Premium:** Painel robusto utilizando Tailwind CSS, efeitos de "glassmorphism", ícones vetoriais modernos (`lucide-react`) e animações com `framer-motion`.
- **Bot Python Integrado (Automação):** Script feito em Python utilizando **Selenium** para raspar (scrape) e capturar as atualizações mais recentes do site oficial de notícias da Riot. *(Expansível)*

## 🛠️ Tecnologias Utilizadas

- **React.js** e **Vite** para o Front-End
- **Tailwind CSS v4** (Estilizações)
- **Framer Motion** (Animações de entrada e renderização)
- **Python** (Selenium, BeautifulSoup, Webdriver Manager)

## 📦 Como rodar localmente

### 1) Rodando o Web Dashboard

1. Abra a pasta do dashboard:
   ```bash
   cd patch-dashboard
   ```
2. Instale as dependências:
   ```bash
   npm install
   ```
3. Inicie o servidor local:
   ```bash
   npm run dev
   ```
*(O app estará disponível em `http://localhost:5173` ou porta similar listada no terminal)*

### 2) Rodando o Bot (Web Scraper)

O script `bot_patch.py` serve como teste de conceito para coletar notas do site oficial no futuro, utilizando Chrome Headless (silencioso).

1. Na pasta raiz do projeto, instale as dependências do Python:
   ```bash
   pip install -r requirements.txt
   ```
2. Execute o bot:
   ```bash
   python bot_patch.py
   ```
O resultado será salvo no arquivo `resumo_patch.txt`.