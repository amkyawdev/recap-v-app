// frontend/assets/js/preview.js
// Preview Page Logic

document.addEventListener('DOMContentLoaded', function() {
    if (!window.location.pathname.includes('preview.html')) return;
    
    const previewVideo = document.getElementById('previewVideo');
    const previewSource = document.getElementById('previewSource');
    const previewSubtitle = document.getElementById('previewSubtitle');
    const videoFileNameSpan = document.getElementById('videoFileName');
    const subtitleCountSpan = document.getElementById('subtitleCount');
    const qualitySelect = document.getElementById('qualitySelect');
    const styleSummarySpan = document.getElementById('styleSummary');
    const renderBtn = document.getElementById('renderBtn');
    const downloadBtn = document.getElementById('downloadBtn');
    const newProjectBtn = document.getElementById('newProjectBtn');
    const progressContainer = document.getElementById('progressContainer');
    const progressFill = document.getElementById('progressFill');
    const progressText = document.getElementById('progressText');
    
    let currentJobId = null;
    let progressInterval = null;
    
    // Load data
    loadPreviewData();
    
    // Apply subtitle style to overlay
    applySubtitleStyle();
    
    // Event listeners
    if (renderBtn) {
        renderBtn.addEventListener('click', startRender);
    }
    
    if (downloadBtn) {
        downloadBtn.addEventListener('click', downloadVideo);
    }
    
    if (newProjectBtn) {
        newProjectBtn.addEventListener('click', () => {
            SessionData.clear();
            window.location.href = 'editing.html';
        });
    }
    
    function loadPreviewData() {
        const videoFile = SessionData.getVideoFile();
        const srtContent = SessionData.getSrtContent();
        const style = SessionData.getSubtitleStyle();
        
        if (videoFile) {
            // For demo, use a placeholder or show that video is ready
            videoFileNameSpan.textContent = videoFile.filename || 'video.mp4';
            // In production, this would load the actual video preview
            previewSource.src = videoFile.preview_url || '';
            previewVideo.load();
        } else {
            videoFileNameSpan.textContent = 'No video loaded. Please go back to editor.';
        }
        
        if (srtContent) {
            const subtitleCount = (srtContent.match(/\d+\n/g) || []).length;
            subtitleCountSpan.textContent = `${subtitleCount} subtitles`;
            
            // Simulate subtitle preview
            simulateSubtitlePreview(srtContent);
        } else {
            subtitleCountSpan.textContent = 'No SRT loaded';
        }
        
        if (style) {
            const styleText = `${style.font}, ${style.size}px, ${style.color}`;
            styleSummarySpan.textContent = styleText;
        }
    }
    
    function applySubtitleStyle() {
        const style = SessionData.getSubtitleStyle();
        if (style && previewSubtitle) {
            previewSubtitle.style.fontFamily = style.font;
            previewSubtitle.style.fontSize = `${style.size}px`;
            previewSubtitle.style.color = style.color;
            
            if (style.background !== 'none') {
                const [bgColor, opacity] = style.background.split('@');
                const opacityNum = opacity ? parseFloat(opacity) : 0.75;
                previewSubtitle.style.backgroundColor = bgColor;
                previewSubtitle.style.opacity = opacityNum;
            } else {
                previewSubtitle.style.backgroundColor = 'transparent';
            }
            
            if (style.position === 'top') {
                previewSubtitle.parentElement.style.bottom = 'auto';
                previewSubtitle.parentElement.style.top = '10%';
            } else if (style.position === 'middle') {
                previewSubtitle.parentElement.style.bottom = 'auto';
                previewSubtitle.parentElement.style.top = '50%';
                previewSubtitle.parentElement.style.transform = 'translateY(-50%)';
            } else {
                previewSubtitle.parentElement.style.bottom = '20%';
                previewSubtitle.parentElement.style.top = 'auto';
                previewSubtitle.parentElement.style.transform = 'none';
            }
        }
    }
    
    function simulateSubtitlePreview(srtContent) {
        // Parse SRT and simulate preview on video timeupdate
        const subtitles = parseSrt(srtContent);
        
        if (previewVideo) {
            previewVideo.addEventListener('timeupdate', () => {
                const currentTime = previewVideo.currentTime;
                const activeSubtitle = subtitles.find(
                    sub => currentTime >= sub.start && currentTime <= sub.end
                );
                
                if (activeSubtitle && previewSubtitle) {
                    previewSubtitle.textContent = activeSubtitle.text;
                    previewSubtitle.style.display = 'inline-block';
                } else if (previewSubtitle) {
                    previewSubtitle.textContent = '';
                    previewSubtitle.style.display = 'none';
                }
            });
        }
    }
    
    function parseSrt(content) {
        const blocks = content.trim().split(/\n\s*\n/);
        const subtitles = [];
        
        for (const block of blocks) {
            const lines = block.split('\n');
            if (lines.length >= 3) {
                const index = parseInt(lines[0]);
                const timeMatch = lines[1].match(/(\d{2}:\d{2}:\d{2},\d{3})\s*-->\s*(\d{2}:\d{2}:\d{2},\d{3})/);
                if (timeMatch) {
                    const text = lines.slice(2).join('\n');
                    subtitles.push({
                        index: index,
                        start: parseSrtTime(timeMatch[1]),
                        end: parseSrtTime(timeMatch[2]),
                        text: text
                    });
                }
            }
        }
        
        return subtitles;
    }
    
    function parseSrtTime(timeStr) {
        const [time, millis] = timeStr.split(',');
        const [hours, minutes, seconds] = time.split(':');
        return parseInt(hours) * 3600 + parseInt(minutes) * 60 + parseInt(seconds) + parseInt(millis) / 1000;
    }
    
    async function startRender() {
        const videoFile = SessionData.getVideoFile();
        const srtContent = SessionData.getSrtContent();
        const style = SessionData.getSubtitleStyle();
        const quality = qualitySelect.value;
        
        if (!videoFile || !srtContent) {
            showToast('Please upload both video and SRT files in the editor first!', 'error');
            return;
        }
        
        showLoader(true, 'Starting render with FFmpeg...');
        renderBtn.disabled = true;
        progressContainer.style.display = 'block';
        
        try {
            const result = await API.renderVideo(videoFile.path, srtContent, style, quality);
            currentJobId = result.job_id;
            SessionData.setRenderJob(result);
            
            startProgressPolling();
            showToast('Render started! Processing with FFmpeg...', 'success');
        } catch (error) {
            showToast(error.message, 'error');
            renderBtn.disabled = false;
            showLoader(false);
        }
    }
    
    function startProgressPolling() {
        if (progressInterval) clearInterval(progressInterval);
        
        progressInterval = setInterval(async () => {
            if (!currentJobId) return;
            
            try {
                const status = await API.getRenderStatus(currentJobId);
                
                if (status.progress) {
                    const percent = status.progress;
                    progressFill.style.width = `${percent}%`;
                    progressText.textContent = `${percent}%`;
                }
                
                if (status.status === 'completed') {
                    clearInterval(progressInterval);
                    renderBtn.disabled = false;
                    showLoader(false);
                    downloadBtn.style.display = 'inline-flex';
                    showToast('Render completed! Your video is ready for download.', 'success');
                } else if (status.status === 'failed') {
                    clearInterval(progressInterval);
                    renderBtn.disabled = false;
                    showLoader(false);
                    showToast(status.error || 'Render failed', 'error');
                }
            } catch (error) {
                console.error('Progress check failed:', error);
            }
        }, 2000);
    }
    
    function downloadVideo() {
        if (currentJobId) {
            const downloadUrl = API.downloadVideo(currentJobId);
            window.open(downloadUrl, '_blank');
            showToast('Download started!', 'success');
        } else {
            const savedJob = SessionData.getRenderJob();
            if (savedJob && savedJob.job_id) {
                const downloadUrl = API.downloadVideo(savedJob.job_id);
                window.open(downloadUrl, '_blank');
            } else {
                showToast('No rendered video available. Please render first.', 'error');
            }
        }
    }
});