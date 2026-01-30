import React, { useState, useRef, useEffect } from "react";

const VoiceRecorder = ({ onTranscript }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [audioBlob, setAudioBlob] = useState(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);

  // Check if browser supports speech recognition
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  const recognitionRef = useRef(null);

  useEffect(() => {
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = "en-US";

      recognition.onresult = (event) => {
        let interimTranscript = "";
        let finalTranscript = "";

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcript + " ";
          } else {
            interimTranscript += transcript;
          }
        }

        setTranscript(finalTranscript || interimTranscript);
      };

      recognition.onerror = (event) => {
        console.error("Speech recognition error:", event.error);
      };

      recognitionRef.current = recognition;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: "audio/wav" });
        setAudioBlob(audioBlob);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);

      // Start speech recognition if available
      if (recognitionRef.current) {
        recognitionRef.current.start();
      }
    } catch (error) {
      console.error("Error starting recording:", error);
      alert("Microphone access denied. Please enable microphone permissions.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }

    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
  };

  const handleSave = () => {
    if (transcript && onTranscript) {
      onTranscript(transcript);
      setTranscript("");
      setAudioBlob(null);
    }
  };

  const playAudio = () => {
    if (audioBlob) {
      const audioUrl = URL.createObjectURL(audioBlob);
      const audio = new Audio(audioUrl);
      audio.play();
    }
  };

  return (
    <div style={{ padding: "20px", background: "var(--bg-secondary)", borderRadius: "4px" }}>
      <h3 style={{ marginBottom: "15px", color: "var(--text-primary)" }}>Voice Recorder</h3>
      
      {!SpeechRecognition && (
        <div style={{ padding: "10px", background: "#ffeb3b", borderRadius: "4px", marginBottom: "10px", fontSize: "12px" }}>
          Speech recognition not supported in this browser. Audio recording only.
        </div>
      )}

      <div style={{ marginBottom: "15px" }}>
        <button
          onClick={isRecording ? stopRecording : startRecording}
          style={{
            padding: "10px 20px",
            background: isRecording ? "#f44336" : "#4CAF50",
            color: "white",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer",
            fontSize: "16px",
            marginRight: "10px"
          }}
        >
          {isRecording ? "⏹ Stop" : "🎤 Start Recording"}
        </button>

        {audioBlob && (
          <button
            onClick={playAudio}
            style={{
              padding: "10px 20px",
              background: "#2196F3",
              color: "white",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer"
            }}
          >
            ▶ Play
          </button>
        )}
      </div>

      {transcript && (
        <div style={{ marginBottom: "15px" }}>
          <textarea
            value={transcript}
            onChange={(e) => setTranscript(e.target.value)}
            placeholder="Transcript will appear here..."
            style={{
              width: "100%",
              minHeight: "100px",
              padding: "10px",
              border: "1px solid var(--border-color)",
              borderRadius: "4px",
              background: "var(--bg-tertiary)",
              color: "var(--text-primary)"
            }}
          />
        </div>
      )}

      {transcript && (
        <button
          onClick={handleSave}
          style={{
            padding: "8px 16px",
            background: "#f5ba13",
            color: "white",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer"
          }}
        >
          Save as Note Content
        </button>
      )}
    </div>
  );
};

export default VoiceRecorder;

