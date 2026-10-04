# Blocky Runner 🟪

A Roblox-style blocky endless runner. Dodge the blocks by switching lanes or jumping, survive until speed hits **100**, and get on the leaderboard.

## Features
- 3 lanes, dark blue/purple perspective road, blocky avatar
- Easy / Mid / Hard difficulties (speed climbs from 20 to 100)
- Score = time taken to finish; crashing records the speed you reached
- Character customization: hair, skin, shirt and pants colors, male or female
- Online leaderboard (Python server) with automatic offline fallback
- Touch buttons (◀ ▶ ▲) and keyboard (← → / A D, Space / ↑ / W)

## Run it
Requires Python 3.8+ (no packages to install).

```bash
python server.py
```
Open http://localhost:8000 . Scores are stored in `scores.json`.
To change the port: `PORT=3000 python server.py`.

## Files
| File | What it does |
|------|--------------|
| `index.html` | Page and menus |
| `style.css` | Styling |
| `game.js` | Game engine, avatar, leaderboard client |
| `server.py` | Serves the game + `GET/POST /api/scores` |

## Hosting notes
- **GitHub Pages** only hosts static files, so the game works there but the leaderboard falls back to each player's own browser.
- For a shared online leaderboard, host `server.py` on any Python host (Render, Railway, PythonAnywhere, a VPS) and run `python server.py`. Note that some free hosts reset the disk, which would clear `scores.json`.
- The server rejects impossible times, but it is a simple anti-cheat, not a secure one.
