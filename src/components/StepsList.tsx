import React from 'react';
import { CheckCircle, Circle, AlertCircle, Loader } from 'lucide-react';
import { Step } from '../types';

interface StepsListProps {
  steps: Step[];
}

const StepIcon = ({ status }: { status: Step['status'] }) => {
  switch (status) {
    case 'completed':
      return <CheckCircle className="text-green-500" size={20} />;
    case 'processing':
      return <Loader className="text-blue-500 animate-spin" size={20} />;
    case 'error':
      return <AlertCircle className="text-red-500" size={20} />;
    default:
      return <Circle className="text-gray-500" size={20} />;
  }
};

export const StepsList: React.FC<StepsListProps> = ({ steps }) => {
  return (
    <div className="h-full bg-gray-900 border-r border-gray-700">
      <div className="p-2 border-b border-gray-700">
        <h2 className="text-gray-300 font-semibold">Build Steps</h2>
      </div>
      <div className="p-4">
        {steps.map((step) => (
          <div key={step.id} className="mb-4 flex items-start">
            <div className="mr-3 mt-1">
              <StepIcon status={step.status} />
            </div>
            <div>
              <h3 className="text-gray-300 font-medium">{step.title}</h3>
              <p className="text-gray-500 text-sm">{step.description}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};