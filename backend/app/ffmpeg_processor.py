# backend/app/core/ffmpeg_processor.py
import subprocess
import os
import re
import tempfile
from pathlib import Path
from typing import Dict, Any
import json

from app.config import FFMPEG_PATH, FFPROBE_PATH, QUALITY_PRESETS

class FFmpegProcessor:
    """Handles FFmpeg operations for subtitle burning."""
    
    def __init__(self):
        self.ffmpeg_path = FFMPEG_PATH
        self.ffprobe_path = FFPROBE_PATH
    
    def create_ass_subtitle_file(self, srt_content: str, style: Dict[str, Any]) -> str:
        """Convert SRT to ASS format with custom styling."""
        temp_ass = tempfile.NamedTemporaryFile(mode='w', suffix='.ass', delete=False)
        
        # Parse style parameters
        font = style.get('font', 'Inter')
        font_size = style.get('size', 24)
        color = style.get('color', 'white')
        background = style.get('background', 'black@0.75')
        
        # Convert color names to ASS color format (BGR with opacity)
        color_map = {
            'white': '&HFFFFFF',
            'yellow': '&H00FFFF',
            'cyan': '&HFFFF00',
            'lime': '&H00FF00',
            'red': '&H0000FF',
            'black': '&H000000'
        }
        
        primary_color = color_map.get(color, '&HFFFFFF')
        
        # Handle background
        if background != 'none':
            bg_parts = background.split('@')
            bg_color = bg_parts[0]
            bg_opacity = int(255 * float(bg_parts[1])) if len(bg_parts) > 1 else 191
            bg_color_hex = color_map.get(bg_color, '&H000000')
            # ASS background color format: &HAA&HBBGGRR
            back_color = f"&H{bg_opacity:02X}{bg_color_hex[2:]}"
        else:
            back_color = '&H00000000'
        
        # Position
        position = style.get('position', 'bottom')
        if position == 'top':
            margin_v = 20
        elif position == 'middle':
            margin_v = 360
        else:  # bottom
            margin_v = 20
        
        # Write ASS header
        ass_content = f"""[Script Info]
Title: Movie Recap Subtitles
ScriptType: v4.00+
WrapStyle: 0
ScaledBorderAndShadow: yes
YCbCr Matrix: TV.601

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Default,{font},{font_size},{primary_color},&HFFFFFF,&H000000,{back_color},0,0,0,0,100,100,0,0,1,1,1,{2 if position != 'top' else 6},{10},{10},{margin_v},1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
"""
        
        # Parse SRT and convert to ASS events
        events = self._srt_to_ass_events(srt_content)
        ass_content += events
        
        temp_ass.write(ass_content)
        temp_ass.close()
        
        return temp_ass.name
    
    def _srt_to_ass_events(self, srt_content: str) -> str:
        """Convert SRT content to ASS event lines."""
        events = []
        blocks = re.split(r'\n\s*\n', srt_content.strip())
        
        for block in blocks:
            lines = block.strip().split('\n')
            if len(lines) >= 3:
                # Parse index (ignore)
                # Parse timestamp
                time_line = lines[1]
                time_match = re.match(r'(\d{2}:\d{2}:\d{2},\d{3})\s*-->\s*(\d{2}:\d{2}:\d{2},\d{3})', time_line)
                
                if time_match:
                    start = self._srt_time_to_ass(time_match.group(1))
                    end = self._srt_time_to_ass(time_match.group(2))
                    text = '\\N'.join(lines[2:])  # Convert newlines to ASS line breaks
                    # Escape special characters for ASS
                    text = text.replace('{', '\\{').replace('}', '\\}')
                    events.append(f"Dialogue: 0,{start},{end},Default,,0,0,0,,{text}")
        
        return '\n'.join(events)
    
    def _srt_time_to_ass(self, srt_time: str) -> str:
        """Convert SRT timestamp (00:00:00,000) to ASS format (0:00:00.00)."""
        # SRT format: HH:MM:SS,mmm
        # ASS format: H:MM:SS.cc (centiseconds)
        parts = srt_time.split(',')
        time_part = parts[0]
        millis = int(parts[1]) if len(parts) > 1 else 0
        centis = millis // 10
        
        return f"{time_part}.{centis:02d}"
    
    def burn_subtitles(self, video_path: str, srt_content: str, style: Dict[str, Any], 
                       output_path: str, quality: str = "medium") -> Dict[str, Any]:
        """
        Burn subtitles into video using FFmpeg.
        
        Args:
            video_path: Path to input video file
            srt_content: SRT subtitle content
            style: Subtitle styling dictionary
            output_path: Path for output video
            quality: Quality preset (high, medium, low)
        
        Returns:
            Dict with processing results
        """
        # Create ASS subtitle file
        ass_file = self.create_ass_subtitle_file(srt_content, style)
        
        try:
            # Get video info
            video_info = self.get_video_info(video_path)
            
            # Get quality preset
            preset = QUALITY_PRESETS.get(quality, QUALITY_PRESETS["medium"])
            
            # Build FFmpeg command
            cmd = [
                self.ffmpeg_path,
                "-i", video_path,
                "-vf", f"ass={ass_file}",
                "-c:v", preset["video_codec"],
                "-crf", str(preset["crf"]),
                "-preset", preset["preset"],
                "-c:a", "copy",  # Copy audio without re-encoding
                "-y",  # Overwrite output file
                output_path
            ]
            
            # Add scaling if needed
            if preset["scale"] != "original":
                # Insert scale filter before ass filter
                cmd[cmd.index("-vf")] = f"scale={preset['scale']},ass={ass_file}"
            
            # Execute FFmpeg
            process = subprocess.Popen(
                cmd,
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                text=True
            )
            
            stdout, stderr = process.communicate()
            
            if process.returncode != 0:
                raise Exception(f"FFmpeg error: {stderr}")
            
            return {
                "success": True,
                "output_path": output_path,
                "video_info": video_info
            }
            
        finally:
            # Clean up temporary ASS file
            if os.path.exists(ass_file):
                os.unlink(ass_file)
    
    def get_video_info(self, video_path: str) -> Dict[str, Any]:
        """Get video metadata using ffprobe."""
        cmd = [
            self.ffprobe_path,
            "-v", "quiet",
            "-print_format", "json",
            "-show_streams",
            video_path
        ]
        
        result = subprocess.run(cmd, capture_output=True, text=True)
        data = json.loads(result.stdout)
        
        video_stream = next(
            (s for s in data.get("streams", []) if s.get("codec_type") == "video"),
            None
        )
        
        if video_stream:
            return {
                "width": int(video_stream.get("width", 0)),
                "height": int(video_stream.get("height", 0)),
                "duration": float(video_stream.get("duration", 0)),
                "codec": video_stream.get("codec_name", "unknown")
            }
        
        return {}
    
    def get_ffmpeg_version(self) -> str:
        """Get FFmpeg version."""
        try:
            result = subprocess.run(
                [self.ffmpeg_path, "-version"],
                capture_output=True,
                text=True
            )
            first_line = result.stdout.split('\n')[0]
            return first_line
        except Exception:
            return "FFmpeg not found"

# Global instance
ffmpeg_processor = FFmpegProcessor()