import cv2
import numpy as np
from deepface import DeepFace
from moviepy.editor import VideoFileClip, AudioFileClip
import speech_recognition as sr
import os
from collections import defaultdict
import math
import sys
import requests
import json
import subprocess

print('[DEBUG] hr_analyzer.py started', file=sys.stderr)

def convert_to_mp4(input_path, output_path):
    cmd = [
        'ffmpeg',
        '-y',  # overwrite output file if it exists
        '-i', input_path,
        '-c:v', 'libx264',
        '-c:a', 'aac',
        output_path
    ]
    subprocess.run(cmd, check=True)

class StderrLogger:
    def message(self, s):
        print(s, file=sys.stderr)
    def error(self, s):
        print(s, file=sys.stderr)

class HRFeedbackGenerator:
    def __init__(self, video_path_or_url):
        # If it's a URL, download to temp file
        if video_path_or_url.startswith('http'):
            self.video_path = self._download_video(video_path_or_url)
            self._temp_file = self.video_path
        else:
            self.video_path = video_path_or_url
            self._temp_file = None
        self.feedback = {
            'eye_contact': 0,
            'facial_expressions': defaultdict(float),
            'confidence_score': 0,
            'speech_clarity': 0,
            'pauses': 0,
            'filler_words': 0,
            'speech_rate': 0  # words per minute
        }

    def _download_video(self, url):
        import mimetypes
        ext = os.path.splitext(url)[-1] or '.webm'
        temp_input = 'temp_interview_video' + ext
        temp_mp4 = 'temp_interview_video.mp4'
        with requests.get(url, stream=True) as r:
            r.raise_for_status()
            with open(temp_input, 'wb') as f:
                for chunk in r.iter_content(chunk_size=8192):
                    f.write(chunk)
        # Convert to mp4
        convert_to_mp4(temp_input, temp_mp4)
        os.remove(temp_input)
        return temp_mp4

    def cleanup(self):
        if self._temp_file and os.path.exists(self._temp_file):
            os.remove(self._temp_file)

    def _extract_audio(self):
        """Extract audio from video for speech analysis"""
        temp_audio = "temp_audio.wav"
        video = VideoFileClip(self.video_path)
        video.audio.write_audiofile(temp_audio, logger=None)
        return temp_audio

    def _analyze_speech(self, audio_path):
        """Analyze speech patterns without content analysis"""
        r = sr.Recognizer()
        with sr.AudioFile(audio_path) as source:
            audio = r.record(source)

            try:
                text = r.recognize_google(audio)
                words = text.lower().split()

                # Count filler words
                filler_words = ['um', 'uh', 'ah', 'like', 'you know']
                self.feedback['filler_words'] = sum(1 for word in words if word in filler_words)

                # Calculate speech rate
                duration = VideoFileClip(self.video_path).duration
                if duration > 0:
                    words_per_minute = (len(words) / duration) * 60
                    self.feedback['speech_rate'] = words_per_minute
                    # Speech clarity based on ideal 110-150 WPM range
                    if 110 <= words_per_minute <= 150:
                        self.feedback['speech_clarity'] = 1.0
                    else:
                        self.feedback['speech_clarity'] = 1 - min(abs(words_per_minute - 130)/80, 1)

                # Detect long pauses (>1 second)
                audio_clip = AudioFileClip(audio_path)
                silent_ranges = self._detect_silence(audio_clip)
                self.feedback['pauses'] = len([r for r in silent_ranges if r[1]-r[0] > 1.0])

            except Exception as e:
                print(f"Speech recognition error: {e}", file=sys.stderr)
                self.feedback['speech_clarity'] = 0.5
            finally:
                if os.path.exists(audio_path):
                    os.remove(audio_path)

    def _detect_silence(self, audio_clip, silence_thresh=-40):
        """Detect silent periods in audio"""
        chunks = audio_clip.iter_chunks(chunk_size=1024)
        silent_ranges = []
        current_start = None

        for i, chunk in enumerate(chunks):
            rms = np.sqrt(np.mean(np.square(chunk)))
            db = 20 * np.log10(rms) if rms > 0 else -100

            if db < silence_thresh:
                if current_start is None:
                    current_start = i / audio_clip.fps
            else:
                if current_start is not None:
                    silent_ranges.append((current_start, i / audio_clip.fps))
                    current_start = None

        return silent_ranges

    def _analyze_facial_features(self):
        """Analyze facial expressions and eye contact"""
        cap = cv2.VideoCapture(self.video_path)
        frame_interval = max(1, int(cap.get(cv2.CAP_PROP_FPS) // 3))  # Sample 3 frames per second

        total_frames = 0
        eye_contact_frames = 0
        emotion_counts = defaultdict(int)

        while cap.isOpened():
            ret, frame = cap.read()
            if not ret:
                break

            total_frames += 1
            if total_frames % frame_interval != 0:
                continue

            try:
                rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
                analysis = DeepFace.analyze(rgb_frame, actions=['emotion'], enforce_detection=False)

                if isinstance(analysis, list):
                    analysis = analysis[0]

                if 'emotion' in analysis:
                    dominant_emotion = max(analysis['emotion'].items(), key=lambda x: x[1])[0]
                    emotion_counts[dominant_emotion] += 1

                if 'region' in analysis:
                    x, y, w, h = analysis['region']['x'], analysis['region']['y'], analysis['region']['w'], analysis['region']['h']
                    # Simple eye contact heuristic (face position in frame)
                    if 0.35 < x/(frame.shape[1]-w) < 0.65:
                        eye_contact_frames += 1

            except Exception as e:
                continue

        cap.release()

        # Calculate metrics
        if total_frames > 0:
            self.feedback['eye_contact'] = eye_contact_frames / (total_frames / frame_interval)

        total_emotion_frames = sum(emotion_counts.values())
        if total_emotion_frames > 0:
            for emotion, count in emotion_counts.items():
                self.feedback['facial_expressions'][emotion] = count / total_emotion_frames

        # Confidence score based on positive expressions
        positive_emotions = ['happy', 'neutral']
        self.feedback['confidence_score'] = sum(
            self.feedback['facial_expressions'].get(emotion, 0)
            for emotion in positive_emotions
        )

    def generate_feedback(self):
        """Generate delivery-focused feedback"""
        # Analyze facial features
        self._analyze_facial_features()

        # Analyze speech patterns
        audio_path = self._extract_audio()
        self._analyze_speech(audio_path)

        return self._format_feedback()

    def _format_feedback(self):
        """Format the feedback for delivery metrics only"""
        # Calculate overall delivery score
        weights = {
            'eye_contact': 0.3,
            'confidence_score': 0.3,
            'speech_clarity': 0.2,
            'filler_words': -0.1,
            'pauses': -0.1
        }

        filler_score = max(0, 1 - (self.feedback['filler_words'] / 10))
        pause_score = max(0, 1 - (self.feedback['pauses'] / 5))

        overall_score = (
            weights['eye_contact'] * self.feedback['eye_contact'] +
            weights['confidence_score'] * self.feedback['confidence_score'] +
            weights['speech_clarity'] * self.feedback['speech_clarity'] +
            weights['filler_words'] * filler_score +
            weights['pauses'] * pause_score
        )

        overall_score = max(0, min(1, overall_score)) * 100

        # Generate feedback comments
        comments = []

        # Eye contact feedback
        eye_contact_percent = self.feedback['eye_contact'] * 100
        if eye_contact_percent < 30:
            comments.append("Poor eye contact ({}%) - practice looking directly at the camera".format(int(eye_contact_percent)))
        elif eye_contact_percent < 60:
            comments.append("Moderate eye contact ({}%) - could be more consistent".format(int(eye_contact_percent)))
        else:
            comments.append("Excellent eye contact ({}%)".format(int(eye_contact_percent)))

        # Confidence feedback
        if self.feedback['confidence_score'] < 0.4:
            comments.append("Low confidence detected - work on posture and voice projection")
        elif self.feedback['confidence_score'] < 0.7:
            comments.append("Moderate confidence - could project more authority")
        else:
            comments.append("High confidence detected - good presence")

        # Speech metrics
        comments.append("Speech rate: {:.1f} words/minute (ideal: 110-150)".format(self.feedback['speech_rate']))
        comments.append("Filler words used: {}".format(self.feedback['filler_words']))
        comments.append("Long pauses (>1s): {}".format(self.feedback['pauses']))

        # Emotion feedback
        dominant_emotion = max(
            self.feedback['facial_expressions'].items(),
            key=lambda x: x[1]
        )[0] if self.feedback['facial_expressions'] else 'neutral'
        comments.append("Dominant facial expression: {}".format(dominant_emotion))

        return {
            'overall_score': round(overall_score, 1),
            'detailed_metrics': {
                'eye_contact': round(self.feedback['eye_contact'] * 100, 1),
                'confidence': round(self.feedback['confidence_score'] * 100, 1),
                'speech_clarity': round(self.feedback['speech_clarity'] * 100, 1),
                'speech_rate': round(self.feedback['speech_rate'], 1),
                'filler_words': self.feedback['filler_words'],
                'long_pauses': self.feedback['pauses'],
                'dominant_emotion': dominant_emotion
            },
            'feedback_comments': comments
        }

if __name__ == '__main__':
    video_path = sys.argv[1]
    analyzer = HRFeedbackGenerator(video_path)
    try:
        print('[DEBUG] Generating feedback', file=sys.stderr)
        result = analyzer.generate_feedback()
        print('[DEBUG] Feedback generated, printing result', file=sys.stderr)
        print(json.dumps(result))
    except Exception as e:
        print(f"Error: {e}", file=sys.stderr)
    finally:
        analyzer.cleanup()