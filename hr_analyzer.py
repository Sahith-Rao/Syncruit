import sys
import json

if __name__ == '__main__':
    video_path = sys.argv[1]
    analyzer = HRFeedbackGenerator(video_path)
    try:
        result = analyzer.generate_feedback()
        print(json.dumps(result))
    except Exception as e:
        print(f"Error: {e}", file=sys.stderr)
    finally:
        analyzer.cleanup() 