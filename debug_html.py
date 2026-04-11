import urllib.request
from bs4 import BeautifulSoup
import sys

sys.stdout.reconfigure(encoding='utf-8')

req = urllib.request.Request(
    'https://www.leagueoflegends.com/pt-br/news/game-updates/league-of-legends-patch-26-7-notes/',
    headers={'User-Agent': 'Mozilla/5.0'}
)
html = urllib.request.urlopen(req).read()
soup = BeautifulSoup(html, 'html.parser')

# Pegar Cassiopeia e ver todos os elementos abaixo até o próximo h3
h3s = soup.find_all('h3')
for h3 in h3s:
    if h3.text.strip() in ['Cassiopeia', 'Graves', 'Karma']:
        print(f'=== {h3.text.strip()} ===')
        sib = h3.find_next_sibling()
        while sib and sib.name not in ['h3', 'h2']:
            if sib.name and sib.text.strip():
                print(f'  [{sib.name}] {repr(sib.text.strip()[:300])}')
                for child in sib.find_all(['li', 'p', 'h4', 'strong', 'del', 'ins']):
                    txt = child.text.strip()
                    if txt:
                        print(f'    ({child.name}): {repr(txt[:200])}')
            sib = sib.find_next_sibling()
        print()
