# backend/app/api/routes.py
import os
import uuid
import shutil
from pathlib import Path
from typing import Optional
from fastapi import APIRouter, UploadFile, File, HTTPException, BackgroundTasks
from fastapi.responses import FileResponse
from pydantic import BaseModel

from app.config import UPLOAD_DIR, OUTPUT_DIR, MAX_VIDEO_SIZE, ALLOWED_VIDEO_EXTENSIONS, DEFAULT_SUBTITLE_STYLE
from app.core.ffmpeg_processor import ffmpeg_processor

router = APIRouter()

# Store job status (in production, use Redis or database)
render_jobs = {}


class RenderRequest(BaseModel):
    video_path: str
    srt_content: str
    style: Optional[dict] = None
    quality: str = "medium"


class SubtitleProcessRequest(BaseModel):
    srt_content: str
    style: Optional[dict] = None


@router.post("/upload/video")
async def upload_video(video: UploadFile = File(...)):
    """Upload a video file."""
    # Validate file extension
    file_ext = os.path.splitext(video.filename)[1].lower()
    if file_ext not in ALLOWED_VIDEO_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            error=f"Invalid video format. Allowed: {', '.join(ALLOWED_VIDEO_EXTENSIONS)}"
        )
    
    # Generate unique filename
    file_id = str(uuid.uuid4())
    safe_filename = f"{file_id}{file_ext}"
    file_path = UPLOAD_DIR / safe_filename
    
    # Save file
    try:
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(video.file, buffer)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to save video: {str(e)}")
    
    return {
        "success": True,
        "file_id": file_id,
        "filename": video.filename,
        "path": str(file_path),
        "size": os.path.getsize(file_path)
    }


@router.post("/upload/srt")
async def upload_srt(srt: UploadFile = File(...)):
    """Upload an SRT subtitle file."""
    if not srt.filename.endswith('.srt'):
        raise HTTPException(status_code=400, detail="Invalid file format. Only .srt files are allowed")
    
    # Read and validate SRT content
    content = await srt.read()
    srt_text = content.decode('utf-8')
    
    # Basic SRT validation
    if not srt_text.strip():
        raise HTTPException(status_code=400, detail="SRT file is empty")
    
    return {
        "success": True,
        "filename": srt.filename,
        "content_length": len(srt_text),
        "preview": srt_text[:500] + ("..." if len(srt_text) > 500 else "")
    }


@router.post("/process/subtitle")
async def process_subtitle(request: SubtitleProcessRequest):
    """Process and validate subtitle content."""
    srt_lines = request.srt_content.strip().split('\n')
    
    # Basic validation
    if len(srt_lines) < 3:
        raise HTTPException(status_code=400, detail="Invalid SRT format: too few lines")
    
    # Count subtitle blocks
    blocks = [b for b in request.srt_content.split('\n\n') if b.strip()]
    
    return {
        "success": True,
        "subtitle_count": len(blocks),
        "is_valid": True
    }


@router.post("/render")
async def render_video(request: RenderRequest, background_tasks: BackgroundTasks):
    """Render video with burned subtitles."""
    # Validate video path
    video_path = Path(request.video_path)
    if not video_path.exists():
        raise HTTPException(status_code=404, detail="Video file not found")
    
    # Validate SRT content
    if not request.srt_content.strip():
        raise HTTPException(status_code=400, detail="SRT content is empty")
    
    # Merge style with defaults
    style = {**DEFAULT_SUBTITLE_STYLE, **(request.style or {})}
    
    # Generate job ID and output path
    job_id = str(uuid.uuid4())
    output_filename = f"{job_id}_output.mp4"
    output_path = OUTPUT_DIR / output_filename
    
    # Store job info
    render_jobs[job_id] = {
        "status": "processing",
        "progress": 0,
        "output_path": str(output_path),
        "video_path": str(video_path)
    }
    
    # Start background task
    background_tasks.add_task(
        process_render_job,
        job_id,
        str(video_path),
        request.srt_content,
        style,
        str(output_path),
        request.quality
    )
    
    return {
        "success": True,
        "job_id": job_id,
        "message": "Render started in background"
    }


async def process_render_job(job_id: str, video_path: str, srt_content: str, 
                             style: dict, output_path: str, quality: str):
    """Background task for video rendering."""
    try:
        # Update progress - started
        render_jobs[job_id]["progress"] = 10
        
        # Process with FFmpeg
        result = ffmpeg_processor.burn_subtitles(
            video_path=video_path,
            srt_content=srt_content,
            style=style,
            output_path=output_path,
            quality=quality
        )
        
        if result["success"]:
            render_jobs[job_id]["status"] = "completed"
            render_jobs[job_id]["progress"] = 100
        else:
            render_jobs[job_id]["status"] = "failed"
            render_jobs[job_id]["error"] = result.get("error", "Unknown error")
            
    except Exception as e:
        render_jobs[job_id]["status"] = "failed"
        render_jobs[job_id]["error"] = str(e)


@router.get("/render/status/{job_id}")
async def get_render_status(job_id: str):
    """Get render job status."""
    if job_id not in render_jobs:
        raise HTTPException(status_code=404, detail="Job not found")
    
    job = render_jobs[job_id]
    return {
        "job_id": job_id,
        "status": job["status"],
        "progress": job.get("progress", 0),
        "error": job.get("error")
    }


@router.get("/render/download/{job_id}")
async def download_rendered_video(job_id: str):
    """Download rendered video file."""
    if job_id not in render_jobs:
        raise HTTPException(status_code=404, detail="Job not found")
    
    job = render_jobs[job_id]
    if job["status"] != "completed":
        raise HTTPException(status_code=400, detail="Video not ready yet")
    
    output_path = Path(job["output_path"])
    if not output_path.exists():
        raise HTTPException(status_code=404, detail="Output file not found")
    
    return FileResponse(
        path=output_path,
        filename=f"movie_recap_{job_id}.mp4",
        media_type="video/mp4"
    )


@router.get("/ffmpeg/version")
async def get_ffmpeg_version():
    """Get FFmpeg version information."""
    version = ffmpeg_processor.get_ffmpeg_version()
    return {"version": version}