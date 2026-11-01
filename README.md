# Studio DAW - Application de création musicale dans le navigateur

## 🎵 Aperçu

**Studio DAW** est une application complète de production musicale directement dans votre navigateur. Inspiré par Soundtrap, FL Studio et BandLab, il offre une expérience professionnelle de création musicale avec prise en charge MIDI, enregistrement vocal, beatmaking, piano roll, mixage audio et bien plus.

## ✨ Fonctionnalités

### 🎹 Instrumentation
- **Piano virtuel** avec plusieurs octaves
- **Synthétiseurs** polyphoniques personnalisables
- **Batterie électronique** avec samples réalistes
- **Clavier MIDI** avec détection automatique
- **Instruments virtuels** (piano, synthé, basse, cordes, etc.)

### 🎶 Beatmaking
- **Drum Machine** avec grille de séquençage
- **Patterns** configurables (16, 32, 64 étapes)
- **Samples de batterie** (kick, snare, hi-hats, claps, 808, etc.)
- **Séquenceur** visuel avec cases cliquables
- **Boucles automatiques** et répétition de patterns

### 🎤 Enregistrement vocal
- **Enregistrement microphone** avec autorisation
- **Contrôle de lecture** (play, pause, stop, enregistrement)
- **Édition basique** des enregistrements
- **Réglage du volume** et panoramique
- **Effets vocaux** (réverbération, delay, etc.)

### 🎛️ Timeline multipiste
- **Gestion de pistes** illimitée
- **Types de pistes** : Audio, MIDI, Batterie, Instrument
- **Clips** déplaçables et redimensionnables
- **Zoom** et dézoom dynamique
- **Règle temporelle** avec marqueurs de mesure
- **Playhead** interactif

### 🎚️ Mixage audio
- **Table de mixage** professionnelle
- **Contrôle du volume** par piste
- **Panoramique** gauche/droite
- **Mute/Solo** pour chaque piste
- **Effets** intégrés (réverb, delay, compresseur, EQ, etc.)
- **VU Meters** pour le monitoring

### 🎧 Connexion MIDI
- **Détection automatique** des appareils MIDI
- **Prise en charge Web MIDI API**
- **Affichage des notes** en temps réel
- **Vélocité** et pression détectées
- **Enregistrement MIDI** sur la timeline
- **Clavier virtuel** de secours

### 💾 Sauvegarde des projets
- **Sauvegarde automatique** (toutes les 30 secondes)
- **IndexedDB** pour le stockage local
- **Création de projets** multiples
- **Import/Export** de projets
- **Export audio** (WAV, MP3)

### ⌨️ Raccourcis clavier
- **Espace** : Lecture/Arrêt
- **R** : Enregistrement
- **S** : Stop
- **Suppr** : Supprimer
- **Ctrl+C** : Copier
- **Ctrl+V** : Coller
- **Ctrl+Z** : Annuler
- **Ctrl+S** : Sauvegarder
- **Flèches** : Navigation

## \ud83d\ude80 Installation et ex\u00e9cution

### M\u00e9thode 1 : Ouverture directe
1. T\u00e9l\u00e9chargez ou clonez ce d\u00e9p\u00f4t
2. Ouvrez le fichier `index.html` dans un navigateur moderne (Chrome, Firefox, Edge)
3. L'application se lancera automatiquement

### M\u00e9thode 2 : Serveur local Windows
**Utilisez le fichier `start-local.bat` fourni :**
1. Double-cliquez sur `start-local.bat` dans l'explorateur de fichiers
2. Un serveur HTTP se lancera automatiquement sur le port 8000
3. Ouvrez votre navigateur et acc\u00e9dez \u00e0 : `http://localhost:8000`

**Pour arr\u00eater le serveur :**
- Fermez la fen\u00eatre du terminal (cliquez sur la croix ou appuyez sur Ctrl+C)

**Si Python n'est pas install\u00e9 :**
1. T\u00e9l\u00e9chargez Python depuis [python.org](https://www.python.org/downloads/)
2. Pendant l'installation, cochez **"Add Python to PATH"**
3. R\u00e9essayez de lancer `start-local.bat`

**Alternatives :**
```bash
# Avec Python
python -m http.server 8000

# Avec Node.js
npx serve

# Avec PHP
php -S localhost:8000
```

### M\u00e9thode 3 : D\u00e9ploiement Netlify
1. **Connectez votre d\u00e9p\u00f4t GitHub** \u00e0 Netlify
2. **Importez le projet** depuis `asusrogoscar-ux/studio-daw`
3. **Configuration automatique** : Netlify d\u00e9tectera le fichier `netlify.toml`
4. **D\u00e9ployez** : Votre application sera disponible sur une URL Netlify

**Configuration Netlify :**
- Dossier de publication : `./` (racine du projet)
- Commande de build : Aucune (projet statique)
- Fichier de configuration : `netlify.toml` (d\u00e9j\u00e0 pr\u00e9sent)

### \u26a0\ufe0f Important
- **HTTPS requis** pour certaines fonctionnalit\u00e9s (MIDI, microphone) en production
- **localhost** fonctionne pour le d\u00e9veloppement
- Utilisez **Chrome, Firefox ou Edge** pour une compatibilit\u00e9 optimale
- Netlify utilise HTTPS par d\u00e9faut, donc toutes les fonctionnalit\u00e9s seront disponibles

