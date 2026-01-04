
import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { LogOut, Settings, User as UserIcon, BookOpen, FileText, Video, MessageSquare } from 'lucide-react';
import { User } from '../types';

interface LayoutProps {
  children: React.ReactNode;
  currentUser: User | null;
  brandName: string;
  copyrightText: string;
  onLogout: () => void;
  canAccess: boolean;
}

export const Navbar: React.FC<LayoutProps> = ({ currentUser, brandName, onLogout, canAccess }) => {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 glass shadow-2xl">
      <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
        <Link to="/" className="text-2xl font-black text-white flex items-center gap-2 group">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-[10px] font-bold group-hover:scale-110 transition-transform">
            {brandName.substring(0, 2)}
          </div>
          <span className="uppercase tracking-[0.2em] text-lg font-bold">{brandName}</span>
        </Link>
        <div className="hidden md:flex items-center gap-1">
          <Link to="/intro" className="flex items-center gap-2 px-4 py-2 rounded-xl text-gray-400 hover:text-white hover:bg-white/10 transition-all">
            <UserIcon size={18} /> <span className="font-medium">강사 소개</span>
          </Link>
          {canAccess && (
            <>
              <Link to="/content" className="flex items-center gap-2 px-4 py-2 rounded-xl text-gray-400 hover:text-white hover:bg-white/10 transition-all">
                <BookOpen size={18} /> <span className="font-medium">컨텐츠</span>
              </Link>
              <Link to="/resources" className="flex items-center gap-2 px-4 py-2 rounded-xl text-gray-400 hover:text-white hover:bg-white/10 transition-all">
                <FileText size={18} /> <span className="font-medium">자료실</span>
              </Link>
              <Link to="/videos" className="flex items-center gap-2 px-4 py-2 rounded-xl text-gray-400 hover:text-white hover:bg-white/10 transition-all">
                <Video size={18} /> <span className="font-medium">복습 영상</span>
              </Link>
              <Link to="/qna" className="flex items-center gap-2 px-4 py-2 rounded-xl text-gray-400 hover:text-white hover:bg-white/10 transition-all">
                <MessageSquare size={18} /> <span className="font-medium">Q&A</span>
              </Link>
            </>
          )}
          {currentUser?.status === 'admin' && (
            <Link to="/admin" className="flex items-center gap-2 px-4 py-2 rounded-xl text-gray-400 hover:text-white hover:bg-white/10 transition-all">
              <Settings size={18} /> <span className="font-medium">관리자</span>
            </Link>
          )}
        </div>
        {currentUser ? (
          <div className="flex items-center gap-4">
            <div className="hidden sm:block text-right">
              <p className="text-[10px] font-bold text-blue-400 uppercase leading-none mb-1">{currentUser.status}</p>
              <p className="text-sm font-medium">{currentUser.name} 님</p>
            </div>
            <button onClick={onLogout} className="p-2.5 rounded-full bg-white/5 hover:bg-white/20 transition-colors">
              <LogOut size={20} />
            </button>
          </div>
        ) : (
          <Link to="/login" className="px-6 py-2.5 bg-blue-600 rounded-2xl font-black shadow-lg hover:bg-blue-500 transition-colors">
            로그인
          </Link>
        )}
      </div>
    </nav>
  );
};

export const Footer: React.FC<{ copyrightText: string }> = ({ copyrightText }) => (
  <footer className="mt-20 py-10 border-t border-white/5 text-center text-gray-500 text-sm">
    <div className="max-w-7xl mx-auto px-6">
      <p className="whitespace-pre-wrap font-medium">{copyrightText}</p>
    </div>
  </footer>
);
