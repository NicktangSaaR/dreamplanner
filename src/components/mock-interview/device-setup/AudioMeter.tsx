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
        console.log("Setting up audio meter with microphone stream");
        
        // 创建或重用 AudioContext
        if (!audioContextRef.current || audioContextRef.current.state === 'closed') {
          audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
        }

        // 创建分析器节点
        analyserRef.current = audioContextRef.current.createAnalyser();
        analyserRef.current.fftSize = 2048; // 提高精度
        analyserRef.current.smoothingTimeConstant = 0.5; // 平滑处理

        // 获取麦克风输入源
        const microphone = stream.getAudioTracks()[0];
        if (!microphone) {
          console.error("No microphone track found in stream");
          return;
        }

        console.log("Creating microphone source from track:", microphone.label);
        const source = audioContextRef.current.createMediaStreamSource(stream);
        source.connect(analyserRef.current);

        const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);

        const updateAudioLevel = () => {
          if (analyserRef.current) {
            analyserRef.current.getByteTimeDomainData(dataArray); // 使用时域数据而不是频域
            
            // 计算音频电平 - 使用 RMS (Root Mean Square) 计算
            let sum = 0;
            for (let i = 0; i < dataArray.length; i++) {
              const amplitude = (dataArray[i] - 128) / 128; // 转换为 -1 到 1 的范围
              sum += amplitude * amplitude;
            }
            const rms = Math.sqrt(sum / dataArray.length);
            const normalizedLevel = Math.min(100, rms * 400); // 调整灵敏度
            
            setAudioLevel(normalizedLevel);
            animationFrameRef.current = requestAnimationFrame(updateAudioLevel);
          }
        };

        updateAudioLevel();
        console.log("Audio meter setup complete for microphone input");
      } catch (error) {
        console.error("Error setting up audio meter:", error);
      }
    }

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close().catch(console.error);
      }
      console.log("Audio meter cleanup complete");
    };
  }, [stream, isAudioWorking]);

  if (!isAudioWorking) {
    return null;
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span>麦克风音量</span>
        <span className="text-sm text-gray-500">{Math.round(audioLevel)}%</span>
      </div>
      <Progress value={audioLevel} className="h-2" />
    </div>
  );
};

export default AudioMeter;