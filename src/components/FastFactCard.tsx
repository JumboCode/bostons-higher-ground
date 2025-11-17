import React from 'react';

interface FastFactCardProps {
  title: string;
  statistic: string | number;
  description: string;
  bgColor: string; 
}

const FastFactCard: React.FC<FastFactCardProps> = ({ title, statistic, description, bgColor }) => {
  return (
    
    <div className={`p-6 rounded-xl w-72 h-44 ${bgColor}`}>
      <p className="text-gray-700 font-medium text-lg">{title}</p>
      <p className="text-5xl font-bold">{statistic}</p>
      <p className="text-gray-500 text-sm">{description}</p>
    </div>
  );
};

export default FastFactCard;