// Timeline pour Studio DAW

class Timeline {
    constructor() {
        this.tracks = [];
        this.clips = [];
        this.selectedTrack = null;
        this.selectedClip = null;
        this.playheadPosition = 0;
        this.zoomLevel = CONFIG.project.zoomLevel;
        this.snapToGrid = CONFIG.project.snapToGrid;
        this.gridSize = CONFIG.project.gridSize;
        this.bpm = CONFIG.project.bpm;
        this.timeSignature = CONFIG.project.timeSignature;
        
        // Éléments DOM
        this.container = null;
        this.ruler = null;
        this.playhead = null;
        this.tracksContainer = null;
        this.tracksHeader = null;
        this.tracksList = null;
        
        // État
        this.isPlaying = false;
        this.isRecording = false;
        this.startTime = 0;
        this.lastUpdateTime = 0;
        this.animationFrameId = null;
        
        // Paramètres d'affichage
        this.pixelsPerSecond = CONFIG.timeline.pixelsPerSecond;
        this.trackHeight = CONFIG.timeline.trackHeight;
        this.headerWidth = CONFIG.timeline.headerWidth;
        this.minTrackHeight = CONFIG.timeline.minTrackHeight;
        this.maxTrackHeight = CONFIG.timeline.maxTrackHeight;
        
        // Callbacks
        this.onPlayheadMove = null;
        this.onSelectionChange = null;
        this.onTrackAdd = null;
        this.onTrackRemove = null;
        this.onClipAdd = null;
        this.onClipRemove = null;
        
        // Initialisation
        this.init();
    }
    
    init() {
        // Récupérer les éléments DOM
        this.container = document.getElementById('timeline-container');
        this.ruler = document.getElementById('ruler-bar');
        this.playhead = document.getElementById('playhead');
        this.tracksContainer = document.getElementById('timeline-container');
        this.tracksHeader = document.querySelector('.tracks-header');
        this.tracksList = document.getElementById('tracks-list');
        
        if (!this.container || !this.ruler || !this.playhead || !this.tracksList) {
            console.warn('Éléments DOM de la timeline non trouvés');
            return;
        }
        
        // Initialiser les pistes
        this.initTracks();
        
        // Initialiser la règle
        this.initRuler();
        
        // Initialiser le playhead
        this.initPlayhead();
        
        // Configurer les événements
        this.setupEvents();
        
        // Mettre à jour l'affichage
        this.updateDisplay();
        
        console.log('Timeline initialisée');
    }
    
    initTracks() {
        // Charger les pistes existantes
        if (APP_STATE.tracks && APP_STATE.tracks.length > 0) {
            this.tracks = APP_STATE.tracks;
        } else {
            // Créer une piste par défaut
            this.addTrack();
        }
    }
    
    initRuler() {
        if (!this.ruler) return;
        
        // Créer les échelles de temps
        this.updateRulerScales();
        
        // Créer les marqueurs
        this.updateRulerMarkers();
    }
    
    initPlayhead() {
        if (!this.playhead) return;
        
        // Position initiale
        this.playhead.style.left = '0px';
    }
    
    setupEvents() {
        if (!this.container) return;
        
        // Événements de la souris sur la timeline
        this.container.addEventListener('click', (e) => this.handleTimelineClick(e));
        this.container.addEventListener('mousemove', (e) => this.handleTimelineMouseMove(e));
        this.container.addEventListener('mousedown', (e) => this.handleTimelineMouseDown(e));
        this.container.addEventListener('mouseup', (e) => this.handleTimelineMouseUp(e));
        this.container.addEventListener('mouseleave', (e) => this.handleTimelineMouseLeave(e));
        
        // Événements du playhead
        if (this.playhead) {
            this.playhead.addEventListener('mousedown', (e) => this.handlePlayheadMouseDown(e));
        }
        
        // Événements de zoom
        const zoomInBtn = document.getElementById('zoom-in-btn');
        const zoomOutBtn = document.getElementById('zoom-out-btn');
        const zoomSlider = document.getElementById('zoom-slider');
        
        if (zoomInBtn) {
            zoomInBtn.addEventListener('click', () => this.zoomIn());
        }
        
        if (zoomOutBtn) {
            zoomOutBtn.addEventListener('click', () => this.zoomOut());
        }
        
        if (zoomSlider) {
            zoomSlider.addEventListener('input', (e) => {
                this.setZoomLevel(parseInt(e.target.value));
            });
        }
        
        // Événements de transport
        const playBtn = document.getElementById('play-btn');
        const stopBtn = document.getElementById('stop-btn');
        const recordBtn = document.getElementById('record-btn');
        
        if (playBtn) {
            playBtn.addEventListener('click', () => this.togglePlay());
        }
        
        if (stopBtn) {
            stopBtn.addEventListener('click', () => this.stop());
        }
        
        if (recordBtn) {
            recordBtn.addEventListener('click', () => this.toggleRecord());
        }
        
        // Événements BPM
        const bpmInput = document.getElementById('bpm-input');
        if (bpmInput) {
            bpmInput.addEventListener('change', (e) => {
                this.setBpm(parseInt(e.target.value) || 120);
            });
        }
        
        // Événements de tap tempo
        const tapTempoBtn = document.getElementById('tap-tempo-btn');
        if (tapTempoBtn) {
            tapTempoBtn.addEventListener('click', () => this.handleTapTempo());
        }
    }
    
    // Gestion des pistes
    addTrack(options = {}) {
        const track = new Track({
            name: options.name || `Piste ${this.tracks.length + 1}`,
            type: options.type || 'audio',
            color: options.color || stringToColor(`track-${this.tracks.length}`),
            index: this.tracks.length
        });
        
        this.tracks.push(track);
        APP_STATE.tracks = this.tracks;
        
        // Créer l'élément DOM de la piste
        this.createTrackElement(track);
        
        // Sélectionner la nouvelle piste
        this.selectTrack(track);
        
        if (this.onTrackAdd) {
            this.onTrackAdd(track);
        }
        
        console.log(`Piste ${track.name} ajoutée`);
        return track;
    }
    
    removeTrack(trackId) {
        const index = this.tracks.findIndex(track => track.id === trackId);
        if (index === -1) return false;
        
        const track = this.tracks[index];
        
        // Nettoyer la piste
        track.cleanup();
        
        // Supprimer de la liste
        this.tracks.splice(index, 1);
        APP_STATE.tracks = this.tracks;
        
        // Supprimer l'élément DOM
        const trackElement = document.getElementById(`track-${track.id}`);
        if (trackElement) {
            trackElement.remove();
        }
        
        // Mettre à jour les index
        for (let i = index; i < this.tracks.length; i++) {
            this.tracks[i].index = i;
        }
        
        // Désélectionner si c'était la piste sélectionnée
        if (this.selectedTrack && this.selectedTrack.id === trackId) {
            this.selectedTrack = null;
            this.updateSelection();
        }
        
        if (this.onTrackRemove) {
            this.onTrackRemove(track);
        }
        
        console.log(`Piste ${track.name} supprimée`);
        return true;
    }
    
    getTrack(trackId) {
        return this.tracks.find(track => track.id === trackId);
    }
    
    selectTrack(track) {
        if (this.selectedTrack === track) return;
        
        // Désélectionner l'ancienne piste
        if (this.selectedTrack) {
            this.selectedTrack.cleanup();
        }
        
        this.selectedTrack = track;
        APP_STATE.selectedTrack = track;
        
        // Mettre à jour l'interface
        this.updateSelection();
        
        if (this.onSelectionChange) {
            this.onSelectionChange({ track });
        }
        
        console.log(`Piste ${track.name} sélectionnée`);
    }
    
    moveTrack(trackId, newIndex) {
        const index = this.tracks.findIndex(track => track.id === trackId);
        if (index === -1) return false;
        
        const track = this.tracks[index];
        
        // Supprimer de l'ancienne position
        this.tracks.splice(index, 1);
        
        // Insérer à la nouvelle position
        newIndex = Math.min(Math.max(newIndex, 0), this.tracks.length);
        this.tracks.splice(newIndex, 0, track);
        
        // Mettre à jour les index
        for (let i = 0; i < this.tracks.length; i++) {
            this.tracks[i].index = i;
        }
        
        // Mettre à jour l'interface
        this.updateTrackOrder();
        
        console.log(`Piste ${track.name} déplacée à la position ${newIndex}`);
        return true;
    }
    
    duplicateTrack(trackId) {
        const track = this.getTrack(trackId);
        if (!track) return null;
        
        const newTrack = new Track({
            name: `${track.name} (copie)`,
            type: track.type,
            color: track.color,
            volume: track.volume,
            pan: track.pan,
            muted: track.muted,
            soloed: track.soloed,
            armored: track.armored,
            visible: track.visible,
            instrument: track.instrument,
            height: track.height
        });
        
        // Copier les clips
        track.clips.forEach(clip => {
            let newClip;
            switch (clip.constructor.name) {
                case 'AudioClip':
                    newClip = new AudioClip({
                        name: `${clip.name} (copie)`,
                        startTime: clip.startTime,
                        duration: clip.duration,
                        volume: clip.volume,
                        pan: clip.pan,
                        muted: clip.muted,
                        loop: clip.loop,
                        playbackRate: clip.playbackRate,
                        color: clip.color
                    });
                    if (clip.buffer) {
                        newClip.setBuffer(clip.buffer);
                    }
                    break;
                case 'MidiClip':
                    newClip = new MidiClip({
                        name: `${clip.name} (copie)`,
                        startTime: clip.startTime,
                        duration: clip.duration,
                        volume: clip.volume,
                        pan: clip.pan,
                        muted: clip.muted,
                        loop: clip.loop,
                        instrument: clip.instrument,
                        notes: clip.notes.map(note => ({ ...note }))
                    });
                    break;
                case 'DrumClip':
                    newClip = new DrumClip({
                        name: `${clip.name} (copie)`,
                        startTime: clip.startTime,
                        duration: clip.duration,
                        volume: clip.volume,
                        pan: clip.pan,
                        muted: clip.muted,
                        loop: clip.loop,
                        pattern: clip.pattern.map(step => step.slice()),
                        patternLength: clip.patternLength,
                        stepDuration: clip.stepDuration
                    });
                    break;
                default:
                    newClip = new AudioClip({
                        name: `${clip.name} (copie)`,
                        startTime: clip.startTime,
                        duration: clip.duration
                    });
            }
            newTrack.addClip(newClip);
        });
        
        // Ajouter la nouvelle piste
        this.addTrack(newTrack);
        
        console.log(`Piste ${track.name} dupliquée`);
        return newTrack;
    }
    
    createTrackElement(track) {
        if (!this.tracksList) return;
        
        // Créer l'élément de la piste
        const trackElement = document.createElement('div');
        trackElement.className = 'track';
        trackElement.id = `track-${track.id}`;
        trackElement.dataset.trackId = track.id;
        trackElement.style.height = `${track.height}px`;
        
        // Créer le contrôleur de la piste
        const controlElement = this.createTrackControlElement(track);
        
        // Créer l'en-tête de la piste
        const headerElement = this.createTrackHeaderElement(track);
        
        // Créer le conteneur des clips
        const clipsContainer = document.createElement('div');
        clipsContainer.className = 'track-clips';
        clipsContainer.id = `track-clips-${track.id}`;
        
        // Ajouter les éléments
        trackElement.appendChild(controlElement);
        trackElement.appendChild(headerElement);
        trackElement.appendChild(clipsContainer);
        
        // Ajouter à la liste
        this.tracksList.appendChild(trackElement);
        
        // Créer les éléments des clips
        track.clips.forEach(clip => {
            this.createClipElement(clip);
        });
    }
    
    createTrackControlElement(track) {
        const controlElement = document.createElement('div');
        controlElement.className = 'track-control';
        
        // Bouton de mute
        const muteBtn = document.createElement('button');
        muteBtn.className = `btn btn-icon ${track.muted ? 'active' : ''}`;
        muteBtn.innerHTML = track.muted ? '🔇' : '🔊';
        muteBtn.title = track.muted ? 'Désactiver le mute' : 'Mute';
        muteBtn.onclick = (e) => {
            e.stopPropagation();
            track.setMuted(!track.muted);
            muteBtn.classList.toggle('active');
            muteBtn.innerHTML = track.muted ? '🔇' : '🔊';
            muteBtn.title = track.muted ? 'Désactiver le mute' : 'Mute';
        };
        
        // Bouton de solo
        const soloBtn = document.createElement('button');
        soloBtn.className = `btn btn-icon ${track.soloed ? 'active' : ''}`;
        soloBtn.innerHTML = track.soloed ? '🎧' : '🎵';
        soloBtn.title = track.soloed ? 'Désactiver le solo' : 'Solo';
        soloBtn.onclick = (e) => {
            e.stopPropagation();
            track.setSoloed(!track.soloed);
            soloBtn.classList.toggle('active');
            soloBtn.innerHTML = track.soloed ? '🎧' : '🎵';
            soloBtn.title = track.soloed ? 'Désactiver le solo' : 'Solo';
        };
        
        // Bouton d'armement
        const armorBtn = document.createElement('button');
        armorBtn.className = `btn btn-icon ${track.armored ? 'active' : ''}`;
        armorBtn.innerHTML = track.armored ? '🎤' : '🎚️';
        armorBtn.title = track.armored ? 'Désarmer' : 'Armer pour l\'enregistrement';
        armorBtn.onclick = (e) => {
            e.stopPropagation();
            track.setArmor(!track.armored);
            armorBtn.classList.toggle('active');
            armorBtn.innerHTML = track.armored ? '🎤' : '🎚️';
            armorBtn.title = track.armored ? 'Désarmer' : 'Armer pour l\'enregistrement';
        };
        
        // Bouton de visibilité
        const visibleBtn = document.createElement('button');
        visibleBtn.className = `btn btn-icon ${!track.visible ? 'active' : ''}`;
        visibleBtn.innerHTML = track.visible ? '👁️' : '👁️‍🗨';
        visibleBtn.title = track.visible ? 'Masquer' : 'Afficher';
        visibleBtn.onclick = (e) => {
            e.stopPropagation();
            track.setVisible(!track.visible);
            visibleBtn.classList.toggle('active');
            visibleBtn.innerHTML = track.visible ? '👁️' : '👁️‍🗨';
            visibleBtn.title = track.visible ? 'Masquer' : 'Afficher';
            
            // Mettre à jour l'affichage
            const trackElement = document.getElementById(`track-${track.id}`);
            if (trackElement) {
                trackElement.style.display = track.visible ? '' : 'none';
            }
        };
        
        // Ajouter les boutons
        controlElement.appendChild(muteBtn);
        controlElement.appendChild(soloBtn);
        controlElement.appendChild(armorBtn);
        controlElement.appendChild(visibleBtn);
        
        return controlElement;
    }
    
    createTrackHeaderElement(track) {
        const headerElement = document.createElement('div');
        headerElement.className = 'track-header';
        
        // Indicateur de couleur
        const colorIndicator = document.createElement('div');
        colorIndicator.className = 'track-color';
        colorIndicator.style.backgroundColor = track.color;
        
        // Nom de la piste
        const nameElement = document.createElement('div');
        nameElement.className = 'track-name';
        nameElement.textContent = track.name;
        nameElement.contentEditable = true;
        nameElement.onblur = () => {
            const newName = nameElement.textContent.trim() || `Piste ${track.index + 1}`;
            track.setName(newName);
            nameElement.textContent = track.name;
        };
        
        // Indicateur de type
        const typeElement = document.createElement('span');
        typeElement.className = 'track-type';
        typeElement.textContent = this.getTrackTypeIcon(track.type);
        typeElement.title = this.getTrackTypeName(track.type);
        
        // Bouton de menu
        const menuBtn = document.createElement('button');
        menuBtn.className = 'btn btn-icon track-menu-btn';
        menuBtn.innerHTML = '⋮';
        menuBtn.title = 'Menu de la piste';
        menuBtn.onclick = (e) => {
            e.stopPropagation();
            this.showTrackMenu(track, menuBtn);
        };
        
        // Ajouter les éléments
        headerElement.appendChild(colorIndicator);
        headerElement.appendChild(nameElement);
        headerElement.appendChild(typeElement);
        headerElement.appendChild(menuBtn);
        
        // Événement de clic pour la sélection
        headerElement.addEventListener('click', (e) => {
            if (e.target === nameElement) return;
            this.selectTrack(track);
        });
        
        return headerElement;
    }
    
    getTrackTypeIcon(type) {
        const icons = {
            audio: '🎵',
            midi: '🎹',
            drum: '🥁',
            instrument: '🎻'
        };
        return icons[type] || '🎵';
    }
    
    getTrackTypeName(type) {
        const names = {
            audio: 'Audio',
            midi: 'MIDI',
            drum: 'Batterie',
            instrument: 'Instrument'
        };
        return names[type] || 'Audio';
    }
    
    showTrackMenu(track, element) {
        // Créer un menu contextuel
        const menu = document.createElement('div');
        menu.className = 'context-menu';
        menu.style.position = 'absolute';
        menu.style.left = `${element.getBoundingClientRect().left}px`;
        menu.style.top = `${element.getBoundingClientRect().bottom}px`;
        menu.style.zIndex = '1000';
        
        // Options du menu
        const options = [
            { label: 'Renommer', action: () => this.renameTrack(track) },
            { label: 'Dupliquer', action: () => this.duplicateTrack(track.id) },
            { label: 'Supprimer', action: () => this.removeTrack(track.id) },
            { label: 'Changer de type', action: () => this.changeTrackType(track) },
            { label: 'Changer de couleur', action: () => this.changeTrackColor(track) },
            { label: 'Hauteur...', action: () => this.changeTrackHeight(track) }
        ];
        
        options.forEach(option => {
            const item = document.createElement('div');
            item.className = 'menu-item';
            item.textContent = option.label;
            item.onclick = () => {
                option.action();
                menu.remove();
            };
            menu.appendChild(item);
        });
        
        // Fermer le menu en cliquant à l'extérieur
        document.addEventListener('click', () => {
            menu.remove();
        }, { once: true });
        
        document.body.appendChild(menu);
    }
    
    renameTrack(track) {
        const newName = prompt('Nouveau nom de la piste:', track.name);
        if (newName && newName.trim()) {
            track.setName(newName.trim());
            const nameElement = document.querySelector(`#track-${track.id} .track-name`);
            if (nameElement) {
                nameElement.textContent = track.name;
            }
        }
    }
    
    changeTrackType(track) {
        const types = ['audio', 'midi', 'drum', 'instrument'];
        const typeNames = ['Audio', 'MIDI', 'Batterie', 'Instrument'];
        
        const selectedType = prompt(`Type de piste actuel: ${this.getTrackTypeName(track.type)}
Choisissez un nouveau type: 1-${typeNames.length}
1. ${typeNames[0]}
2. ${typeNames[1]}
3. ${typeNames[2]}
4. ${typeNames[3]}`);
        
        if (selectedType) {
            const index = parseInt(selectedType) - 1;
            if (index >= 0 && index < types.length) {
                track.type = types[index];
                const typeElement = document.querySelector(`#track-${track.id} .track-type`);
                if (typeElement) {
                    typeElement.textContent = this.getTrackTypeIcon(track.type);
                    typeElement.title = this.getTrackTypeName(track.type);
                }
            }
        }
    }
    
    changeTrackColor(track) {
        const newColor = prompt('Nouvelle couleur (hex):', track.color);
        if (newColor && /^#[0-9A-Fa-f]{6}$/.test(newColor)) {
            track.setColor(newColor);
            const colorElement = document.querySelector(`#track-${track.id} .track-color`);
            if (colorElement) {
                colorElement.style.backgroundColor = newColor;
            }
        }
    }
    
    changeTrackHeight(track) {
        const newHeight = prompt('Nouvelle hauteur (px):', track.height);
        if (newHeight) {
            const height = parseInt(newHeight);
            if (height >= this.minTrackHeight && height <= this.maxTrackHeight) {
                track.setHeight(height);
                const trackElement = document.getElementById(`track-${track.id}`);
                if (trackElement) {
                    trackElement.style.height = `${height}px`;
                }
            }
        }
    }
    
    updateTrackOrder() {
        if (!this.tracksList) return;
        
        const trackElements = Array.from(this.tracksList.children);
        trackElements.forEach((element, index) => {
            element.style.order = index;
        });
    }
    
    // Gestion des clips
    addClip(clip, trackId = null) {
        let track;
        
        if (trackId) {
            track = this.getTrack(trackId);
        } else if (this.selectedTrack) {
            track = this.selectedTrack;
        } else if (this.tracks.length > 0) {
            track = this.tracks[0];
        }
        
        if (!track) return null;
        
        // Ajouter le clip à la piste
        track.addClip(clip);
        
        // Créer l'élément DOM du clip
        this.createClipElement(clip);
        
        // Sélectionner le clip
        this.selectClip(clip);
        
        if (this.onClipAdd) {
            this.onClipAdd(clip, track);
        }
        
        console.log(`Clip ${clip.name} ajouté à la piste ${track.name}`);
        return clip;
    }
    
    removeClip(clipId) {
        let clipFound = null;
        let trackFound = null;
        
        for (const track of this.tracks) {
            const clip = track.getClip(clipId);
            if (clip) {
                clipFound = clip;
                trackFound = track;
                break;
            }
        }
        
        if (!clipFound || !trackFound) return false;
        
        // Supprimer le clip de la piste
        trackFound.removeClip(clipId);
        
        // Supprimer l'élément DOM
        const clipElement = document.getElementById(`clip-${clipId}`);
        if (clipElement) {
            clipElement.remove();
        }
        
        // Désélectionner si c'était le clip sélectionné
        if (this.selectedClip && this.selectedClip.id === clipId) {
            this.selectedClip = null;
            this.updateSelection();
        }
        
        if (this.onClipRemove) {
            this.onClipRemove(clipFound, trackFound);
        }
        
        console.log(`Clip ${clipFound.name} supprimé`);
        return true;
    }
    
    getClip(clipId) {
        for (const track of this.tracks) {
            const clip = track.getClip(clipId);
            if (clip) return clip;
        }
        return null;
    }
    
    selectClip(clip) {
        if (this.selectedClip === clip) return;
        
        this.selectedClip = clip;
        APP_STATE.selectedClip = clip;
        
        // Mettre à jour l'interface
        this.updateSelection();
        
        if (this.onSelectionChange) {
            this.onSelectionChange({ clip });
        }
        
        console.log(`Clip ${clip.name} sélectionné`);
    }
    
    createClipElement(clip) {
        if (!clip.track || !this.tracksList) return;
        
        const clipsContainer = document.getElementById(`track-clips-${clip.track.id}`);
        if (!clipsContainer) return;
        
        // Créer l'élément du clip
        const clipElement = document.createElement('div');
        clipElement.className = `clip ${clip.constructor.name.toLowerCase()}`;
        clipElement.id = `clip-${clip.id}`;
        clipElement.dataset.clipId = clip.id;
        clipElement.style.left = `${this.timeToPixels(clip.startTime)}px`;
        clipElement.style.width = `${this.timeToPixels(clip.duration / 1000)}px`;
        clipElement.style.backgroundColor = clip.color;
        clipElement.style.height = `${clip.track.height - 4}px`;
        
        // Créer le contenu du clip
        const contentElement = document.createElement('div');
        contentElement.className = 'clip-content';
        
        const nameElement = document.createElement('span');
        nameElement.className = 'clip-name';
        nameElement.textContent = clip.name;
        
        const durationElement = document.createElement('span');
        durationElement.className = 'clip-duration';
        durationElement.textContent = formatTime(clip.duration / 1000);
        
        contentElement.appendChild(nameElement);
        contentElement.appendChild(durationElement);
        clipElement.appendChild(contentElement);
        
        // Gestionnaire de clic pour la sélection
        clipElement.addEventListener('click', (e) => {
            e.stopPropagation();
            this.selectClip(clip);
        });
        
        // Gestionnaire de double clic pour l'édition
        clipElement.addEventListener('dblclick', (e) => {
            e.stopPropagation();
            this.editClip(clip);
        });
        
        // Gestionnaire de glisser-déposer
        this.setupClipDragAndDrop(clipElement, clip);
        
        // Ajouter à la piste
        clipsContainer.appendChild(clipElement);
    }
    
    editClip(clip) {
        // À implémenter: édition du clip
        console.log(`Éditer le clip ${clip.name}`);
    }
    
    setupClipDragAndDrop(clipElement, clip) {
        let startX, startLeft, isDragging = false;
        
        clipElement.addEventListener('mousedown', (e) => {
            if (e.button !== 0) return; // Bouton gauche uniquement
            
            e.preventDefault();
            e.stopPropagation();
            
            startX = e.clientX;
            startLeft = parseFloat(clipElement.style.left);
            isDragging = true;
            
            clipElement.classList.add('dragging');
            
            // Stocker la position initiale
            const initialStartTime = clip.startTime;
        });
        
        document.addEventListener('mousemove', (e) => {
            if (!isDragging) return;
            
            e.preventDefault();
            
            const dx = e.clientX - startX;
            const newLeft = startLeft + dx;
            
            // Limiter la position
            const minLeft = 0;
            const maxLeft = this.container.clientWidth - clipElement.clientWidth;
            const clampedLeft = Math.max(minLeft, Math.min(maxLeft, newLeft));
            
            clipElement.style.left = `${clampedLeft}px`;
            
            // Mettre à jour la position du clip
            const newStartTime = this.pixelsToTime(clampedLeft);
            clip.setStartTime(newStartTime);
        });
        
        document.addEventListener('mouseup', (e) => {
            if (!isDragging) return;
            
            e.preventDefault();
            
            isDragging = false;
            clipElement.classList.remove('dragging');
        });
    }
    
    // Lecture
    play(time = 0) {
        if (this.isPlaying) return;
        
        this.isPlaying = true;
        this.startTime = Date.now();
        this.playheadPosition = time;
        
        // Démarrer l'animation du playhead
        this.startPlayheadAnimation();
        
        // Jouer toutes les pistes
        this.tracks.forEach(track => {
            track.play(time);
        });
        
        console.log('Lecture démarrée à ' + formatTime(time));
    }
    
    stop() {
        if (!this.isPlaying) return;
        
        this.isPlaying = false;
        
        // Arrêter l'animation du playhead
        this.stopPlayheadAnimation();
        
        // Arrêter toutes les pistes
        this.tracks.forEach(track => {
            track.stop();
        });
        
        console.log('Lecture arrêtée');
    }
    
    togglePlay() {
        if (this.isPlaying) {
            this.stop();
        } else {
            this.play(this.playheadPosition);
        }
    }
    
    // Enregistrement
    startRecording() {
        if (this.isRecording) return;
        
        this.isRecording = true;
        
        // Démarrer l'enregistrement sur les pistes armées
        this.tracks.forEach(track => {
            if (track.armored) {
                track.startRecording();
            }
        });
        
        // Démarrer la lecture
        this.play(this.playheadPosition);
        
        console.log('Enregistrement démarré');
        showToast('Enregistrement démarré!', 'success');
    }
    
    stopRecording() {
        if (!this.isRecording) return;
        
        this.isRecording = false;
        
        // Arrêter l'enregistrement sur les pistes armées
        this.tracks.forEach(track => {
            if (track.armored) {
                track.stopRecording();
            }
        });
        
        // Arrêter la lecture
        this.stop();
        
        console.log('Enregistrement arrêté');
        showToast('Enregistrement arrêté!', 'info');
    }
    
    toggleRecord() {
        if (this.isRecording) {
            this.stopRecording();
        } else {
            this.startRecording();
        }
    }
    
    // Playhead
    setPlayheadPosition(position) {
        this.playheadPosition = Math.max(0, position);
        
        if (this.playhead) {
            this.playhead.style.left = `${this.timeToPixels(this.playheadPosition)}px`;
        }
        
        if (this.onPlayheadMove) {
            this.onPlayheadMove(this.playheadPosition);
        }
    }
    
    startPlayheadAnimation() {
        if (this.animationFrameId) {
            cancelAnimationFrame(this.animationFrameId);
        }
        
        const audioEngine = getAudioEngine();
        if (!audioEngine) return;
        
        const startTime = Date.now();
        const initialPosition = this.playheadPosition;
        
        const animate = () => {
            if (!this.isPlaying) return;
            
            const elapsed = (Date.now() - startTime) / 1000;
            const newPosition = initialPosition + elapsed;
            
            this.setPlayheadPosition(newPosition);
            
            this.animationFrameId = requestAnimationFrame(animate);
        };
        
        animate();
    }
    
    stopPlayheadAnimation() {
        if (this.animationFrameId) {
            cancelAnimationFrame(this.animationFrameId);
            this.animationFrameId = null;
        }
    }
    
    handlePlayheadMouseDown(e) {
        e.preventDefault();
        e.stopPropagation();
        
        const startX = e.clientX;
        const startPosition = this.playheadPosition;
        
        const onMouseMove = (e) => {
            const dx = e.clientX - startX;
            const newPosition = startPosition + this.pixelsToTime(dx);
            this.setPlayheadPosition(newPosition);
        };
        
        const onMouseUp = () => {
            document.removeEventListener('mousemove', onMouseMove);
            document.removeEventListener('mouseup', onMouseUp);
        };
        
        document.addEventListener('mousemove', onMouseMove);
        document.addEventListener('mouseup', onMouseUp);
    }
    
    // Règle
    updateRulerScales() {
        if (!this.ruler) return;
        
        const scalesContainer = document.getElementById('ruler-scales');
        if (!scalesContainer) return;
        
        // Effacer les échelles existantes
        scalesContainer.innerHTML = '';
        
        // Calculer les échelles en fonction du zoom
        const containerWidth = this.container.clientWidth;
        const maxTime = this.pixelsToTime(containerWidth);
        const interval = this.calculateRulerInterval(maxTime);
        
        // Créer les échelles
        for (let time = 0; time <= maxTime; time += interval) {
            const scaleElement = document.createElement('div');
            scaleElement.className = 'ruler-scale';
            scaleElement.style.left = `${this.timeToPixels(time)}px`;
            scaleElement.textContent = formatTime(time);
            scalesContainer.appendChild(scaleElement);
        }
    }
    
    updateRulerMarkers() {
        if (!this.ruler) return;
        
        const markersContainer = document.getElementById('ruler-markers');
        if (!markersContainer) return;
        
        // Effacer les marqueurs existants
        markersContainer.innerHTML = '';
        
        // Calculer les marqueurs en fonction du BPM
        const containerWidth = this.container.clientWidth;
        const maxTime = this.pixelsToTime(containerWidth);
        const beatsPerSecond = this.bpm / 60;
        const beatInterval = 1 / beatsPerSecond;
        
        // Créer les marqueurs de mesure
        for (let time = 0; time <= maxTime; time += beatInterval * 4) {
            const markerElement = document.createElement('div');
            markerElement.className = 'ruler-marker measure';
            markerElement.style.left = `${this.timeToPixels(time)}px`;
            markersContainer.appendChild(markerElement);
        }
        
        // Créer les marqueurs de beat
        for (let time = 0; time <= maxTime; time += beatInterval) {
            const markerElement = document.createElement('div');
            markerElement.className = 'ruler-marker beat';
            markerElement.style.left = `${this.timeToPixels(time)}px`;
            markersContainer.appendChild(markerElement);
        }
    }
    
    calculateRulerInterval(maxTime) {
        // Calculer un intervalle approprié pour les échelles
        if (maxTime <= 10) {
            return 1; // 1 seconde
        } else if (maxTime <= 60) {
            return 5; // 5 secondes
        } else if (maxTime <= 300) {
            return 15; // 15 secondes
        } else if (maxTime <= 600) {
            return 30; // 30 secondes
        } else {
            return 60; // 1 minute
        }
    }
    
    // Zoom
    zoomIn() {
        this.zoomLevel = Math.min(this.zoomLevel + 10, 100);
        this.updateZoom();
    }
    
    zoomOut() {
        this.zoomLevel = Math.max(this.zoomLevel - 10, 1);
        this.updateZoom();
    }
    
    setZoomLevel(level) {
        this.zoomLevel = clamp(level, 1, 100);
        this.updateZoom();
    }
    
    updateZoom() {
        // Mettre à jour les pixels par seconde
        this.pixelsPerSecond = mapValue(
            this.zoomLevel,
            1, 100,
            CONFIG.timeline.minPixelsPerSecond,
            CONFIG.timeline.maxPixelsPerSecond
        );
        
        // Mettre à jour l'affichage
        this.updateDisplay();
        
        // Mettre à jour le slider
        const zoomSlider = document.getElementById('zoom-slider');
        if (zoomSlider) {
            zoomSlider.value = this.zoomLevel;
        }
        
        console.log(`Zoom: ${this.zoomLevel}%`);
    }
    
    // Conversion temps/pixels
    timeToPixels(time) {
        return time * this.pixelsPerSecond;
    }
    
    pixelsToTime(pixels) {
        return pixels / this.pixelsPerSecond;
    }
    
    // BPM et tempo
    setBpm(bpm) {
        this.bpm = clamp(bpm, 40, 200);
        CONFIG.project.bpm = this.bpm;
        
        // Mettre à jour la drum machine
        const drumMachine = getDrumMachine();
        if (drumMachine) {
            drumMachine.setBpm(this.bpm);
        }
        
        // Mettre à jour le métronome
        const audioEngine = getAudioEngine();
        if (audioEngine && audioEngine.metronome) {
            audioEngine.metronome.setBpm(this.bpm);
        }
        
        // Mettre à jour les marqueurs de la règle
        this.updateRulerMarkers();
        
        console.log(`BPM: ${this.bpm}`);
    }
    
    handleTapTempo() {
        const now = Date.now();
        const audioEngine = getAudioEngine();
        
        if (!APP_STATE.lastTapTime) {
            APP_STATE.lastTapTime = now;
            APP_STATE.tapTempoCount = 1;
            showToast('Tap tempo: 1 tap', 'info');
            return;
        }
        
        const interval = now - APP_STATE.lastTapTime;
        const bpm = Math.round(60000 / interval);
        
        APP_STATE.lastTapTime = now;
        APP_STATE.tapTempoCount++;
        
        if (APP_STATE.tapTempoCount > 1) {
            this.setBpm(bpm);
            showToast(`BPM: ${bpm}`, 'success');
        }
        
        // Réinitialiser après un certain temps
        setTimeout(() => {
            if (Date.now() - APP_STATE.lastTapTime > 2000) {
                APP_STATE.tapTempoCount = 0;
            }
        }, 2000);
    }
    
    // Mise à jour de l'affichage
    updateDisplay() {
        this.updateRulerScales();
        this.updateRulerMarkers();
        this.updateClipsPosition();
        this.updatePlayheadPosition();
    }
    
    updateClipsPosition() {
        this.tracks.forEach(track => {
            track.clips.forEach(clip => {
                const clipElement = document.getElementById(`clip-${clip.id}`);
                if (clipElement) {
                    clipElement.style.left = `${this.timeToPixels(clip.startTime)}px`;
                    clipElement.style.width = `${this.timeToPixels(clip.duration / 1000)}px`;
                }
            });
        });
    }
    
    updatePlayheadPosition() {
        if (this.playhead) {
            this.playhead.style.left = `${this.timeToPixels(this.playheadPosition)}px`;
        }
    }
    
    updateSelection() {
        // Mettre à jour la sélection des pistes
        document.querySelectorAll('.track').forEach(element => {
            element.classList.remove('selected');
            if (this.selectedTrack && element.dataset.trackId === this.selectedTrack.id) {
                element.classList.add('selected');
            }
        });
        
        // Mettre à jour la sélection des clips
        document.querySelectorAll('.clip').forEach(element => {
            element.classList.remove('selected');
            if (this.selectedClip && element.dataset.clipId === this.selectedClip.id) {
                element.classList.add('selected');
            }
        });
    }
    
    // Gestion des événements de la timeline
    handleTimelineClick(e) {
        if (e.target.classList.contains('clip') || 
            e.target.closest('.clip') ||
            e.target.classList.contains('track-header') ||
            e.target.closest('.track-header')) {
            return; // Ne pas gérer si on clique sur un clip ou un en-tête
        }
        
        // Désélectionner
        this.selectedTrack = null;
        this.selectedClip = null;
        this.updateSelection();
        
        if (this.onSelectionChange) {
            this.onSelectionChange({ track: null, clip: null });
        }
    }
    
    handleTimelineMouseMove(e) {
        // Peut être utilisé pour le survol, etc.
    }
    
    handleTimelineMouseDown(e) {
        // Peut être utilisé pour la sélection multiple, etc.
    }
    
    handleTimelineMouseUp(e) {
        // Fin de la sélection, etc.
    }
    
    handleTimelineMouseLeave(e) {
        // La souris quitte la timeline
    }
    
    // Sérialisation
    toJSON() {
        return {
            tracks: this.tracks.map(track => track.toJSON()),
            playheadPosition: this.playheadPosition,
            zoomLevel: this.zoomLevel,
            snapToGrid: this.snapToGrid,
            gridSize: this.gridSize,
            bpm: this.bpm,
            timeSignature: this.timeSignature
        };
    }
    
    static fromJSON(data) {
        const timeline = new Timeline();
        
        timeline.playheadPosition = data.playheadPosition || 0;
        timeline.zoomLevel = data.zoomLevel || CONFIG.project.zoomLevel;
        timeline.snapToGrid = data.snapToGrid !== undefined ? data.snapToGrid : CONFIG.project.snapToGrid;
        timeline.gridSize = data.gridSize || CONFIG.project.gridSize;
        timeline.bpm = data.bpm || CONFIG.project.bpm;
        timeline.timeSignature = data.timeSignature || CONFIG.project.timeSignature;
        
        // Charger les pistes
        timeline.tracks = data.tracks.map(trackData => Track.fromJSON(trackData));
        APP_STATE.tracks = timeline.tracks;
        
        // Créer les éléments DOM
        timeline.tracks.forEach(track => {
            timeline.createTrackElement(track);
        });
        
        // Mettre à jour le zoom
        timeline.updateZoom();
        
        // Mettre à jour le BPM
        timeline.setBpm(timeline.bpm);
        
        return timeline;
    }
    
    // Nettoyage
    cleanup() {
        this.stop();
        this.stopRecording();
        
        // Nettoyer les pistes
        this.tracks.forEach(track => {
            track.cleanup();
        });
        this.tracks = [];
        APP_STATE.tracks = [];
        
        // Nettoyer les éléments DOM
        if (this.tracksList) {
            this.tracksList.innerHTML = '';
        }
        
        // Réinitialiser les variables
        this.selectedTrack = null;
        this.selectedClip = null;
        this.playheadPosition = 0;
        this.zoomLevel = CONFIG.project.zoomLevel;
        this.snapToGrid = CONFIG.project.snapToGrid;
        this.gridSize = CONFIG.project.gridSize;
        this.bpm = CONFIG.project.bpm;
        this.timeSignature = CONFIG.project.timeSignature;
        
        // Nettoyer l'animation
        this.stopPlayheadAnimation();
        
        console.log('Timeline nettoyée');
    }
}

// Singleton de la timeline
let timelineInstance = null;

function getTimeline() {
    if (!timelineInstance) {
        timelineInstance = new Timeline();
    }
    return timelineInstance;
}

// Exporter pour les autres modules
window.Timeline = Timeline;
window.getTimeline = getTimeline;
window._timelineInstance = timelineInstance;
