let audioCtx: AudioContext | null = null;

const getCtx = () => {
    if (!audioCtx) {
        audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    return audioCtx;
}

export type SoundType = 'start' | 'heartbeat' | 'urgent' | 'end' | 'all-in' | 'profit' | 'loss';

export const playSound = (type: SoundType) => {
    try {
        const ctx = getCtx();
        // Ensure context is running (browsers suspend it until user interaction)
        if (ctx.state === 'suspended') {
            ctx.resume().catch(e => console.error(e));
        }
        
        const t = ctx.currentTime;
        
        switch (type) {
            case 'start':
                // Ascending positive chime (Game Start)
                const startOsc = ctx.createOscillator();
                const startGain = ctx.createGain();
                
                startOsc.type = 'triangle'; 
                startOsc.connect(startGain);
                startGain.connect(ctx.destination);
                
                // Frequency sweep
                startOsc.frequency.setValueAtTime(400, t);
                startOsc.frequency.exponentialRampToValueAtTime(800, t + 0.1);
                startOsc.frequency.setValueAtTime(800, t + 0.1);
                startOsc.frequency.exponentialRampToValueAtTime(1200, t + 0.3);

                // Envelope
                startGain.gain.setValueAtTime(0, t);
                startGain.gain.linearRampToValueAtTime(0.3, t + 0.05);
                startGain.gain.exponentialRampToValueAtTime(0.001, t + 0.5);
                
                startOsc.start(t);
                startOsc.stop(t + 0.5);
                break;
                
            case 'heartbeat':
                // Low, rhythmic thud (Cardiogram style)
                const beatOsc = ctx.createOscillator();
                const beatGain = ctx.createGain();
                
                beatOsc.type = 'sine';
                beatOsc.connect(beatGain);
                beatGain.connect(ctx.destination);
                
                // Low frequency kick
                beatOsc.frequency.setValueAtTime(150, t);
                beatOsc.frequency.exponentialRampToValueAtTime(0.001, t + 0.1);
                
                // Percussive envelope
                beatGain.gain.setValueAtTime(0.5, t);
                beatGain.gain.exponentialRampToValueAtTime(0.001, t + 0.1);
                
                beatOsc.start(t);
                beatOsc.stop(t + 0.1);
                break;

            case 'urgent':
                // Higher pitched double-beat (Alarm/High HR)
                const urgentOsc = ctx.createOscillator();
                const urgentGain = ctx.createGain();
                
                urgentOsc.type = 'triangle';
                urgentOsc.connect(urgentGain);
                urgentGain.connect(ctx.destination);
                
                // Double blip pattern
                urgentOsc.frequency.setValueAtTime(800, t);
                urgentGain.gain.setValueAtTime(0.2, t);
                urgentGain.gain.exponentialRampToValueAtTime(0.001, t + 0.05);
                
                // Second blip
                urgentOsc.frequency.setValueAtTime(800, t + 0.1);
                urgentGain.gain.setValueAtTime(0.2, t + 0.1);
                urgentGain.gain.exponentialRampToValueAtTime(0.001, t + 0.15);
                
                urgentOsc.start(t);
                urgentOsc.stop(t + 0.2);
                break;
                
            case 'all-in':
                // Mechanical "Locking" Sound + Power Up
                const lockOsc = ctx.createOscillator();
                const lockGain = ctx.createGain();
                const noiseBuffer = ctx.createBuffer(1, ctx.sampleRate * 0.1, ctx.sampleRate);
                const output = noiseBuffer.getChannelData(0);
                for (let i = 0; i < noiseBuffer.length; i++) {
                    output[i] = Math.random() * 2 - 1;
                }
                const noiseSrc = ctx.createBufferSource();
                noiseSrc.buffer = noiseBuffer;
                const noiseGain = ctx.createGain();

                lockOsc.type = 'square';
                lockOsc.connect(lockGain);
                lockGain.connect(ctx.destination);
                noiseSrc.connect(noiseGain);
                noiseGain.connect(ctx.destination);

                // Metallic clank (Square wave + noise burst)
                lockOsc.frequency.setValueAtTime(220, t);
                lockOsc.frequency.exponentialRampToValueAtTime(880, t + 0.05);
                
                lockGain.gain.setValueAtTime(0.2, t);
                lockGain.gain.exponentialRampToValueAtTime(0.001, t + 0.1);

                noiseGain.gain.setValueAtTime(0.3, t);
                noiseGain.gain.exponentialRampToValueAtTime(0.001, t + 0.05);

                lockOsc.start(t);
                lockOsc.stop(t + 0.1);
                noiseSrc.start(t);
                noiseSrc.stop(t + 0.1);
                break;

            case 'profit':
                // "Cha-Ching" (Cash Register)
                // Arpeggio of high sines
                const freqs = [1000, 1500, 2000, 2500]; // Rough register chime
                freqs.forEach((f, i) => {
                    const osc = ctx.createOscillator();
                    const g = ctx.createGain();
                    osc.type = 'sine';
                    osc.connect(g);
                    g.connect(ctx.destination);
                    
                    const startTime = t + (i * 0.04);
                    osc.frequency.setValueAtTime(f, startTime);
                    g.gain.setValueAtTime(0.2, startTime);
                    g.gain.exponentialRampToValueAtTime(0.001, startTime + 0.4);
                    
                    osc.start(startTime);
                    osc.stop(startTime + 0.4);
                });
                break;

            case 'loss':
                // "Thud" / Power Down
                const thudOsc = ctx.createOscillator();
                const thudGain = ctx.createGain();
                
                thudOsc.type = 'sawtooth';
                thudOsc.connect(thudGain);
                thudGain.connect(ctx.destination);
                
                // Deep descending tone
                thudOsc.frequency.setValueAtTime(100, t);
                thudOsc.frequency.exponentialRampToValueAtTime(10, t + 0.4);
                
                thudGain.gain.setValueAtTime(0.4, t);
                thudGain.gain.exponentialRampToValueAtTime(0.001, t + 0.4);
                
                thudOsc.start(t);
                thudOsc.stop(t + 0.5);
                break;

            case 'end':
                // Generic buzzer
                const endOsc = ctx.createOscillator();
                const endGain = ctx.createGain();
                endOsc.type = 'sawtooth';
                endOsc.connect(endGain);
                endGain.connect(ctx.destination);
                
                endOsc.frequency.setValueAtTime(150, t);
                endOsc.frequency.linearRampToValueAtTime(50, t + 0.5);
                
                endGain.gain.setValueAtTime(0.3, t);
                endGain.gain.linearRampToValueAtTime(0.001, t + 0.5);
                
                endOsc.start(t);
                endOsc.stop(t + 0.5);
                break;
        }
    } catch (e) {
        console.error("Audio playback failed", e);
    }
}