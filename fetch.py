import urllib.request
import json

req = urllib.request.Request("https://valorant-api.com/v1/agents?isPlayableCharacter=true")
with urllib.request.urlopen(req) as response:
    data = json.loads(response.read().decode())['data']
    for a in data:
        if a['displayName'] in ['Cypher', 'Deadlock', 'Iso', 'Jett']:
            print(f"{a['displayName']}: {a['displayIcon']}")

req2 = urllib.request.Request("https://valorant-api.com/v1/weapons")
with urllib.request.urlopen(req2) as response:
    data2 = json.loads(response.read().decode())['data']
    for a in data2:
        if a['displayName'] in ['Outlaw', 'Classic']:
            print(f"{a['displayName']}: {a['displayIcon']}")
