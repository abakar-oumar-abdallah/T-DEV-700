import React from 'react';

interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: number;
  bgColor: string;
  iconColor: string;
}

export default function StatCard({ icon, label, value, bgColor, iconColor }: StatCardProps) {
  return (
    <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
      <div className="flex items-center justify-between mb-4">
        <div className={`w-12 h-12 rounded-full ${bgColor} flex items-center justify-center`}>
          <div className={iconColor}>
            {icon}
          </div>
        </div>
      </div>
      <h3 className="text-gray-600 text-sm font-medium mb-1">{label}</h3>
      <p className="text-3xl font-bold text-gray-900">{value}</p>
    </div>
  );
}