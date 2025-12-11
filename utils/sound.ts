let audioCtx: AudioContext | null = null;

const getCtx = () => {
    if (!audioCtx) {
        audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    return audioCtx;
}

export const playSound = (type: 'start' | 'tick' | 'end') => {
    try {
        const ctx = getCtx();
        // Ensure context is running (browsers suspend it until user interaction)
        if (ctx.state === 'suspended') {
            ctx.resume().catch(e => console.error(e));
        }
        
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        
        const t = ctx.currentTime;
        
        switch (type) {
            case 'start':
                // Ascending chime
                osc.type = 'sine';
                osc.frequency.setValueAtTime(500, t);
                osc.frequency.exponentialRampToValueAtTime(1000, t + 0.1);
                osc.frequency.setValueAtTime(1000, t + 0.1);
                osc.frequency.exponentialRampToValueAtTime(1500, t + 0.2);
                
                gain.gain.setValueAtTime(0.1, t);
                gain.gain.linearRampToValueAtTime(0.1, t + 0.2);
                gain.gain.exponentialRampToValueAtTime(0.001, t + 0.5);
                
                osc.start(t);
                osc.stop(t + 0.5);
                break;
                
            case 'tick':
                // Short, sharp woodblock-like sound
                osc.type = 'sine';
                osc.frequency.setValueAtTime(800, t);
                gain.gain.setValueAtTime(0.1, t);
                gain.gain.exponentialRampToValueAtTime(0.001, t + 0.05);
                
                osc.start(t);
                osc.stop(t + 0.05);
                break;
                
            case 'end':
                // Alarm / Buzzer
                osc.type = 'sawtooth';
                osc.frequency.setValueAtTime(440, t);
                osc.frequency.linearRampToValueAtTime(220, t + 0.3);
                
                // Add a second oscillator for dissonance
                const osc2 = ctx.createOscillator();
                const gain2 = ctx.createGain();
                osc2.type = 'square';
                osc2.connect(gain2);
                gain2.connect(ctx.destination);
                osc2.frequency.setValueAtTime(450, t); // Slight detune
                osc2.frequency.linearRampToValueAtTime(225, t + 0.3);
                
                gain.gain.setValueAtTime(0.2, t);
                gain.gain.linearRampToValueAtTime(0.001, t + 0.6);
                
                gain2.gain.setValueAtTime(0.1, t);
                gain2.gain.linearRampToValueAtTime(0.001, t + 0.6);
                
                osc.start(t);
                osc.stop(t + 0.6);
                osc2.start(t);
                osc2.stop(t + 0.6);
                break;
        }
    } catch (e) {
        console.error("Audio playback failed", e);
    }
}
