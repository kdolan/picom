const Readable = require('stream').Readable;
const bufferAlloc = require('buffer-alloc');

function generateTone({freq=440.0, durationSec=1}) {
    console.log('generating a %dhz sine wave for %d seconds', freq, durationSec);

    // A SineWaveGenerator readable stream
    const sine = new Readable();
    sine.bitDepth = 16;
    sine.channels = 2;
    sine.sampleRate = 44100;
    sine.samplesGenerated = 0;
    sine._read = _generateReadFunction({freq, durationSec});

    return sine;
}

function _generateReadFunction({freq, durationSec}) {
// the Readable "_read()" callback function
    const read = function (n) {
        const sampleSize = this.bitDepth / 8;
        const blockAlign = sampleSize * this.channels;
        const numSamples = n / blockAlign | 0;
        const buf = bufferAlloc(numSamples * blockAlign);
        const amplitude = 32760; // Max amplitude for 16-bit audio

        // the "angle" used in the function, adjusted for the number of
        // channels and sample rate. This value is like the period of the wave.
        const t = (Math.PI * 2 * freq) / this.sampleRate;

        for (let i = 0; i < numSamples; i++) {
            // fill with a simple sine wave at max amplitude
            for (let channel = 0; channel < this.channels; channel++) {
                const s = this.samplesGenerated + i;
                const val = Math.round(amplitude * Math.sin(t * s)) ;// sine wave
                const offset = (i * sampleSize * this.channels) + (channel * sampleSize);
                buf[`writeInt${this.bitDepth}LE`](val, offset);
            }
        }

        this.push(buf);

        this.samplesGenerated += numSamples;
        if (this.samplesGenerated >= this.sampleRate * durationSec) {
            // after generating "duration" second of audio, emit "end"
            this.push(null);
        }
    };
    return read;
}

module.exports.generateTone = generateTone;