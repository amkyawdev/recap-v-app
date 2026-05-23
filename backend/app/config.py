# backend/app/config.py
import os
from pathlib import Path

# Base directories
BASE_DIR = Path(__file__).resolve().parent.parent
UPLOAD_DIR = BASE_DIR / "uploads"
OUTPUT_DIR = BASE_DIR / "outputs"

# Create directories if they don't exist
UPLOAD_DIR.mkdir(exist_ok=True)
OUTPUT_DIR.mkdir(exist_ok=True)

# FFmpeg settings
FFMPEG_PATH = os.environ.get("FFMPEG_PATH", "ffmpeg")
FFPROBE_PATH = os.environ.get("FFPROBE_PATH", "ffprobe")

# Upload settings
MAX_VIDEO_SIZE = 500 * 1024 * 1024  # 500MB
ALLOWED_VIDEO_EXTENSIONS = {".mp4", ".mov", ".avi", ".mkv", ".webm"}
ALLOWED_SRT_EXTENSIONS = {".srt"}

# Render quality presets
QUALITY_PRESETS = {
    "high": {
        "video_codec": "libx264",
        "crf": 18,
        "preset": "slow",
        "scale": "1920:1080"
    },
    "medium": {
        "video_codec": "libx264",
        "crf": 23,
        "preset": "medium",
        "scale": "1280:720"
    },
    "low": {
        "video_codec": "libx264",
        "crf": 28,
        "preset": "fast",
        "scale": "854:480"
    }
}

# Subtitle style defaults
DEFAULT_SUBTITLE_STYLE = {
    "font": "Inter",
    "size": 24,
    "color": "white",
    "background": "black@0.75",
    "position": "bottom"
}