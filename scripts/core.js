// CORE SYSTEM pour Studio DAW
// Ce fichier DOIT être chargé EN PREMIER
// Il contient les dépendances minimales et le système de gestion des modules

// ============================================================================
// 1. OBJET GLOBAL POUR L'ÉTAT DE L'APPLICATION
// ============================================================================

if (typeof window.APP_STATE === 'undefined') {
    window.APP_STATE = {
        audioContext: null,
        isPlaying: false,
        isRecording: false,
        currentProject: null,
        projects: [],
        tracks: [],
        bpm: 120,
        selectedTrack: null,
        selectedInstrument: 'piano',
        initialized: false,
        modules: {}
    };
}

// ============================================================================
// 2. MESSAGES D'ERREUR GLOBAUX
// ============================================================================

if (typeof window.ERROR_MESSAGES === 'undefined') {
    window.ERROR_MESSAGES = {
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
}

// ============================================================================
// 3. FONCTIONS UTILITAIRES GLOBALES (SYNC, PAS DE DÉPENDANCES)
// ============================================================================

if (typeof window.generateId === 'undefined') {
    window.generateId = function(prefix = '') {
        return `${prefix}${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    };
}

if (typeof window.formatTime === 'undefined') {
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
}

if (typeof window.isSupported === 'undefined') {
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
}

if (typeof window.beatsToSeconds === 'undefined') {
    window.beatsToSeconds = function(beats, bpm) {
        return (beats * 60) / (bpm || 120);
    };
}

if (typeof window.secondsToBeats === 'undefined') {
    window.secondsToBeats = function(seconds, bpm) {
        return (seconds * (bpm || 120)) / 60;
    };
}

if (typeof window.velocityToGain === 'undefined') {
    window.velocityToGain = function(velocity, curve = 'linear') {
        const normalized = velocity / 127;
        switch (curve) {
            case 'logarithmic': return Math.pow(normalized, 2);
            case 'exponential': return Math.sqrt(normalized);
            default: return normalized;
        }
    };
}

if (typeof window.midiToFrequency === 'undefined') {
    window.midiToFrequency = function(midiNote) {
        return 440 * Math.pow(2, (midiNote - 69) / 12);
    };
}

if (typeof window.frequencyToMidi === 'undefined') {
    window.frequencyToMidi = function(frequency) {
        return Math.round(69 + 12 * Math.log2(frequency / 440));
    };
}

// ============================================================================
// 4. SYSTÈME DE GESTION DES MODULES
// ============================================================================

// Registry pour les classes des modules
window.CORE = window.CORE || {};
window.CORE.ModuleRegistry = {
    classes: {},
    instances: {},
    getters: {},
    
    register: function(moduleName, moduleClass, getterFunction) {
        this.classes[moduleName] = moduleClass;
        this.getters[moduleName] = getterFunction;
        console.log(`Module '${moduleName}' enregistré dans le registry`);
    },
    
    getClass: function(moduleName) {
        return this.classes[moduleName];
    },
    
    createInstance: function(moduleName, ...args) {
        const moduleClass = this.getClass(moduleName);
        if (moduleClass) {
            const instance = new moduleClass(...args);
            this.instances[moduleName] = instance;
            return instance;
        }
        return null;
    },
    
    getInstance: function(moduleName) {
        return this.instances[moduleName] || null;
    },
    
    getGetter: function(moduleName) {
        return this.getters[moduleName] || null;
    }
};

// ============================================================================
// 5. SYSTÈME DE LOG ET NOTIFICATIONS
// ============================================================================

if (typeof window.showToast === 'undefined') {
    window.showToast = function(message, type = 'info', duration = 3000) {
        // Essayer de trouver le container
        let toastContainer = document.getElementById('toast-container');
        
        // Si le DOM n'est pas prêt, réessayer
        if (!toastContainer) {
            const tryAgain = () => {
                toastContainer = document.getElementById('toast-container');
                if (toastContainer) {
                    createToast();
                } else {
                    setTimeout(tryAgain, 50);
                }
            };
            tryAgain();
            return;
        }
        
        const createToast = () => {
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
        
        createToast();
    };
}

if (typeof window.showError === 'undefined') {
    window.showError = function(message, error = null) {
        console.error(message, error);
        window.showToast(message, 'error', 5000);
    };
}

if (typeof window.showWarning === 'undefined') {
    window.showWarning = function(message) {
        console.warn(message);
        window.showToast(message, 'warning', 5000);
    };
}

// ============================================================================
// 6. FONCTIONS POUR ENREGISTRER LES MODULES
// Ces fonctions seront appelées par chaque module pour s'enregistrer
// ============================================================================

window.CORE.registerModule = function(moduleName, moduleClass, getterFunction) {
    window.CORE.ModuleRegistry.register(moduleName, moduleClass, getterFunction);
};

window.CORE.getModule = function(moduleName) {
    return window.CORE.ModuleRegistry.getInstance(moduleName);
};

// ============================================================================
// 7. FONCTIONS GETTER GLOBALES (seront remplacées par les vrais modules)
// ============================================================================

// Pour l'instant, ces fonctions retournent null ou utilisent le registry
window.getAudioEngine = function() {
    return window.CORE.getModule('audio-engine');
};

window.getMidiManager = function() {
    return window.CORE.getModule('midi-manager');
};

window.getTimeline = function() {
    return window.CORE.getModule('timeline');
};

window.getMixer = function() {
    return window.CORE.getModule('mixer');
};

window.getDrumMachine = function() {
    return window.CORE.getModule('drum-machine');
};

window.getPianoRoll = function() {
    return window.CORE.getModule('piano-roll');
};

window.getVirtualKeyboard = function() {
    return window.CORE.getModule('virtual-keyboard');
};

window.getRecorder = function() {
    return window.CORE.getModule('recorder');
};

window.getSamplesLibrary = function() {
    return window.CORE.getModule('samples-library');
};

window.getInstrumentsManager = function() {
    return window.CORE.getModule('instruments');
};

window.getEffectsManager = function() {
    return window.CORE.getModule('effects');
};

window.getStorageManager = function() {
    return window.CORE.getModule('storage');
};

window.getUIManager = function() {
    return window.CORE.getModule('ui');
};

window.getKeyboardShortcuts = function() {
    return window.CORE.getModule('keyboard-shortcuts');
};

// ============================================================================
// 8. SYSTÈME D'INITIALISATION
// ============================================================================

window.CORE.initAllModules = async function() {
    try {
        console.log('Initialisation de tous les modules...');
        
        // 1. Créer toutes les instances dans le bon ordre
        const initOrder = [
            'audio-engine',
            'midi-manager', 
            'storage',
            'track',
            'timeline',
            'recorder',
            'drum-machine',
            'piano-roll',
            'virtual-keyboard',
            'mixer',
            'effects',
            'samples-library',
            'instruments',
            'ui',
            'keyboard-shortcuts'
        ];
        
        // Créer les instances
        for (const moduleName of initOrder) {
            const getter = window.CORE.ModuleRegistry.getGetter(moduleName);
            if (getter) {
                console.log(`  Création de l'instance pour ${moduleName}...`);
                const instance = getter();
                if (instance) {
                    window.CORE.ModuleRegistry.instances[moduleName] = instance;
                    console.log(`    ✓ ${moduleName} créé`);
                } else {
                    console.error(`    ✗ Échec de la création de ${moduleName}`);
                }
            } else {
                console.warn(`    ⚠ Getter non trouvé pour ${moduleName}`);
            }
        }
        
        // 2. Initialiser les modules dans le bon ordre
        console.log('Initialisation des modules...');
        
        // Moteur audio
        const audioEngine = window.CORE.getModule('audio-engine');
        if (audioEngine && !audioEngine.isInitialized) {
            await audioEngine.init();
            console.log('  ✓ Moteur audio initialisé');
        }
        
        // MIDI
        const midiManager = window.CORE.getModule('midi-manager');
        if (midiManager && window.isSupported('webMidi')) {
            await midiManager.init();
            window.showToast('MIDI prêt!', 'success');
            console.log('  ✓ MIDI initialisé');
        }
        
        // Storage
        const storage = window.CORE.getModule('storage');
        if (storage) {
            storage.init();
            console.log('  ✓ Stockage initialisé');
        }
        
        // Timeline
        const timeline = window.CORE.getModule('timeline');
        if (timeline) {
            timeline.init();
            console.log('  ✓ Timeline initialisée');
        }
        
        // Mixer
        const mixer = window.CORE.getModule('mixer');
        if (mixer) {
            mixer.init();
            console.log('  ✓ Mixeur initialisé');
        }
        
        // Drum Machine
        const drumMachine = window.CORE.getModule('drum-machine');
        if (drumMachine) {
            drumMachine.init();
            console.log('  ✓ Drum Machine initialisée');
        }
        
        // Piano Roll
        const pianoRoll = window.CORE.getModule('piano-roll');
        if (pianoRoll) {
            pianoRoll.init();
            console.log('  ✓ Piano Roll initialisé');
        }
        
        // Virtual Keyboard
        const virtualKeyboard = window.CORE.getModule('virtual-keyboard');
        if (virtualKeyboard) {
            virtualKeyboard.init();
            console.log('  ✓ Clavier virtuel initialisé');
        }
        
        // Recorder
        const recorder = window.CORE.getModule('recorder');
        if (recorder) {
            recorder.init();
            console.log('  ✓ Enregistreur initialisé');
        }
        
        // Samples Library
        const samplesLibrary = window.CORE.getModule('samples-library');
        if (samplesLibrary) {
            samplesLibrary.init();
            console.log('  ✓ Bibliothèque de samples initialisée');
        }
        
        // Instruments
        const instrumentsManager = window.CORE.getModule('instruments');
        if (instrumentsManager) {
            instrumentsManager.init();
            console.log('  ✓ Gestionnaire d\'instruments initialisé');
        }
        
        // Effects
        const effectsManager = window.CORE.getModule('effects');
        if (effectsManager) {
            effectsManager.init();
            console.log('  ✓ Gestionnaire d\'effets initialisé');
        }
        
        // UI
        const uiManager = window.CORE.getModule('ui');
        if (uiManager) {
            uiManager.init();
            console.log('  ✓ Interface utilisateur initialisée');
        }
        
        // Keyboard Shortcuts
        const keyboardShortcuts = window.CORE.getModule('keyboard-shortcuts');
        if (keyboardShortcuts) {
            keyboardShortcuts.init();
            console.log('  ✓ Raccourcis clavier initialisés');
        }
        
        // Charger le dernier projet
        if (storage) {
            await storage.loadLastProject();
            console.log('  ✓ Dernier projet chargé');
        }
        
        // Démarrer la sauvegarde automatique
        if (storage) {
            storage.startAutoSave();
            console.log('  ✓ Sauvegarde automatique démarrée');
        }
        
        // Masquer l'overlay de chargement
        const loadingOverlay = document.getElementById('loading-overlay');
        if (loadingOverlay) {
            loadingOverlay.style.display = 'none';
        }
        
        window.APP_STATE.initialized = true;
        console.log('Tous les modules initialisés avec succès!');
        window.showToast('Bienvenue dans Studio DAW!', 'success', 5000);
        
    } catch (error) {
        console.error('Erreur lors de l\'initialisation:', error);
        window.showError('Erreur d\'initialisation: ' + error.message);
        
        // Masquer l'overlay de chargement
        const loadingOverlay = document.getElementById('loading-overlay');
        if (loadingOverlay) {
            loadingOverlay.style.display = 'none';
        }
        window.APP_STATE.initialized = false;
    }
};

// ============================================================================
// 9. DÉMARRER L'INITIALISATION
// ============================================================================

// Attendre que le DOM soit prêt
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        // Donner du temps pour que tous les scripts se chargent
        setTimeout(() => {
            window.CORE.initAllModules().catch(err => {
                console.error('Erreur fatale:', err);
            });
        }, 500);
    });
} else {
    setTimeout(() => {
        window.CORE.initAllModules().catch(err => {
            console.error('Erreur fatale:', err);
        });
    }, 500);
}

console.log('CORE System chargé');
