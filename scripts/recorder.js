// Enregistreur audio pour Studio DAW

class Recorder {
    constructor() {
        this.mediaRecorder = null;
        this.audioChunks = [];
        this.isRecording = false;
        this.isPaused = false;
        this.startTime = 0;
        this.pausedTime = 0;
        this.totalRecordedTime = 0;
        this.stream = null;
        this.audioContext = null;
        this.sourceNode = null;
        this.processor = null;
        
        // Paramètres
        this.mimeType = CONFIG.recording.mimeType;
        this.bitRate = CONFIG.recording.bitRate;
        this.sampleRate = CONFIG.recording.sampleRate;
        this.channels = CONFIG.recording.channels;
        
        // Callbacks
        this.onStart = null;
        this.onStop = null;
        this.onPause = null;
        this.onResume = null;
        this.onDataAvailable = null;
        this.onError = null;
        
        // Initialisation
        this.init();
    }
    
    async init() {
        try {
            // Vérifier la prise en charge
            if (!isSupported('getUserMedia')) {
                throw new Error('MediaDevices API non supportée');
            }
            
            if (!isSupported('mediaRecorder')) {
                throw new Error('MediaRecorder API non supportée');
            }
            
            // Obtenir le contexte audio
            const audioEngine = getAudioEngine();
            if (audioEngine && audioEngine.audioContext) {
                this.audioContext = audioEngine.audioContext;
            }
            
            console.log('Enregistreur initialisé');
            
        } catch (error) {
            console.error('Erreur lors de l\'initialisation de l\'enregistreur:', error);
            showError('Erreur d\'initialisation de l\'enregistreur: ' + error.message);
        }
    }
    
    async start(track = null) {
        if (this.isRecording) {
            console.warn('Enregistrement déjà en cours');
            return false;
        }
        
        try {
            // Demander l'accès au microphone
            this.stream = await navigator.mediaDevices.getUserMedia({
                audio: {
                    sampleRate: this.sampleRate,
                    channelCount: this.channels,
                    echoCancellation: false,
                    noiseSuppression: false,
                    autoGainControl: false
                },
                video: false
            });
            
            // Créer le MediaRecorder
            this.mediaRecorder = new MediaRecorder(this.stream, {
                mimeType: this.mimeType,
                audioBitsPerSecond: this.bitRate * 1000
            });
            
            // Configurer les événements
            this.mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    this.audioChunks.push(event.data);
                    if (this.onDataAvailable) {
                        this.onDataAvailable(event.data);
                    }
                }
            };
            
            this.mediaRecorder.onstop = () => {
                this.isRecording = false;
                this.isPaused = false;
                if (this.onStop) {
                    this.onStop(this.getRecordedData());
                }
            };
            
            this.mediaRecorder.onpause = () => {
                this.isPaused = true;
                this.pausedTime = Date.now();
                if (this.onPause) {
                    this.onPause();
                }
            };
            
            this.mediaRecorder.onresume = () => {
                this.isPaused = false;
                const pauseDuration = Date.now() - this.pausedTime;
                this.totalRecordedTime += pauseDuration;
                if (this.onResume) {
                    this.onResume();
                }
            };
            
            this.mediaRecorder.onerror = (error) => {
                console.error('Erreur MediaRecorder:', error);
                if (this.onError) {
                    this.onError(error);
                }
            };
            
            // Créer le nœud source pour le monitoring
            if (this.audioContext) {
                this.sourceNode = this.audioContext.createMediaStreamSource(this.stream);
                
                // Connecter au track si spécifié
                if (track && track.audioNode) {
                    this.sourceNode.connect(track.audioNode);
                }
            }
            
            // Démarrer l'enregistrement
            this.audioChunks = [];
            this.startTime = Date.now();
            this.totalRecordedTime = 0;
            this.isRecording = true;
            this.isPaused = false;
            
            this.mediaRecorder.start();
            
            if (this.onStart) {
                this.onStart();
            }
            
            console.log('Enregistrement démarré');
            showToast('Enregistrement démarré!', 'success');
            
            return true;
            
        } catch (error) {
            console.error('Erreur lors du démarrage de l\'enregistrement:', error);
            showError('Erreur de microphone: ' + error.message);
            
            // Nettoyer
            if (this.stream) {
                this.stream.getTracks().forEach(track => track.stop());
                this.stream = null;
            }
            
            return false;
        }
    }
    
    pause() {
        if (!this.isRecording || this.isPaused) return;
        
        if (this.mediaRecorder) {
            this.mediaRecorder.pause();
        }
    }
    
    resume() {
        if (!this.isRecording || !this.isPaused) return;
        
        if (this.mediaRecorder) {
            this.mediaRecorder.resume();
        }
    }
    
    stop() {
        if (!this.isRecording) return;
        
        if (this.mediaRecorder) {
            this.mediaRecorder.stop();
        }
        
        // Arrêter le stream
        if (this.stream) {
            this.stream.getTracks().forEach(track => track.stop());
            this.stream = null;
        }
        
        // Nettoyer le nœud source
        if (this.sourceNode) {
            this.sourceNode.disconnect();
            this.sourceNode = null;
        }
        
        console.log('Enregistrement arrêté');
        showToast('Enregistrement arrêté!', 'info');
    }
    
    getRecordedData() {
        if (this.audioChunks.length === 0) return null;
        
        return new Blob(this.audioChunks, { type: this.mimeType });
    }
    
    async getAudioBuffer() {
        const blob = this.getRecordedData();
        if (!blob) return null;
        
        const audioEngine = getAudioEngine();
        if (!audioEngine || !audioEngine.audioContext) return null;
        
        const arrayBuffer = await blob.arrayBuffer();
        return audioEngine.audioContext.decodeAudioData(arrayBuffer);
    }
    
    getRecordedTime() {
        if (!this.isRecording) {
            return this.totalRecordedTime / 1000;
        }
        
        const currentTime = Date.now();
        const recordedTime = (currentTime - this.startTime - this.totalRecordedTime) / 1000;
        return recordedTime + (this.totalRecordedTime / 1000);
    }
    
    isRecordingActive() {
        return this.isRecording && !this.isPaused;
    }
    
    // Méthodes pour l'enregistrement MIDI
    startMidiRecording(track = null) {
        if (this.isRecording) return;
        
        this.isRecording = true;
        this.startTime = Date.now();
        this.midiNotes = [];
        this.midiEvents = [];
        
        // Écouter les événements MIDI
        const midiManager = getMidiManager();
        if (midiManager) {
            this.midiListener = midiManager.addListener('message', (event) => {
                this.handleMidiEvent(event);
            });
        }
        
        if (this.onStart) {
            this.onStart();
        }
        
        console.log('Enregistrement MIDI démarré');
        showToast('Enregistrement MIDI démarré!', 'success');
    }
    
    stopMidiRecording() {
        if (!this.isRecording) return;
        
        this.isRecording = false;
        
        // Arrêter d'écouter les événements MIDI
        if (this.midiListener) {
            this.midiListener();
            this.midiListener = null;
        }
        
        if (this.onStop) {
            this.onStop(this.getMidiData());
        }
        
        console.log('Enregistrement MIDI arrêté');
        showToast('Enregistrement MIDI arrêté!', 'info');
    }
    
    handleMidiEvent(event) {
        const timestamp = Date.now() - this.startTime;
        
        this.midiEvents.push({
            type: event.type,
            data1: event.data1,
            data2: event.data2,
            channel: event.channel,
            timestamp
        });
        
        // Gérer spécifiquement les notes
        if (event.type === 0x09) { // Note On
            this.midiNotes.push({
                note: event.data1,
                velocity: event.data2,
                time: timestamp / 1000,
                type: 'noteOn'
            });
        } else if (event.type === 0x08) { // Note Off
            const noteOnIndex = this.midiNotes.findIndex(n => 
                n.note === event.data1 && n.type === 'noteOn' && !n.noteOff
            );
            
            if (noteOnIndex !== -1) {
                const note = this.midiNotes[noteOnIndex];
                note.duration = (timestamp - note.time) / 1000;
                note.noteOff = true;
                note.type = 'note';
                note.velocityOff = event.data2;
            }
        }
    }
    
    getMidiData() {
        return {
            events: this.midiEvents,
            notes: this.midiNotes.filter(n => n.type === 'note'),
            duration: this.getRecordedTime()
        };
    }
    
    // Export
    async exportToWAV() {
        const buffer = await this.getAudioBuffer();
        if (!buffer) return null;
        
        return audioBufferToWav(buffer);
    }
    
    async exportToMP3() {
        const buffer = await this.getAudioBuffer();
        if (!buffer) return null;
        
        return audioBufferToMp3(buffer);
    }
    
    // Nettoyage
    cleanup() {
        this.stop();
        
        // Nettoyer le MediaRecorder
        if (this.mediaRecorder) {
            this.mediaRecorder.ondataavailable = null;
            this.mediaRecorder.onstop = null;
            this.mediaRecorder.onpause = null;
            this.mediaRecorder.onresume = null;
            this.mediaRecorder.onerror = null;
            this.mediaRecorder = null;
        }
        
        // Nettoyer le stream
        if (this.stream) {
            this.stream.getTracks().forEach(track => track.stop());
            this.stream = null;
        }
        
        // Nettoyer le nœud source
        if (this.sourceNode) {
            this.sourceNode.disconnect();
            this.sourceNode = null;
        }
        
        // Réinitialiser les variables
        this.audioChunks = [];
        this.isRecording = false;
        this.isPaused = false;
        this.startTime = 0;
        this.pausedTime = 0;
        this.totalRecordedTime = 0;
        this.midiNotes = [];
        this.midiEvents = [];
        
        // Nettoyer les écouteurs
        if (this.midiListener) {
            this.midiListener();
            this.midiListener = null;
        }
        
        console.log('Enregistreur nettoyé');
    }
}

// Singleton de l'enregistreur
let recorderInstance = null;

function getRecorder() {
    if (!recorderInstance) {
        recorderInstance = new Recorder();
    }
    return recorderInstance;
}

// Exporter pour les autres modules
window.Recorder = Recorder;
window.getRecorder = getRecorder;
