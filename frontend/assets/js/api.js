// frontend/assets/js/api.js
// API Communication Module

const API_BASE_URL = 'http://localhost:8000/api';

class API {
    static async request(endpoint, options = {}) {
        const defaultOptions = {
            headers: {
                'Content-Type': 'application/json',
            },
        };
        
        const mergedOptions = {
            ...defaultOptions,
            ...options,
            headers: {
                ...defaultOptions.headers,
                ...options.headers,
            },
        };
        
        try {
            const response = await fetch(`${API_BASE_URL}${endpoint}`, mergedOptions);
            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.error || 'API request failed');
            }
            
            return data;
        } catch (error) {
            console.error('API Error:', error);
            throw error;
        }
    }
    
    static async uploadVideo(file) {
        const formData = new FormData();
        formData.append('video', file);
        
        const response = await fetch(`${API_BASE_URL}/upload/video`, {
            method: 'POST',
            body: formData,
        });
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Video upload failed');
        }
        
        return response.json();
    }
    
    static async uploadSrt(file) {
        const formData = new FormData();
        formData.append('srt', file);
        
        const response = await fetch(`${API_BASE_URL}/upload/srt`, {
            method: 'POST',
            body: formData,
        });
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'SRT upload failed');
        }
        
        return response.json();
    }
    
    static async processSubtitle(srtContent, style) {
        return this.request('/process/subtitle', {
            method: 'POST',
            body: JSON.stringify({ srt_content: srtContent, style }),
        });
    }
    
    static async renderVideo(videoPath, srtContent, style, quality) {
        return this.request('/render', {
            method: 'POST',
            body: JSON.stringify({ 
                video_path: videoPath, 
                srt_content: srtContent, 
                style,
                quality 
            }),
        });
    }
    
    static async getRenderStatus(jobId) {
        return this.request(`/render/status/${jobId}`);
    }
    
    static async downloadVideo(jobId) {
        return `${API_BASE_URL}/render/download/${jobId}`;
    }
}

// Session data management
const SessionData = {
    getVideoFile: () => Storage.get('video_file'),
    setVideoFile: (data) => Storage.set('video_file', data),
    
    getSrtFile: () => Storage.get('srt_file'),
    setSrtFile: (data) => Storage.set('srt_file', data),
    
    getSrtContent: () => Storage.get('srt_content'),
    setSrtContent: (content) => Storage.set('srt_content', content),
    
    getSubtitleStyle: () => Storage.get('subtitle_style', {
        font: 'Inter',
        size: '24',
        color: 'white',
        background: 'black@0.75',
        position: 'bottom'
    }),
    setSubtitleStyle: (style) => Storage.set('subtitle_style', style),
    
    getRenderJob: () => Storage.get('render_job'),
    setRenderJob: (job) => Storage.set('render_job', job),
    
    clear: () => {
        Storage.remove('video_file');
        Storage.remove('srt_file');
        Storage.remove('srt_content');
        Storage.remove('subtitle_style');
        Storage.remove('render_job');
    }
};