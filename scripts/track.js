// Classe Track pour Studio DAW

class Track {
    constructor(options = {}) {
        // ID unique
        this.id = options.id || generateId('track-');
        
        // Nom de la piste
        this.name = options.name || `Piste ${APP_STATE.tracks.length + 1}`;
        
        // Type de piste
        this.type = options.type || 'audio'; // 'audio', 'midi', 'drum', 'instrument'
        
        // Couleur de la piste
        this.color = options.color || stringToColor(this.id);
        
        // Volume (0-1)
        this.volume = options.volume !== undefined ? options.volume : 1;
        
        // Panoramique (-1 à 1)
        this.pan = options.pan !== undefined ? options.pan : 0;
        
        // État de la piste
        this.muted = options.muted || false;
        this.soloed = options.soloed || false;
        this.armored = options.armored || false; // Prête pour l'enregistrement
        this.visible = options.visible !== undefined ? options.visible : true;
        
        // Nœud audio
        this.audioNode = null;
        this.gainNode = null;
        this.panNode = null;
        this.meterNode = null;
        
        // Effets
        this.effects = options.effects || [];
        this.effectChain = null;
        
        // Instrument (pour les pistes MIDI/instrument)
        this.instrument = options.instrument || null;
        
        // Clips
        this.clips = options.clips || [];
        
        // Paramètres d'enregistrement
        this.inputSource = options.inputSource || null;
        this.recording = false;
        
        // Hauteur de la piste
        this.height = options.height || CONFIG.timeline.trackHeight;
        
        // Index de la piste
        this.index = options.index || APP_STATE.tracks.length;
        
        // Initialisation
        this.init();
    }
    
    init() {
        const audioEngine = getAudioEngine();
        if (!audioEngine || !audioEngine.audioContext) {
            console.warn('Contexte audio non disponible pour la piste');
            return;
        }
        
        // Créer les nœuds audio
        this.createAudioNodes(audioEngine.audioContext);
        
        // Initialiser les clips
        this.clips.forEach(clip => {
            clip.track = this;
            clip.init(audioEngine.audioContext);
        });
        
        console.log(`Piste ${this.name} initialisée`);
    }
    
    createAudioNodes(audioContext) {
        // Créer le nœud de gain principal
        this.gainNode = audioContext.createGain();
        this.gainNode.gain.value = this.volume;
        
        // Créer le nœud de panoramique
        this.panNode = audioContext.createStereoPanner();
        this.panNode.pan.value = this.pan;
        
        // Créer l'analyseur de niveau
        this.meterNode = audioContext.createAnalyser();
        this.meterNode.fftSize = 256;
        this.meterNode.smoothingTimeConstant = 0.8;
        
        // Connecter les nœuds
        this.gainNode.connect(this.panNode);
        this.panNode.connect(this.meterNode);
        
        // Connecter au nœud de sortie du moteur audio
        this.meterNode.connect(audioEngine.masterGain);
        
        // Stocker le nœud audio principal
        this.audioNode = this.gainNode;
    }
    
    // Gestion des clips
    addClip(clip) {
        clip.track = this;
        clip.index = this.clips.length;
        this.clips.push(clip);
        
        // Initialiser le clip
        const audioEngine = getAudioEngine();
        if (audioEngine && audioEngine.audioContext) {
            clip.init(audioEngine.audioContext);
        }
        
        return clip;
    }
    
    removeClip(clipId) {
        const index = this.clips.findIndex(clip => clip.id === clipId);
        if (index !== -1) {
            const clip = this.clips[index];
            clip.cleanup();
            this.clips.splice(index, 1);
            
            // Mettre à jour les index des clips suivants
            for (let i = index; i < this.clips.length; i++) {
                this.clips[i].index = i;
            }
            
            return true;
        }
        return false;
    }
    
    getClip(clipId) {
        return this.clips.find(clip => clip.id === clipId);
    }
    
    getClipsAtTime(time) {
        return this.clips.filter(clip => {
            return time >= clip.startTime && time < clip.startTime + clip.duration;
        });
    }
    
    getClipsInRange(startTime, endTime) {
        return this.clips.filter(clip => {
            return clip.startTime + clip.duration > startTime &&
                   clip.startTime < endTime;
        });
    }
    
    // Lecture
    play(time = 0) {
        if (this.muted || !this.visible) return;
        
        // Si une autre piste est en solo, ne pas jouer cette piste
        const soloedTrack = APP_STATE.tracks.find(t => t.soloed);
        if (soloedTrack && soloedTrack.id !== this.id) return;
        
        // Jouer tous les clips qui commencent avant ou à ce temps
        this.clips.forEach(clip => {
            if (clip.startTime <= time && clip.startTime + clip.duration > time) {
                clip.play(time - clip.startTime);
            }
        });
    }
    
    stop() {
        this.clips.forEach(clip => {
            clip.stop();
        });
    }
    
    // Enregistrement
    startRecording() {
        if (this.recording) return;
        
        this.recording = true;
        this.recordingStartTime = Date.now();
        
        console.log(`Enregistrement démarré sur la piste ${this.name}`);
    }
    
    stopRecording() {
        if (!this.recording) return;
        
        this.recording = false;
        
        console.log(`Enregistrement arrêté sur la piste ${this.name}`);
    }
    
    // Gestion des effets
    addEffect(effect) {
        this.effects.push(effect);
        this.rebuildEffectChain();
        return effect;
    }
    
    removeEffect(effectId) {
        const index = this.effects.findIndex(e => e.id === effectId);
        if (index !== -1) {
            this.effects.splice(index, 1);
            this.rebuildEffectChain();
            return true;
        }
        return false;
    }
    
    rebuildEffectChain() {
        if (!this.gainNode) return;
        
        // Déconnecter tout
        this.gainNode.disconnect();
        
        // Reconnecter avec les effets
        let currentNode = this.gainNode;
        
        this.effects.forEach(effect => {
            currentNode.connect(effect.input);
            currentNode = effect.output;
        });
        
        // Connecter au panoramique
        currentNode.connect(this.panNode);
    }
    
    // Paramètres
    setVolume(volume) {
        this.volume = clamp(volume, 0, 1);
        if (this.gainNode) {
            this.gainNode.gain.value = this.volume;
        }
    }
    
    setPan(pan) {
        this.pan = clamp(pan, -1, 1);
        if (this.panNode) {
            this.panNode.pan.value = this.pan;
        }
    }
    
    setMuted(muted) {
        this.muted = muted;
    }
    
    setSoloed(soloed) {
        this.soloed = soloed;
    }
    
    setArmor(armored) {
        this.armored = armored;
    }
    
    setVisible(visible) {
        this.visible = visible;
    }
    
    setColor(color) {
        this.color = color;
    }
    
    setName(name) {
        this.name = name;
    }
    
    setInstrument(instrument) {
        this.instrument = instrument;
        this.type = 'instrument';
    }
    
    setHeight(height) {
        this.height = clamp(height, CONFIG.timeline.minTrackHeight, CONFIG.timeline.maxTrackHeight);
    }
    
    // Niveau audio
    getLevel() {
        if (!this.meterNode) return 0;
        
        const bufferLength = this.meterNode.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);
        this.meterNode.getByteTimeDomainData(dataArray);
        
        let sum = 0;
        for (let i = 0; i < bufferLength; i++) {
            sum += Math.abs(dataArray[i] - 128);
        }
        
        const average = sum / bufferLength;
        return average / 128;
    }
    
    getPeak() {
        if (!this.meterNode) return 0;
        
        const bufferLength = this.meterNode.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);
        this.meterNode.getByteTimeDomainData(dataArray);
        
        let max = 0;
        for (let i = 0; i < bufferLength; i++) {
            const value = Math.abs(dataArray[i] - 128);
            if (value > max) max = value;
        }
        
        return max / 128;
    }
    
    // Sérialisation
    toJSON() {
        return {
            id: this.id,
            name: this.name,
            type: this.type,
            color: this.color,
            volume: this.volume,
            pan: this.pan,
            muted: this.muted,
            soloed: this.soloed,
            armored: this.armored,
            visible: this.visible,
            instrument: this.instrument,
            height: this.height,
            effects: this.effects.map(effect => effect.toJSON ? effect.toJSON() : effect),
            clips: this.clips.map(clip => clip.toJSON ? clip.toJSON() : clip)
        };
    }
    
    static fromJSON(data) {
        const track = new Track({
            id: data.id,
            name: data.name,
            type: data.type,
            color: data.color,
            volume: data.volume,
            pan: data.pan,
            muted: data.muted,
            soloed: data.soloed,
            armored: data.armored,
            visible: data.visible,
            instrument: data.instrument,
            height: data.height
        });
        
        // Charger les effets
        if (data.effects) {
            data.effects.forEach(effectData => {
                // À implémenter: chargement des effets
            });
        }
        
        // Charger les clips
        if (data.clips) {
            data.clips.forEach(clipData => {
                let clip;
                switch (track.type) {
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
                track.addClip(clip);
            });
        }
        
        return track;
    }
    
    // Nettoyage
    cleanup() {
        this.stop();
        
        // Nettoyer les clips
        this.clips.forEach(clip => {
            clip.cleanup();
        });
        this.clips = [];
        
        // Nettoyer les nœuds audio
        if (this.gainNode) {
            this.gainNode.disconnect();
            this.gainNode = null;
        }
        
        if (this.panNode) {
            this.panNode.disconnect();
            this.panNode = null;
        }
        
        if (this.meterNode) {
            this.meterNode.disconnect();
            this.meterNode = null;
        }
        
        this.audioNode = null;
        
        // Nettoyer les effets
        this.effects.forEach(effect => {
            if (effect.cleanup) {
                effect.cleanup();
            }
        });
        this.effects = [];
        
        console.log(`Piste ${this.name} nettoyée`);
    }
}

// Classe AudioClip
class AudioClip {
    constructor(options = {}) {
        this.id = options.id || generateId('clip-');
        this.track = options.track || null;
        this.startTime = options.startTime || 0;
        this.duration = options.duration || 0;
        this.name = options.name || 'Clip audio';
        this.color = options.color || stringToColor(this.id);
        this.volume = options.volume !== undefined ? options.volume : 1;
        this.pan = options.pan !== undefined ? options.pan : 0;
        this.muted = options.muted || false;
        this.loop = options.loop || false;
        this.playbackRate = options.playbackRate || 1;
        
        // Buffer audio
        this.buffer = options.buffer || null;
        this.bufferId = options.bufferId || null;
        
        // Source audio
        this.source = null;
        this.gainNode = null;
        this.panNode = null;
        
        // État
        this.isPlaying = false;
        this.startOffset = 0;
        
        // Index dans la piste
        this.index = options.index || 0;
        
        // Initialisation
        this.init();
    }
    
    init(audioContext) {
        const audioEngine = getAudioEngine();
        if (!audioEngine) {
            console.warn('Moteur audio non disponible pour le clip');
            return;
        }
        
        audioContext = audioContext || audioEngine.audioContext;
        
        // Créer les nœuds audio
        this.gainNode = audioContext.createGain();
        this.gainNode.gain.value = this.volume;
        
        this.panNode = audioContext.createStereoPanner();
        this.panNode.pan.value = this.pan;
        
        // Connecter au track
        if (this.track && this.track.audioNode) {
            this.gainNode.connect(this.panNode);
            this.panNode.connect(this.track.audioNode);
        }
    }
    
    play(offset = 0) {
        if (!this.buffer || !this.track || !this.track.audioNode) return;
        
        const audioEngine = getAudioEngine();
        if (!audioEngine) return;
        
        // Arrêter la lecture actuelle
        this.stop();
        
        // Créer la source
        this.source = audioEngine.audioContext.createBufferSource();
        this.source.buffer = this.buffer;
        this.source.playbackRate.value = this.playbackRate;
        this.source.loop = this.loop;
        
        // Connecter les nœuds
        this.source.connect(this.gainNode);
        
        // Calculer l'offset de départ
        const startTime = audioEngine.audioContext.currentTime;
        this.startOffset = offset;
        
        // Démarrer la lecture
        this.source.start(startTime, offset);
        this.isPlaying = true;
        
        // Gérer la fin de la lecture
        this.source.onended = () => {
            this.isPlaying = false;
            this.source = null;
        };
    }
    
    stop() {
        if (this.source) {
            this.source.stop();
            this.source.onended = null;
            this.source = null;
        }
        this.isPlaying = false;
    }
    
    setBuffer(buffer) {
        this.buffer = buffer;
        if (this.source) {
            this.source.buffer = buffer;
        }
        this.duration = buffer ? buffer.duration : 0;
    }
    
    setStartTime(time) {
        this.startTime = time;
    }
    
    setDuration(duration) {
        this.duration = duration;
    }
    
    setVolume(volume) {
        this.volume = clamp(volume, 0, 1);
        if (this.gainNode) {
            this.gainNode.gain.value = this.volume;
        }
    }
    
    setPan(pan) {
        this.pan = clamp(pan, -1, 1);
        if (this.panNode) {
            this.panNode.pan.value = this.pan;
        }
    }
    
    setMuted(muted) {
        this.muted = muted;
        if (this.gainNode) {
            this.gainNode.gain.value = muted ? 0 : this.volume;
        }
    }
    
    setPlaybackRate(rate) {
        this.playbackRate = clamp(rate, 0.1, 4);
        if (this.source) {
            this.source.playbackRate.value = this.playbackRate;
        }
    }
    
    setLoop(loop) {
        this.loop = loop;
        if (this.source) {
            this.source.loop = loop;
        }
    }
    
    splitAt(time) {
        if (!this.buffer || time <= 0 || time >= this.duration) return null;
        
        const audioEngine = getAudioEngine();
        if (!audioEngine) return null;
        
        // Créer un nouveau buffer pour la partie découpée
        const sampleRate = this.buffer.sampleRate;
        const originalLength = this.buffer.length;
        const splitSample = Math.floor(time * sampleRate);
        const newLength = originalLength - splitSample;
        
        const newBuffer = audioEngine.audioContext.createBuffer(
            this.buffer.numberOfChannels,
            newLength,
            sampleRate
        );
        
        // Copier les données
        for (let channel = 0; channel < this.buffer.numberOfChannels; channel++) {
            const originalData = this.buffer.getChannelData(channel);
            const newData = newBuffer.getChannelData(channel);
            
            for (let i = 0; i < newLength; i++) {
                newData[i] = originalData[splitSample + i];
            }
        }
        
        // Créer le nouveau clip
        const newClip = new AudioClip({
            name: `${this.name} (partie)`,
            buffer: newBuffer,
            duration: newLength / sampleRate,
            startTime: this.startTime + time,
            volume: this.volume,
            pan: this.pan
        });
        
        // Mettre à jour le clip original
        this.duration = time;
        
        // Créer un nouveau buffer pour le clip original
        const originalBuffer = audioEngine.audioContext.createBuffer(
            this.buffer.numberOfChannels,
            splitSample,
            sampleRate
        );
        
        for (let channel = 0; channel < this.buffer.numberOfChannels; channel++) {
            const originalData = this.buffer.getChannelData(channel);
            const newData = originalBuffer.getChannelData(channel);
            
            for (let i = 0; i < splitSample; i++) {
                newData[i] = originalData[i];
            }
        }
        
        this.buffer = originalBuffer;
        
        return newClip;
    }
    
    toJSON() {
        return {
            id: this.id,
            type: 'audio',
            startTime: this.startTime,
            duration: this.duration,
            name: this.name,
            color: this.color,
            volume: this.volume,
            pan: this.pan,
            muted: this.muted,
            loop: this.loop,
            playbackRate: this.playbackRate,
            bufferId: this.bufferId
        };
    }
    
    static fromJSON(data) {
        return new AudioClip({
            id: data.id,
            startTime: data.startTime,
            duration: data.duration,
            name: data.name,
            color: data.color,
            volume: data.volume,
            pan: data.pan,
            muted: data.muted,
            loop: data.loop,
            playbackRate: data.playbackRate,
            bufferId: data.bufferId
        });
    }
    
    cleanup() {
        this.stop();
        
        if (this.gainNode) {
            this.gainNode.disconnect();
            this.gainNode = null;
        }
        
        if (this.panNode) {
            this.panNode.disconnect();
            this.panNode = null;
        }
        
        this.source = null;
        this.buffer = null;
    }
}

// Classe MidiClip
class MidiClip {
    constructor(options = {}) {
        this.id = options.id || generateId('clip-');
        this.track = options.track || null;
        this.startTime = options.startTime || 0;
        this.duration = options.duration || 0;
        this.name = options.name || 'Clip MIDI';
        this.color = options.color || stringToColor(this.id);
        this.volume = options.volume !== undefined ? options.volume : 1;
        this.pan = options.pan !== undefined ? options.pan : 0;
        this.muted = options.muted || false;
        this.loop = options.loop || false;
        
        // Notes MIDI
        this.notes = options.notes || [];
        
        // Instrument
        this.instrument = options.instrument || null;
        
        // Source MIDI
        this.source = null;
        this.gainNode = null;
        this.panNode = null;
        
        // État
        this.isPlaying = false;
        this.startTimeInClip = 0;
        
        // Index dans la piste
        this.index = options.index || 0;
        
        // Initialisation
        this.init();
    }
    
    init(audioContext) {
        const audioEngine = getAudioEngine();
        if (!audioEngine) {
            console.warn('Moteur audio non disponible pour le clip MIDI');
            return;
        }
        
        audioContext = audioContext || audioEngine.audioContext;
        
        // Créer les nœuds audio
        this.gainNode = audioContext.createGain();
        this.gainNode.gain.value = this.volume;
        
        this.panNode = audioContext.createStereoPanner();
        this.panNode.pan.value = this.pan;
        
        // Connecter au track
        if (this.track && this.track.audioNode) {
            this.gainNode.connect(this.panNode);
            this.panNode.connect(this.track.audioNode);
        }
    }
    
    play(offset = 0) {
        if (!this.notes.length || !this.track || !this.track.audioNode) return;
        
        const audioEngine = getAudioEngine();
        if (!audioEngine) return;
        
        // Arrêter la lecture actuelle
        this.stop();
        
        // Déterminer l'instrument à utiliser
        const instrument = this.instrument || this.track.instrument || 'piano';
        const synth = audioEngine.synths[instrument];
        
        if (!synth) {
            console.warn(`Instrument ${instrument} non trouvé`);
            return;
        }
        
        this.isPlaying = true;
        this.startTimeInClip = offset;
        
        // Planifier les notes
        const now = audioEngine.audioContext.currentTime;
        const startTime = now + (offset / 1000);
        
        this.notes.forEach(note => {
            const noteStart = note.time + this.startTime;
            const noteDuration = note.duration;
            
            if (noteStart + noteDuration > this.startTime + offset &&
                noteStart < this.startTime + this.duration + offset) {
                
                const noteStartTime = startTime + (noteStart - this.startTime - offset) / 1000;
                const noteEndTime = noteStartTime + (noteDuration / 1000);
                
                // Jouer la note
                const voice = synth.play(
                    note.pitch,
                    note.velocity,
                    note.instrument || instrument
                );
                
                // Arrêter la note à la fin
                if (voice && voice.stop) {
                    setTimeout(() => {
                        voice.stop();
                    }, (noteDuration - (offset * 1000)));
                }
            }
        });
        
        // Gérer la fin de la lecture
        setTimeout(() => {
            this.isPlaying = false;
        }, (this.duration - offset) * 1000);
    }
    
    stop() {
        this.isPlaying = false;
    }
    
    addNote(note) {
        this.notes.push(note);
        this.updateDuration();
    }
    
    removeNote(noteId) {
        const index = this.notes.findIndex(n => n.id === noteId);
        if (index !== -1) {
            this.notes.splice(index, 1);
            this.updateDuration();
            return true;
        }
        return false;
    }
    
    updateDuration() {
        if (!this.notes.length) {
            this.duration = 0;
            return;
        }
        
        const lastNote = this.notes.reduce((latest, note) => {
            return note.time + note.duration > latest.time + latest.duration ? note : latest;
        });
        
        this.duration = lastNote.time + lastNote.duration;
    }
    
    setStartTime(time) {
        this.startTime = time;
    }
    
    setVolume(volume) {
        this.volume = clamp(volume, 0, 1);
        if (this.gainNode) {
            this.gainNode.gain.value = this.volume;
        }
    }
    
    setPan(pan) {
        this.pan = clamp(pan, -1, 1);
        if (this.panNode) {
            this.panNode.pan.value = this.pan;
        }
    }
    
    setMuted(muted) {
        this.muted = muted;
        if (this.gainNode) {
            this.gainNode.gain.value = muted ? 0 : this.volume;
        }
    }
    
    setLoop(loop) {
        this.loop = loop;
    }
    
    setInstrument(instrument) {
        this.instrument = instrument;
    }
    
    toJSON() {
        return {
            id: this.id,
            type: 'midi',
            startTime: this.startTime,
            duration: this.duration,
            name: this.name,
            color: this.color,
            volume: this.volume,
            pan: this.pan,
            muted: this.muted,
            loop: this.loop,
            instrument: this.instrument,
            notes: this.notes
        };
    }
    
    static fromJSON(data) {
        const clip = new MidiClip({
            id: data.id,
            startTime: data.startTime,
            duration: data.duration,
            name: data.name,
            color: data.color,
            volume: data.volume,
            pan: data.pan,
            muted: data.muted,
            loop: data.loop,
            instrument: data.instrument,
            notes: data.notes || []
        });
        
        return clip;
    }
    
    cleanup() {
        this.stop();
        
        if (this.gainNode) {
            this.gainNode.disconnect();
            this.gainNode = null;
        }
        
        if (this.panNode) {
            this.panNode.disconnect();
            this.panNode = null;
        }
        
        this.source = null;
    }
}

// Classe DrumClip
class DrumClip {
    constructor(options = {}) {
        this.id = options.id || generateId('clip-');
        this.track = options.track || null;
        this.startTime = options.startTime || 0;
        this.duration = options.duration || 0;
        this.name = options.name || 'Clip batterie';
        this.color = options.color || stringToColor(this.id);
        this.volume = options.volume !== undefined ? options.volume : 1;
        this.pan = options.pan !== undefined ? options.pan : 0;
        this.muted = options.muted || false;
        this.loop = options.loop || false;
        
        // Pattern de batterie
        this.pattern = options.pattern || [];
        this.patternLength = options.patternLength || 16;
        this.stepDuration = options.stepDuration || 0.25; // en secondes
        
        // Source
        this.source = null;
        this.gainNode = null;
        this.panNode = null;
        
        // État
        this.isPlaying = false;
        this.currentStep = 0;
        
        // Index dans la piste
        this.index = options.index || 0;
        
        // Initialisation
        this.init();
    }
    
    init(audioContext) {
        const audioEngine = getAudioEngine();
        if (!audioEngine) {
            console.warn('Moteur audio non disponible pour le clip batterie');
            return;
        }
        
        audioContext = audioContext || audioEngine.audioContext;
        
        // Créer les nœuds audio
        this.gainNode = audioContext.createGain();
        this.gainNode.gain.value = this.volume;
        
        this.panNode = audioContext.createStereoPanner();
        this.panNode.pan.value = this.pan;
        
        // Connecter au track
        if (this.track && this.track.audioNode) {
            this.gainNode.connect(this.panNode);
            this.panNode.connect(this.track.audioNode);
        }
    }
    
    play(offset = 0) {
        if (!this.pattern.length || !this.track || !this.track.audioNode) return;
        
        const audioEngine = getAudioEngine();
        if (!audioEngine) return;
        
        // Arrêter la lecture actuelle
        this.stop();
        
        this.isPlaying = true;
        this.currentStep = Math.floor(offset / this.stepDuration);
        
        // Calculer le temps de départ
        const startTime = audioEngine.audioContext.currentTime;
        const firstStepTime = startTime + (this.stepDuration - (offset % this.stepDuration));
        
        // Planifier les étapes
        this.scheduleSteps(firstStepTime, startTime + (this.duration / 1000));
    }
    
    scheduleSteps(startTime, endTime) {
        const audioEngine = getAudioEngine();
        if (!audioEngine) return;
        
        const now = audioEngine.audioContext.currentTime;
        
        for (let step = this.currentStep; step < this.patternLength; step++) {
            const stepTime = startTime + (step - this.currentStep) * this.stepDuration;
            
            if (stepTime > endTime) break;
            
            // Vérifier s'il y a des sons à cette étape
            const sounds = this.pattern[step];
            if (sounds && sounds.length > 0) {
                sounds.forEach(sound => {
                    // Planifier le son
                    setTimeout(() => {
                        if (this.isPlaying) {
                            audioEngine.playDrumSound(sound);
                        }
                    }, (stepTime - now) * 1000);
                });
            }
        }
        
        // Planifier la boucle si nécessaire
        if (this.loop && this.duration > 0) {
            const loopDuration = this.patternLength * this.stepDuration * 1000;
            setTimeout(() => {
                if (this.isPlaying) {
                    this.currentStep = 0;
                    this.scheduleSteps(audioEngine.audioContext.currentTime, Infinity);
                }
            }, loopDuration);
        } else {
            // Arrêter à la fin
            setTimeout(() => {
                this.isPlaying = false;
            }, (endTime - now) * 1000);
        }
    }
    
    stop() {
        this.isPlaying = false;
    }
    
    setPattern(pattern, length = 16) {
        this.pattern = pattern;
        this.patternLength = length;
        this.updateDuration();
    }
    
    setStepDuration(duration) {
        this.stepDuration = duration;
        this.updateDuration();
    }
    
    setSoundAtStep(step, sound) {
        if (step < 0 || step >= this.patternLength) return;
        
        if (!this.pattern[step]) {
            this.pattern[step] = [];
        }
        
        if (!this.pattern[step].includes(sound)) {
            this.pattern[step].push(sound);
        }
        
        this.updateDuration();
    }
    
    removeSoundAtStep(step, sound) {
        if (step < 0 || step >= this.patternLength) return;
        
        if (this.pattern[step]) {
            const index = this.pattern[step].indexOf(sound);
            if (index !== -1) {
                this.pattern[step].splice(index, 1);
            }
        }
        
        this.updateDuration();
    }
    
    clearStep(step) {
        if (step < 0 || step >= this.patternLength) return;
        this.pattern[step] = [];
        this.updateDuration();
    }
    
    clearPattern() {
        this.pattern = [];
        for (let i = 0; i < this.patternLength; i++) {
            this.pattern[i] = [];
        }
        this.updateDuration();
    }
    
    updateDuration() {
        this.duration = this.patternLength * this.stepDuration * 1000;
    }
    
    setStartTime(time) {
        this.startTime = time;
    }
    
    setVolume(volume) {
        this.volume = clamp(volume, 0, 1);
        if (this.gainNode) {
            this.gainNode.gain.value = this.volume;
        }
    }
    
    setPan(pan) {
        this.pan = clamp(pan, -1, 1);
        if (this.panNode) {
            this.panNode.pan.value = this.pan;
        }
    }
    
    setMuted(muted) {
        this.muted = muted;
        if (this.gainNode) {
            this.gainNode.gain.value = muted ? 0 : this.volume;
        }
    }
    
    setLoop(loop) {
        this.loop = loop;
    }
    
    toJSON() {
        return {
            id: this.id,
            type: 'drum',
            startTime: this.startTime,
            duration: this.duration,
            name: this.name,
            color: this.color,
            volume: this.volume,
            pan: this.pan,
            muted: this.muted,
            loop: this.loop,
            pattern: this.pattern,
            patternLength: this.patternLength,
            stepDuration: this.stepDuration
        };
    }
    
    static fromJSON(data) {
        return new DrumClip({
            id: data.id,
            startTime: data.startTime,
            duration: data.duration,
            name: data.name,
            color: data.color,
            volume: data.volume,
            pan: data.pan,
            muted: data.muted,
            loop: data.loop,
            pattern: data.pattern || [],
            patternLength: data.patternLength || 16,
            stepDuration: data.stepDuration || 0.25
        });
    }
    
    cleanup() {
        this.stop();
        
        if (this.gainNode) {
            this.gainNode.disconnect();
            this.gainNode = null;
        }
        
        if (this.panNode) {
            this.panNode.disconnect();
            this.panNode = null;
        }
        
        this.source = null;
    }
}

// Exporter les classes
window.Track = Track;
window.AudioClip = AudioClip;
window.MidiClip = MidiClip;
window.DrumClip = DrumClip;
