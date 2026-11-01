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

## 🚀 Installation et exécution

### Méthode 1 : Ouverture directe
1. Téléchargez ou clonez ce dépôt
2. Ouvrez le fichier `index.html` dans un navigateur moderne (Chrome, Firefox, Edge)
3. L'application se lancera automatiquement

### Méthode 2 : Serveur local
```bash
# Avec Python
python -m http.server 8000

# Avec Node.js
npx serve

# Avec PHP
php -S localhost:8000
```

Puis ouvrez `http://localhost:8000` dans votre navigateur.

### ⚠️ Important
- **HTTPS requis** pour certaines fonctionnalités (MIDI, microphone) en production
- **localhost** fonctionne pour le développement
- Utilisez **Chrome, Firefox ou Edge** pour une compatibilité optimale

## 📁 Structure du projet

```
studio-music/
├── index.html              # Page principale
├── README.md               # Documentation
├── styles/
│   └── main.css           # Styles CSS principaux
├── scripts/
│   ├── config.js          # Configuration et constants
│   ├── utils.js           # Fonctions utilitaires
│   ├── audio-engine.js    # Moteur audio (Web Audio API)
│   ├── midi-manager.js    # Gestion MIDI
│   ├── track.js           # Classes Track et Clip
│   ├── timeline.js        # Timeline multipiste
│   ├── recorder.js        # Enregistrement audio/MIDI
│   ├── drum-machine.js    # Drum Machine et séquences
│   ├── piano-roll.js      # Piano Roll
│   ├── virtual-keyboard.js # Clavier virtuel
│   ├── mixer.js           # Mixeur audio
│   ├── effects.js         # Effets audio
│   ├── samples-library.js # Bibliothèque de samples
│   ├── instruments.js     # Instruments virtuels
│   ├── storage.js         # Sauvegarde IndexedDB
│   ├── ui.js              # Gestion de l'interface
│   ├── keyboard-shortcuts.js # Raccourcis clavier
│   └── main.js            # Point d'entrée principal
└── samples/               # (Optionnel) Samples audio
```

## 🔧 Technologies utilisées

- **HTML5** : Structure de l'application
- **CSS3** : Styles et animations
- **JavaScript (ES6+)** : Logique de l'application
- **Web Audio API** : Traitement audio en temps réel
- **Web MIDI API** : Connexion aux appareils MIDI
- **MediaRecorder API** : Enregistrement audio
- **IndexedDB** : Sauvegarde locale des projets
- **AudioWorklet** : (Optionnel) Traitement audio avancé

## 🎯 Utilisation

### 1. Création d'un nouveau projet
- Cliquez sur **📁** (Nouveau projet)
- Ou appuyez sur **Ctrl+N**

### 2. Ajout de pistes
- Cliquez sur **+** ou utilisez le menu
- Choisissez le type de piste (Audio, MIDI, Batterie, Instrument)

### 3. Enregistrement
- **Armez** une piste avec le bouton **🎤**
- Cliquez sur **⭕** (Enregistrement) ou appuyez sur **R**
- Jouez votre instrument ou chantez dans le microphone

### 4. Beatmaking
- Allez dans l'onglet **Drum Machine**
- Cliquez sur les cases de la grille pour ajouter des sons
- Sélectionnez un pattern et appuyez sur **Lecture**

### 5. Piano Roll
- Allez dans l'onglet **Piano Roll**
- Cliquez sur les notes du clavier pour les ajouter
- Utilisez le clavier de l'ordinateur (A-W-S-E-D-...) pour jouer

### 6. Mixage
- Ouvrez le **Mixeur** en bas de l'écran
- Réglez le volume, le panoramique et les effets
- Utilisez **Mute** et **Solo** pour isoler des pistes

### 7. Export
- Cliquez sur **📤** (Exporter)
- Choisissez le format (WAV, MP3, MIDI)
- Le fichier sera téléchargé automatiquement

## 🎨 Personnalisation

### Thème
- **Mode sombre** par défaut
- Couleurs personnalisables dans `config.js`

### Paramètres audio
- **BPM** : 40-200
- **Taille du buffer** : 256, 512, 1024, 2048
- **Fréquence d'échantillonnage** : 44100, 48000, 96000 Hz

### Paramètres MIDI
- **Canal MIDI** : 1-16 ou Tous
- **Courbe de vélocité** : Linéaire, Logarithmique, Exponentielle
- **MIDI Thru** : Activation/désactivation

## 🐛 Dépannage

### Problèmes courants

1. **Le son ne fonctionne pas**
   - Vérifiez que votre navigateur supporte la Web Audio API
   - Cliquez sur la page pour activer le contexte audio
   - Assurez-vous que le volume n'est pas muet

2. **Le MIDI ne se connecte pas**
   - Utilisez Chrome, Firefox ou Edge
   - Vérifiez que votre appareil MIDI est connecté
   - Rafraîchissez la page après avoir connecté l'appareil
   - Assurez-vous d'utiliser HTTPS ou localhost

3. **Le microphone ne fonctionne pas**
   - Autorisez l'accès au microphone dans votre navigateur
   - Vérifiez que le microphone est connecté
   - Utilisez HTTPS ou localhost

4. **Les projets ne se sauvegardent pas**
   - Vérifiez que votre navigateur supporte IndexedDB
   - Assurez-vous qu'il y a assez d'espace de stockage
   - Essayez un autre navigateur

## 📊 Performances

- **Latence** : < 10ms avec buffer 256
- **Voix polyphoniques** : Jusqu'à 16 par instrument
- **Pistes** : Illimitées (selon les ressources du navigateur)
- **Clips** : Illimités (selon les ressources du navigateur)

## 🔒 Sécurité et confidentialité

- **Aucune donnée** n'est envoyée à des serveurs externes
- **Tout est local** : les projets sont stockés dans votre navigateur
- **Pas de tracking** : aucune collecte de données
- **Open source** : le code est transparent et vérifiable

## 🤝 Contribution

Les contributions sont les bienvenues ! Voici comment contribuer :

1. **Fork** le projet
2. **Créez** une branche (`git checkout -b feature/amazing-feature`)
3. **Commitez** vos changements (`git commit -m 'Add amazing feature'`)
4. **Poussez** sur la branche (`git push origin feature/amazing-feature`)
5. **Ouvrez** une Pull Request

## 📄 Licence

Ce projet est sous licence **MIT** - libre d'utilisation pour tout usage personnel ou commercial.

## 🙏 Remerciements

- **Web Audio API** - MDN Documentation
- **Web MIDI API** - Chrome Developers
- **Tone.js** - Inspiration pour la gestion audio
- **Soundtrap, FL Studio, BandLab** - Inspiration pour l'interface et les fonctionnalités

---

**Créé avec ❤️ pour les musiciens et les développeurs**

*Studio DAW - Votre studio de musique dans le navigateur*
