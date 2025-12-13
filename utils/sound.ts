let audioCtx: AudioContext | null = null;

const getCtx = () => {
    if (!audioCtx) {
        audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    return audioCtx;
}

export const playSound = (type: 'start' | 'tick' | 'end' | 'urgent') => {
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
                
                startOsc.type = 'triangle'; // Softer than sine, punchier
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
                
            case 'tick':
                // Sharp, percussive woodblock sound
                const tickOsc = ctx.createOscillator();
                const tickGain = ctx.createGain();
                
                tickOsc.type = 'sine';
                tickOsc.connect(tickGain);
                tickGain.connect(ctx.destination);
                
                // High pitch short blip
                tickOsc.frequency.setValueAtTime(1000, t);
                tickOsc.frequency.exponentialRampToValueAtTime(600, t + 0.05);
                
                // Very short envelope
                tickGain.gain.setValueAtTime(0.3, t);
                tickGain.gain.exponentialRampToValueAtTime(0.001, t + 0.05);
                
                tickOsc.start(t);
                tickOsc.stop(t + 0.05);
                break;

            case 'urgent':
                // Higher pitched, metallic tick for last 10 seconds
                const urgentOsc = ctx.createOscillator();
                const urgentGain = ctx.createGain();
                
                urgentOsc.type = 'square'; // More aggressive waveform
                urgentOsc.connect(urgentGain);
                urgentGain.connect(ctx.destination);
                
                // Constant high pitch
                urgentOsc.frequency.setValueAtTime(1200, t);
                
                // Short, sharp envelope
                urgentGain.gain.setValueAtTime(0.15, t);
                urgentGain.gain.exponentialRampToValueAtTime(0.001, t + 0.05);
                
                urgentOsc.start(t);
                urgentOsc.stop(t + 0.05);
                break;
                
            case 'end':
                // Distinct "Time's Up" Buzzer
                const osc1 = ctx.createOscillator();
                const osc2 = ctx.createOscillator(); // Dissonance layer
                const endGain = ctx.createGain();
                
                osc1.type = 'sawtooth';
                osc2.type = 'square';
                
                osc1.connect(endGain);
                osc2.connect(endGain);
                endGain.connect(ctx.destination);
                
                // Descending pitch
                osc1.frequency.setValueAtTime(300, t);
                osc1.frequency.linearRampToValueAtTime(100, t + 0.8);
                
                osc2.frequency.setValueAtTime(305, t); // Slight detune for harshness
                osc2.frequency.linearRampToValueAtTime(105, t + 0.8);
                
                // Sustain envelope
                endGain.gain.setValueAtTime(0.4, t);
                endGain.gain.setValueAtTime(0.4, t + 0.6);
                endGain.gain.linearRampToValueAtTime(0.001, t + 0.8);
                
                osc1.start(t);
                osc2.start(t);
                osc1.stop(t + 0.8);
                osc2.stop(t + 0.8);
                break;
        }
    } catch (e) {
        console.error("Audio playback failed", e);
    }
}