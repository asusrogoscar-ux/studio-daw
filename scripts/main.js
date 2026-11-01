// Point d'entrée principal de Studio DAW

// Attendre que le DOM soit chargé
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', main);
} else {
    main();
}

async function main() {
    try {
        // Masquer l'overlay de chargement
        const loadingOverlay = document.getElementById('loading-overlay');
        if (loadingOverlay) {
            loadingOverlay.style.display = 'none';
        }
        
        // Vérifier la compatibilité du navigateur
        checkBrowserCompatibility();
        
        // Initialiser les composants principaux
        await initCoreComponents();
        
        // Initialiser l'interface utilisateur
        initUI();
        
        // Initialiser les raccourcis clavier
        initKeyboardShortcuts();
        
        // Charger le dernier projet si disponible
        await loadLastProject();
        
        // Démarrer la sauvegarde automatique
        startAutoSave();
        
        console.log('Studio DAW initialisé avec succès!');
        showToast('Bienvenue dans Studio DAW!', 'success', 5000);
        
        // Afficher les conseils de démarrage
        showGettingStartedTips();
        
    } catch (error) {
        console.error('Erreur lors de l\'initialisation:', error);
        showError('Erreur d\'initialisation: ' + error.message);
        
        // Masquer l'overlay de chargement même en cas d'erreur
        const loadingOverlay = document.getElementById('loading-overlay');
        if (loadingOverlay) {
            loadingOverlay.style.display = 'none';
        }
    }
}

// Vérification de la compatibilité du navigateur
function checkBrowserCompatibility() {
    const requiredFeatures = [
        { name: 'Web Audio API', check: isSupported('webAudio') },
        { name: 'Web MIDI API', check: isSupported('webMidi'), optional: true },
        { name: 'MediaRecorder API', check: isSupported('mediaRecorder') },
        { name: 'IndexedDB', check: isSupported('indexedDB') },
        { name: 'getUserMedia', check: isSupported('getUserMedia') }
    ];
    
    const missingFeatures = requiredFeatures.filter(f => !f.optional && !f.check);
    
    if (missingFeatures.length > 0) {
        const message = `Votre navigateur ne supporte pas: ${missingFeatures.map(f => f.name).join(', ')}`;
        showWarning(message);
        
        const warning = document.getElementById('compatibility-warning');
        if (warning) {
            warning.innerHTML = `<span>⚠️ ${message}. Utilisez Chrome, Firefox ou Edge pour une expérience optimale.</span>`;
            warning.classList.remove('hidden');
        }
    }
}

// Initialisation des composants principaux
async function initCoreComponents() {
    // Initialiser le moteur audio
    const audioEngine = getAudioEngine();
    if (!audioEngine.isInitialized) {
        await audioEngine.init();
    }
    
    // Initialiser le gestionnaire MIDI
    const midiManager = getMidiManager();
    if (isSupported('webMidi')) {
        await midiManager.init();
    }
    
    // Initialiser la timeline
    const timeline = getTimeline();
    timeline.init();
    
    // Initialiser le mixeur
    const mixer = getMixer();
    mixer.init();
    
    // Initialiser la drum machine
    const drumMachine = getDrumMachine();
    drumMachine.init();
    
    // Initialiser le piano roll
    const pianoRoll = getPianoRoll();
    pianoRoll.init();
    
    // Initialiser le clavier virtuel
    const virtualKeyboard = getVirtualKeyboard();
    virtualKeyboard.init();
    
    // Initialiser l'enregistreur
    const recorder = getRecorder();
    recorder.init();
    
    // Initialiser la bibliothèque de samples
    const samplesLibrary = getSamplesLibrary();
    samplesLibrary.init();
    
    // Initialiser le gestionnaire d'instruments
    const instrumentsManager = getInstrumentsManager();
    instrumentsManager.init();
    
    // Initialiser le gestionnaire d'effets
    const effectsManager = getEffectsManager();
    effectsManager.init();
    
    // Initialiser le gestionnaire de stockage
    const storage = getStorageManager();
    await storage.init();
}

// Initialisation de l'interface utilisateur
function initUI() {
    const uiManager = getUIManager();
    uiManager.init();
    
    // Configurer les callbacks
    setupCallbacks();
    
    // Mettre à jour l'interface
    uiManager.update();
}

// Configuration des callbacks
function setupCallbacks() {
    const timeline = getTimeline();
    const mixer = getMixer();
    const drumMachine = getDrumMachine();
    const pianoRoll = getPianoRoll();
    const virtualKeyboard = getVirtualKeyboard();
    const recorder = getRecorder();
    const samplesLibrary = getSamplesLibrary();
    
    // Callbacks de la timeline
    if (timeline) {
        timeline.onPlayheadMove = (position) => {
            // Mettre à jour l'affichage du temps
            const timeDisplay = document.getElementById('current-time-display');
            if (timeDisplay) {
                timeDisplay.textContent = formatTime(position);
            }
        };
        
        timeline.onSelectionChange = (selection) => {
            // Mettre à jour l'inspecteur
            updateInspector(selection);
        };
        
        timeline.onTrackAdd = (track) => {
            // Ajouter un canal au mixeur
            if (mixer) {
                mixer.addChannel({ track: track });
            }
        };
        
        timeline.onTrackRemove = (track) => {
            // Supprimer le canal du mixeur
            if (mixer) {
                const channel = mixer.channels.find(c => c.track && c.track.id === track.id);
                if (channel) {
                    mixer.removeChannel(channel.id);
                }
            }
        };
    }
    
    // Callbacks du mixeur
    if (mixer) {
        mixer.onVolumeChange = (channel, volume) => {
            // Mettre à jour la piste
            if (channel.track) {
                channel.track.setVolume(volume);
            }
        };
        
        mixer.onPanChange = (channel, pan) => {
            if (channel.track) {
                channel.track.setPan(pan);
            }
        };
        
        mixer.onMuteChange = (channel, muted) => {
            if (channel.track) {
                channel.track.setMuted(muted);
            }
        };
        
        mixer.onSoloChange = (channel, soloed) => {
            if (channel.track) {
                channel.track.setSoloed(soloed);
            }
        };
    }
    
    // Callbacks de la drum machine
    if (drumMachine) {
        drumMachine.onStep = (step, sounds) => {
            // Animation de la grille
            const cells = document.querySelectorAll(`.drum-cell[data-step="${step}"]`);
            cells.forEach(cell => {
                cell.classList.add('playing');
                setTimeout(() => {
                    cell.classList.remove('playing');
                }, 100);
            });
        };
        
        drumMachine.onPatternChange = (pattern) => {
            // Mettre à jour l'interface
            const uiManager = getUIManager();
            if (uiManager) {
                uiManager.updateDrumMachine();
            }
        };
    }
    
    // Callbacks du piano roll
    if (pianoRoll) {
        pianoRoll.onNoteAdd = (note) => {
            // Jouer la note
            pianoRoll.playNote(note.pitch, note.velocity);
        };
        
        pianoRoll.onNoteSelect = (note) => {
            // Mettre à jour l'inspecteur
            updateInspector({ note });
        };
    }
    
    // Callbacks du clavier virtuel
    if (virtualKeyboard) {
        virtualKeyboard.onNoteOn = (note) => {
            // Animation du clavier
            const key = document.querySelector(`.virtual-keyboard .key[data-note="${note}"]`);
            if (key) {
                key.classList.add('active');
            }
        };
        
        virtualKeyboard.onNoteOff = (note) => {
            const key = document.querySelector(`.virtual-keyboard .key[data-note="${note}"]`);
            if (key) {
                key.classList.remove('active');
            }
        };
        
        virtualKeyboard.onRecordStart = () => {
            showToast('Enregistrement du clavier démarré!', 'success');
        };
        
        virtualKeyboard.onRecordStop = (notes) => {
            showToast(`Enregistrement arrêté! ${notes.length} notes enregistrées.`, 'info');
        };
    }
    
    // Callbacks de l'enregistreur
    if (recorder) {
        recorder.onStart = () => {
            const recordBtn = document.getElementById('record-btn');
            if (recordBtn) {
                recordBtn.classList.add('active');
            }
        };
        
        recorder.onStop = (data) => {
            const recordBtn = document.getElementById('record-btn');
            if (recordBtn) {
                recordBtn.classList.remove('active');
            }
            
            if (data) {
                showToast('Enregistrement terminé!', 'success');
            }
        };
    }
    
    // Callbacks de la bibliothèque de samples
    if (samplesLibrary) {
        samplesLibrary.onSampleSelect = (sample) => {
            // Jouer le sample
            samplesLibrary.playSample(sample);
        };
        
        samplesLibrary.onSamplePlay = (sample) => {
            // Animation
            const element = document.querySelector(`.sample-item[data-sample-id="${sample.id}"]`);
            if (element) {
                element.classList.add('playing');
                setTimeout(() => {
                    element.classList.remove('playing');
                }, 200);
            }
        };
    }
}

// Mise à jour de l'inspecteur
function updateInspector(selection) {
    const inspector = document.getElementById('inspector-panel');
    if (!inspector) return;
    
    // Effacer l'inspecteur
    inspector.innerHTML = '';
    
    if (selection.track) {
        // Afficher les informations de la piste
        const trackInfo = document.createElement('div');
        trackInfo.className = 'inspector-section';
        trackInfo.innerHTML = `
            <h3>Piste: ${selection.track.name}</h3>
            <p>Type: ${selection.track.type}</p>
            <p>Volume: ${Math.round(selection.track.volume * 100)}%</p>
            <p>Pan: ${selection.track.pan === 0 ? 'Centre' : (selection.track.pan < 0 ? 'Gauche' : 'Droite')}</p>
            <p>Mute: ${selection.track.muted ? 'Oui' : 'Non'}</p>
            <p>Solo: ${selection.track.soloed ? 'Oui' : 'Non'}</p>
        `;
        inspector.appendChild(trackInfo);
    }
    
    if (selection.clip) {
        // Afficher les informations du clip
        const clipInfo = document.createElement('div');
        clipInfo.className = 'inspector-section';
        clipInfo.innerHTML = `
            <h3>Clip: ${selection.clip.name}</h3>
            <p>Type: ${selection.clip.constructor.name}</p>
            <p>Début: ${formatTime(selection.clip.startTime)}</p>
            <p>Durée: ${formatTime(selection.clip.duration / 1000)}</p>
            <p>Volume: ${Math.round(selection.clip.volume * 100)}%</p>
        `;
        inspector.appendChild(clipInfo);
    }
    
    if (selection.note) {
        // Afficher les informations de la note
        const noteInfo = document.createElement('div');
        noteInfo.className = 'inspector-section';
        noteInfo.innerHTML = `
            <h3>Note</h3>
            <p>Hauteur: ${getNoteName(selection.note.pitch)}</p>
            <p>Position: ${selection.note.step}</p>
            <p>Durée: ${selection.note.duration}</p>
            <p>Vélocité: ${selection.note.velocity}</p>
        `;
        inspector.appendChild(noteInfo);
    }
}

// Chargement du dernier projet
async function loadLastProject() {
    try {
        const storage = getStorageManager();
        if (!storage.isReady) return;
        
        const projects = await storage.getAllProjects();
        if (projects.length > 0) {
            // Charger le dernier projet
            const lastProject = projects[0];
            await storage.loadProject(lastProject.id);
            
            const timeline = getTimeline();
            if (timeline) {
                timeline.cleanup();
                Timeline.fromJSON(lastProject.data);
                
                const uiManager = getUIManager();
                if (uiManager) {
                    uiManager.updateProjectUI();
                }
            }
            
            showToast(`Projet "${lastProject.name}" chargé!`, 'success');
        }
        
    } catch (error) {
        console.error('Erreur lors du chargement du dernier projet:', error);
    }
}

// Sauvegarde automatique
function startAutoSave() {
    const storage = getStorageManager();
    const timeline = getTimeline();
    
    if (!storage || !timeline) return;
    
    // Sauvegarder automatiquement toutes les 30 secondes
    setInterval(async () => {
        try {
            const projects = await storage.getAllProjects();
            if (projects.length > 0) {
                const lastProject = projects[0];
                lastProject.data = timeline.toJSON();
                lastProject.updatedAt = Date.now();
                
                await storage.saveProject(lastProject);
                console.log('Sauvegarde automatique effectuée');
            }
        } catch (error) {
            console.error('Erreur lors de la sauvegarde automatique:', error);
        }
    }, 30000);
}

// Initialisation des raccourcis clavier
function initKeyboardShortcuts() {
    const keyboardShortcuts = getKeyboardShortcuts();
    keyboardShortcuts.init();
}

// Affichage des conseils de démarrage
function showGettingStartedTips() {
    const tips = [
        'Appuyez sur Espace pour lecture/arrêt',
        'Appuyez sur R pour enregistrer',
        'Appuyez sur Ctrl+S pour sauvegarder',
        'Utilisez la souris pour déplacer les clips',
        'Double-cliquez sur un clip pour l\'éditer'
    ];
    
    // Afficher les conseils un par un
    tips.forEach((tip, index) => {
        setTimeout(() => {
            showToast(tip, 'info', 4000);
        }, index * 2000);
    });
}

// Gestion des événements globaux
function setupGlobalEvents() {
    // Événement de clic pour reprendre le contexte audio
    document.addEventListener('click', async () => {
        const audioEngine = getAudioEngine();
        if (audioEngine && audioEngine.audioContext) {
            try {
                await audioEngine.resume();
            } catch (error) {
                console.error('Erreur lors de la reprise du contexte audio:', error);
            }
        }
    }, { once: true });
    
    // Événement avant de quitter la page
    window.addEventListener('beforeunload', (e) => {
        // Vérifier s'il y a des modifications non sauvegardées
        const timeline = getTimeline();
        if (timeline && timeline.tracks.length > 0) {
            e.preventDefault();
            e.returnValue = 'Vous avez des modifications non sauvegardées. Voulez-vous vraiment quitter?';
        }
    });
}

// Démarrer l'application
setupGlobalEvents();

// Exporter les fonctions principales pour le débogage
window.StudioDAW = {
    getAudioEngine,
    getMidiManager,
    getTimeline,
    getMixer,
    getDrumMachine,
    getPianoRoll,
    getVirtualKeyboard,
    getRecorder,
    getSamplesLibrary,
    getInstrumentsManager,
    getEffectsManager,
    getStorageManager,
    getUIManager,
    getKeyboardShortcuts
};

// Messages de bienvenue
console.log('%c Studio DAW ', 'background: #6366f1; color: white; font-size: 20px; padding: 10px;');
console.log('%c Bienvenue dans votre studio de musique en ligne! ', 'color: #94a3b8; font-size: 14px;');
console.log('%c Utilisez les raccourcis clavier pour une expérience optimale. ', 'color: #64748b; font-size: 12px;');
