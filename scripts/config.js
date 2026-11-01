// Configuration de l'application Studio DAW

const CONFIG = {
    // Paramètres audio
    audio: {
        sampleRate: 44100,
        bufferSize: 512,
        latencyCompensation: 0,
        masterVolume: 0.8
    },
    
    // Paramètres par défaut du projet
    project: {
        bpm: 120,
        timeSignature: {
            numerator: 4,
            denominator: 4
        },
        zoomLevel: 50,
        snapToGrid: true,
        gridSize: 16,
        metronomeEnabled: false,
        metronomeVolume: 0.5
    },
    
    // Paramètres de la timeline
    timeline: {
        pixelsPerSecond: 100,
        minPixelsPerSecond: 20,
        maxPixelsPerSecond: 500,
        trackHeight: 60,
        headerWidth: 200,
        minTrackHeight: 40,
        maxTrackHeight: 100
    },
    
    // Paramètres MIDI
    midi: {
        enabled: true,
        thruEnabled: true,
        channel: 'all',
        velocityCurve: 'linear'
    },
    
    // Paramètres d'enregistrement
    recording: {
        bitRate: 16,
        sampleRate: 44100,
        channels: 2,
        mimeType: 'audio/wav'
    },
    
    // Paramètres d'export
    export: {
        wav: {
            bitRate: 16,
            sampleRate: 44100
        },
        mp3: {
            bitRate: 192,
            sampleRate: 44100
        }
    },
    
    // Couleurs de l'interface
    colors: {
        primary: '#6366f1',
        secondary: '#8b5cf6',
        accent: '#ec4899',
        success: '#10b981',
        warning: '#f59e0b',
        danger: '#ef4444',
        background: '#0f172a',
        surface: '#1e293b',
        surfaceHover: '#334155',
        text: '#f8fafc',
        textSecondary: '#94a3b8',
        border: '#334155',
        grid: '#475569'
    },
    
    // Raccourcis clavier
    keyboard: {
        play: ' ',
        record: 'r',
        stop: 's',
        rewind: 'Backspace',
        delete: 'Delete',
        copy: 'ctrl+c',
        paste: 'ctrl+v',
        undo: 'ctrl+z',
        redo: 'ctrl+y',
        save: 'ctrl+s',
        newProject: 'ctrl+n',
        zoomIn: 'ctrl+',
        zoomOut: 'ctrl-'
    },
    
    // Liste des sons de batterie par défaut
    drumSounds: {
        kick: { name: 'Kick', file: null, color: '#ef4444' },
        snare: { name: 'Snare', file: null, color: '#3b82f6' },
        'hihat-closed': { name: 'Hi-Hat Fermé', file: null, color: '#10b981' },
        'hihat-open': { name: 'Hi-Hat Ouvert', file: null, color: '#10b981' },
        clap: { name: 'Clap', file: null, color: '#f59e0b' },
        '808': { name: '808 Bass', file: null, color: '#8b5cf6' },
        cymbal: { name: 'Cymbal', file: null, color: '#ec4899' },
        tom: { name: 'Tom', file: null, color: '#06b6d4' }
    },
    
    // Instruments virtuels
    instruments: {
        piano: { name: 'Piano', type: 'polyphonic', color: '#6366f1' },
        synth: { name: 'Synthé', type: 'polyphonic', color: '#8b5cf6' },
        bass: { name: 'Basse', type: 'polyphonic', color: '#06b6d4' },
        strings: { name: 'Cordes', type: 'polyphonic', color: '#10b981' },
        organ: { name: 'Orgue', type: 'polyphonic', color: '#f59e0b' },
        guitar: { name: 'Guitare', type: 'polyphonic', color: '#ef4444' }
    },
    
    // Effets audio
    effects: {
        reverb: { name: 'Réverbération', type: 'reverb', color: '#6366f1' },
        delay: { name: 'Delay', type: 'delay', color: '#8b5cf6' },
        compressor: { name: 'Compresseur', type: 'compressor', color: '#10b981' },
        eq: { name: 'Égaliseur', type: 'eq', color: '#f59e0b' },
        distortion: { name: 'Distorsion', type: 'distortion', color: '#ef4444' },
        limiter: { name: 'Limiteur', type: 'limiter', color: '#ec4899' }
    }
};

// État global de l'application
const APP_STATE = {
    isPlaying: false,
    isRecording: false,
    currentTime: 0,
    project: null,
    tracks: [],
    selectedTrack: null,
    selectedClip: null,
    midiDevices: [],
    connectedMidiDevice: null,
    audioContext: null,
    metronomeActive: false,
    metronomeNode: null,
    zoomLevel: 50,
    lastTapTime: 0,
    tapTempoCount: 0,
    undoStack: [],
    redoStack: []
};

// Messages d'erreur
const ERROR_MESSAGES = {
    audioContext: {
        create: 'Impossible de créer le contexte audio. Vérifiez que votre navigateur supporte la Web Audio API.',
        resume: 'Impossible de reprendre le contexte audio. Essayez de cliquer sur la page d\'abord.'
    },
    midi: {
        notSupported: 'Votre navigateur ne supporte pas la Web MIDI API. Utilisez Chrome, Firefox ou Edge.',
        noDevices: 'Aucun appareil MIDI détecté. Connectez un appareil et rafraîchissez la page.',
        permissionDenied: 'Permission refusée pour accéder aux appareils MIDI.'
    },
    recording: {
        permissionDenied: 'Permission refusée pour accéder au microphone.',
        notSupported: 'Votre navigateur ne supporte pas l\'API MediaRecorder.',
        error: 'Erreur lors de l\'enregistrement audio.'
    },
    storage: {
        quotaExceeded: 'Espace de stockage insuffisant pour sauvegarder le projet.',
        error: 'Erreur lors de la sauvegarde ou du chargement du projet.'
    },
    export: {
        error: 'Erreur lors de l\'export du projet.'
    }
};

// Notifications
const NOTIFICATIONS = {
    project: {
        saved: 'Projet sauvegardé avec succès!',
        loaded: 'Projet chargé avec succès!',
        created: 'Nouveau projet créé!',
        deleted: 'Projet supprimé!'
    },
    midi: {
        connected: 'Appareil MIDI connecté!',
        disconnected: 'Appareil MIDI déconnecté!',
        error: 'Erreur de connexion MIDI'
    },
    recording: {
        started: 'Enregistrement démarré!',
        stopped: 'Enregistrement arrêté!',
        error: 'Erreur d\'enregistrement'
    },
    export: {
        started: 'Export en cours...',
        completed: 'Export terminé!',
        error: 'Erreur lors de l\'export'
    }
};
