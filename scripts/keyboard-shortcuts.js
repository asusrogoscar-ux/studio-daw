// Raccourcis clavier pour Studio DAW

class KeyboardShortcuts {
    constructor() {
        this.shortcuts = new Map();
        this.isListening = false;
        
        // Initialisation
        this.init();
    }
    
    init() {
        // Enregistrer les raccourcis par défaut
        this.registerDefaultShortcuts();
        
        // Démarrer l'écoute
        this.startListening();
        
        console.log('Raccourcis clavier initialisés');
    }
    
    registerDefaultShortcuts() {
        // Raccourcis de transport
        this.registerShortcut(' ', () => this.handlePlayPause(), 'Lecture/Arrêt');
        this.registerShortcut('r', () => this.handleRecord(), 'Enregistrement');
        this.registerShortcut('s', () => this.handleStop(), 'Stop');
        this.registerShortcut('Backspace', () => this.handleRewind(), 'Retour rapide');
        
        // Raccourcis d'édition
        this.registerShortcut('Delete', () => this.handleDelete(), 'Supprimer');
        this.registerShortcut('Ctrl+c', () => this.handleCopy(), 'Copier');
        this.registerShortcut('Ctrl+v', () => this.handlePaste(), 'Coller');
        this.registerShortcut('Ctrl+z', () => this.handleUndo(), 'Annuler');
        this.registerShortcut('Ctrl+y', () => this.handleRedo(), 'Rétablir');
        
        // Raccourcis de projet
        this.registerShortcut('Ctrl+n', () => this.handleNewProject(), 'Nouveau projet');
        this.registerShortcut('Ctrl+s', () => this.handleSaveProject(), 'Sauvegarder');
        this.registerShortcut('Ctrl+o', () => this.handleLoadProject(), 'Charger');
        
        // Raccourcis de zoom
        this.registerShortcut('Ctrl+=', () => this.handleZoomIn(), 'Zoom +');
        this.registerShortcut('Ctrl+-', () => this.handleZoomOut(), 'Zoom -');
        
        // Raccourcis de navigation
        this.registerShortcut('ArrowLeft', () => this.handleArrowLeft(), 'Déplacer gauche');
        this.registerShortcut('ArrowRight', () => this.handleArrowRight(), 'Déplacer droite');
        this.registerShortcut('ArrowUp', () => this.handleArrowUp(), 'Déplacer haut');
        this.registerShortcut('ArrowDown', () => this.handleArrowDown(), 'Déplacer bas');
        
        // Raccourcis de sélection
        this.registerShortcut('Shift+ArrowLeft', () => this.handleShiftArrowLeft(), 'Sélection gauche');
        this.registerShortcut('Shift+ArrowRight', () => this.handleShiftArrowRight(), 'Sélection droite');
        
        // Raccourcis divers
        this.registerShortcut('m', () => this.handleToggleMute(), 'Mute/Unmute');
        this.registerShortcut('Space', () => this.handlePlayPause(), 'Lecture/Arrêt (alternatif)');
    }
    
    registerShortcut(key, callback, description) {
        this.shortcuts.set(key, { callback, description });
    }
    
    unregisterShortcut(key) {
        this.shortcuts.delete(key);
    }
    
    startListening() {
        if (this.isListening) return;
        
        this.isListening = true;
        document.addEventListener('keydown', this.handleKeyDown.bind(this));
    }
    
    stopListening() {
        if (!this.isListening) return;
        
        this.isListening = false;
        document.removeEventListener('keydown', this.handleKeyDown.bind(this));
    }
    
    handleKeyDown(event) {
        // Ignorer si on est en train de taper dans un input
        if (event.target.tagName === 'INPUT' || 
            event.target.tagName === 'TEXTAREA' ||
            event.target.tagName === 'SELECT' ||
            event.target.isContentEditable) {
            return;
        }
        
        // Construire la touche
        let key = event.key;
        
        if (event.ctrlKey) {
            key = `Ctrl+${key}`;
        } else if (event.shiftKey) {
            key = `Shift+${key}`;
        } else if (event.altKey) {
            key = `Alt+${key}`;
        }
        
        // Trouver le raccourci
        const shortcut = this.shortcuts.get(key);
        
        if (shortcut) {
            event.preventDefault();
            shortcut.callback(event);
        }
    }
    
    // Gestionnaires des raccourcis
    handlePlayPause() {
        const timeline = getTimeline();
        if (timeline) {
            timeline.togglePlay();
        }
    }
    
    handleRecord() {
        const timeline = getTimeline();
        if (timeline) {
            timeline.toggleRecord();
        }
    }
    
    handleStop() {
        const timeline = getTimeline();
        if (timeline) {
            timeline.stop();
        }
    }
    
    handleRewind() {
        const timeline = getTimeline();
        if (timeline) {
            timeline.setPlayheadPosition(0);
        }
    }
    
    handleDelete() {
        const timeline = getTimeline();
        if (timeline && timeline.selectedClip) {
            timeline.removeClip(timeline.selectedClip.id);
        }
    }
    
    handleCopy() {
        const timeline = getTimeline();
        if (timeline && timeline.selectedClip) {
            // Copier le clip
            const clip = timeline.selectedClip;
            navigator.clipboard.writeText(JSON.stringify(clip.toJSON()));
            showToast('Clip copié!', 'success');
        }
    }
    
    handlePaste() {
        const timeline = getTimeline();
        if (!timeline) return;
        
        navigator.clipboard.readText().then(text => {
            try {
                const clipData = JSON.parse(text);
                let clip;
                
                switch (clipData.type) {
                    case 'audio':
                        clip = AudioClip.fromJSON(clipData);
                        break;
                    case 'midi':
                        clip = MidiClip.fromJSON(clipData);
                        break;
                    case 'drum':
                        clip = DrumClip.fromJSON(clipData);
                        break;
                    default:
                        clip = AudioClip.fromJSON(clipData);
                }
                
                timeline.addClip(clip);
                showToast('Clip collé!', 'success');
                
            } catch (error) {
                showError('Impossible de coller le clip');
            }
        });
    }
    
    handleUndo() {
        // À implémenter: système d'annulation
        showToast('Annuler (à implémenter)', 'info');
    }
    
    handleRedo() {
        // À implémenter: système de rétablissement
        showToast('Rétablir (à implémenter)', 'info');
    }
    
    handleNewProject() {
        const uiManager = getUIManager();
        if (uiManager) {
            uiManager.newProject();
        }
    }
    
    handleSaveProject() {
        const uiManager = getUIManager();
        if (uiManager) {
            uiManager.saveProject();
        }
    }
    
    handleLoadProject() {
        const uiManager = getUIManager();
        if (uiManager) {
            uiManager.loadProject();
        }
    }
    
    handleZoomIn() {
        const timeline = getTimeline();
        if (timeline) {
            timeline.zoomIn();
        }
    }
    
    handleZoomOut() {
        const timeline = getTimeline();
        if (timeline) {
            timeline.zoomOut();
        }
    }
    
    handleArrowLeft() {
        const timeline = getTimeline();
        if (timeline) {
            const newPosition = timeline.playheadPosition - 0.1;
            timeline.setPlayheadPosition(Math.max(0, newPosition));
        }
    }
    
    handleArrowRight() {
        const timeline = getTimeline();
        if (timeline) {
            const newPosition = timeline.playheadPosition + 0.1;
            timeline.setPlayheadPosition(newPosition);
        }
    }
    
    handleArrowUp() {
        const timeline = getTimeline();
        if (timeline && timeline.selectedTrack) {
            const currentIndex = timeline.tracks.findIndex(
                t => t.id === timeline.selectedTrack.id
            );
            if (currentIndex > 0) {
                timeline.selectTrack(timeline.tracks[currentIndex - 1]);
            }
        }
    }
    
    handleArrowDown() {
        const timeline = getTimeline();
        if (timeline && timeline.selectedTrack) {
            const currentIndex = timeline.tracks.findIndex(
                t => t.id === timeline.selectedTrack.id
            );
            if (currentIndex < timeline.tracks.length - 1) {
                timeline.selectTrack(timeline.tracks[currentIndex + 1]);
            }
        }
    }
    
    handleShiftArrowLeft() {
        const timeline = getTimeline();
        if (timeline && timeline.selectedClip) {
            const newStartTime = timeline.selectedClip.startTime - 0.1;
            timeline.selectedClip.setStartTime(Math.max(0, newStartTime));
            timeline.updateClipsPosition();
        }
    }
    
    handleShiftArrowRight() {
        const timeline = getTimeline();
        if (timeline && timeline.selectedClip) {
            const newStartTime = timeline.selectedClip.startTime + 0.1;
            timeline.selectedClip.setStartTime(newStartTime);
            timeline.updateClipsPosition();
        }
    }
    
    handleToggleMute() {
        const timeline = getTimeline();
        if (timeline && timeline.selectedTrack) {
            const track = timeline.selectedTrack;
            track.setMuted(!track.muted);
            
            // Mettre à jour l'interface
            const muteBtn = document.querySelector(`#track-${track.id} .track-control .btn-icon:nth-child(1)`);
            if (muteBtn) {
                muteBtn.classList.toggle('active');
                muteBtn.innerHTML = track.muted ? '🔇' : '🔊';
            }
        }
    }
    
    // Nettoyage
    cleanup() {
        this.stopListening();
        this.shortcuts.clear();
        
        console.log('Raccourcis clavier nettoyés');
    }
}

// Singleton des raccourcis clavier
let keyboardShortcutsInstance = null;

function getKeyboardShortcuts() {
    if (!keyboardShortcutsInstance) {
        keyboardShortcutsInstance = new KeyboardShortcuts();
    }
    return keyboardShortcutsInstance;
}

// Exporter pour les autres modules
window.KeyboardShortcuts = KeyboardShortcuts;
window.getKeyboardShortcuts = getKeyboardShortcuts;
window._keyboardShortcutsInstance = keyboardShortcutsInstance;
