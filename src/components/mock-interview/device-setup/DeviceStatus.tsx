interface DeviceStatusProps {
  label: string;
  isWorking: boolean;
}

const DeviceStatus = ({ label, isWorking }: DeviceStatusProps) => {
  return (
    <div className="flex items-center justify-between">
      <span>{label}状态：</span>
      <span className={isWorking ? "text-green-500" : "text-red-500"}>
        {isWorking ? "正常" : "未开启"}
      </span>
    </div>
  );
};

export default DeviceStatus;