// Bootstrap pour Studio DAW
// Ce fichier DOIT être chargé EN PREMIER dans index.html
// Il garantit que toutes les dépendances sont disponibles avant utilisation

// ============================================================================
// PHASE 1: Charger la configuration (sync)
// ============================================================================

// ============================================================================
// PHASE 2: Définir les variables globales pour tous les modules
// ============================================================================

// Objet global pour l'état de l'application
window.APP_STATE = window.APP_STATE || {
    audioContext: null,
    isPlaying: false,
    isRecording: false,
    currentProject: null,
    projects: [],
    tracks: [],
    bpm: 120,
    selectedTrack: null,
    selectedInstrument: 'piano'
};

// Objet global pour les erreurs
window.ERROR_MESSAGES = window.ERROR_MESSAGES || {
    audioContext: {
        create: 'Impossible de créer le contexte audio. Vérifiez que votre navigateur supporte la Web Audio API.',
        resume: 'Impossible de reprendre le contexte audio. Cliquez sur la page pour activer le son.',
        suspended: 'Le contexte audio est suspendu.'
    },
    midi: {
        permissionDenied: 'Accès MIDI refusé. Veuillez autoriser l\'accès MIDI et recharger la page.',
        notSupported: 'La Web MIDI API n\'est pas supportée par votre navigateur.',
        noDevices: 'Aucun appareil MIDI détecté.'
    },
    audio: {
        permissionDenied: 'Accès au microphone refusé. Veuillez autoriser l\'accès et recharger la page.',
        notSupported: 'L\'API MediaDevices n\'est pas supportée.',
        recordingError: 'Erreur lors de l\'enregistrement audio.'
    },
    storage: {
        notSupported: 'IndexedDB n\'est pas supporté par votre navigateur.',
        quotaExceeded: 'Espace de stockage insuffisant.',
        error: 'Erreur de stockage.'
    }
};

// ============================================================================
// PHASE 3: Fonctions utilitaires globales (doivent être disponibles partout)
// ============================================================================

/**
 * Vérifie si une fonctionnalité est supportée par le navigateur
 */
window.isSupported = function(feature) {
    const features = {
        webAudio: typeof AudioContext !== 'undefined' || typeof webkitAudioContext !== 'undefined',
        webMidi: typeof navigator.requestMIDIAccess === 'function',
        mediaRecorder: typeof MediaRecorder !== 'undefined',
        indexedDB: typeof indexedDB !== 'undefined',
        audioWorklet: typeof AudioWorklet !== 'undefined' || typeof webkitAudioWorklet !== 'undefined',
        getUserMedia: typeof navigator.mediaDevices?.getUserMedia === 'function'
    };
    return features[feature] || false;
};

/**
 * Génère un ID unique
 */
window.generateId = function(prefix = '') {
    return `${prefix}${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

/**
 * Formate le temps en secondes au format MM:SS
 */
window.formatTime = function(seconds) {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    
    if (hours > 0) {
        return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    } else {
        return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
};

/**
 * Affiche un toast notification
 */
window.showToast = function(message, type = 'info', duration = 3000) {
    // Attendre que le DOM soit prêt
    if (!document.getElementById('toast-container')) {
        setTimeout(() => window.showToast(message, type, duration), 100);
        return;
    }
    
    const toastContainer = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    toastContainer.appendChild(toast);
    
    setTimeout(() => {
        toast.classList.add('show');
    }, 10);
    
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => {
            toast.remove();
        }, 300);
    }, duration);
};

/**
 * Affiche une erreur
 */
window.showError = function(message, error = null) {
    console.error(message, error);
    window.showToast(message, 'error', 5000);
};

/**
 * Affiche un avertissement
 */
window.showWarning = function(message) {
    console.warn(message);
    window.showToast(message, 'warning', 5000);
};

/**
 * Convertit les beats en secondes
 */
window.beatsToSeconds = function(beats, bpm) {
    return (beats * 60) / (bpm || 120);
};

/**
 * Convertit les secondes en beats
 */
window.secondsToBeats = function(seconds, bpm) {
    return (seconds * (bpm || 120)) / 60;
};

/**
 * Convertit la vélocité MIDI (0-127) en gain (0-1)
 */
window.velocityToGain = function(velocity, curve = 'linear') {
    const normalized = velocity / 127;
    switch (curve) {
        case 'logarithmic': return Math.pow(normalized, 2);
        case 'exponential': return Math.sqrt(normalized);
        default: return normalized;
    }
};

/**
 * Convertit la fréquence MIDI en note
 */
window.midiToFrequency = function(midiNote) {
    return 440 * Math.pow(2, (midiNote - 69) / 12);
};

/**
 * Convertit la fréquence en note MIDI
 */
window.frequencyToMidi = function(frequency) {
    return Math.round(69 + 12 * Math.log2(frequency / 440));
};

// ============================================================================
// PHASE 4: Déclarer les variables des singletons AVANT leur utilisation
// ============================================================================

// Variables pour les instances singleton (déclarées ici pour éviter les références circulaires)
window._audioEngineInstance = null;
window._midiManagerInstance = null;
window._timelineInstance = null;
window._mixerInstance = null;
window._drumMachineInstance = null;
window._pianoRollInstance = null;
window._virtualKeyboardInstance = null;
window._recorderInstance = null;
window._samplesLibraryInstance = null;
window._instrumentsManagerInstance = null;
window._effectsManagerInstance = null;
window._storageManagerInstance = null;
window._uiManagerInstance = null;

// ============================================================================
// PHASE 5: Fonctions getters pour les singletons
// Ces fonctions seront remplacées par les vrais modules, mais sont déclarées ici
// pour éviter les erreurs "is not defined"
// ============================================================================

window.getAudioEngine = function() {
    if (!window._audioEngineInstance) {
        console.warn('getAudioEngine appelé avant l\'initialisation. Retourne null.');
    }
    return window._audioEngineInstance;
};

window.getMidiManager = function() {
    if (!window._midiManagerInstance) {
        console.warn('getMidiManager appelé avant l\'initialisation. Retourne null.');
    }
    return window._midiManagerInstance;
};

window.getTimeline = function() {
    if (!window._timelineInstance) {
        console.warn('getTimeline appelé avant l\'initialisation. Retourne null.');
    }
    return window._timelineInstance;
};

window.getMixer = function() {
    if (!window._mixerInstance) {
        console.warn('getMixer appelé avant l\'initialisation. Retourne null.');
    }
    return window._mixerInstance;
};

window.getDrumMachine = function() {
    if (!window._drumMachineInstance) {
        console.warn('getDrumMachine appelé avant l\'initialisation. Retourne null.');
    }
    return window._drumMachineInstance;
};

window.getPianoRoll = function() {
    if (!window._pianoRollInstance) {
        console.warn('getPianoRoll appelé avant l\'initialisation. Retourne null.');
    }
    return window._pianoRollInstance;
};

window.getVirtualKeyboard = function() {
    if (!window._virtualKeyboardInstance) {
        console.warn('getVirtualKeyboard appelé avant l\'initialisation. Retourne null.');
    }
    return window._virtualKeyboardInstance;
};

window.getRecorder = function() {
    if (!window._recorderInstance) {
        console.warn('getRecorder appelé avant l\'initialisation. Retourne null.');
    }
    return window._recorderInstance;
};

window.getSamplesLibrary = function() {
    if (!window._samplesLibraryInstance) {
        console.warn('getSamplesLibrary appelé avant l\'initialisation. Retourne null.');
    }
    return window._samplesLibraryInstance;
};

window.getInstrumentsManager = function() {
    if (!window._instrumentsManagerInstance) {
        console.warn('getInstrumentsManager appelé avant l\'initialisation. Retourne null.');
    }
    return window._instrumentsManagerInstance;
};

window.getEffectsManager = function() {
    if (!window._effectsManagerInstance) {
        console.warn('getEffectsManager appelé avant l\'initialisation. Retourne null.');
    }
    return window._effectsManagerInstance;
};

window.getStorageManager = function() {
    if (!window._storageManagerInstance) {
        console.warn('getStorageManager appelé avant l\'initialisation. Retourne null.');
    }
    return window._storageManagerInstance;
};

window.getUIManager = function() {
    if (!window._uiManagerInstance) {
        console.warn('getUIManager appelé avant l\'initialisation. Retourne null.');
    }
    return window._uiManagerInstance;
};

// ============================================================================
// PHASE 6: Fonction pour initialiser l'application
// ============================================================================

/**
 * Initialise l'application une fois que tous les scripts sont chargés
 */
window.initStudioDAW = function() {
    // Vérifier que le DOM est prêt
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', window.initStudioDAW);
        return;
    }
    
    // Masquer l'overlay de chargement
    const loadingOverlay = document.getElementById('loading-overlay');
    if (loadingOverlay) {
        loadingOverlay.style.display = 'none';
    }
    
    // Vérifier la compatibilité du navigateur
    window.checkBrowserCompatibility();
    
    // Initialiser les composants principaux dans le bon ordre
    window.initCoreComponents();
};

/**
 * Vérifie la compatibilité du navigateur
 */
window.checkBrowserCompatibility = function() {
    const warning = document.getElementById('compatibility-warning');
    if (!warning) return;
    
    const missingFeatures = [];
    
    if (!window.isSupported('webAudio')) {
        missingFeatures.push('Web Audio API');
    }
    
    if (!window.isSupported('webMidi')) {
        missingFeatures.push('Web MIDI API');
    }
    
    if (!window.isSupported('mediaRecorder')) {
        missingFeatures.push('MediaRecorder API');
    }
    
    if (!window.isSupported('getUserMedia')) {
        missingFeatures.push('MediaDevices API');
    }
    
    if (!window.isSupported('indexedDB')) {
        missingFeatures.push('IndexedDB');
    }
    
    if (missingFeatures.length > 0) {
        const message = `Votre navigateur ne supporte pas : ${missingFeatures.join(', ')}`;
        warning.innerHTML = `<span>\u26a0\ufe0f ${message}. Utilisez Chrome, Firefox ou Edge pour une expérience optimale.</span>`;
        warning.classList.remove('hidden');
    }
};

/**
 * Initialisation des composants principaux
 */
window.initCoreComponents = async function() {
    try {
        console.log('Initialisation des composants principaux...');
        
        // 1. Initialiser le moteur audio
        console.log('Initialisation du moteur audio...');
        const audioEngine = window.getAudioEngine();
        if (audioEngine && !audioEngine.isInitialized) {
            await audioEngine.init();
        }
        
        // 2. Initialiser le gestionnaire MIDI
        console.log('Initialisation du gestionnaire MIDI...');
        const midiManager = window.getMidiManager();
        if (midiManager && window.isSupported('webMidi')) {
            await midiManager.init();
            window.showToast('MIDI prêt!', 'success');
        }
        
        // 3. Initialiser la timeline
        console.log('Initialisation de la timeline...');
        const timeline = window.getTimeline();
        if (timeline) {
            timeline.init();
        }
        
        // 4. Initialiser le mixeur
        console.log('Initialisation du mixeur...');
        const mixer = window.getMixer();
        if (mixer) {
            mixer.init();
        }
        
        // 5. Initialiser la drum machine
        console.log('Initialisation de la drum machine...');
        const drumMachine = window.getDrumMachine();
        if (drumMachine) {
            drumMachine.init();
        }
        
        // 6. Initialiser le piano roll
        console.log('Initialisation du piano roll...');
        const pianoRoll = window.getPianoRoll();
        if (pianoRoll) {
            pianoRoll.init();
        }
        
        // 7. Initialiser le clavier virtuel
        console.log('Initialisation du clavier virtuel...');
        const virtualKeyboard = window.getVirtualKeyboard();
        if (virtualKeyboard) {
            virtualKeyboard.init();
        }
        
        // 8. Initialiser l'enregistreur
        console.log('Initialisation de l\'enregistreur...');
        const recorder = window.getRecorder();
        if (recorder) {
            recorder.init();
        }
        
        // 9. Initialiser la bibliothèque de samples
        console.log('Initialisation de la bibliothèque de samples...');
        const samplesLibrary = window.getSamplesLibrary();
        if (samplesLibrary) {
            samplesLibrary.init();
        }
        
        // 10. Initialiser le gestionnaire d'instruments
        console.log('Initialisation du gestionnaire d\'instruments...');
        const instrumentsManager = window.getInstrumentsManager();
        if (instrumentsManager) {
            instrumentsManager.init();
        }
        
        // 11. Initialiser le gestionnaire d'effets
        console.log('Initialisation du gestionnaire d\'effets...');
        const effectsManager = window.getEffectsManager();
        if (effectsManager) {
            effectsManager.init();
        }
        
        // 12. Initialiser le gestionnaire de stockage
        console.log('Initialisation du gestionnaire de stockage...');
        const storage = window.getStorageManager();
        if (storage) {
            storage.init();
        }
        
        // 13. Initialiser l'interface utilisateur
        console.log('Initialisation de l\'interface utilisateur...');
        const uiManager = window.getUIManager();
        if (uiManager) {
            uiManager.init();
        }
        
        // 14. Initialiser les raccourcis clavier
        console.log('Initialisation des raccourcis clavier...');
        window.initKeyboardShortcuts();
        
        // 15. Charger le dernier projet si disponible
        console.log('Chargement du dernier projet...');
        await window.loadLastProject();
        
        // 16. Démarrer la sauvegarde automatique
        console.log('Démarrage de la sauvegarde automatique...');
        window.startAutoSave();
        
        console.log('Studio DAW initialisé avec succès!');
        window.showToast('Bienvenue dans Studio DAW!', 'success', 5000);
        
    } catch (error) {
        console.error('Erreur lors de l\'initialisation:', error);
        window.showError('Erreur d\'initialisation: ' + error.message);
        
        // Masquer l'overlay de chargement même en cas d'erreur
        const loadingOverlay = document.getElementById('loading-overlay');
        if (loadingOverlay) {
            loadingOverlay.style.display = 'none';
        }
    }
};

// ============================================================================
// PHASE 7: Fonctions utilitaires pour l'application
// ============================================================================

/**
 * Charge le dernier projet sauvegardé
 */
window.loadLastProject = async function() {
    const storage = window.getStorageManager();
    if (storage) {
        await storage.loadLastProject();
    }
};

/**
 * Démarre la sauvegarde automatique
 */
window.startAutoSave = function() {
    const storage = window.getStorageManager();
    if (storage) {
        storage.startAutoSave();
    }
};

/**
 * Initialise les raccourcis clavier
 */
window.initKeyboardShortcuts = function() {
    // Sera implémenté dans keyboard-shortcuts.js
};

// ============================================================================
// PHASE 8: Démarrer l'initialisation une fois que tous les scripts sont chargés
// ============================================================================

// Attendre que tous les scripts soient chargés
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        // Donner un peu de temps pour que tous les scripts soient exécutés
        setTimeout(window.initStudioDAW, 100);
    });
} else {
    setTimeout(window.initStudioDAW, 100);
}

console.log('Bootstrap Studio DAW chargé');
