const startBtn = document.getElementById('startBtn');
const stopBtn = document.getElementById('stopBtn');
const copyBtn = document.getElementById('copyBtn');
const textDisplay = document.getElementById('textDisplay');
const status = document.getElementById('status');

let recognition;
let isRecording = false;

// Initialize speech recognition
function initRecognition() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
        status.textContent = 'আপনার ব্রাউজার স্পিচ রেকগনিশন সাপোর্ট করে না। Chrome ব্যবহার করুন।';
        startBtn.disabled = true;
        return null;
    }

    const rec = new SpeechRecognition();
    rec.lang = 'bn-BD'; // Bengali (Bangladesh), also supports 'bn-IN' for India
    rec.continuous = true;
    rec.interimResults = true;
    rec.maxAlternatives = 1;

    rec.onstart = () => {
        isRecording = true;
        startBtn.disabled = true;
        stopBtn.disabled = false;
        status.textContent = 'রেকর্ডিং চলছে...';
        textDisplay.style.borderColor = '#27ae60';
    };

    rec.onresult = (event) => {
        let transcript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
            transcript += event.results[i][0].transcript;
        }
        textDisplay.textContent = transcript;
    };

    rec.onerror = (event) => {
        if (event.error === 'no-speech') {
            status.textContent = 'কোন কথা শোনা যায়নি, আবার চেষ্টা করুন';
        } else if (event.error === 'audio-capture') {
            status.textContent = 'মাইক্রোফোন অ্যাক্সেস দিন';
        } else if (event.error === 'not-allowed') {
            status.textContent = 'মাইক্রোফোনের অনুমতি দিন';
        } else {
            status.textContent = 'ত্রুটি: ' + event.error;
        }
    };

    rec.onend = () => {
        if (isRecording) {
            rec.start(); // Restart if still recording
        } else {
            startBtn.disabled = false;
            stopBtn.disabled = true;
            status.textContent = 'রেকর্ডিং শেষ';
            textDisplay.style.borderColor = '#e0e0e0';
        }
    };

    return rec;
}

startBtn.addEventListener('click', () => {
    recognition = initRecognition();
    if (recognition) {
        recognition.start();
    }
});

stopBtn.addEventListener('click', () => {
    isRecording = false;
    if (recognition) {
        recognition.stop();
    }
});

copyBtn.addEventListener('click', () => {
    const text = textDisplay.textContent;
    if (text && text !== 'এখানে টেক্সট দেখা যাবে...') {
        navigator.clipboard.writeText(text).then(() => {
            const originalText = copyBtn.textContent;
            copyBtn.textContent = 'কপি হয়েছে!';
            setTimeout(() => {
                copyBtn.textContent = originalText;
            }, 2000);
        });
    }
});
