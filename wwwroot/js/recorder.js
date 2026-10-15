// Suvidha Centre - Camera & Video Feedback Recording Module
document.addEventListener('DOMContentLoaded', () => {
    const container = document.getElementById('recordingContainer');
    if (!container) return; // Only execute on the recording page

    const videoPreview = document.getElementById('videoPreview');
    const startBtn = document.getElementById('startBtn');
    const stopBtn = document.getElementById('stopBtn');
    const submitBtn = document.getElementById('submitBtn');
    const retakeBtn = document.getElementById('retakeBtn');
    const postRecordControls = document.getElementById('postRecordControls');
    const timerText = document.getElementById('timerText');
    const timerBadge = document.getElementById('timerBadge');
    const statusText = document.getElementById('statusText');
    const recBadge = document.getElementById('recBadge');
    const guidanceOverlay = document.getElementById('guidanceOverlay');
    const uploadStatusBox = document.getElementById('uploadStatusBox');

    const userName = container.dataset.name || '';
    const userPhone = container.dataset.phone || '';
    const centreLocation = container.dataset.location || '';
    const facilityType = container.dataset.facility || '';

    let mediaRecorder = null;
    let recordedChunks = [];
    let stream = null;
    let countdownInterval = null;
    let timeLeft = 30;
    const MAX_DURATION = 30; // maximum 30 seconds
    let recordedBlob = null;

    // 1. Initialize camera and microphone
    async function initCamera() {
        try {
            statusText.textContent = 'Requesting camera & microphone access...';
            
            // Prefer user/front camera on mobile
            const constraints = {
                video: {
                    facingMode: 'user',
                    width: { ideal: 1280 },
                    height: { ideal: 720 }
                },
                audio: true
            };

            stream = await navigator.mediaDevices.getUserMedia(constraints);
            videoPreview.srcObject = stream;
            videoPreview.controls = false;
            videoPreview.muted = true; // prevent audio feedback loop during live preview
            await videoPreview.play();

            startBtn.disabled = false;
            statusText.textContent = 'Camera is ready. Tap Start Recording (Max 30s).';
            if (guidanceOverlay) {
                guidanceOverlay.textContent = 'Ready! Tap Start Recording. You can stop anytime.';
            }
        } catch (err) {
            console.error('Camera initialization error:', err);
            statusText.textContent = 'Camera access was denied or is unavailable. Please grant camera permission in your browser.';
            if (guidanceOverlay) {
                guidanceOverlay.textContent = 'Camera permission required.';
            }
        }
    }

    // 2. Start recording
    function startRecording() {
        if (!stream) return;

        recordedChunks = [];
        recordedBlob = null;
        timeLeft = MAX_DURATION;
        updateTimerDisplay();

        // Determine supported MIME type
        let options = { mimeType: 'video/webm' };
        if (MediaRecorder.isTypeSupported('video/webm;codecs=vp9,opus')) {
            options = { mimeType: 'video/webm;codecs=vp9,opus' };
        } else if (MediaRecorder.isTypeSupported('video/webm;codecs=vp8,opus')) {
            options = { mimeType: 'video/webm;codecs=vp8,opus' };
        } else if (MediaRecorder.isTypeSupported('video/mp4')) {
            options = { mimeType: 'video/mp4' };
        }

        try {
            mediaRecorder = new MediaRecorder(stream, options);
        } catch (e) {
            console.warn('Fallback to default MediaRecorder options', e);
            mediaRecorder = new MediaRecorder(stream);
        }

        mediaRecorder.ondataavailable = (event) => {
            if (event.data && event.data.size > 0) {
                recordedChunks.push(event.data);
            }
        };

        mediaRecorder.onstop = handleRecordingStopped;

        // Collect chunk data every second
        mediaRecorder.start(1000);

        // UI state: Recording active
        startBtn.style.display = 'none';
        stopBtn.style.display = 'inline-flex';
        if (postRecordControls) postRecordControls.style.display = 'none';
        if (recBadge) recBadge.classList.add('active');
        if (timerBadge) timerBadge.classList.remove('warning');

        statusText.textContent = 'Recording in progress... Tap Stop when finished.';
        if (guidanceOverlay) {
            guidanceOverlay.textContent = 'Recording... Speak now. Tap Stop Recording when done.';
        }

        // Start countdown timer
        clearInterval(countdownInterval);
        countdownInterval = setInterval(() => {
            timeLeft--;
            updateTimerDisplay();

            if (timeLeft <= 5 && timerBadge) {
                timerBadge.classList.add('warning');
            }

            if (timeLeft <= 0) {
                // Auto-stop at 30 seconds
                stopRecording();
            }
        }, 1000);
    }

    // 3. Stop recording (Called on 30s timeout OR when user taps Stop button)
    function stopRecording() {
        clearInterval(countdownInterval);

        if (mediaRecorder && mediaRecorder.state !== 'inactive') {
            mediaRecorder.stop();
        }

        // UI transition
        stopBtn.style.display = 'none';
        if (recBadge) recBadge.classList.remove('active');
        if (timerBadge) timerBadge.classList.remove('warning');
    }

    // 4. Handle recording stopped & prepare review
    function handleRecordingStopped() {
        recordedBlob = new Blob(recordedChunks, { type: mediaRecorder.mimeType || 'video/webm' });

        // Switch video element from live camera to recorded playback
        videoPreview.srcObject = null;
        videoPreview.src = URL.createObjectURL(recordedBlob);
        videoPreview.controls = true;
        videoPreview.muted = false; // Allow citizen to hear their recorded voice
        videoPreview.play().catch(() => {});

        // Show review and submit controls
        if (postRecordControls) postRecordControls.style.display = 'block';

        const recordedSeconds = MAX_DURATION - timeLeft;
        statusText.textContent = `Recorded ${recordedSeconds}s video! Review above and tap Submit.`;
        if (guidanceOverlay) {
            guidanceOverlay.textContent = `Review your ${recordedSeconds}s feedback. Happy with it? Tap Submit!`;
        }
    }

    // 5. Retake / Record Again
    async function retakeRecording() {
        if (postRecordControls) postRecordControls.style.display = 'none';
        recordedBlob = null;
        recordedChunks = [];
        timeLeft = MAX_DURATION;
        updateTimerDisplay();

        // Release old object URL
        if (videoPreview.src) {
            URL.revokeObjectURL(videoPreview.src);
            videoPreview.removeAttribute('src');
        }

        // Reconnect live stream
        if (!stream || !stream.active) {
            await initCamera();
        } else {
            videoPreview.srcObject = stream;
            videoPreview.controls = false;
            videoPreview.muted = true;
            await videoPreview.play();
            startBtn.disabled = false;
        }

        startBtn.style.display = 'inline-flex';
        statusText.textContent = 'Ready for retake. Tap Start Recording (Max 30s).';
        if (guidanceOverlay) {
            guidanceOverlay.textContent = 'Tap Start Recording to record again.';
        }
    }

    // 6. Update countdown display
    function updateTimerDisplay() {
        if (timerText) {
            timerText.textContent = timeLeft;
        }
    }

    // 7. Upload recorded video to server
    async function uploadVideo() {
        if (!recordedBlob) {
            statusText.textContent = 'No recorded video found to upload.';
            return;
        }

        statusText.textContent = 'Uploading feedback video to Suvidha Centre...';
        submitBtn.disabled = true;
        if (retakeBtn) retakeBtn.disabled = true;
        if (uploadStatusBox) uploadStatusBox.classList.add('active');

        // Stop camera hardware tracks on upload
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
        }

        const formData = new FormData();
        formData.append('video', recordedBlob, 'suvidha_feedback.webm');
        formData.append('name', userName);
        formData.append('phoneNumber', userPhone);
        formData.append('centreLocation', centreLocation);
        formData.append('facilityType', facilityType);

        try {
            const response = await fetch('/Home/UploadVideo', {
                method: 'POST',
                body: formData
            });

            const result = await response.json();
            if (result && result.success) {
                window.location.href = '/Home/ThankYou';
            } else {
                const errorMsg = (result && result.message) ? result.message : 'Upload failed. Please try again.';
                statusText.textContent = errorMsg;
                submitBtn.disabled = false;
                if (retakeBtn) retakeBtn.disabled = false;
                if (uploadStatusBox) uploadStatusBox.classList.remove('active');
            }
        } catch (err) {
            console.error('Upload error:', err);
            statusText.textContent = 'Network error while uploading. Please check connection and try again.';
            submitBtn.disabled = false;
            if (retakeBtn) retakeBtn.disabled = false;
            if (uploadStatusBox) uploadStatusBox.classList.remove('active');
        }
    }

    // Event listeners
    if (startBtn) startBtn.addEventListener('click', startRecording);
    if (stopBtn) stopBtn.addEventListener('click', stopRecording);
    if (submitBtn) submitBtn.addEventListener('click', uploadVideo);
    if (retakeBtn) retakeBtn.addEventListener('click', retakeRecording);

    // Auto initialize camera on page load
    initCamera();
});
