// Gestion de l'interface utilisateur pour Studio DAW

class UIManager {
    constructor() {
        this.timeline = null;
        this.mixer = null;
        this.drumMachine = null;
        this.pianoRoll = null;
        this.virtualKeyboard = null;
        this.recorder = null;
        this.samplesLibrary = null;
        this.storage = null;
        
        // État de l'interface
        this.currentTab = 'drum-machine';
        this.isMixerVisible = false;
        this.isSettingsVisible = false;
        
        // Initialisation
        this.init();
    }
    
    init() {
        // Initialiser les composants
        this.timeline = getTimeline();
        this.mixer = getMixer();
        this.drumMachine = getDrumMachine();
        this.pianoRoll = getPianoRoll();
        this.virtualKeyboard = getVirtualKeyboard();
        this.recorder = getRecorder();
        this.samplesLibrary = getSamplesLibrary();
        this.storage = getStorageManager();
        
        // Configurer les événements
        this.setupEvents();
        
        // Initialiser les onglets
        this.initTabs();
        
        // Initialiser les modals
        this.initModals();
        
        // Initialiser les paramètres
        this.initSettings();
        
        console.log('Gestionnaire UI initialisé');
    }
    
    setupEvents() {
        // Événements des onglets
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', () => this.switchTab(btn.dataset.tab));
        });
        
        // Événements du panneau de gauche
        document.querySelectorAll('.left-panel .tab-btn').forEach(btn => {
            btn.addEventListener('click', () => this.switchLeftTab(btn.dataset.tab));
        });
        
        // Événements du panneau de droite
        document.querySelectorAll('.right-tabs .tab-btn').forEach(btn => {
            btn.addEventListener('click', () => this.switchRightTab(btn.dataset.tab));
        });
        
        // Bouton de menu des paramètres
        const settingsBtn = document.getElementById('settings-btn');
        if (settingsBtn) {
            settingsBtn.addEventListener('click', () => this.toggleSettings());
        }
        
        // Bouton du métronome
        const metronomeBtn = document.getElementById('metronome-btn');
        if (metronomeBtn) {
            metronomeBtn.addEventListener('click', () => this.toggleMetronome());
        }
        
        // Boutons de projet
        const newProjectBtn = document.getElementById('new-project-btn');
        const saveProjectBtn = document.getElementById('save-project-btn');
        const loadProjectBtn = document.getElementById('load-project-btn');
        const exportProjectBtn = document.getElementById('export-project-btn');
        
        if (newProjectBtn) {
            newProjectBtn.addEventListener('click', () => this.newProject());
        }
        
        if (saveProjectBtn) {
            saveProjectBtn.addEventListener('click', () => this.saveProject());
        }
        
        if (loadProjectBtn) {
            loadProjectBtn.addEventListener('click', () => this.loadProject());
        }
        
        if (exportProjectBtn) {
            exportProjectBtn.addEventListener('click', () => this.exportProject());
        }
        
        // Boutons du mixeur
        const mixerPanel = document.getElementById('mixer-panel');
        const toggleMixerBtn = document.getElementById('toggle-mixer-btn');
        
        if (toggleMixerBtn) {
            toggleMixerBtn.addEventListener('click', () => this.toggleMixerPanel());
        }
        
        // Boutons de la drum machine
        this.setupDrumMachineEvents();
        
        // Boutons du piano roll
        this.setupPianoRollEvents();
        
        // Boutons du clavier virtuel
        this.setupVirtualKeyboardEvents();
        
        // Vérifier la compatibilité
        this.checkCompatibility();
    }
    
    checkCompatibility() {
        const warning = document.getElementById('compatibility-warning');
        if (!warning) return;
        
        // Vérifier les fonctionnalités critiques
        const requiredFeatures = ['webAudio', 'getUserMedia'];
        const missingFeatures = requiredFeatures.filter(feature => !isSupported(feature));
        
        if (missingFeatures.length > 0) {
            warning.classList.remove('hidden');
        } else {
            warning.classList.add('hidden');
        }
    }
    
    initTabs() {
        // Onglets principaux
        this.switchTab(this.currentTab);
    }
    
    switchTab(tabName) {
        this.currentTab = tabName;
        
        // Mettre à jour les boutons
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.tab === tabName);
        });
        
        // Mettre à jour les contenus
        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.toggle('hidden', content.id !== `${tabName}-tab`);
        });
    }
    
    switchLeftTab(tabName) {
        // Mettre à jour les boutons
        document.querySelectorAll('.left-panel .tab-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.tab === tabName);
        });
        
        // Mettre à jour les contenus
        document.querySelectorAll('.left-panel .tab-content').forEach(content => {
            content.classList.toggle('hidden', content.id !== `${tabName}-tab`);
        });
    }
    
    switchRightTab(tabName) {
        this.currentTab = tabName;
        
        // Mettre à jour les boutons
        document.querySelectorAll('.right-tabs .tab-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.tab === tabName);
        });
        
        // Mettre à jour les contenus
        document.querySelectorAll('.right-panel .tab-content').forEach(content => {
            content.classList.toggle('hidden', content.id !== `${tabName}-tab`);
        });
    }
    
    initModals() {
        // Fermer les modals en cliquant sur le fond
        document.querySelectorAll('.modal').forEach(modal => {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    this.closeModal(modal.id);
                }
            });
        });
        
        // Fermer les modals avec la touche Échap
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                document.querySelectorAll('.modal:not(.hidden)').forEach(modal => {
                    this.closeModal(modal.id);
                });
            }
        });
    }
    
    closeModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.add('hidden');
        }
    }
    
    openModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.remove('hidden');
        }
    }
    
    initSettings() {
        // Charger les paramètres
        this.loadSettings();
    }
    
    async loadSettings() {
        try {
            const storage = getStorageManager();
            const settings = await storage.loadSettings();
            
            if (settings) {
                // Appliquer les paramètres
                this.applySettings(settings);
            }
            
        } catch (error) {
            console.error('Erreur lors du chargement des paramètres:', error);
        }
    }
    
    applySettings(settings) {
        if (settings.audio) {
            CONFIG.audio = { ...CONFIG.audio, ...settings.audio };
        }
        
        if (settings.project) {
            CONFIG.project = { ...CONFIG.project, ...settings.project };
        }
        
        if (settings.midi) {
            CONFIG.midi = { ...CONFIG.midi, ...settings.midi };
        }
    }
    
    async saveSettings() {
        try {
            const storage = getStorageManager();
            const settings = {
                audio: CONFIG.audio,
                project: CONFIG.project,
                midi: CONFIG.midi
            };
            
            await storage.saveSettings(settings);
            showToast('Paramètres sauvegardés!', 'success');
            
        } catch (error) {
            console.error('Erreur lors de la sauvegarde des paramètres:', error);
            showError('Erreur lors de la sauvegarde des paramètres');
        }
    }
    
    toggleSettings() {
        const settingsPanel = document.getElementById('settings-panel');
        if (settingsPanel) {
            settingsPanel.classList.toggle('hidden');
        }
    }
    
    closeSettings() {
        const settingsPanel = document.getElementById('settings-panel');
        if (settingsPanel) {
            settingsPanel.classList.add('hidden');
        }
    }
    
    toggleMetronome() {
        const audioEngine = getAudioEngine();
        if (!audioEngine || !audioEngine.metronome) return;
        
        const metronomeBtn = document.getElementById('metronome-btn');
        
        if (audioEngine.metronome.isPlaying) {
            audioEngine.stopMetronome();
            metronomeBtn.classList.remove('active');
            CONFIG.project.metronomeEnabled = false;
        } else {
            audioEngine.startMetronome();
            metronomeBtn.classList.add('active');
            CONFIG.project.metronomeEnabled = true;
        }
    }
    
    toggleMixerPanel() {
        const mixerPanel = document.getElementById('mixer-panel');
        const toggleMixerBtn = document.getElementById('toggle-mixer-btn');
        
        if (mixerPanel) {
            mixerPanel.classList.toggle('hidden');
            this.isMixerVisible = !mixerPanel.classList.contains('hidden');
            
            if (toggleMixerBtn) {
                toggleMixerBtn.textContent = this.isMixerVisible ? 'Masquer' : 'Afficher';
            }
        }
    }
    
    // Gestion des projets
    newProject() {
        showConfirm(
            'Nouveau projet',
            'Êtes-vous sûr de vouloir créer un nouveau projet? Les modifications non sauvegardées seront perdues.',
            () => {
                // Créer un nouveau projet
                this.clearProject();
                showToast('Nouveau projet créé!', 'success');
            }
        );
    }
    
    async saveProject() {
        try {
            const storage = getStorageManager();
            const timeline = getTimeline();
            
            if (!timeline) {
                showError('La timeline n\'est pas initialisée');
                return;
            }
            
            // Créer l'objet projet
            const project = {
                id: generateId('project-'),
                name: document.getElementById('project-name')?.value || generateDefaultProjectName(),
                description: document.getElementById('project-description')?.value || '',
                createdAt: Date.now(),
                updatedAt: Date.now(),
                data: timeline.toJSON()
            };
            
            // Sauvegarder
            await storage.saveProject(project);
            
            showToast('Projet sauvegardé avec succès!', 'success');
            this.closeModal('save-modal');
            
            // Démarrer la sauvegarde automatique
            storage.startAutoSave(project, 30000);
            
        } catch (error) {
            console.error('Erreur lors de la sauvegarde du projet:', error);
            showError('Erreur lors de la sauvegarde du projet');
        }
    }
    
    async loadProject() {
        try {
            const storage = getStorageManager();
            const projects = await storage.getAllProjects();
            
            const projectsList = document.getElementById('projects-list');
            if (!projectsList) return;
            
            // Effacer la liste actuelle
            projectsList.innerHTML = '';
            
            if (projects.length === 0) {
                projectsList.innerHTML = '<p>Aucun projet sauvegardé</p>';
                return;
            }
            
            // Créer la liste des projets
            projects.forEach(project => {
                const projectElement = document.createElement('div');
                projectElement.className = 'project-item';
                projectElement.dataset.projectId = project.id;
                
                const name = document.createElement('div');
                name.className = 'project-name';
                name.textContent = project.name;
                
                const date = document.createElement('div');
                date.className = 'project-date';
                date.textContent = new Date(project.updatedAt).toLocaleString();
                
                const loadBtn = document.createElement('button');
                loadBtn.className = 'btn btn-primary';
                loadBtn.textContent = 'Charger';
                loadBtn.onclick = () => this.loadProjectById(project.id);
                
                const deleteBtn = document.createElement('button');
                deleteBtn.className = 'btn btn-danger';
                deleteBtn.textContent = 'Supprimer';
                deleteBtn.onclick = () => this.deleteProject(project.id);
                
                projectElement.appendChild(name);
                projectElement.appendChild(date);
                projectElement.appendChild(loadBtn);
                projectElement.appendChild(deleteBtn);
                
                projectsList.appendChild(projectElement);
            });
            
            // Ouvrir la modal
            this.openModal('load-modal');
            
        } catch (error) {
            console.error('Erreur lors du chargement des projets:', error);
            showError('Erreur lors du chargement des projets');
        }
    }
    
    async loadProjectById(projectId) {
        try {
            const storage = getStorageManager();
            const timeline = getTimeline();
            
            const project = await storage.loadProject(projectId);
            if (!project) {
                showError('Projet non trouvé');
                return;
            }
            
            // Charger les données du projet
            if (project.data && timeline) {
                timeline.cleanup();
                Timeline.fromJSON(project.data);
                
                // Mettre à jour l'interface
                this.updateProjectUI();
            }
            
            showToast(`Projet "${project.name}" chargé!`, 'success');
            this.closeModal('load-modal');
            
            // Démarrer la sauvegarde automatique
            storage.startAutoSave(project, 30000);
            
        } catch (error) {
            console.error('Erreur lors du chargement du projet:', error);
            showError('Erreur lors du chargement du projet');
        }
    }
    
    async deleteProject(projectId) {
        showConfirm(
            'Supprimer le projet',
            'Êtes-vous sûr de vouloir supprimer ce projet? Cette action est irréversible.',
            async () => {
                try {
                    const storage = getStorageManager();
                    await storage.deleteProject(projectId);
                    showToast('Projet supprimé!', 'success');
                    this.loadProject(); // Rafraîchir la liste
                } catch (error) {
                    console.error('Erreur lors de la suppression du projet:', error);
                    showError('Erreur lors de la suppression du projet');
                }
            }
        );
    }
    
    async exportProject() {
        try {
            const storage = getStorageManager();
            const timeline = getTimeline();
            
            if (!timeline) {
                showError('La timeline n\'est pas initialisée');
                return;
            }
            
            // Obtenir le projet actuel
            const projects = await storage.getAllProjects();
            const currentProject = projects[0]; // Prendre le dernier projet
            
            if (!currentProject) {
                showError('Aucun projet à exporter');
                return;
            }
            
            // Exporter
            await storage.exportProject(currentProject.id);
            showToast('Projet exporté!', 'success');
            this.closeModal('export-modal');
            
        } catch (error) {
            console.error('Erreur lors de l\'export du projet:', error);
            showError('Erreur lors de l\'export du projet');
        }
    }
    
    clearProject() {
        const timeline = getTimeline();
        const drumMachine = getDrumMachine();
        const pianoRoll = getPianoRoll();
        const virtualKeyboard = getVirtualKeyboard();
        
        if (timeline) {
            timeline.cleanup();
        }
        
        if (drumMachine) {
            drumMachine.cleanup();
        }
        
        if (pianoRoll) {
            pianoRoll.cleanup();
        }
        
        if (virtualKeyboard) {
            virtualKeyboard.cleanup();
        }
        
        // Recréer les composants
        timeline = new Timeline();
        drumMachine = new DrumMachine();
        pianoRoll = new PianoRoll();
        virtualKeyboard = new VirtualKeyboard();
        
        APP_STATE.tracks = [];
        APP_STATE.selectedTrack = null;
        APP_STATE.selectedClip = null;
    }
    
    updateProjectUI() {
        const timeline = getTimeline();
        if (timeline) {
            timeline.updateDisplay();
        }
    }
    
    // Événements de la drum machine
    setupDrumMachineEvents() {
        const drumMachine = this.drumMachine;
        if (!drumMachine) return;
        
        // Boutons de la drum machine
        const playBtn = document.querySelector('#drum-machine-tab .drum-play-btn');
        const stopBtn = document.querySelector('#drum-machine-tab .drum-stop-btn');
        const recordBtn = document.querySelector('#drum-machine-tab .drum-record-btn');
        const clearBtn = document.getElementById('clear-drum-pattern');
        
        // Grille de la drum machine
        this.setupDrumGridEvents();
        
        // Pads de la drum machine
        this.setupDrumPadEvents();
        
        // Boutons de contrôle
        if (playBtn) {
            playBtn.addEventListener('click', () => drumMachine.play());
        }
        
        if (stopBtn) {
            stopBtn.addEventListener('click', () => drumMachine.stop());
        }
        
        if (recordBtn) {
            recordBtn.addEventListener('click', () => {
                if (drumMachine.isRecording) {
                    drumMachine.stopRecording();
                    recordBtn.classList.remove('active');
                } else {
                    drumMachine.startRecording();
                    recordBtn.classList.add('active');
                }
            });
        }
        
        if (clearBtn) {
            clearBtn.addEventListener('click', () => drumMachine.clearPattern());
        }
        
        // Sélecteur de pattern
        const patternSelect = document.getElementById('drum-pattern-select');
        if (patternSelect) {
            patternSelect.addEventListener('change', (e) => {
                drumMachine.selectPattern(parseInt(e.target.value));
            });
        }
        
        // Sélecteur de longueur
        const patternLengthSelect = document.getElementById('drum-pattern-length');
        if (patternLengthSelect) {
            patternLengthSelect.addEventListener('change', (e) => {
                drumMachine.setPatternLength(parseInt(e.target.value));
            });
        }
    }
    
    setupDrumGridEvents() {
        const drumMachine = this.drumMachine;
        if (!drumMachine) return;
        
        const drumGrid = document.getElementById('drum-grid');
        if (!drumGrid) return;
        
        // Effacer la grille existante
        drumGrid.innerHTML = '';
        
        // Créer la grille
        const patternLength = drumMachine.patternLength || 16;
        const sounds = drumMachine.getSounds();
        
        for (let step = 0; step < patternLength; step++) {
            for (const sound of sounds) {
                const cell = document.createElement('div');
                cell.className = 'drum-cell';
                cell.dataset.step = step;
                cell.dataset.sound = sound;
                
                // Vérifier si le son est actif à cette étape
                const pattern = drumMachine.getCurrentPattern();
                if (pattern && pattern.getSoundsAtStep(step).includes(sound)) {
                    cell.classList.add('active');
                }
                
                // Couleur
                cell.style.setProperty('--cell-color', drumMachine.getSoundColor(sound));
                
                // Gestionnaire de clic
                cell.addEventListener('click', () => {
                    drumMachine.toggleSoundAtStep(step, sound);
                    cell.classList.toggle('active');
                });
                
                drumGrid.appendChild(cell);
            }
        }
    }
    
    setupDrumPadEvents() {
        const drumMachine = this.drumMachine;
        if (!drumMachine) return;
        
        const drumPads = document.querySelectorAll('.drum-pad');
        drumPads.forEach(pad => {
            const sound = pad.dataset.sound;
            
            // Gestionnaire de clic
            pad.addEventListener('click', () => {
                drumMachine.playSound(sound);
                
                // Animation
                pad.classList.add('active');
                setTimeout(() => {
                    pad.classList.remove('active');
                }, 100);
            });
            
            // Gestionnaire de mousedown
            pad.addEventListener('mousedown', (e) => {
                e.preventDefault();
                drumMachine.playSound(sound);
                pad.classList.add('active');
            });
            
            // Gestionnaire de mouseup
            pad.addEventListener('mouseup', () => {
                pad.classList.remove('active');
            });
        });
    }
    
    // Événements du piano roll
    setupPianoRollEvents() {
        const pianoRoll = this.pianoRoll;
        if (!pianoRoll) return;
        
        // Boutons du piano roll
        const playBtn = document.querySelector('#piano-roll-tab .piano-roll-play-btn');
        const stopBtn = document.querySelector('#piano-roll-tab .piano-roll-stop-btn');
        const clearBtn = document.getElementById('clear-piano-roll');
        
        if (playBtn) {
            playBtn.addEventListener('click', () => pianoRoll.play());
        }
        
        if (stopBtn) {
            stopBtn.addEventListener('click', () => pianoRoll.stop());
        }
        
        if (clearBtn) {
            clearBtn.addEventListener('click', () => pianoRoll.clear());
        }
    }
    
    // Événements du clavier virtuel
    setupVirtualKeyboardEvents() {
        const virtualKeyboard = this.virtualKeyboard;
        if (!virtualKeyboard) return;
        
        // Boutons du clavier virtuel
        const playBtn = document.querySelector('#virtual-keyboard-tab .keyboard-play-btn');
        const stopBtn = document.querySelector('#virtual-keyboard-tab .keyboard-stop-btn');
        
        if (playBtn) {
            playBtn.addEventListener('click', () => {
                // Jouer une note de test
                virtualKeyboard.playNote(60);
            });
        }
        
        if (stopBtn) {
            stopBtn.addEventListener('click', () => {
                virtualKeyboard.stopAllNotes();
            });
        }
    }
    
    // Mise à jour de l'interface
    update() {
        this.updateTimeline();
        this.updateMixer();
        this.updateDrumMachine();
        this.updatePianoRoll();
        this.updateVirtualKeyboard();
    }
    
    updateTimeline() {
        const timeline = this.timeline;
        if (timeline) {
            timeline.updateDisplay();
        }
    }
    
    updateMixer() {
        const mixer = this.mixer;
        if (mixer) {
            mixer.update();
        }
    }
    
    updateDrumMachine() {
        const drumMachine = this.drumMachine;
        if (drumMachine) {
            // Mettre à jour la grille
            this.setupDrumGridEvents();
        }
    }
    
    updatePianoRoll() {
        const pianoRoll = this.pianoRoll;
        if (pianoRoll) {
            pianoRoll.initPianoRoll();
            pianoRoll.initKeyboard();
        }
    }
    
    updateVirtualKeyboard() {
        const virtualKeyboard = this.virtualKeyboard;
        if (virtualKeyboard) {
            virtualKeyboard.initKeyboard();
        }
    }
    
    // Nettoyage
    cleanup() {
        // Nettoyer les composants
        if (this.timeline) {
            this.timeline.cleanup();
        }
        
        if (this.mixer) {
            this.mixer.cleanup();
        }
        
        if (this.drumMachine) {
            this.drumMachine.cleanup();
        }
        
        if (this.pianoRoll) {
            this.pianoRoll.cleanup();
        }
        
        if (this.virtualKeyboard) {
            this.virtualKeyboard.cleanup();
        }
        
        if (this.recorder) {
            this.recorder.cleanup();
        }
        
        if (this.samplesLibrary) {
            this.samplesLibrary.cleanup();
        }
        
        if (this.storage) {
            this.storage.cleanup();
        }
        
        console.log('Gestionnaire UI nettoyé');
    }
}

// Singleton du gestionnaire UI
let uiManagerInstance = null;

function getUIManager() {
    if (!uiManagerInstance) {
        uiManagerInstance = new UIManager();
    }
    return uiManagerInstance;
}

// Exporter pour les autres modules
window.UIManager = UIManager;
window.getUIManager = getUIManager;
window._uiManagerInstance = uiManagerInstance;
