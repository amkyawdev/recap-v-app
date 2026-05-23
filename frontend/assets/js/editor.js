// frontend/assets/js/editor.js
// Editor Page Logic

document.addEventListener('DOMContentLoaded', function() {
    // Only run on editing page
    if (!window.location.pathname.includes('editing.html')) return;
    
    // Elements
    const videoUploadArea = document.getElementById('videoUploadArea');
    const videoInput = document.getElementById('videoInput');
    const videoInfo = document.getElementById('videoInfo');
    const videoNameSpan = document.getElementById('videoName');
    const removeVideoBtn = document.getElementById('removeVideo');
    
    const srtUploadArea = document.getElementById('srtUploadArea');
    const srtInput = document.getElementById('srtInput');
    const srtInfo = document.getElementById('srtInfo');
    const srtNameSpan = document.getElementById('srtName');
    const removeSrtBtn = document.getElementById('removeSrt');
    
    const srtEditor = document.getElementById('srtEditor');
    const formatSrtBtn = document.getElementById('formatSrtBtn');
    const previewSrtBtn = document.getElementById('previewSrtBtn');
    const resetStylesBtn = document.getElementById('resetStylesBtn');
    const applyStylesBtn = document.getElementById('applyStylesBtn');
    
    // Dropdown initialization
    initializeDropdowns();
    
    // Load saved data
    loadSavedData();
    
    // Video upload handlers
    if (videoUploadArea) {
        videoUploadArea.addEventListener('click', () => videoInput.click());
        videoInput.addEventListener('change', handleVideoUpload);
        
        // Drag and drop
        videoUploadArea.addEventListener('dragover', (e) => {
            e.preventDefault();
            videoUploadArea.style.borderColor = 'var(--primary)';
        });
        videoUploadArea.addEventListener('dragleave', () => {
            videoUploadArea.style.borderColor = 'rgba(99, 102, 241, 0.3)';
        });
        videoUploadArea.addEventListener('drop', (e) => {
            e.preventDefault();
            const file = e.dataTransfer.files[0];
            if (file && file.type.startsWith('video/')) {
                handleVideoFile(file);
            }
        });
    }
    
    // SRT upload handlers
    if (srtUploadArea) {
        srtUploadArea.addEventListener('click', () => srtInput.click());
        srtInput.addEventListener('change', handleSrtUpload);
        
        srtUploadArea.addEventListener('dragover', (e) => {
            e.preventDefault();
            srtUploadArea.style.borderColor = 'var(--primary)';
        });
        srtUploadArea.addEventListener('dragleave', () => {
            srtUploadArea.style.borderColor = 'rgba(99, 102, 241, 0.3)';
        });
        srtUploadArea.addEventListener('drop', (e) => {
            e.preventDefault();
            const file = e.dataTransfer.files[0];
            if (file && file.name.endsWith('.srt')) {
                handleSrtFile(file);
            }
        });
    }
    
    // Remove handlers
    if (removeVideoBtn) {
        removeVideoBtn.addEventListener('click', () => {
            SessionData.setVideoFile(null);
            videoInfo.style.display = 'none';
            videoUploadArea.style.display = 'flex';
            showToast('Video removed', 'info');
        });
    }
    
    if (removeSrtBtn) {
        removeSrtBtn.addEventListener('click', () => {
            SessionData.setSrtFile(null);
            SessionData.setSrtContent(null);
            srtInfo.style.display = 'none';
            srtUploadArea.style.display = 'flex';
            srtEditor.value = '';
            showToast('SRT file removed', 'info');
        });
    }
    
    // Editor actions
    if (formatSrtBtn) {
        formatSrtBtn.addEventListener('click', formatSrtContent);
    }
    
    if (previewSrtBtn) {
        previewSrtBtn.addEventListener('click', saveAndPreview);
    }
    
    if (resetStylesBtn) {
        resetStylesBtn.addEventListener('click', resetStyles);
    }
    
    if (applyStylesBtn) {
        applyStylesBtn.addEventListener('click', saveAndContinue);
    }
    
    // Helper functions
    async function handleVideoUpload(e) {
        const file = e.target.files[0];
        if (file) await handleVideoFile(file);
    }
    
    async function handleVideoFile(file) {
        showLoader(true, 'Uploading video...');
        try {
            const result = await API.uploadVideo(file);
            SessionData.setVideoFile(result);
            videoNameSpan.textContent = file.name;
            videoUploadArea.style.display = 'none';
            videoInfo.style.display = 'flex';
            showToast('Video uploaded successfully!', 'success');
        } catch (error) {
            showToast(error.message, 'error');
        } finally {
            showLoader(false);
        }
    }
    
    async function handleSrtUpload(e) {
        const file = e.target.files[0];
        if (file) await handleSrtFile(file);
    }
    
    async function handleSrtFile(file) {
        showLoader(true, 'Processing SRT file...');
        try {
            const content = await file.text();
            const result = await API.uploadSrt(file);
            SessionData.setSrtFile(result);
            SessionData.setSrtContent(content);
            srtEditor.value = content;
            srtNameSpan.textContent = file.name;
            srtUploadArea.style.display = 'none';
            srtInfo.style.display = 'flex';
            showToast('SRT file loaded!', 'success');
        } catch (error) {
            showToast(error.message, 'error');
        } finally {
            showLoader(false);
        }
    }
    
    function formatSrtContent() {
        let content = srtEditor.value;
        // Basic SRT formatting - ensure proper line breaks
        content = content.replace(/\r\n/g, '\n');
        content = content.replace(/\n{3,}/g, '\n\n');
        srtEditor.value = content;
        showToast('SRT formatted', 'success');
    }
    
    function saveAndPreview() {
        const content = srtEditor.value;
        SessionData.setSrtContent(content);
        showToast('Changes saved', 'success');
        // Simulate preview
        showDialog('Preview', 'Style preview will be shown in the preview page', 
            () => window.location.href = 'preview.html',
            () => {}
        );
    }
    
    function saveAndContinue() {
        const content = srtEditor.value;
        SessionData.setSrtContent(content);
        // Save current style from dropdowns
        const style = getCurrentStyle();
        SessionData.setSubtitleStyle(style);
        showToast('Styles applied! Redirecting to preview...', 'success');
        setTimeout(() => {
            window.location.href = 'preview.html';
        }, 1000);
    }
    
    function loadSavedData() {
        const savedVideo = SessionData.getVideoFile();
        if (savedVideo && videoInfo) {
            videoNameSpan.textContent = savedVideo.filename || 'Video file';
            videoUploadArea.style.display = 'none';
            videoInfo.style.display = 'flex';
        }
        
        const savedSrt = SessionData.getSrtFile();
        const savedContent = SessionData.getSrtContent();
        if (savedSrt && srtEditor && savedContent) {
            srtNameSpan.textContent = savedSrt.filename || 'SRT file';
            srtEditor.value = savedContent;
            srtUploadArea.style.display = 'none';
            srtInfo.style.display = 'flex';
        }
        
        const savedStyle = SessionData.getSubtitleStyle();
        if (savedStyle) {
            applyStyleToDropdowns(savedStyle);
        }
    }
    
    function getCurrentStyle() {
        return {
            font: getDropdownValue('font') || 'Inter',
            size: getDropdownValue('size') || '24',
            color: getDropdownValue('color') || 'white',
            background: getDropdownValue('bg') || 'black@0.75',
            position: getDropdownValue('position') || 'bottom'
        };
    }
    
    function resetStyles() {
        setDropdownValue('font', 'Inter');
        setDropdownValue('size', '24');
        setDropdownValue('color', 'white');
        setDropdownValue('bg', 'black@0.75');
        setDropdownValue('position', 'bottom');
        showToast('Styles reset to default', 'success');
    }
    
    function initializeDropdowns() {
        document.querySelectorAll('.dropdown').forEach(dropdown => {
            const btn = dropdown.querySelector('.dropdown-btn');
            const menu = dropdown.querySelector('.dropdown-menu');
            
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                // Close all other dropdowns
                document.querySelectorAll('.dropdown-menu').forEach(m => {
                    if (m !== menu) m.classList.remove('active');
                });
                menu.classList.toggle('active');
            });
            
            menu.querySelectorAll('div').forEach(item => {
                item.addEventListener('click', () => {
                    const value = item.dataset.value;
                    const text = item.textContent.trim();
                    const type = btn.dataset.type;
                    
                    btn.querySelector('span').textContent = text;
                    menu.classList.remove('active');
                    
                    // Update stored style
                    const style = SessionData.getSubtitleStyle();
                    if (type === 'font') style.font = value;
                    if (type === 'size') style.size = value;
                    if (type === 'color') style.color = value;
                    if (type === 'bg') style.background = value;
                    if (type === 'position') style.position = value;
                    SessionData.setSubtitleStyle(style);
                });
            });
        });
        
        // Close dropdowns when clicking outside
        document.addEventListener('click', () => {
            document.querySelectorAll('.dropdown-menu').forEach(menu => {
                menu.classList.remove('active');
            });
        });
    }
    
    function getDropdownValue(type) {
        const btn = document.querySelector(`.dropdown-btn[data-type="${type}"]`);
        if (btn) {
            const text = btn.querySelector('span').textContent;
            const menu = btn.parentElement.querySelector('.dropdown-menu');
            const selected = Array.from(menu.querySelectorAll('div')).find(
                item => item.textContent.trim() === text
            );
            return selected ? selected.dataset.value : null;
        }
        return null;
    }
    
    function setDropdownValue(type, value) {
        const btn = document.querySelector(`.dropdown-btn[data-type="${type}"]`);
        if (btn) {
            const menu = btn.parentElement.querySelector('.dropdown-menu');
            const selected = Array.from(menu.querySelectorAll('div')).find(
                item => item.dataset.value === value
            );
            if (selected) {
                btn.querySelector('span').textContent = selected.textContent.trim();
            }
        }
    }
    
    function applyStyleToDropdowns(style) {
        if (style.font) setDropdownValue('font', style.font);
        if (style.size) setDropdownValue('size', style.size);
        if (style.color) setDropdownValue('color', style.color);
        if (style.background) setDropdownValue('bg', style.background);
        if (style.position) setDropdownValue('position', style.position);
    }
});