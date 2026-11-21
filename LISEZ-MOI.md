# Scrabble duplicate, entraînement (PWA)

## Les fichiers
- index.html : la structure de la page
- style.css : le design
- app.js : le code de l'appli (lis les commentaires en haut)
- data.js : les 8 parties intégrées
- dict.js : la liste de mots ODS8, compressée
- pdf.min.js et pdf.worker.min.js : lecture des PDF, en local pour marcher hors connexion
- manifest.webmanifest : le "passeport" de l'appli (nom, icône, couleurs)
- sw.js : le service worker, qui garde tout en cache (usage hors connexion)
- icon-192.png et icon-512.png : les icônes

## Mettre en ligne (GitHub Pages, depuis le téléphone)
1. Créer un compte sur github.com.
2. Nouveau dépôt (bouton +), nom : scrabble-duplicate, visibilité : Public.
3. "uploading an existing file", puis envoyer TOUS les fichiers de ce dossier (à plat, sans sous-dossier).
4. Valider avec "Commit changes".
5. Settings > Pages > Source : "Deploy from a branch", branche main, dossier / (root), Save.
6. Après 1 à 2 minutes, le lien apparaît : https://TON-PSEUDO.github.io/scrabble-duplicate/

## Installer sur le téléphone
1. Ouvrir le lien dans Chrome, avec internet, et laisser charger.
2. Menu (3 points) > "Installer l'application" ou "Ajouter à l'écran d'accueil".
3. Ouvrir l'appli une fois, puis tester en mode avion.

## Mettre à jour plus tard
Modifier le fichier sur GitHub, puis changer le numéro dans sw.js
(const CACHE = 'duplicate-v2') pour que les téléphones prennent la nouvelle version.
