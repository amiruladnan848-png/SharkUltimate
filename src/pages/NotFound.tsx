import React from 'react';
import { useNavigate } from 'react-router-dom';
import { BackgroundAnimation } from '@/components/features/BackgroundAnimation';

const NotFound: React.FC = () => {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-[#050814] flex items-center justify-center relative overflow-hidden">
      <BackgroundAnimation />
      <div className="relative z-10 text-center">
        <div className="text-[120px] font-black text-cyan-500/20 leading-none select-none">404</div>
        <h1 className="text-2xl font-bold text-white mb-2 -mt-4">Page Not Found</h1>
        <p className="text-gray-500 text-sm mb-6">This signal doesn't exist in our engine.</p>
        <button
          onClick={() => navigate('/')}
          className="px-6 py-3 rounded-xl border border-cyan-500/30 bg-cyan-500/10 text-cyan-400 font-semibold text-sm hover:bg-cyan-500/20 transition-all"
        >
          Return to Login
        </button>
      </div>
    </div>
  );
};

export default NotFound;
