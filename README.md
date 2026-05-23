
# Movie Recap App

A powerful web application for burning subtitles into videos with custom styling. Built with FastAPI (Python) backend and HTML/CSS/JS frontend, powered by FFmpeg for professional video processing.

## Features

- 🎬 Upload video files (MP4, MOV, AVI, MKV)
- 📝 Upload and edit SRT subtitle files
- 🎨 Customize subtitle styling:
  - Font family selection
  - Font size adjustment
  - Text color picker
  - Background opacity/color
  - Position (top/middle/bottom)
- ⚡ Real-time preview with video synchronization
- 🚀 FFmpeg-powered subtitle burning
- 📱 Mobile-first responsive design
- 🐳 Docker support for easy deployment

## Tech Stack

### Backend
- Python 3.11+
- FastAPI
- FFmpeg (subtitle burning)
- Uvicorn

### Frontend
- HTML5
- CSS3 (Mobile-first, Flexbox/Grid)
- Vanilla JavaScript
- Font Awesome Icons

## Project Structure

```

movie-recap-app/
├── backend/
│   ├── app/
│   │   ├── init.py
│   │   ├── main.py           # FastAPI entry point
│   │   ├── config.py         # Configuration settings
│   │   ├── core/
│   │   │   ├── init.py
│   │   │   └── ffmpeg_processor.py  # FFmpeg subtitle burning logic
│   │   └── api/
│   │       ├── init.py
│   │       └── routes.py     # API endpoints
│   ├── requirements.txt      # Python dependencies
│   └── Dockerfile            # Docker configuration
├── frontend/
│   ├── assets/
│   │   ├── css/
│   │   │   ├── style.css     # Global styles
│   │   │   └── components.css # Component styles
│   │   ├── js/
│   │   │   ├── app.js        # Core JS (navigation, loader)
│   │   │   ├── api.js        # API communication
│   │   │   ├── editor.js     # Editor page logic
│   │   │   └── preview.js    # Preview page logic
│   │   └── images/           # Image assets
│   ├── index.html            # Landing page
│   ├── editing.html          # SRT editor page
│   ├── preview.html          # Preview & render page
│   └── about.html            # About page
└── README.md

```

## Installation

### Local Development

#### Prerequisites
- Python 3.11 or higher
- FFmpeg installed on your system
- Node.js (optional, for frontend development)

#### Backend Setup

1. Navigate to backend directory:
```bash
cd backend
```

2. Create virtual environment:

```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

3. Install dependencies:

```bash
pip install -r requirements.txt
```

4. Run the FastAPI server:

```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

Frontend Setup

Simply serve the frontend files using any static server:

```bash
cd frontend
python -m http.server 3000
```

Or use VS Code Live Server extension.

Docker Deployment

Build and run with Docker:

```bash
docker build -t movie-recap-app backend/
docker run -p 8000:8000 movie-recap-app
```

The API will be available at http://localhost:8000

API Endpoints

Method Endpoint Description
POST /api/upload/video Upload video file
POST /api/upload/srt Upload SRT file
POST /api/process/subtitle Validate subtitle content
POST /api/render Start video rendering
GET /api/render/status/{job_id} Get render progress
GET /api/render/download/{job_id} Download rendered video
GET /api/ffmpeg/version Get FFmpeg version

Usage Guide

1. Upload Media: Start on the Editor page. Upload your video file and matching SRT subtitle file.
2. Edit Subtitles:
   · Edit subtitle text and timings directly in the editor
   · Use dropdown menus to customize font, size, color, background, and position
   · Click "Format" to clean up SRT formatting
   · Click "Apply Styles" to save and continue
3. Preview & Render:
   · Preview the video with subtitle styling applied
   · Select output quality (High/Medium/Low)
   · Click "Start Rendering" to begin FFmpeg processing
   · Monitor progress bar
   · Download the finished video when complete

Subtitle Styling Options

· Font: Arial, Helvetica, Times New Roman, Courier New, Georgia, Verdana, Inter
· Size: 16px - 36px
· Color: White, Yellow, Cyan, Lime, Red, Black
· Background: Black (75%/50%/25%), White (75%), Transparent
· Position: Top Center, Middle Center, Bottom Center

FFmpeg Requirements

Ensure FFmpeg is properly installed:

```bash
ffmpeg -version
```

The application uses FFmpeg for:

· Video decoding/encoding
· Subtitle burning (ASS filter)
· Format conversion
· Scaling/quality adjustments

Browser Support

· Chrome (latest)
· Firefox (latest)
· Safari (latest)
· Edge (latest)
· Mobile browsers (iOS Safari, Chrome Android)

Performance Considerations

· Video uploads limited to 500MB
· Rendering time depends on video length and quality preset
· Background processing prevents UI blocking
· Progress updates every 2 seconds during rendering

Security Notes (Production)

For production deployment, consider:

· Adding authentication/authorization
· Implementing rate limiting
· Using a task queue (Celery/RabbitMQ) for heavy processing
· Storing files in cloud storage (S3, etc.)
· Adding HTTPS with valid SSL certificate
· Restricting CORS origins

License

MIT License - feel free to use for personal or commercial projects.

Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

Support

For issues or questions, please open an issue on the repository.

---

Built with ❤️ using FastAPI, FFmpeg, and modern web technologies