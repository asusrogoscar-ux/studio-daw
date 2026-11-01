// Timeline multipiste pour Studio DAW

class Timeline {
    constructor() {
        this.tracks = [];
        this.playheadPosition = 0;
        this.isPlaying = false;
        this.isRecording = false;
        this.startTime = 0;
        this.pausedTime = 0;
        this.bpm = window.APP_STATE ? window.APP_STATE.bpm : 120;
        this.timeSignature = { numerator: 4, denominator: 4 };
        this.zoomLevel = 50;
        this.pixelsPerSecond = 100;
        this.snapToGrid = true;
        this.gridSize = 16;
        this.totalDuration = 0;
        
        // Éléments DOM
        this.timelineElement = null;
        this.tracksContainer = null;
        this.ruler = null;
        this.playhead = null;
        this.zoomControls = null;
        
        // Callbacks
        this.onPlay = null;
        this.onStop = null;
        this.onRecordStart = null;
        this.onRecordStop = null;
        this.onBpmChange = null;
        this.onTrackAdd = null;
        this.onTrackRemove = null;
        this.onTrackSelect = null;
        
        // NE PAS initialiser automatiquement dans le constructeur
        // L'initialisation sera faite par core.js dans le bon ordre
    }
    
    init() {
        // Récupérer les éléments DOM
        this.timelineElement = document.getElementById('timeline');
        this.tracksContainer = document.getElementById('tracks-container');
        this.ruler = document.getElementById('ruler');
        this.playhead = document.getElementById('playhead');
        
        // Créer les pistes par défaut
        this.createDefaultTracks();
        
        // Configurer les événements
        this.setupEvents();
        
        // Mettre à jour l'affichage
        this.updateDisplay();
        
        console.log('Timeline initialisée');
    }
    
    createDefaultTracks() {
        // Créer une piste audio par défaut
        const audioTrack = this.createTrack('Audio', 'audio');
        this.addTrack(audioTrack);
        
        // Créer une piste MIDI par défaut
        const midiTrack = this.createTrack('Piano', 'midi');
        midiTrack.instrument = 'piano';
        this.addTrack(midiTrack);
        
        // Créer une piste de batterie
        const drumTrack = this.createTrack('Batterie', 'drum');
        this.addTrack(drumTrack);
    }
    
    createTrack(name, type) {
        const track = typeof Track === 'function' ? new Track(name, type, this) : null;
        if (!track) {
            console.error('La classe Track n\'est pas disponible');
            return null;
        }
        return track;
    }
    
    addTrack(track) {
        this.tracks.push(track);
        track.id = window.generateId ? window.generateId('track-') : `track-${Date.now()}`;
        track.timeline = this;
        
        // Créer l'élément DOM de la piste
        track.createElement(this.tracksContainer);
        
        // Mettre à jour l'ordre
        this.updateTrackOrder();
        
        // Notifier
        if (this.onTrackAdd) {
            this.onTrackAdd(track);
        }
        
        // Mettre à jour la durée totale
        this.updateTotalDuration();
        
        return track;
    }
    
    removeTrack(track) {
        const index = this.tracks.indexOf(track);
        if (index > -1) {
            this.tracks.splice(index, 1);
            
            // Supprimer l'élément DOM
            if (track.element && track.element.parentNode) {
                track.element.parentNode.removeChild(track.element);
            }
            
            // Notifier
            if (this.onTrackRemove) {
                this.onTrackRemove(track);
            }
            
            // Mettre à jour la durée totale
            this.updateTotalDuration();
            
            // Si c'était la piste sélectionnée, désélectionner
            if (window.APP_STATE && window.APP_STATE.selectedTrack === track) {
                window.APP_STATE.selectedTrack = null;
            }
        }
    }
    
    selectTrack(track) {
        // Désélectionner la piste actuelle
        if (window.APP_STATE && window.APP_STATE.selectedTrack) {
            window.APP_STATE.selectedTrack.deselect();
        }
        
        // Sélectionner la nouvelle piste
        track.select();
        window.APP_STATE.selectedTrack = track;
        
        // Notifier
        if (this.onTrackSelect) {
            this.onTrackSelect(track);
        }
    }
    
    updateTrackOrder() {
        this.tracks.forEach((track, index) => {
            track.index = index;
            if (track.element) {
                track.element.style.top = `${index * 60}px`;
            }
        });
    }
    
    setupEvents() {
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
            let lastTapTime = 0;
            let tapCount = 0;
            const tapTimes = [];
            
            tapTempoBtn.addEventListener('click', () => {
                const now = Date.now();
                
                if (lastTapTime > 0) {
                    const interval = now - lastTapTime;
                    tapTimes.push(interval);
                    tapCount++;
                    
                    if (tapCount >= 3) {
                        // Calculer le BPM moyen
                        const avgInterval = tapTimes.reduce((a, b) => a + b, 0) / tapTimes.length;
                        const newBpm = Math.round(60000 / avgInterval);
                        this.setBpm(newBpm);
                        tapTimes.length = 0;
                        tapCount = 0;
                    }
                }
                
                lastTapTime = now;
            });
        }
        
        // Événements de zoom
        const zoomInBtn = document.getElementById('zoom-in-btn');
        const zoomOutBtn = document.getElementById('zoom-out-btn');
        
        if (zoomInBtn) {
            zoomInBtn.addEventListener('click', () => this.zoomIn());
        }
        
        if (zoomOutBtn) {
            zoomOutBtn.addEventListener('click', () => this.zoomOut());
        }
        
        // Événements sur la timeline
        if (this.timelineElement) {
            this.timelineElement.addEventListener('click', (e) => {
                if (e.target === this.timelineElement || e.target === this.ruler) {
                    const rect = this.timelineElement.getBoundingClientRect();
                    const clickX = e.clientX - rect.left;
                    this.setPlayheadPosition(this.pixelsToTime(clickX));
                }
            });
        }
        
        // Événements du playhead
        if (this.playhead) {
            this.playhead.addEventListener('mousedown', (e) => {
                e.preventDefault();
                this.isDraggingPlayhead = true;
                document.addEventListener('mousemove', this.handlePlayheadDrag.bind(this));
                document.addEventListener('mouseup', this.handlePlayheadDrop.bind(this));
            });
        }
    }
    
    handlePlayheadDrag(e) {
        if (!this.isDraggingPlayhead) return;
        
        const rect = this.timelineElement.getBoundingClientRect();
        const clickX = e.clientX - rect.left;
        this.setPlayheadPosition(this.pixelsToTime(clickX));
    }
    
    handlePlayheadDrop() {
        this.isDraggingPlayhead = false;
        document.removeEventListener('mousemove', this.handlePlayheadDrag.bind(this));
        document.removeEventListener('mouseup', this.handlePlayheadDrop.bind(this));
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
        
        console.log('Lecture démarrée à ' + (window.formatTime ? window.formatTime(time) : time));
        
        // Notifier
        if (this.onPlay) {
            this.onPlay(time);
        }
    }
    
    startPlayheadAnimation() {
        if (this.playheadAnimationId) {
            cancelAnimationFrame(this.playheadAnimationId);
        }
        
        const animate = () => {
            if (!this.isPlaying) return;
            
            const elapsed = (Date.now() - this.startTime) / 1000;
            this.playheadPosition = this.startTimePosition + elapsed;
            
            // Mettre à jour la position du playhead
            if (this.playhead) {
                this.playhead.style.left = `${this.timeToPixels(this.playheadPosition)}px`;
            }
            
            // Si on dépasse la fin, arrêter
            if (this.playheadPosition > this.totalDuration) {
                this.stop();
                return;
            }
            
            this.playheadAnimationId = requestAnimationFrame(animate);
        };
        
        this.startTimePosition = this.playheadPosition;
        this.playheadAnimationId = requestAnimationFrame(animate);
    }
    
    stopPlayheadAnimation() {
        if (this.playheadAnimationId) {
            cancelAnimationFrame(this.playheadAnimationId);
            this.playheadAnimationId = null;
        }
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
        
        // Notifier
        if (this.onStop) {
            this.onStop(this.playheadPosition);
        }
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
        window.showToast ? window.showToast('Enregistrement démarré!', 'success') : console.log('Enregistrement démarré');
        
        // Notifier
        if (this.onRecordStart) {
            this.onRecordStart();
        }
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
        window.showToast ? window.showToast('Enregistrement terminé!', 'success') : console.log('Enregistrement terminé');
        
        // Notifier
        if (this.onRecordStop) {
            this.onRecordStop();
        }
    }
    
    toggleRecord() {
        if (this.isRecording) {
            this.stopRecording();
        } else {
            this.startRecording();
        }
    }
    
    // BPM
    setBpm(bpm) {
        this.bpm = bpm;
        window.APP_STATE.bpm = bpm;
        
        // Notifier
        if (this.onBpmChange) {
            this.onBpmChange(bpm);
        }
        
        console.log(`BPM mis à jour: ${bpm}`);
    }
    
    getBpm() {
        return this.bpm;
    }
    
    // Zoom
    setZoomLevel(level) {
        this.zoomLevel = level;
        this.pixelsPerSecond = this.zoomToPixelsPerSecond(level);
        this.updateDisplay();
    }
    
    zoomIn() {
        this.setZoomLevel(this.zoomLevel + 10);
    }
    
    zoomOut() {
        this.setZoomLevel(this.zoomLevel - 10);
    }
    
    zoomToPixelsPerSecond(level) {
        // Level: 0-100, où 50 = 100px/s
        return 100 * Math.pow(1.2, (level - 50) / 10);
    }
    
    // Conversion temps/pixels
    timeToPixels(time) {
        return time * this.pixelsPerSecond;
    }
    
    pixelsToTime(pixels) {
        return pixels / this.pixelsPerSecond;
    }
    
    // Position du playhead
    setPlayheadPosition(position) {
        this.playheadPosition = Math.max(0, position);
        
        if (this.playhead) {
            this.playhead.style.left = `${this.timeToPixels(this.playheadPosition)}px`;
        }
    }
    
    getPlayheadPosition() {
        return this.playheadPosition;
    }
    
    // Durée
    updateTotalDuration() {
        let maxDuration = 0;
        this.tracks.forEach(track => {
            maxDuration = Math.max(maxDuration, track.getDuration());
        });
        this.totalDuration = maxDuration;
    }
    
    getTotalDuration() {
        return this.totalDuration;
    }
    
    // Affichage
    updateDisplay() {
        // Mettre à jour la règle
        if (this.ruler) {
            this.updateRuler();
        }
        
        // Mettre à jour la position du playhead
        if (this.playhead) {
            this.playhead.style.left = `${this.timeToPixels(this.playheadPosition)}px`;
        }
        
        // Mettre à jour les pistes
        this.tracks.forEach(track => {
            track.updateDisplay();
        });
    }
    
    updateRuler() {
        if (!this.ruler) return;
        
        const duration = Math.max(this.totalDuration, 16);
        const pixels = this.timeToPixels(duration);
        
        // Générer les marqueurs de temps
        let html = '';
        const interval = this.bpm / 60; // Intervalle en secondes pour chaque beat
        
        for (let t = 0; t <= duration; t += interval) {
            const measure = Math.floor(t / (interval * 4)) + 1;
            const beat = Math.floor((t % (interval * 4)) / interval) + 1;
            const x = this.timeToPixels(t);
            
            if (beat === 1) {
                html += `<div class="ruler-marker measure" style="left: ${x}px"><span>${measure}</span></div>`;
            } else {
                html += `<div class="ruler-marker beat" style="left: ${x}px"></div>`;
            }
        }
        
        this.ruler.innerHTML = html;
    }
    
    // Nettoyage
    cleanup() {
        this.stop();
        this.stopRecording();
        
        if (this.playheadAnimationId) {
            cancelAnimationFrame(this.playheadAnimationId);
        }
        
        this.tracks.forEach(track => {
            track.cleanup();
        });
        
        this.tracks = [];
        
        console.log('Timeline nettoyée');
    }
    
    // Export/Import
    toJSON() {
        return {
            bpm: this.bpm,
            timeSignature: this.timeSignature,
            zoomLevel: this.zoomLevel,
            tracks: this.tracks.map(track => track.toJSON())
        };
    }
    
    fromJSON(data) {
        this.bpm = data.bpm || 120;
        this.timeSignature = data.timeSignature || { numerator: 4, denominator: 4 };
        this.zoomLevel = data.zoomLevel || 50;
        this.pixelsPerSecond = this.zoomToPixelsPerSecond(this.zoomLevel);
        
        // Charger les pistes
        this.tracks = [];
        if (data.tracks) {
            data.tracks.forEach(trackData => {
                const track = this.createTrack(trackData.name, trackData.type);
                if (track) {
                    track.fromJSON(trackData);
                    this.addTrack(track);
                }
            });
        }
        
        this.updateDisplay();
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

// Enregistrer dans le registry CORE
if (typeof window.CORE !== 'undefined' && typeof window.CORE.registerModule === 'function') {
    window.CORE.registerModule('timeline', Timeline, getTimeline);
}
