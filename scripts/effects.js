// Effets audio pour Studio DAW

class EffectsManager {
    constructor() {
        this.effects = new Map();
        this.audioContext = null;
        
        // Types d'effets supportés
        this.supportedEffects = [
            'reverb',
            'delay',
            'compressor',
            'eq',
            'distortion',
            'limiter',
            'chorus',
            'phaser',
            'flanger',
            'tremolo'
        ];
        
        // Initialisation
        this.init();
    }
    
    init() {
        const audioEngine = getAudioEngine();
        if (audioEngine && audioEngine.audioContext) {
            this.audioContext = audioEngine.audioContext;
        }
        
        // Créer les effets par défaut
        this.createDefaultEffects();
        
        console.log('Gestionnaire d\'effets initialisé');
    }
    
    createDefaultEffects() {
        // Réverbération
        this.effects.set('reverb', this.createReverb());
        
        // Delay
        this.effects.set('delay', this.createDelay());
        
        // Compresseur
        this.effects.set('compressor', this.createCompressor());
        
        // Égaliseur
        this.effects.set('eq', this.createEQ());
        
        // Distorsion
        this.effects.set('distortion', this.createDistortion());
        
        // Limiteur
        this.effects.set('limiter', this.createLimiter());
        
        // Chorus
        this.effects.set('chorus', this.createChorus());
        
        // Phaser
        this.effects.set('phaser', this.createPhaser());
        
        // Flanger
        this.effects.set('flanger', this.createFlanger());
        
        // Tremolo
        this.effects.set('tremolo', this.createTremolo());
    }
    
    getEffect(name) {
        return this.effects.get(name);
    }
    
    hasEffect(name) {
        return this.effects.has(name);
    }
    
    addEffect(name, effect) {
        this.effects.set(name, effect);
    }
    
    removeEffect(name) {
        const effect = this.effects.get(name);
        if (effect) {
            this.effects.delete(name);
            if (effect.cleanup) {
                effect.cleanup();
            }
            return true;
        }
        return false;
    }
    
    createEffectChain(effectNames) {
        if (!this.audioContext) return null;
        
        const input = this.audioContext.createGain();
        const output = this.audioContext.createGain();
        
        let currentNode = input;
        
        effectNames.forEach(effectName => {
            const effect = this.getEffect(effectName);
            if (effect) {
                currentNode.connect(effect.input);
                currentNode = effect.output;
            }
        });
        
        currentNode.connect(output);
        
        return {
            input,
            output,
            effects: effectNames.map(name => this.getEffect(name))
        };
    }
    
    // Création des effets individuels
    createReverb(settings = {}) {
        if (!this.audioContext) return null;
        
        const convolver = this.audioContext.createConvolver();
        const gain = this.audioContext.createGain();
        const dry = this.audioContext.createGain();
        const wet = this.audioContext.createGain();
        const merger = this.audioContext.createChannelMerger(2);
        
        // Paramètres par défaut
        const decay = settings.decay || 3;
        const wetLevel = settings.wet || 0.3;
        const dryLevel = settings.dry !== undefined ? settings.dry : 1 - wetLevel;
        
        // Créer un impulse response pour la réverb
        const sampleRate = this.audioContext.sampleRate;
        const duration = decay;
        const length = Math.floor(sampleRate * duration);
        const impulse = this.audioContext.createBuffer(2, length, sampleRate);
        
        const left = impulse.getChannelData(0);
        const right = impulse.getChannelData(1);
        
        for (let i = 0; i < length; i++) {
            const n = length - i;
            const value = (Math.random() * 2 - 1) * Math.pow(n / length, 2);
            left[i] = value * 0.5;
            right[i] = value * 0.3;
        }
        
        convolver.buffer = impulse;
        gain.gain.value = wetLevel;
        dry.gain.value = dryLevel;
        
        // Connexion
        convolver.connect(gain);
        gain.connect(wet);
        wet.connect(merger, 0, 0);
        wet.connect(merger, 0, 1);
        
        return {
            id: 'reverb',
            name: 'Réverbération',
            type: 'reverb',
            input: convolver,
            output: merger,
            dry: dry,
            wet: wet,
            convolver: convolver,
            gain: gain,
            settings: { decay, wet: wetLevel, dry: dryLevel },
            setDecay: (decayTime) => {
                settings.decay = decayTime;
                // Recreate impulse response with new decay
                const newLength = Math.floor(this.audioContext.sampleRate * decayTime);
                const newImpulse = this.audioContext.createBuffer(2, newLength, this.audioContext.sampleRate);
                const newLeft = newImpulse.getChannelData(0);
                const newRight = newImpulse.getChannelData(1);
                
                for (let i = 0; i < newLength; i++) {
                    const n = newLength - i;
                    const value = (Math.random() * 2 - 1) * Math.pow(n / newLength, 2);
                    newLeft[i] = value * 0.5;
                    newRight[i] = value * 0.3;
                }
                
                convolver.buffer = newImpulse;
            },
            setWet: (wetLevel) => {
                settings.wet = wetLevel;
                gain.gain.value = wetLevel;
                dry.gain.value = 1 - wetLevel;
            },
            setDry: (dryLevel) => {
                settings.dry = dryLevel;
                dry.gain.value = dryLevel;
                gain.gain.value = 1 - dryLevel;
            },
            cleanup: () => {
                // Déconnecter les nœuds
                convolver.disconnect();
                gain.disconnect();
                dry.disconnect();
                wet.disconnect();
                merger.disconnect();
            }
        };
    }
    
    createDelay(settings = {}) {
        if (!this.audioContext) return null;
        
        const delay = this.audioContext.createDelay();
        const feedback = this.audioContext.createGain();
        const wet = this.audioContext.createGain();
        const dry = this.audioContext.createGain();
        const merger = this.audioContext.createChannelMerger(2);
        
        // Paramètres par défaut
        const delayTime = settings.delayTime || 0.5;
        const feedbackLevel = settings.feedback || 0.5;
        const wetLevel = settings.wet || 0.3;
        const dryLevel = settings.dry !== undefined ? settings.dry : 1 - wetLevel;
        
        // Configurer les valeurs
        delay.delayTime.value = delayTime;
        feedback.gain.value = feedbackLevel;
        wet.gain.value = wetLevel;
        dry.gain.value = dryLevel;
        
        // Connexion du feedback
        delay.connect(feedback);
        feedback.connect(delay);
        
        // Connexion principale
        delay.connect(wet);
        wet.connect(merger, 0, 0);
        wet.connect(merger, 0, 1);
        
        return {
            id: 'delay',
            name: 'Delay',
            type: 'delay',
            input: delay,
            output: merger,
            dry: dry,
            wet: wet,
            delay: delay,
            feedback: feedback,
            settings: { delayTime, feedback: feedbackLevel, wet: wetLevel, dry: dryLevel },
            setDelayTime: (time) => {
                settings.delayTime = time;
                delay.delayTime.value = time;
            },
            setFeedback: (feedbackLevel) => {
                settings.feedback = feedbackLevel;
                feedback.gain.value = feedbackLevel;
            },
            setWet: (wetLevel) => {
                settings.wet = wetLevel;
                wet.gain.value = wetLevel;
                dry.gain.value = 1 - wetLevel;
            },
            setDry: (dryLevel) => {
                settings.dry = dryLevel;
                dry.gain.value = dryLevel;
                wet.gain.value = 1 - dryLevel;
            },
            cleanup: () => {
                delay.disconnect();
                feedback.disconnect();
                wet.disconnect();
                dry.disconnect();
                merger.disconnect();
            }
        };
    }
    
    createCompressor(settings = {}) {
        if (!this.audioContext) return null;
        
        const compressor = this.audioContext.createDynamicsCompressor();
        
        // Paramètres par défaut
        const threshold = settings.threshold || -24;
        const knee = settings.knee || 30;
        const ratio = settings.ratio || 4;
        const attack = settings.attack || 0.003;
        const release = settings.release || 0.25;
        
        // Configurer les valeurs
        compressor.threshold.value = threshold;
        compressor.knee.value = knee;
        compressor.ratio.value = ratio;
        compressor.attack.value = attack;
        compressor.release.value = release;
        
        return {
            id: 'compressor',
            name: 'Compresseur',
            type: 'compressor',
            input: compressor,
            output: compressor,
            compressor: compressor,
            settings: { threshold, knee, ratio, attack, release },
            setThreshold: (threshold) => {
                settings.threshold = threshold;
                compressor.threshold.value = threshold;
            },
            setKnee: (knee) => {
                settings.knee = knee;
                compressor.knee.value = knee;
            },
            setRatio: (ratio) => {
                settings.ratio = ratio;
                compressor.ratio.value = ratio;
            },
            setAttack: (attack) => {
                settings.attack = attack;
                compressor.attack.value = attack;
            },
            setRelease: (release) => {
                settings.release = release;
                compressor.release.value = release;
            },
            cleanup: () => {
                compressor.disconnect();
            }
        };
    }
    
    createEQ(settings = {}) {
        if (!this.audioContext) return null;
        
        const input = this.audioContext.createGain();
        const output = this.audioContext.createGain();
        
        // Filtres pour l'EQ 3 bandes
        const lowFilter = createLowPassFilter(this.audioContext, 200);
        const midFilter = createBandPassFilter(this.audioContext, 1000, 1);
        const highFilter = createHighPassFilter(this.audioContext, 2000);
        
        const lowGain = this.audioContext.createGain();
        const midGain = this.audioContext.createGain();
        const highGain = this.audioContext.createGain();
        
        const merger = this.audioContext.createChannelMerger(2);
        const splitter = this.audioContext.createChannelSplitter(2);
        
        // Paramètres par défaut
        const lowGainValue = settings.low || 0;
        const midGainValue = settings.mid || 0;
        const highGainValue = settings.high || 0;
        
        // Configurer les gains
        lowGain.gain.value = dbToGain(lowGainValue);
        midGain.gain.value = dbToGain(midGainValue);
        highGain.gain.value = dbToGain(highGainValue);
        
        // Connexion
        input.connect(splitter);
        
        splitter.connect(lowFilter, 0);
        splitter.connect(lowFilter, 1);
        lowFilter.connect(lowGain);
        
        splitter.connect(midFilter, 0);
        splitter.connect(midFilter, 1);
        midFilter.connect(midGain);
        
        splitter.connect(highFilter, 0);
        splitter.connect(highFilter, 1);
        highFilter.connect(highGain);
        
        lowGain.connect(merger, 0, 0);
        lowGain.connect(merger, 0, 1);
        midGain.connect(merger, 0, 0);
        midGain.connect(merger, 0, 1);
        highGain.connect(merger, 0, 0);
        highGain.connect(merger, 0, 1);
        
        merger.connect(output);
        
        return {
            id: 'eq',
            name: 'Égaliseur',
            type: 'eq',
            input: input,
            output: output,
            lowGain: lowGain,
            midGain: midGain,
            highGain: highGain,
            settings: { low: lowGainValue, mid: midGainValue, high: highGainValue },
            setLowGain: (gain) => {
                settings.low = gain;
                lowGain.gain.value = dbToGain(gain);
            },
            setMidGain: (gain) => {
                settings.mid = gain;
                midGain.gain.value = dbToGain(gain);
            },
            setHighGain: (gain) => {
                settings.high = gain;
                highGain.gain.value = dbToGain(gain);
            },
            cleanup: () => {
                input.disconnect();
                output.disconnect();
                lowFilter.disconnect();
                midFilter.disconnect();
                highFilter.disconnect();
                lowGain.disconnect();
                midGain.disconnect();
                highGain.disconnect();
                merger.disconnect();
                splitter.disconnect();
            }
        };
    }
    
    createDistortion(settings = {}) {
        if (!this.audioContext) return null;
        
        const waveShaper = this.audioContext.createWaveShaper();
        const gain = this.audioContext.createGain();
        
        // Paramètres par défaut
        const amount = settings.amount || 0.5;
        const outputGain = settings.outputGain !== undefined ? settings.outputGain : 0.5;
        
        // Courbe de distorsion
        const curve = new Float32Array(1024);
        for (let i = 0; i < curve.length; i++) {
            const x = (i / curve.length) * 2 - 1;
            curve[i] = (x < 0 ? -1 : 1) * Math.min(1, Math.abs(x) * (1 + amount * 10));
        }
        
        waveShaper.curve = curve;
        gain.gain.value = outputGain;
        
        // Connexion
        waveShaper.connect(gain);
        
        return {
            id: 'distortion',
            name: 'Distorsion',
            type: 'distortion',
            input: waveShaper,
            output: gain,
            waveShaper: waveShaper,
            gain: gain,
            curve: curve,
            settings: { amount, outputGain },
            setAmount: (amt) => {
                settings.amount = clamp(amt, 0, 1);
                for (let i = 0; i < curve.length; i++) {
                    const x = (i / curve.length) * 2 - 1;
                    curve[i] = (x < 0 ? -1 : 1) * Math.min(1, Math.abs(x) * (1 + settings.amount * 10));
                }
                waveShaper.curve = curve;
            },
            setOutputGain: (gainValue) => {
                settings.outputGain = clamp(gainValue, 0, 1);
                gain.gain.value = gainValue;
            },
            cleanup: () => {
                waveShaper.disconnect();
                gain.disconnect();
            }
        };
    }
    
    createLimiter(settings = {}) {
        if (!this.audioContext) return null;
        
        const limiter = this.audioContext.createDynamicsCompressor();
        
        // Paramètres par défaut
        const threshold = settings.threshold || -0.1;
        const knee = settings.knee || 0;
        const ratio = settings.ratio || 20;
        const attack = settings.attack || 0.001;
        const release = settings.release || 0.01;
        
        // Configurer les valeurs
        limiter.threshold.value = threshold;
        limiter.knee.value = knee;
        limiter.ratio.value = ratio;
        limiter.attack.value = attack;
        limiter.release.value = release;
        
        return {
            id: 'limiter',
            name: 'Limiteur',
            type: 'limiter',
            input: limiter,
            output: limiter,
            limiter: limiter,
            settings: { threshold, knee, ratio, attack, release },
            setThreshold: (threshold) => {
                settings.threshold = threshold;
                limiter.threshold.value = threshold;
            },
            setKnee: (knee) => {
                settings.knee = knee;
                limiter.knee.value = knee;
            },
            setRatio: (ratio) => {
                settings.ratio = ratio;
                limiter.ratio.value = ratio;
            },
            setAttack: (attack) => {
                settings.attack = attack;
                limiter.attack.value = attack;
            },
            setRelease: (release) => {
                settings.release = release;
                limiter.release.value = release;
            },
            cleanup: () => {
                limiter.disconnect();
            }
        };
    }
    
    createChorus(settings = {}) {
        if (!this.audioContext) return null;
        
        const input = this.audioContext.createGain();
        const output = this.audioContext.createGain();
        
        // Paramètres par défaut
        const rate = settings.rate || 0.5;
        const depth = settings.depth || 0.002;
        const feedback = settings.feedback || 0.3;
        const wet = settings.wet || 0.3;
        const dry = settings.dry !== undefined ? settings.dry : 1 - wet;
        
        // Créer l'effet chorus avec des oscillateurs LFO
        const lfo1 = this.audioContext.createOscillator();
        const lfo2 = this.audioContext.createOscillator();
        const delay1 = this.audioContext.createDelay();
        const delay2 = this.audioContext.createDelay();
        const gain1 = this.audioContext.createGain();
        const gain2 = this.audioContext.createGain();
        const wetGain = this.audioContext.createGain();
        const dryGain = this.audioContext.createGain();
        const merger = this.audioContext.createChannelMerger(2);
        
        // Configurer les LFO
        lfo1.type = 'sine';
        lfo1.frequency.value = rate;
        lfo2.type = 'sine';
        lfo2.frequency.value = rate * 1.5;
        
        // Configurer les gains
        gain1.gain.value = depth * 0.5;
        gain2.gain.value = depth * 0.5;
        wetGain.gain.value = wet;
        dryGain.gain.value = dry;
        
        // Connexion des LFO aux délais
        lfo1.connect(gain1);
        gain1.connect(delay1.delayTime);
        lfo2.connect(gain2);
        gain2.connect(delay2.delayTime);
        
        // Connexion des délais
        input.connect(delay1);
        input.connect(delay2);
        delay1.connect(wetGain);
        delay2.connect(wetGain);
        input.connect(dryGain);
        
        wetGain.connect(merger, 0, 0);
        wetGain.connect(merger, 0, 1);
        dryGain.connect(merger, 0, 0);
        dryGain.connect(merger, 0, 1);
        
        merger.connect(output);
        
        // Démarrer les LFO
        lfo1.start();
        lfo2.start();
        
        return {
            id: 'chorus',
            name: 'Chorus',
            type: 'chorus',
            input: input,
            output: output,
            settings: { rate, depth, feedback, wet, dry },
            setRate: (rate) => {
                settings.rate = rate;
                lfo1.frequency.value = rate;
                lfo2.frequency.value = rate * 1.5;
            },
            setDepth: (depth) => {
                settings.depth = depth;
                gain1.gain.value = depth * 0.5;
                gain2.gain.value = depth * 0.5;
            },
            setFeedback: (feedback) => {
                settings.feedback = feedback;
            },
            setWet: (wet) => {
                settings.wet = wet;
                wetGain.gain.value = wet;
                dryGain.gain.value = 1 - wet;
            },
            setDry: (dry) => {
                settings.dry = dry;
                dryGain.gain.value = dry;
                wetGain.gain.value = 1 - dry;
            },
            cleanup: () => {
                input.disconnect();
                output.disconnect();
                lfo1.stop();
                lfo2.stop();
                delay1.disconnect();
                delay2.disconnect();
                gain1.disconnect();
                gain2.disconnect();
                wetGain.disconnect();
                dryGain.disconnect();
                merger.disconnect();
            }
        };
    }
    
    createPhaser(settings = {}) {
        if (!this.audioContext) return null;
        
        const input = this.audioContext.createGain();
        const output = this.audioContext.createGain();
        
        // Paramètres par défaut
        const rate = settings.rate || 0.5;
        const depth = settings.depth || 0.5;
        const feedback = settings.feedback || 0.3;
        const wet = settings.wet || 0.3;
        const dry = settings.dry !== undefined ? settings.dry : 1 - wet;
        
        // Créer l'effet phaser
        const lfo = this.audioContext.createOscillator();
        const allpass1 = this.audioContext.createBiquadFilter();
        const allpass2 = this.audioContext.createBiquadFilter();
        const allpass3 = this.audioContext.createBiquadFilter();
        const allpass4 = this.audioContext.createBiquadFilter();
        
        // Configurer les filtres all-pass
        allpass1.type = 'allpass';
        allpass2.type = 'allpass';
        allpass3.type = 'allpass';
        allpass4.type = 'allpass';
        
        // Configurer les fréquences des filtres
        const baseFrequency = 500;
        allpass1.frequency.value = baseFrequency * 0.5;
        allpass2.frequency.value = baseFrequency * 0.75;
        allpass3.frequency.value = baseFrequency * 1.25;
        allpass4.frequency.value = baseFrequency * 1.5;
        
        // Configurer le LFO
        lfo.type = 'sine';
        lfo.frequency.value = rate;
        
        // Connexion
        input.connect(allpass1);
        allpass1.connect(allpass2);
        allpass2.connect(allpass3);
        allpass3.connect(allpass4);
        
        // Modulation avec le LFO
        const lfoGain = this.audioContext.createGain();
        lfoGain.gain.value = depth * 1000;
        lfo.connect(lfoGain);
        lfoGain.connect(allpass1.frequency);
        lfoGain.connect(allpass2.frequency);
        lfoGain.connect(allpass3.frequency);
        lfoGain.connect(allpass4.frequency);
        
        // Mixage wet/dry
        const wetGain = this.audioContext.createGain();
        const dryGain = this.audioContext.createGain();
        const merger = this.audioContext.createChannelMerger(2);
        
        wetGain.gain.value = wet;
        dryGain.gain.value = dry;
        
        input.connect(dryGain);
        allpass4.connect(wetGain);
        
        dryGain.connect(merger, 0, 0);
        dryGain.connect(merger, 0, 1);
        wetGain.connect(merger, 0, 0);
        wetGain.connect(merger, 0, 1);
        
        merger.connect(output);
        
        // Démarrer le LFO
        lfo.start();
        
        return {
            id: 'phaser',
            name: 'Phaser',
            type: 'phaser',
            input: input,
            output: output,
            settings: { rate, depth, feedback, wet, dry },
            setRate: (rate) => {
                settings.rate = rate;
                lfo.frequency.value = rate;
            },
            setDepth: (depth) => {
                settings.depth = depth;
                lfoGain.gain.value = depth * 1000;
            },
            setFeedback: (feedback) => {
                settings.feedback = feedback;
            },
            setWet: (wet) => {
                settings.wet = wet;
                wetGain.gain.value = wet;
                dryGain.gain.value = 1 - wet;
            },
            setDry: (dry) => {
                settings.dry = dry;
                dryGain.gain.value = dry;
                wetGain.gain.value = 1 - dry;
            },
            cleanup: () => {
                input.disconnect();
                output.disconnect();
                lfo.stop();
                allpass1.disconnect();
                allpass2.disconnect();
                allpass3.disconnect();
                allpass4.disconnect();
                lfoGain.disconnect();
                wetGain.disconnect();
                dryGain.disconnect();
                merger.disconnect();
            }
        };
    }
    
    createFlanger(settings = {}) {
        if (!this.audioContext) return null;
        
        const input = this.audioContext.createGain();
        const output = this.audioContext.createGain();
        
        // Paramètres par défaut
        const rate = settings.rate || 0.1;
        const depth = settings.depth || 0.002;
        const feedback = settings.feedback || 0.3;
        const delayTime = settings.delayTime || 0.003;
        const wet = settings.wet || 0.3;
        const dry = settings.dry !== undefined ? settings.dry : 1 - wet;
        
        // Créer l'effet flanger
        const lfo = this.audioContext.createOscillator();
        const delay = this.audioContext.createDelay();
        const feedbackGain = this.audioContext.createGain();
        
        // Configurer le LFO
        lfo.type = 'sine';
        lfo.frequency.value = rate;
        
        // Configurer le délai
        delay.delayTime.value = delayTime;
        
        // Configurer le feedback
        feedbackGain.gain.value = feedback;
        
        // Connexion du feedback
        delay.connect(feedbackGain);
        feedbackGain.connect(delay);
        
        // Modulation avec le LFO
        const lfoGain = this.audioContext.createGain();
        lfoGain.gain.value = depth;
        lfo.connect(lfoGain);
        lfoGain.connect(delay.delayTime);
        
        // Mixage wet/dry
        const wetGain = this.audioContext.createGain();
        const dryGain = this.audioContext.createGain();
        const merger = this.audioContext.createChannelMerger(2);
        
        wetGain.gain.value = wet;
        dryGain.gain.value = dry;
        
        input.connect(delay);
        input.connect(dryGain);
        delay.connect(wetGain);
        
        dryGain.connect(merger, 0, 0);
        dryGain.connect(merger, 0, 1);
        wetGain.connect(merger, 0, 0);
        wetGain.connect(merger, 0, 1);
        
        merger.connect(output);
        
        // Démarrer le LFO
        lfo.start();
        
        return {
            id: 'flanger',
            name: 'Flanger',
            type: 'flanger',
            input: input,
            output: output,
            settings: { rate, depth, feedback, delayTime, wet, dry },
            setRate: (rate) => {
                settings.rate = rate;
                lfo.frequency.value = rate;
            },
            setDepth: (depth) => {
                settings.depth = depth;
                lfoGain.gain.value = depth;
            },
            setFeedback: (feedback) => {
                settings.feedback = feedback;
                feedbackGain.gain.value = feedback;
            },
            setDelayTime: (delayTime) => {
                settings.delayTime = delayTime;
                delay.delayTime.value = delayTime;
            },
            setWet: (wet) => {
                settings.wet = wet;
                wetGain.gain.value = wet;
                dryGain.gain.value = 1 - wet;
            },
            setDry: (dry) => {
                settings.dry = dry;
                dryGain.gain.value = dry;
                wetGain.gain.value = 1 - dry;
            },
            cleanup: () => {
                input.disconnect();
                output.disconnect();
                lfo.stop();
                delay.disconnect();
                feedbackGain.disconnect();
                lfoGain.disconnect();
                wetGain.disconnect();
                dryGain.disconnect();
                merger.disconnect();
            }
        };
    }
    
    createTremolo(settings = {}) {
        if (!this.audioContext) return null;
        
        const input = this.audioContext.createGain();
        const output = this.audioContext.createGain();
        
        // Paramètres par défaut
        const rate = settings.rate || 5;
        const depth = settings.depth || 0.5;
        
        // Créer l'effet tremolo
        const lfo = this.audioContext.createOscillator();
        const lfoGain = this.audioContext.createGain();
        const volumeGain = this.audioContext.createGain();
        
        // Configurer le LFO
        lfo.type = 'sine';
        lfo.frequency.value = rate;
        
        // Configurer le gain du LFO
        lfoGain.gain.value = depth * 0.5;
        
        // Configurer le gain de volume
        volumeGain.gain.value = 1 - depth * 0.5;
        
        // Connexion
        input.connect(volumeGain);
        lfo.connect(lfoGain);
        lfoGain.connect(volumeGain.gain);
        volumeGain.connect(output);
        
        // Démarrer le LFO
        lfo.start();
        
        return {
            id: 'tremolo',
            name: 'Tremolo',
            type: 'tremolo',
            input: input,
            output: output,
            settings: { rate, depth },
            setRate: (rate) => {
                settings.rate = rate;
                lfo.frequency.value = rate;
            },
            setDepth: (depth) => {
                settings.depth = depth;
                lfoGain.gain.value = depth * 0.5;
                volumeGain.gain.value = 1 - depth * 0.5;
            },
            cleanup: () => {
                input.disconnect();
                output.disconnect();
                lfo.stop();
                lfoGain.disconnect();
                volumeGain.disconnect();
            }
        };
    }
    
    // Nettoyage
    cleanup() {
        // Nettoyer tous les effets
        this.effects.forEach(effect => {
            if (effect.cleanup) {
                effect.cleanup();
            }
        });
        
        this.effects.clear();
        this.audioContext = null;
        
        console.log('Gestionnaire d\'effets nettoyé');
    }
}

// Singleton du gestionnaire d'effets
let effectsManagerInstance = null;

function getEffectsManager() {
    if (!effectsManagerInstance) {
        effectsManagerInstance = new EffectsManager();
    }
    return effectsManagerInstance;
}

// Exporter pour les autres modules
window.EffectsManager = EffectsManager;
window.getEffectsManager = getEffectsManager;
window._effectsManagerInstance = effectsManagerInstance;
