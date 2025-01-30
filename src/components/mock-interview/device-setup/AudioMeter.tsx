import { useEffect, useRef, useState } from "react";
import { Progress } from "@/components/ui/progress";

interface AudioMeterProps {
  stream: MediaStream | null;
  isAudioWorking: boolean;
}

const AudioMeter = ({ stream, isAudioWorking }: AudioMeterProps) => {
  const [audioLevel, setAudioLevel] = useState(0);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number>();

  useEffect(() => {
    if (stream && isAudioWorking) {
      try {
        if (!audioContextRef.current) {
          audioContextRef.current = new AudioContext();
        }

        if (!analyserRef.current) {
          analyserRef.current = audioContextRef.current.createAnalyser();
          analyserRef.current.fftSize = 256;
        }

        const source = audioContextRef.current.createMediaStreamSource(stream);
        source.connect(analyserRef.current);

        const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);

        const updateAudioLevel = () => {
          if (analyserRef.current) {
            analyserRef.current.getByteFrequencyData(dataArray);
            const average = dataArray.reduce((acc, value) => acc + value, 0) / dataArray.length;
            const normalizedLevel = Math.min(100, (average / 128) * 100);
            setAudioLevel(normalizedLevel);
            animationFrameRef.current = requestAnimationFrame(updateAudioLevel);
          }
        };

        updateAudioLevel();
      } catch (error) {
        console.error("Error setting up audio meter:", error);
      }
    }

    return () => {
      if (audioContextRef.current?.state !== 'closed') {
        audioContextRef.current?.close();
      }
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [stream, isAudioWorking]);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span>麦克风状态：</span>
        <span className={isAudioWorking ? "text-green-500" : "text-red-500"}>
          {isAudioWorking ? "正常" : "未开启"}
        </span>
      </div>
      {isAudioWorking && (
        <div className="w-full">
          <Progress value={audioLevel} className="h-2" />
        </div>
      )}
    </div>
  );
};

export default AudioMeter;