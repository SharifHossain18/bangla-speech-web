const startBtn = document.getElementById('startBtn');
const stopBtn = document.getElementById('stopBtn');
const copyBtn = document.getElementById('copyBtn');
const clearBtn = document.getElementById('clearBtn');
const textDisplay = document.getElementById('textDisplay');
const status = document.getElementById('status');
const langSelect = document.getElementById('langSelect');

let recognition;
let isRecording = false;
let finalTranscript = '';
let lastResultIndex = 0;
let isNewSegment = false;

function initRecognition() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
        status.textContent = 'আপনার ব্রাউজার স্পিচ রেকগনিশন সাপোর্ট করে না। Chrome ব্যবহার করুন।';
        startBtn.disabled = true;
        return null;
    }

    const rec = new SpeechRecognition();
    rec.lang = langSelect.value;
    rec.continuous = true;
    rec.interimResults = true;
    rec.maxAlternatives = 3;
    lastResultIndex = 0;

    rec.onstart = () => {
        isRecording = true;
        startBtn.disabled = true;
        stopBtn.disabled = false;
        status.textContent = 'রেকর্ডিং চলছে...';
        textDisplay.classList.add('recording');
        isNewSegment = finalTranscript.length > 0;
    };

    rec.onresult = (event) => {
        let interimTranscript = '';

        for (let i = lastResultIndex; i < event.results.length; i++) {
            const result = event.results[i];
            const transcript = result[0].transcript.trim();
            
            if (result.isFinal) {
                if (finalTranscript && isNewSegment) {
                    finalTranscript += '। ';
                    isNewSegment = false;
                } else if (finalTranscript && !finalTranscript.endsWith('। ') && !finalTranscript.endsWith(' ')) {
                    finalTranscript += ' ';
                }
                finalTranscript += transcript + ' ';
            } else {
                interimTranscript += transcript;
            }
        }

        lastResultIndex = event.results.length;
        displayTranscript(finalTranscript, interimTranscript);
    };

    rec.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        
        if (event.error === 'no-speech') {
            status.textContent = 'কোন কথা শোনা যায়নি, চলতে থাকবে...';
        } else if (event.error === 'audio-capture') {
            status.textContent = 'মাইক্রোফোন অ্যাক্সেস দিন';
            stopRecording(rec);
        } else if (event.error === 'not-allowed') {
            status.textContent = 'মাইক্রোফোনের অনুমতি দিন';
            stopRecording(rec);
        } else if (event.error === 'language-not-supported') {
            status.textContent = 'এই ভাষা সাপোর্ট করে না, অন্য ভাষা বেছে নিন';
            stopRecording(rec);
        } else {
            status.textContent = 'ত্রুটি: ' + event.error;
        }
    };

    rec.onend = () => {
        if (isRecording) {
            try {
                setTimeout(() => {
                    if (isRecording && recognition === rec) {
                        rec.start();
                    }
                }, 100);
            } catch (e) {
                console.log('Recognition restart failed:', e);
                isRecording = false;
                cleanup(rec);
            }
        } else {
            cleanup(rec);
        }
    };

    return rec;
}

function displayTranscript(final, interim) {
    textDisplay.innerHTML = '';
    
    if (final) {
        const finalSpan = document.createElement('span');
        finalSpan.className = 'final-text';
        finalSpan.textContent = final;
        textDisplay.appendChild(finalSpan);
    }
    
    if (interim) {
        const interimSpan = document.createElement('span');
        interimSpan.className = 'interim-text';
        interimSpan.textContent = interim;
        textDisplay.appendChild(interimSpan);
    }
    
    if (!final && !interim) {
        const placeholder = document.createElement('span');
        placeholder.className = 'placeholder';
        placeholder.textContent = 'এখানে টেক্সট দেখা যাবে...';
        textDisplay.appendChild(placeholder);
    }

    textDisplay.scrollTop = textDisplay.scrollHeight;
}

function stopRecording(rec) {
    isRecording = false;
    if (rec) {
        rec.stop();
    }
}

function cleanup(rec) {
    isRecording = false;
    startBtn.disabled = false;
    stopBtn.disabled = true;
    status.textContent = 'রেকর্ডিং শেষ';
    textDisplay.classList.remove('recording');
    
    setTimeout(() => {
        if (!isRecording) {
            status.textContent = '';
        }
    }, 3000);
}

startBtn.addEventListener('click', () => {
    recognition = initRecognition();
    if (recognition) {
        try {
            recognition.start();
        } catch (e) {
            console.error('Failed to start recognition:', e);
            status.textContent = 'শুরু করতে ব্যর্থ, আবার চেষ্টা করুন';
        }
    }
});

stopBtn.addEventListener('click', () => {
    stopRecording(recognition);
});

copyBtn.addEventListener('click', () => {
    const text = finalTranscript.trim();
    if (text && text !== '') {
        navigator.clipboard.writeText(text).then(() => {
            const originalText = copyBtn.textContent;
            copyBtn.textContent = 'কপি হয়েছে!';
            setTimeout(() => {
                copyBtn.textContent = originalText;
            }, 2000);
        }).catch(() => {
            copyBtn.textContent = 'কপি ব্যর্থ!';
            setTimeout(() => {
                copyBtn.textContent = 'টেক্সট কপি করুন';
            }, 2000);
        });
    }
});

clearBtn.addEventListener('click', () => {
    finalTranscript = '';
    lastResultIndex = 0;
    textDisplay.innerHTML = '<span class="placeholder">এখানে টেক্সট দেখা যাবে...</span>';
    status.textContent = 'টেক্সট মুছে ফেলা হয়েছে';
    setTimeout(() => {
        if (!isRecording) {
            status.textContent = '';
        }
    }, 2000);
});

langSelect.addEventListener('change', () => {
    if (isRecording && recognition) {
        stopRecording(recognition);
        setTimeout(() => {
            startBtn.click();
        }, 500);
    }
});
