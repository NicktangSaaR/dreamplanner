
import React from "react";

interface StatusBadgeProps {
  status: string;
}

export const StatusBadge = ({ status }: StatusBadgeProps) => {
  // Helper function to get status color
  const getStatusColor = (statusValue: string) => {
    switch (statusValue) {
      case "Pre-9":
        return "bg-blue-100 text-blue-800";
      case "G9":
        return "bg-purple-100 text-purple-800";
      case "G10":
        return "bg-indigo-100 text-indigo-800";
      case "G11":
        return "bg-orange-100 text-orange-800";
      case "College Bound":
        return "bg-pink-100 text-pink-800";
      case "Completed":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <span className={`text-xs px-2 py-0.5 rounded-full ${getStatusColor(status)}`}>
      {status}
    </span>
  );
};
