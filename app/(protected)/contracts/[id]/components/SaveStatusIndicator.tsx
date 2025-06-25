import { SaveStatus } from '../types/contract';

export const SaveStatusIndicator = ({ status }: { status: SaveStatus }) => {
  if (status === 'saving') {
    return (
      <div className="flex items-center text-gray-500 text-sm">
        <span>Saving</span>
        <div className="flex ml-0.75 items-center mt-1.5">
          <div className="w-0.5 h-0.5 bg-gray-500 rounded-full animate-pulse" style={{ animationDelay: '0ms' }}></div>
          <div className="w-0.5 h-0.5 bg-gray-500 rounded-full animate-pulse ml-0.5" style={{ animationDelay: '200ms' }}></div>
          <div className="w-0.5 h-0.5 bg-gray-500 rounded-full animate-pulse ml-0.5" style={{ animationDelay: '400ms' }}></div>
        </div>
      </div>
    );
  }
  
  if (status === 'saved') {
    return (
      <div className="flex items-center text-green-600 text-sm">
        <span>Saved</span>
        <svg className="w-4 h-4 ml-1 text-green-600" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
        </svg>
      </div>
    );
  }
  
  return null;
};