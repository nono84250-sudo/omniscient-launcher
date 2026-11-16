# Omniscient Launcher

Launcher Minecraft open source d'[Omniscient](https://omniscientlauncher.com) : trouve un serveur
Minecraft, et rejoins-le en un clic avec le bon modpack installé automatiquement.

*English below.*

## Télécharger

- **Windows** : installeur dans l'onglet [Releases](../../releases/latest)
  ou sur [omniscientlauncher.com/download](https://omniscientlauncher.com/download).
- **Linux** : AppImage et paquet `.deb` dans les releases, à partir de la prochaine version.

Le launcher se met à jour tout seul à partir des releases de ce dépôt.

## Code source

Ce dépôt contient le code source complet du launcher (Electron) :

- `src/` : le code de l'application (fenêtre principale, lancement du jeu, modpacks, comptes Microsoft).
- `build/` : icônes et script de l'installeur Windows.
- `scripts/generate-env.js` : prépare la configuration au moment du build.

Le site omniscientlauncher.com (annuaire des serveurs et API) est un service séparé et n'est pas dans ce dépôt.

### Lancer en développement

```bash
npm install
npm start
```

Pour construire l'installeur : `npm run dist` (Windows) ou `npm run dist:linux`.
Le build attend un fichier `.env` (jamais commité) avec `LAUNCHER_API_KEY` et `MCHUB_SITE_URL`.

## Licence

Le code est publié sous la licence **GNU GPL v3** (voir [LICENSE](LICENSE)) : tu peux le lire, le modifier
et le redistribuer, à condition que toute version modifiée reste publiée sous la même licence.

Le nom « Omniscient », le logo et l'identité visuelle ne sont pas couverts par cette licence :
une version modifiée doit porter un autre nom. Les composants tiers gardent leur propre licence
(`src/fonts/Inter-OFL-LICENSE.txt`, `src/vendor/LICENSES-skinview3d.txt`).

Omniscient n'est affilié ni à Mojang ni à Microsoft.

---

## English

Open source Minecraft launcher for [Omniscient](https://omniscientlauncher.com): find a Minecraft
server and join it in one click, with the right modpack installed automatically.

- **Windows**: installer in [Releases](../../releases/latest).
- **Linux**: AppImage and `.deb` in the releases, starting with the next version.

Development: `npm install` then `npm start`. Licensed under the **GNU GPL v3** (see [LICENSE](LICENSE)).
The "Omniscient" name and logo are not covered by the license. Not affiliated with Mojang or Microsoft.
