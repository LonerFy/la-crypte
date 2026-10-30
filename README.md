# La Crypte

Site d'horreur pour Halloween : cinématique d'entrée, cimetière interactif, transitions de sang liquide, huit histoires immersives et interactives, bestiaire et veillées du monde.

Site 100 % statique (HTML, CSS, JavaScript). Aucune dépendance, aucune étape de build. Tous les sons sont synthétisés dans le navigateur.

## Lancer en local

```bash
python3 -m http.server 8000
# puis ouvrir http://localhost:8000
```

## Déploiement

- **GitHub Pages** : Settings › Pages › Source : branche `main`, dossier `/ (root)`.
- **Vercel** : importer le dépôt, preset « Other », sans commande de build, dossier de sortie `.`.

## Structure

- `index.html` : la page
- `css/` : styles du site et du lecteur d'histoires
- `js/stories-*.js` : textes des histoires
- `js/scenes-*.js` : décors animés
- `js/audio.js` : moteur sonore
- `js/app.js` : navigation et Atelier de réglages

Conception : AMOUSSOU-GUENOU Donald
