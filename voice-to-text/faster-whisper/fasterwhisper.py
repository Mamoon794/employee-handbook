from faster_whisper import WhisperModel

def main():
    model_size = "small"

    model = WhisperModel(model_size, device="cpu", compute_type="int8")

    segments, info = model.transcribe("voice-to-text/faster-whisper/audio.m4a", beam_size=5)

    print("Detected language '%s' with probability %f" % (info.language, info.language_probability))

    for segment in segments:
        print("[%.2fs -> %.2fs] %s" % (segment.start, segment.end, segment.text))

if __name__ == "__main__":
    main()