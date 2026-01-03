import React, { useState, useEffect, useRef } from 'react';
import { 
  HashRouter as Router, 
  Routes, 
  Route, 
  Link
} from 'react-router-dom';
import { 
  User as UserIcon, 
  LogOut, 
  BookOpen, 
  Video, 
  FileText, 
  MessageSquare, 
  Settings, 
  CheckCircle, 
  XCircle, 
  X,
  Plus, 
  Download, 
  Play, 
  UserCheck, 
  ChevronRight,
  Layout,
  ImageIcon,
  Globe,
  UploadCloud,
  Youtube,
  ShieldCheck,
  Trash2,
  Send,
  Sparkles,
  Save,
  Award,
  Upload,
  Image as ImageLink,
  ExternalLink,
  History,
  Info,
  Clock,
  UserCircle
} from 'lucide-react';
import { 
  collection, 
  doc, 
  onSnapshot, 
  setDoc, 
  updateDoc, 
  deleteDoc,
  arrayUnion,
  query,
  orderBy,
  getDocs,
  where,
  serverTimestamp,
  getDoc
} from "firebase/firestore";
import { db, auth } from './firebase';
import { onAuthStateChanged, signOut } from "firebase/auth";
import CryptoJS from 'crypto-js';
import { 
  User as UserType, 
  UserStatus, 
  CourseContent, 
  ResourceFile, 
  ReviewVideo, 
  QnAPost,
  InstructorInfo,
  AnalyticsData,
  UserActivity
} from './types';
import { generateSlogan } from './services/geminiService';

// --- HELPERS ---
const extractYoutubeId = (url: string) => {
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
  const match = url.match(regExp);
  return (match && match[2].length === 11) ? match[2] : null;
};

// --- CONSTANTS ---
const DEFAULT_INSTRUCTOR: InstructorInfo = {
  name: "강사 성함",
  role: "대표 강사 / 교육 전문가",
  profileImageUrl: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=400",
  bio: "수강생 여러분의 무한한 성장을 위해 최고의 교육 환경을 제공합니다.",
  achievements: ["주요 학력 및 경력 1", "주요 학력 및 경력 2", "주요 저서 및 연구"]
};

// --- UI COMPONENTS ---
const NavItem: React.FC<{ to: string; icon: React.ReactNode; label: string }> = ({ to, icon, label }) => (
  <Link 
    to={to} 
    className="flex items-center gap-2 px-4 py-2 rounded-xl transition-all text-gray-400 hover:text-white hover:bg-white/10"
  >
    {icon}
    <span className="font-medium">{label}</span>
  </Link>
);

const SectionTitle: React.FC<{ title: string; subtitle?: string }> = ({ title, subtitle }) => (
  <div className="mb-8">
    <h2 className="text-3xl font-bold text-white tracking-tight">{title}</h2>
    {subtitle && <p className="text-blue-400/80 font-medium mt-2">{subtitle}</p>}
  </div>
);

const AccessDenied = () => (
  <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
    <div className="w-20 h-20 bg-red-500/20 text-red-400 rounded-full flex items-center justify-center mb-6">
      <XCircle size={48} />
    </div>
    <h2 className="text-3xl font-bold mb-4">접근 제한됨</h2>
    <p className="text-gray-400 max-w-md">이 페이지는 승인된 수강생 전용입니다. 로그인을 먼저 진행해주세요.</p>
    <Link to="/login" className="mt-8 px-8 py-3 bg-white text-indigo-900 font-bold rounded-xl hover:bg-gray-100 transition">로그인 페이지로 이동</Link>
  </div>
);

// --- PAGES ---
const Home: React.FC<{ instructorSlogan: string; heroImageUrl: string }> = ({ instructorSlogan, heroImageUrl }) => (
  <div className="relative w-full h-[100vh] -mt-28 flex items-center justify-center overflow-hidden">
    <div className="absolute inset-0 bg-cover bg-center transition-all duration-1000" style={{ backgroundImage: `url(${heroImageUrl})` }}>
      <div className="absolute inset-0 hero-overlay"></div>
    </div>
    <div className="relative z-10 max-w-5xl mx-auto px-6 text-center">
      <div className="mb-6 inline-block px-4 py-1.5 rounded-full bg-blue-500/20 border border-blue-500/30 backdrop-blur-sm animate-fade-in-up">
        <span className="text-blue-400 text-sm font-bold tracking-widest uppercase">Premium Learning Experience</span>
      </div>
      <h1 className="text-5xl md:text-8xl font-script text-white mb-8 drop-shadow-[0_10px_30px_rgba(0,0,0,0.6)] leading-[1.2] animate-fade-in-up">
        {instructorSlogan || "The Future Belongs to You"}
      </h1>
    </div>
  </div>
);

const InstructorIntro: React.FC<{ info: InstructorInfo }> = ({ info }) => (
  <div className="max-w-5xl mx-auto py-12 px-4">
    <SectionTitle title="강사 소개" subtitle={info.role} />
    <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-start">
      <div className="glass-card p-4 rounded-3xl overflow-hidden shadow-2xl animate-fade-in-up">
        <img src={info.profileImageUrl} alt="Profile" className="w-full rounded-2xl object-cover aspect-[4/5]" />
      </div>
      <div className="space-y-8 animate-fade-in-up">
        <div className="glass-card p-8 rounded-3xl">
          <h3 className="text-2xl font-bold mb-4 flex items-center gap-2 text-blue-400"><UserCheck size={24} /> 주요 약력 및 소개</h3>
          <p className="text-gray-300 leading-relaxed mb-6 whitespace-pre-wrap">{info.bio}</p>
          <div className="space-y-3">
            {info.achievements.map((item, i) => (
              <div key={i} className="flex gap-3 items-start text-gray-200">
                <CheckCircle size={18} className="text-blue-500 mt-1 flex-shrink-0" />
                <span>{item}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  </div>
);

const ContentIntro: React.FC<{ contents: CourseContent[] }> = ({ contents }) => (
  <div className="max-w-6xl mx-auto py-12 px-4">
    <SectionTitle title="컨텐츠 소개" subtitle="빈틈없는 학습을 위한 고퀄리티 커리큘럼" />
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
      {contents.map((c) => (
        <div key={c.id} className="glass-card rounded-3xl overflow-hidden group animate-fade-in-up">
          <div className="h-48 overflow-hidden">
            <img src={c.imageUrl} alt={c.title} className="w-full h-full object-cover transition duration-500 group-hover:scale-110" />
          </div>
          <div className="p-6">
            <h4 className="text-xl font-bold mb-3">{c.title}</h4>
            <p className="text-gray-400 text-sm leading-relaxed mb-4">{c.description}</p>
            <button className="text-blue-400 text-sm font-semibold flex items-center gap-1 hover:underline">상세 커리큘럼 보기 <ChevronRight size={16} /></button>
          </div>
        </div>
      ))}
      {contents.length === 0 && <p className="col-span-full text-center py-20 text-gray-500">등록된 컨텐츠가 없습니다.</p>}
    </div>
  </div>
);

const Resources: React.FC<{ resources: ResourceFile[]; onDownload: (resourceId: string, resourceName: string) => void }> = ({ resources, onDownload }) => (
  <div className="max-w-4xl mx-auto py-12 px-4">
    <SectionTitle title="자료실" subtitle="효율적인 복습과 실력 향상을 위한 교재 및 자료" />
    <div className="space-y-4">
      {resources.map((r) => (
        <div key={r.id} className="glass-card p-6 rounded-2xl flex items-center justify-between group animate-fade-in-up">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-indigo-500/20 flex items-center justify-center text-indigo-400">
              <FileText size={24} />
            </div>
            <div>
              <p className="font-bold text-white group-hover:text-blue-400 transition">{r.name}</p>
              <p className="text-xs text-gray-500 mt-1">{r.description} | {r.date}</p>
            </div>
          </div>
          <a 
            href={r.url} 
            download={r.name}
            onClick={() => onDownload(r.id, r.name)}
            className="p-3 rounded-full bg-white/5 hover:bg-white/20 transition text-gray-300"
          >
            <Download size={20} />
          </a>
        </div>
      ))}
      {resources.length === 0 && <p className="text-center py-20 text-gray-500">등록된 자료가 없습니다.</p>}
    </div>
  </div>
);

const ReviewVideos: React.FC<{ videos: ReviewVideo[]; onWatch: (videoId: string, videoTitle: string) => void }> = ({ videos, onWatch }) => (
  <div className="max-w-5xl mx-auto py-12 px-4">
    <SectionTitle title="복습 영상" subtitle="언제든 다시 꺼내보는 1:1 맞춤 피드백 영상" />
    <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
      {videos.map((v) => (
        <div key={v.id} className="space-y-4 animate-fade-in-up">
          <div className="aspect-video rounded-3xl overflow-hidden glass shadow-2xl relative group">
             <iframe 
                width="100%" 
                height="100%" 
                src={`https://www.youtube.com/embed/${v.youtubeId}`} 
                title={v.title} 
                onLoad={() => onWatch(v.id, v.title)}
                frameBorder="0" 
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                allowFullScreen
              ></iframe>
              <a 
                href={`https://www.youtube.com/watch?v=${v.youtubeId}`} 
                target="_blank" 
                rel="noopener noreferrer"
                className="absolute top-4 right-4 p-2 bg-black/60 text-white rounded-lg opacity-0 group-hover:opacity-100 transition hover:bg-black/80 flex items-center gap-2 text-xs font-bold"
              >
                <Youtube size={16} className="text-red-500" /> 유튜브에서 보기 <ExternalLink size={12} />
              </a>
          </div>
          <div className="glass-card p-6 rounded-2xl">
            <h4 className="text-lg font-bold mb-2 flex items-center gap-2"><Play size={18} className="text-red-500" /> {v.title}</h4>
            <p className="text-sm text-gray-400">{v.description}</p>
          </div>
        </div>
      ))}
      {videos.length === 0 && <p className="col-span-full text-center py-20 text-gray-500">등록된 영상이 없습니다.</p>}
    </div>
  </div>
);

const QnA: React.FC<{ qna: QnAPost[]; onAddQuestion: (title: string, content: string) => void }> = ({ qna, onAddQuestion }) => {
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (title.trim() && content.trim()) {
      onAddQuestion(title, content);
      setTitle(''); setContent(''); setShowForm(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-12 px-4">
      <div className="flex justify-between items-end mb-8">
        <SectionTitle title="Q&A 게시판" subtitle="막히는 부분이 있다면 망설이지 말고 질문하세요." />
        <button 
          onClick={() => setShowForm(!showForm)}
          className="px-6 py-2 bg-indigo-600 rounded-xl hover:bg-indigo-500 transition flex items-center gap-2 font-bold mb-8"
        >
          {showForm ? <X size={18} /> : <Plus size={18} />} {showForm ? '닫기' : '질문 작성'}
        </button>
      </div>

      {showForm && (
        <div className="glass-card p-8 rounded-3xl mb-12 animate-fade-in-up">
          <form onSubmit={handleSubmit} className="space-y-4">
            <input className="w-full bg-white/5 border border-white/10 px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="질문 제목" value={title} onChange={e => setTitle(e.target.value)} required />
            <textarea className="w-full bg-white/5 border border-white/10 px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 h-32" placeholder="궁금한 내용을 입력하세요" value={content} onChange={e => setContent(e.target.value)} required />
            <button type="submit" className="w-full bg-blue-600 py-3 rounded-xl font-bold hover:bg-blue-500 transition">질문 등록하기</button>
          </form>
        </div>
      )}

      <div className="space-y-6">
        {qna.map((post) => (
          <div key={post.id} className="glass-card p-8 rounded-3xl group animate-fade-in-up">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h4 className="text-xl font-bold mb-1">{post.title}</h4>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-500">{post.author}</span>
                  <span className="text-[10px] text-gray-600">•</span>
                  <span className="text-xs text-gray-500">{post.date}</span>
                </div>
              </div>
              {post.replies.length > 0 ? (
                <span className="bg-green-500/10 text-green-400 text-[10px] font-bold px-3 py-1 rounded-full border border-green-500/20 uppercase">Replied</span>
              ) : (
                <span className="bg-amber-500/10 text-amber-400 text-[10px] font-bold px-3 py-1 rounded-full border border-amber-500/20 uppercase">Pending</span>
              )}
            </div>
            <p className="text-gray-300 leading-relaxed mb-6 whitespace-pre-wrap">{post.content}</p>
            {post.replies.map(reply => (
              <div key={reply.id} className="mt-6 p-6 bg-white/5 rounded-2xl border-l-4 border-blue-500">
                <div className="flex items-center gap-2 mb-2">
                  <p className="text-xs font-bold text-blue-400">강사님 답변</p>
                  <span className="text-[10px] text-gray-600">•</span>
                  <p className="text-[10px] text-gray-500">{reply.date}</p>
                </div>
                <p className="text-gray-300 text-sm whitespace-pre-wrap">{reply.content}</p>
              </div>
            ))}
          </div>
        ))}
        {qna.length === 0 && <div className="text-center py-20 text-gray-500">등록된 질문이 없습니다.</div>}
      </div>
    </div>
  );
};

const Login: React.FC<{ onLogin: (name: string, phone: string, academy: string, isAdmin: boolean, isSignUp: boolean) => void }> = ({ onLogin }) => {
  const [isAdmin, setIsAdmin] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [formData, setFormData] = useState({ name: '', phone: '', academy: '', password: '' });
  const [isFirstSetup, setIsFirstSetup] = useState(false);

  useEffect(() => {
    const checkPassword = async () => {
      const docSnap = await getDoc(doc(db, "settings", "adminPassword"));
      setIsFirstSetup(!docSnap.exists());
    };
    checkPassword();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (isAdmin) {
      if (isFirstSetup) {
        if (formData.password.length < 8) {
          alert("비밀번호는 8자 이상이어야 합니다.");
          return;
        }
        if (window.confirm("관리자 비밀번호를 설정하시겠습니까?")) {
          await setDoc(doc(db, "settings", "adminPassword"), { hash: CryptoJS.SHA256(formData.password).toString() });
          onLogin('관리자', '', '', true, false);
        }
        return;
      }

      const docSnap = await getDoc(doc(db, "settings", "adminPassword"));
      if (docSnap.exists()) {
        const savedHash = docSnap.data().hash;
        const inputHash = CryptoJS.SHA256(formData.password).toString();
        if (savedHash === inputHash) {
          onLogin('관리자', '', '', true, false);
        } else {
          alert("비밀번호가 틀렸습니다.");
        }
      }
      return;
    }

    onLogin(formData.name, formData.phone, formData.academy, false, isSignUp);
  };

  return (
    <div className="flex items-center justify-center min-h-[80vh] px-4">
      <div className="glass-card p-10 rounded-[2.5rem] w-full max-w-md shadow-2xl">
        <div className="flex p-1 bg-white/5 rounded-2xl mb-8">
          <button onClick={() => { setIsAdmin(false); setIsSignUp(false); }} className={`flex-1 py-3 rounded-xl font-bold transition-all ${!isAdmin ? 'bg-white text-indigo-950 shadow-lg' : 'text-gray-400'}`}>
            수강생
          </button>
          <button onClick={() => { setIsAdmin(true); setIsSignUp(false); }} className={`flex-1 py-3 rounded-xl font-bold transition-all ${isAdmin ? 'bg-white text-indigo-950 shadow-lg' : 'text-gray-400'}`}>
            관리자
          </button>
        </div>

        <h2 className="text-3xl font-black mb-8 text-center text-white">
          {isAdmin ? (isFirstSetup ? '관리자 비번 설정' : '관리자 로그인') : (isSignUp ? '회원가입 신청' : '로그인')}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-6">
          {!isAdmin && (
            <>
              <input type="text" required placeholder="성함" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full bg-white/5 border border-white/10 px-5 py-4 rounded-2xl text-white outline-none focus:ring-2 focus:ring-blue-500" />
              <input type="tel" required placeholder="전화번호" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} className="w-full bg-white/5 border border-white/10 px-5 py-4 rounded-2xl text-white outline-none focus:ring-2 focus:ring-blue-500" />
              {isSignUp && <input type="text" placeholder="소속 학원" value={formData.academy} onChange={e => setFormData({...formData, academy: e.target.value})} className="w-full bg-white/5 border border-white/10 px-5 py-4 rounded-2xl text-white outline-none focus:ring-2 focus:ring-blue-500" />}
            </>
          )}
          {isAdmin && (
            <input 
              type="password" 
              required 
              placeholder={isFirstSetup ? "새 비밀번호 (8자 이상)" : "비밀번호 입력"} 
              value={formData.password} 
              onChange={e => setFormData({...formData, password: e.target.value})} 
              className="w-full bg-white/5 border border-white/10 px-5 py-4 rounded-2xl text-white outline-none focus:ring-2 focus:ring-blue-500" 
            />
          )}
          <button type="submit" className="w-full bg-white text-indigo-950 font-black py-4 rounded-2xl shadow-xl active:scale-95 transition">
            {isAdmin ? (isFirstSetup ? '비밀번호 설정 완료' : '관리자 로그인') : (isSignUp ? '회원가입 신청' : '로그인')}
          </button>
          {!isAdmin && (
            <button type="button" onClick={() => setIsSignUp(!isSignUp)} className="w-full text-center text-sm text-blue-400 font-bold hover:text-blue-300">
              {isSignUp ? '이미 계정이 있나요? 로그인' : '처음이신가요? 회원가입 신청'}
            </button>
          )}
        </form>
      </div>
    </div>
  );
};

// --- ADMIN PANEL ---
const AdminPanel: React.FC<{
  users: UserType[];
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
  brandName: string;
  setBrandName: (v: string) => void;
  heroImageUrl: string;
  setHeroImageUrl: (v: string) => void;
  instructorSlogan: string;
  setInstructorSlogan: (v: string) => void;
  copyrightText: string;
  setCopyrightText: (v: string) => void;
  instructorInfo: InstructorInfo;
  setInstructorInfo: (v: InstructorInfo) => void;
  contents: CourseContent[];
  onAddContent: (c: Omit<CourseContent, 'id'>) => void;
  onDeleteContent: (id: string) => void;
  resources: ResourceFile[];
  onAddResource: (r: Omit<ResourceFile, 'id' | 'date'>) => void;
  onDeleteResource: (id: string) => void;
  videos: ReviewVideo[];
  onAddVideo: (v: Omit<ReviewVideo, 'id'>) => void;
  onDeleteVideo: (id: string) => void;
  qna: QnAPost[];
  onAddReply: (id: string, content: string) => void;
  analytics: AnalyticsData;
}> = ({
  users, onApprove, onReject, brandName, setBrandName, heroImageUrl, setHeroImageUrl, instructorSlogan, setInstructorSlogan,
  copyrightText, setCopyrightText, instructorInfo, setInstructorInfo, contents, onAddContent, onDeleteContent, resources, onAddResource, onDeleteResource,
  videos, onAddVideo, onDeleteVideo, qna, onAddReply, analytics
}) => {
  const [activeTab, setActiveTab] = useState('users');
  const [newContent, setNewContent] = useState({ title: '', description: '', imageUrl: '' });
  const [newResource, setNewResource] = useState({ name: '', description: '', url: '' });
  const [newVideo, setNewVideo] = useState({ title: '', description: '', youtubeUrl: '' });
  const [replyText, setReplyText] = useState<{ [key: string]: string }>({});
  
  const contentFileRef = useRef<HTMLInputElement>(null);
  const instructorFileRef = useRef<HTMLInputElement>(null);
  const resourceFileRef = useRef<HTMLInputElement>(null);
  const heroFileRef = useRef<HTMLInputElement>(null);

  const [editInstructor, setEditInstructor] = useState<InstructorInfo>(instructorInfo);

  useEffect(() => {
    setEditInstructor(instructorInfo);
  }, [instructorInfo]);

  const handleAiSlogan = async () => {
    const slogan = await generateSlogan("최고의 강사, 성적 향상, 밀착 관리");
    setInstructorSlogan(slogan);
  };

  const handleSaveInstructor = () => {
    setInstructorInfo(editInstructor);
    alert("강사 정보가 성공적으로 업데이트되었습니다.");
  };

  const handleAddAchievement = () => {
    setEditInstructor({
      ...editInstructor,
      achievements: [...editInstructor.achievements, ""]
    });
  };

  const handleUpdateAchievement = (index: number, val: string) => {
    const updated = [...editInstructor.achievements];
    updated[index] = val;
    setEditInstructor({ ...editInstructor, achievements: updated });
  };

  const handleRemoveAchievement = (index: number) => {
    const updated = editInstructor.achievements.filter((_, i) => i !== index);
    setEditInstructor({ ...editInstructor, achievements: updated });
  };

  const handleFileAsBase64 = (e: React.ChangeEvent<HTMLInputElement>, callback: (base64: string) => void) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        callback(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleResourceUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setNewResource({ 
          ...newResource, 
          url: reader.result as string, 
          name: file.name 
        });
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="max-w-7xl mx-auto py-12 px-4 space-y-8">
      <SectionTitle title="Admin Dashboard" subtitle="실시간 페이지 관리 및 통계" />
      <div className="flex flex-wrap gap-2 mb-8 bg-white/5 p-1.5 rounded-2xl w-fit">
        {['users', 'branding', 'instructor', 'contents', 'resources', 'videos', 'qna', 'stats'].map(tab => (
          <button 
            key={tab} 
            onClick={() => setActiveTab(tab)} 
            className={`px-5 py-2 rounded-xl font-bold transition-all ${activeTab === tab ? 'bg-blue-600 text-white shadow-lg' : 'text-gray-400 hover:bg-white/10'}`}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      <div className="animate-in fade-in duration-500">
        {activeTab === 'users' && (
          <div className="glass-card p-8 rounded-3xl space-y-4">
            <h3 className="text-xl font-bold flex items-center gap-2"><UserCheck /> 수강 신청 승인</h3>
            {users.filter(u => u.status === 'pending').map(user => (
              <div key={user.id} className="bg-white/5 p-4 rounded-2xl flex justify-between items-center group">
                <div>
                  <p className="font-bold">{user.name}</p>
                  <p className="text-sm text-gray-500">{user.academy} | {user.phone}</p>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => onApprove(user.id)} className="px-4 py-2 bg-green-600 text-white rounded-xl font-bold hover:bg-green-500 transition shadow-lg">승인</button>
                  <button onClick={() => onReject(user.id)} className="px-4 py-2 bg-red-600/20 text-red-400 rounded-xl font-bold hover:bg-red-500 hover:text-white transition">거절</button>
                </div>
              </div>
            ))}
            {users.filter(u => u.status === 'pending').length === 0 && <p className="text-gray-500 text-center py-8">대기 중인 신청이 없습니다.</p>}
          </div>
        )}

        {activeTab === 'branding' && (
          <div className="glass-card p-8 rounded-3xl space-y-8">
            <h3 className="text-xl font-bold flex items-center gap-2"><Layout /> 브랜딩 설정</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-6">
                <div>
                  <label className="text-xs text-gray-500 block mb-1">사이트 명칭</label>
                  <input className="w-full bg-white/5 border border-white/10 px-4 py-3 rounded-xl" value={brandName} onChange={e => setBrandName(e.target.value)} />
                </div>
                <div>
                  <label className="text-xs text-gray-500 block mb-1">메인 슬로건</label>
                  <div className="flex gap-2">
                    <input className="flex-1 bg-white/5 border border-white/10 px-4 py-3 rounded-xl" value={instructorSlogan} onChange={e => setInstructorSlogan(e.target.value)} />
                    <button onClick={handleAiSlogan} className="p-3 bg-indigo-600 rounded-xl hover:bg-indigo-500 transition shadow-lg"><Sparkles size={18} /></button>
                  </div>
                </div>
                <div>
                  <label className="text-xs text-gray-500 block mb-1 font-bold">하단 저작권 정보 (Copyright Text)</label>
                  <textarea 
                    className="w-full bg-white/5 border border-white/10 px-4 py-3 rounded-xl h-24" 
                    placeholder="예: © 2024 Elite Hub. All rights reserved." 
                    value={copyrightText} 
                    onChange={e => setCopyrightText(e.target.value)} 
                  />
                  <p className="text-[10px] text-gray-500 mt-1 italic">페이지 하단에 상시 노출되는 텍스트입니다.</p>
                </div>
              </div>
              <div className="space-y-6">
                <div>
                  <label className="text-xs text-gray-500 block mb-1 font-bold uppercase tracking-wider">메인 배경 사진 직접 업로드</label>
                  <div className="flex gap-4 items-center mt-2">
                    <div className="w-40 h-24 rounded-2xl overflow-hidden glass border-2 border-white/20 flex-shrink-0 relative group">
                       <img src={heroImageUrl} alt="Hero Preview" className="w-full h-full object-cover" />
                       <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition">
                         <ImageIcon size={24} />
                       </div>
                    </div>
                    <div className="flex flex-col gap-2 flex-1">
                      <button 
                        onClick={() => heroFileRef.current?.click()}
                        className="w-full px-4 py-3 bg-indigo-600 hover:bg-indigo-500 rounded-xl transition flex items-center justify-center gap-2 font-bold text-sm shadow-xl"
                      >
                        <Upload size={16} /> 배경 사진 업로드
                      </button>
                      <input 
                        type="file" 
                        ref={heroFileRef} 
                        className="hidden" 
                        accept="image/*" 
                        onChange={(e) => handleFileAsBase64(e, (b) => setHeroImageUrl(b))} 
                      />
                      <p className="text-[10px] text-gray-500">팁: 고화질 가로형 이미지를 권장합니다.</p>
                    </div>
                  </div>
                </div>
                <div className="p-4 bg-white/5 rounded-2xl border border-white/10">
                  <p className="text-xs text-gray-400 flex items-center gap-2 mb-2 font-bold"><Info size={14} className="text-blue-400" /> 실시간 반영</p>
                  <p className="text-xs text-gray-500 leading-relaxed">사이트 명칭, 슬로건, 배경 사진은 변경 즉시 메인 페이지에 반영됩니다.</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'instructor' && (
          <div className="glass-card p-8 rounded-3xl space-y-8">
            <h3 className="text-xl font-bold flex items-center gap-2"><UserCheck /> 강사 정보 관리</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-4">
                <div>
                  <label className="text-xs text-gray-500 block mb-1">강사 성함</label>
                  <input className="w-full bg-white/5 border border-white/10 px-4 py-3 rounded-xl" 
                    value={editInstructor.name} onChange={e => setEditInstructor({...editInstructor, name: e.target.value})} />
                </div>
                <div>
                  <label className="text-xs text-gray-500 block mb-1 uppercase tracking-wider font-bold">프로필 사진 업로드</label>
                  <div className="flex gap-4 items-center mt-2">
                    <div className="w-24 h-24 rounded-2xl overflow-hidden glass border-2 border-white/20 flex-shrink-0 relative group">
                       <img src={editInstructor.profileImageUrl} alt="Preview" className="w-full h-full object-cover" />
                    </div>
                    <button 
                      onClick={() => instructorFileRef.current?.click()}
                      className="px-4 py-3 bg-white/10 hover:bg-white/20 rounded-xl transition flex items-center justify-center gap-2 font-bold text-sm"
                    >
                      <Upload size={16} /> 사진 선택
                    </button>
                    <input type="file" ref={instructorFileRef} className="hidden" accept="image/*" onChange={(e) => handleFileAsBase64(e, (b) => setEditInstructor({...editInstructor, profileImageUrl: b}))} />
                  </div>
                </div>
                <div>
                  <label className="text-xs text-gray-500 block mb-1">소개글 (Bio)</label>
                  <textarea className="w-full bg-white/5 border border-white/10 px-4 py-3 rounded-xl h-32" 
                    value={editInstructor.bio} onChange={e => setEditInstructor({...editInstructor, bio: e.target.value})} />
                </div>
              </div>
              <div className="space-y-4">
                <div className="flex justify-between items-center mb-1">
                  <label className="text-xs text-gray-500 block font-bold flex items-center gap-1"><Award size={14}/> 주요 약력 및 성과</label>
                  <button onClick={handleAddAchievement} className="text-[10px] bg-blue-600 px-3 py-1 rounded-full hover:bg-blue-500 transition flex items-center gap-1">
                    <Plus size={12}/> 추가
                  </button>
                </div>
                <div className="space-y-3">
                  {editInstructor.achievements.map((ach, idx) => (
                    <div key={idx} className="flex gap-2">
                      <input className="flex-1 bg-white/5 border border-white/10 px-4 py-2 rounded-xl text-sm" 
                        value={ach} onChange={e => handleUpdateAchievement(idx, e.target.value)} />
                      <button onClick={() => handleRemoveAchievement(idx)} className="p-2 text-red-400 hover:bg-red-400/10 rounded-lg transition">
                        <Trash2 size={16}/>
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <button onClick={handleSaveInstructor} className="w-full py-4 bg-blue-600 text-white font-bold rounded-2xl flex items-center justify-center gap-2 hover:bg-blue-500 transition shadow-xl"><Save size={20}/> 강사 정보 저장</button>
          </div>
        )}

        {activeTab === 'stats' && (
          <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="glass-card p-8 rounded-3xl text-center border-b-4 border-blue-500">
                <Globe className="mx-auto mb-4 text-blue-400" size={32} />
                <p className="text-gray-400 text-xs font-bold uppercase mb-2">총 방문자 수</p>
                <p className="text-5xl font-black">{analytics.visits}</p>
              </div>
              <div className="glass-card p-8 rounded-3xl text-center border-b-4 border-red-500">
                <Youtube className="mx-auto mb-4 text-red-500" size={32} />
                <p className="text-gray-400 text-xs font-bold uppercase mb-2">영상 시청 수</p>
                <p className="text-5xl font-black">{analytics.videoViews}</p>
              </div>
              <div className="glass-card p-8 rounded-3xl text-center border-b-4 border-green-500">
                <Download className="mx-auto mb-4 text-green-400" size={32} />
                <p className="text-gray-400 text-xs font-bold uppercase mb-2">자료 다운로드</p>
                <p className="text-5xl font-black">{analytics.downloads}</p>
              </div>
            </div>

            <div className="glass-card p-8 rounded-3xl space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-bold flex items-center gap-2"><History size={24} className="text-indigo-400" /> 학생 실시간 활동 상세 로그</h3>
                <div className="text-[10px] text-gray-500 bg-white/5 px-3 py-1 rounded-full flex items-center gap-2">
                   <Clock size={12} /> 실시간 업데이트 중
                </div>
              </div>
              
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="text-xs text-gray-400 uppercase tracking-wider bg-white/5">
                    <tr>
                      <th className="py-4 px-4 font-black">시간</th>
                      <th className="py-4 px-4 font-black">학생 이름</th>
                      <th className="py-4 px-4 font-black">활동 유형</th>
                      <th className="py-4 px-4 font-black">상세 항목</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {analytics.activities?.slice().reverse().map((act, idx) => (
                      <tr key={idx} className="hover:bg-white/10 transition group">
                        <td className="py-4 px-4 text-gray-500 text-xs">
                          {new Date(act.timestamp).toLocaleString('ko-KR', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                        </td>
                        <td className="py-4 px-4">
                           <div className="flex items-center gap-2 font-bold text-white">
                             <UserCircle size={16} className="text-blue-400" />
                             {act.userName}
                           </div>
                        </td>
                        <td className="py-4 px-4">
                          {act.type === 'downloads' ? (
                            <span className="text-[10px] font-black bg-green-500/20 text-green-400 px-2 py-1 rounded-full uppercase flex items-center gap-1 w-fit">
                              <Download size={10}/> DOWNLOAD
                            </span>
                          ) : act.type === 'videoViews' ? (
                            <span className="text-[10px] font-black bg-red-500/20 text-red-400 px-2 py-1 rounded-full uppercase flex items-center gap-1 w-fit">
                              <Youtube size={10}/> VIDEO WATCH
                            </span>
                          ) : act.type === 'visits' ? (
                            <span className="text-[10px] font-black bg-blue-500/20 text-blue-400 px-2 py-1 rounded-full uppercase flex items-center gap-1 w-fit">
                              <Globe size={10}/> PAGE VISIT
                            </span>
                          ) : <span className="text-xs">{act.type}</span>}
                        </td>
                        <td className="py-4 px-4 text-gray-300 font-medium">
                           {act.detail || "-"}
                        </td>
                      </tr>
                    ))}
                    {(!analytics.activities || analytics.activities.length === 0) && (
                      <tr>
                        <td colSpan={4} className="py-20 text-center text-gray-500 italic font-medium">기록된 활동이 없습니다.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'contents' && (
          <div className="space-y-6">
            <div className="glass-card p-8 rounded-3xl space-y-6">
              <div className="flex justify-between items-center border-b border-white/5 pb-4">
                <h3 className="text-xl font-bold flex items-center gap-2"><BookOpen size={24} className="text-blue-400"/> 새 컨텐츠 마스터 등록</h3>
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                <div className="space-y-6">
                  <div>
                    <label className="text-xs font-bold text-gray-400 uppercase mb-2 block">컨텐츠 제목</label>
                    <input className="w-full bg-white/5 border border-white/10 px-5 py-4 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500 transition text-lg font-semibold" placeholder="예: 2024 수능 대비 특강" value={newContent.title} onChange={e => setNewContent({...newContent, title: e.target.value})} />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-gray-400 uppercase mb-2 block">이미지 업로드</label>
                    <div className="flex gap-2">
                      <input className="flex-1 bg-white/5 border border-white/10 px-5 py-4 rounded-2xl outline-none" placeholder="이미지 URL" value={newContent.imageUrl} onChange={e => setNewContent({...newContent, imageUrl: e.target.value})} />
                      <button onClick={() => contentFileRef.current?.click()} className="px-4 py-4 bg-white/10 hover:bg-white/20 rounded-2xl transition flex items-center gap-2 font-bold text-sm whitespace-nowrap shadow-lg"><Upload size={18} /> 파일 선택</button>
                      <input type="file" ref={contentFileRef} className="hidden" accept="image/*" onChange={(e) => handleFileAsBase64(e, (b) => setNewContent({...newContent, imageUrl: b}))} />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-gray-400 uppercase mb-2 block">컨텐츠 요약 설명</label>
                    <textarea className="w-full bg-white/5 border border-white/10 px-5 py-4 rounded-2xl outline-none h-32" placeholder="주요 특징 등을 입력하세요" value={newContent.description} onChange={e => setNewContent({...newContent, description: e.target.value})} />
                  </div>
                </div>
                <div className="flex flex-col">
                  <label className="text-xs font-bold text-gray-400 uppercase mb-2 block">미리보기</label>
                  <div className="flex-1 glass shadow-2xl rounded-[2.5rem] overflow-hidden border border-white/10 relative">
                    {newContent.imageUrl ? <img src={newContent.imageUrl} alt="Preview" className="w-full h-full object-cover" /> : <div className="h-full w-full flex items-center justify-center text-gray-500">이미지 대기 중...</div>}
                  </div>
                </div>
              </div>
              <button onClick={() => { if(!newContent.title || !newContent.imageUrl) return alert("제목과 이미지는 필수입니다."); onAddContent(newContent); setNewContent({ title: '', description: '', imageUrl: '' }); }} className="w-full bg-blue-600 py-5 rounded-2xl font-black text-white hover:bg-blue-500 transition shadow-2xl flex items-center justify-center gap-3 text-lg"><Plus size={24}/> 최종 컨텐츠 등록</button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
               {contents.map(c => (
                 <div key={c.id} className="glass-card rounded-2xl overflow-hidden group relative">
                   <div className="h-40 relative overflow-hidden">
                     <img src={c.imageUrl} alt={c.title} className="w-full h-full object-cover" />
                     <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center gap-2">
                       <button onClick={() => onDeleteContent(c.id)} className="p-3 bg-red-600 text-white rounded-xl hover:scale-110 transition shadow-lg"><Trash2 size={20} /></button>
                     </div>
                   </div>
                   <div className="p-4 bg-white/2"><h4 className="font-bold text-sm truncate">{c.title}</h4></div>
                 </div>
               ))}
            </div>
          </div>
        )}
        
        {activeTab === 'resources' && (
           <div className="space-y-6">
           <div className="glass-card p-8 rounded-3xl space-y-6">
             <h3 className="text-xl font-bold flex items-center gap-2 text-indigo-400"><FileText size={24}/> 새 학습 자료 등록</h3>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
               <div className="space-y-4">
                 <div>
                   <label className="text-xs font-bold text-gray-500 mb-1 block">자료 제목</label>
                   <input className="w-full bg-white/5 border border-white/10 px-4 py-3 rounded-xl" placeholder="예: 3월 모의고사 변형" value={newResource.name} onChange={e => setNewResource({...newResource, name: e.target.value})} />
                 </div>
                 <div>
                   <label className="text-xs font-bold text-gray-500 mb-1 block">자료 설명</label>
                   <input className="w-full bg-white/5 border border-white/10 px-4 py-3 rounded-xl" placeholder="간단한 내용을 입력하세요" value={newResource.description} onChange={e => setNewResource({...newResource, description: e.target.value})} />
                 </div>
               </div>
               <div>
                 <label className="text-xs font-bold text-gray-500 mb-1 block">파일 업로드</label>
                 <div onClick={() => resourceFileRef.current?.click()} className={`h-full min-h-[140px] border-2 border-dashed rounded-2xl flex flex-col items-center justify-center cursor-pointer transition ${newResource.url ? 'border-green-500/50 bg-green-500/5' : 'border-white/10 hover:border-indigo-500/50 bg-white/2 hover:bg-white/5'}`}>
                   {newResource.url ? (
                     <div className="flex flex-col items-center gap-2 text-green-400">
                       <CheckCircle size={32} />
                       <p className="text-sm font-bold">파일 준비됨</p>
                       <p className="text-[10px] text-gray-500 truncate max-w-[200px]">{newResource.name}</p>
                     </div>
                   ) : (
                     <div className="flex flex-col items-center gap-2 text-gray-500">
                       <UploadCloud size={32} />
                       <p className="text-sm font-bold">클릭하여 파일 업로드</p>
                     </div>
                   )}
                   <input type="file" ref={resourceFileRef} className="hidden" onChange={handleResourceUpload} />
                 </div>
               </div>
             </div>
             <button onClick={() => { if(!newResource.name || !newResource.url) return alert("자료 이름과 파일이 필요합니다."); onAddResource(newResource); setNewResource({ name: '', description: '', url: '' }); }} className="w-full bg-indigo-600 py-4 rounded-xl font-bold hover:bg-indigo-500 transition shadow-lg flex items-center justify-center gap-2"><Plus size={20} /> 자료 등록 완료</button>
           </div>
         </div>
        )}

        {activeTab === 'videos' && (
           <div className="space-y-6">
           <div className="glass-card p-8 rounded-3xl space-y-6">
             <h3 className="text-xl font-bold flex items-center gap-2 text-red-400"><Youtube size={24}/> 새 복습 영상 등록</h3>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
               <div className="space-y-4">
                 <div>
                   <label className="text-xs font-bold text-gray-500 mb-1 block">영상 제목</label>
                   <input className="w-full bg-white/5 border border-white/10 px-4 py-3 rounded-xl" placeholder="예: 미적분 심화" value={newVideo.title} onChange={e => setNewVideo({...newVideo, title: e.target.value})} />
                 </div>
                 <div>
                   <label className="text-xs font-bold text-gray-500 mb-1 block">YouTube 전체 링크</label>
                   <div className="relative">
                     <input className="w-full bg-white/5 border border-white/10 pl-11 pr-4 py-3 rounded-xl" placeholder="https://www.youtube.com/watch?v=..." value={newVideo.youtubeUrl} onChange={e => setNewVideo({...newVideo, youtubeUrl: e.target.value})} />
                     <Youtube className="absolute left-4 top-3.5 text-gray-500" size={18} />
                   </div>
                 </div>
               </div>
               <div>
                 <label className="text-xs font-bold text-gray-500 mb-1 block">영상 요약 설명</label>
                 <textarea className="w-full bg-white/5 border border-white/10 px-4 py-3 rounded-xl h-[104px] resize-none" placeholder="짧은 설명을 입력하세요" value={newVideo.description} onChange={e => setNewVideo({...newVideo, description: e.target.value})} />
               </div>
             </div>
             <button onClick={() => { const id = extractYoutubeId(newVideo.youtubeUrl); if(!id) return alert("올바른 YouTube 링크를 입력해주세요."); if(!newVideo.title) return alert("제목을 입력해주세요."); onAddVideo({ title: newVideo.title, description: newVideo.description, youtubeId: id }); setNewVideo({ title: '', description: '', youtubeUrl: '' }); }} className="w-full bg-red-600 py-4 rounded-xl font-bold hover:bg-red-500 transition shadow-lg flex items-center justify-center gap-2"><Plus size={20} /> 영상 등록 완료</button>
           </div>
         </div>
        )}
      </div>
    </div>
  );
};

// --- MAIN APP ---
const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<UserType | null>(null);
  const [users, setUsers] = useState<UserType[]>([]);
  const [instructorInfo, setInstructorInfo] = useState<InstructorInfo>(DEFAULT_INSTRUCTOR);
  const [contents, setContents] = useState<CourseContent[]>([]);
  const [resources, setResources] = useState<ResourceFile[]>([]);
  const [videos, setVideos] = useState<ReviewVideo[]>([]);
  const [qna, setQna] = useState<QnAPost[]>([]);
  const [brandName, setBrandName] = useState("ELITE HUB");
  const [heroImageUrl, setHeroImageUrl] = useState("https://images.unsplash.com/photo-1516979187457-637abb4f9353?auto=format&fit=crop&q=80&w=1920");
  const [instructorSlogan, setInstructorSlogan] = useState("");
  const [copyrightText, setCopyrightText] = useState("© 2024 ELITE HUB. All rights reserved.");
  const [analytics, setAnalytics] = useState<AnalyticsData>({ visits: 0, videoViews: 0, downloads: 0, activities: [] });

  const recordActivity = async (type: keyof AnalyticsData, targetId?: string, detail?: string) => {
    try {
      if (!currentUser || currentUser.status === 'pending') return;

      const activity: UserActivity = {
        userName: currentUser.name,
        type,
        detail: detail || '',
        timestamp: new Date().toISOString()
      };

      const analyticsRef = doc(db, "analytics", "global");
      const currentVal = analytics[type] as number || 0;
      await updateDoc(analyticsRef, { 
        [type]: currentVal + 1,
        activities: arrayUnion(activity)
      });
    } catch (e) {
      console.error("Failed to record activity", e);
    }
  };

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (firebaseUser) => {
      if (!firebaseUser) {
        setCurrentUser(null);
        return;
      }
      const userDocRef = doc(db, "users", firebaseUser.uid);
      const unsubUser = onSnapshot(userDocRef, (snap) => {
        if (snap.exists()) {
          const userData = snap.data() as Omit<UserType, 'id'>;
          setCurrentUser({ id: snap.id, ...userData } as UserType);
        } else {
          setCurrentUser(null);
          signOut(auth);
        }
      });
      return () => unsubUser();
    });

    const unsubscribes: (() => void)[] = [];

    unsubscribes.push(onSnapshot(doc(db, "settings", "branding"), (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        setBrandName(data.brandName || "ELITE HUB");
        setHeroImageUrl(data.heroImageUrl || "https://images.unsplash.com/photo-1516979187457-637abb4f9353?auto=format&fit=crop&q=80&w=1920");
        setInstructorSlogan(data.instructorSlogan || "");
        setCopyrightText(data.copyrightText || "© 2024 ELITE HUB. All rights reserved.");
      }
    }));

    unsubscribes.push(onSnapshot(doc(db, "settings", "instructor"), (snap) => {
      if (snap.exists()) setInstructorInfo(snap.data() as InstructorInfo);
    }));

    unsubscribes.push(onSnapshot(collection(db, "contents"), (snap) => {
      setContents(snap.docs.map(d => ({ id: d.id, ...d.data() } as CourseContent)));
    }));

    unsubscribes.push(onSnapshot(collection(db, "resources"), (snap) => {
      setResources(snap.docs.map(d => ({ id: d.id, ...d.data() } as ResourceFile)));
    }));

    unsubscribes.push(onSnapshot(collection(db, "videos"), (snap) => {
      setVideos(snap.docs.map(d => ({ id: d.id, ...d.data() } as ReviewVideo)));
    }));

    unsubscribes.push(onSnapshot(query(collection(db, "qna"), orderBy("timestamp", "desc")), (snap) => {
      setQna(snap.docs.map(d => ({ id: d.id, ...d.data() } as QnAPost)));
    }));

    unsubscribes.push(onSnapshot(collection(db, "users"), (snap) => {
      setUsers(snap.docs.map(d => ({ id: d.id, ...d.data() } as UserType)));
    }));

    unsubscribes.push(onSnapshot(doc(db, "analytics", "global"), (snap) => {
      if (snap.exists()) {
        const data = snap.data() as AnalyticsData;
        setAnalytics({
            visits: data.visits || 0,
            videoViews: data.videoViews || 0,
            downloads: data.downloads || 0,
            activities: data.activities || []
        });
      }
    }));

    return () => {
      unsubscribeAuth();
      unsubscribes.forEach(unsub => unsub());
    };
  }, []);

  useEffect(() => {
    if (currentUser?.status === 'approved' || currentUser?.status === 'admin') {
      recordActivity('visits', undefined, 'Main Page Visit');
    }
  }, [currentUser?.id]);

  const handleLogin = async (name: string, phone: string, academy: string, isAdmin: boolean, isSignUp: boolean) => {
    if (isAdmin) {
      setCurrentUser({ id: 'admin-id', name: '관리자', phone: '', academy: '', status: 'admin' });
      return;
    }
    if (isSignUp) {
      const newUserRef = doc(collection(db, "users"));
      const newUser = { name, phone, academy, status: 'pending' as UserStatus, createdAt: serverTimestamp(), timestamp: serverTimestamp() };
      await setDoc(newUserRef, newUser);
      setCurrentUser({ id: newUserRef.id, ...newUser } as any);
    } else {
      const q = query(collection(db, "users"), where("name", "==", name), where("phone", "==", phone));
      const querySnapshot = await getDocs(q);
      if (querySnapshot.empty) return alert("등록된 정보를 찾을 수 없습니다.");
      const userDoc = querySnapshot.docs[0];
      setCurrentUser({ id: userDoc.id, ...userDoc.data() as any });
    }
  };

  const handleLogout = () => { setCurrentUser(null); signOut(auth); };
  const canAccess = currentUser?.status === 'approved' || currentUser?.status === 'admin';

  return (
    <Router>
      <div className="min-h-screen">
        <nav className="fixed top-0 left-0 right-0 z-50 glass shadow-2xl">
          <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
            <Link to="/" className="text-2xl font-black text-white flex items-center gap-2 group">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-[10px] font-bold group-hover:scale-110 transition-transform">{brandName.substring(0,2)}</div>
              <span className="uppercase tracking-[0.2em] text-lg font-bold">{brandName}</span>
            </Link>
            <div className="hidden md:flex items-center gap-1">
              <NavItem to="/intro" label="강사 소개" icon={<UserIcon size={18} />} />
              {canAccess && (
                <>
                  <NavItem to="/content" label="컨텐츠" icon={<BookOpen size={18} />} />
                  <NavItem to="/resources" label="자료실" icon={<FileText size={18} />} />
                  <NavItem to="/videos" label="복습 영상" icon={<Video size={18} />} />
                  <NavItem to="/qna" label="QnA" icon={<MessageSquare size={18} />} />
                </>
              )}
              {currentUser?.status === 'admin' && <NavItem to="/admin" label="관리자" icon={<Settings size={18} />} />}
            </div>
            {currentUser ? (
              <div className="flex items-center gap-4">
                <div className="hidden sm:block text-right">
                    <p className="text-[10px] font-bold text-blue-400 uppercase leading-none mb-1">{currentUser.status}</p>
                    <p className="text-sm font-medium">{currentUser.name} 님</p>
                </div>
                <button onClick={handleLogout} className="p-2.5 rounded-full bg-white/5 hover:bg-white/20 transition-colors"><LogOut size={20} /></button>
              </div>
            ) : <Link to="/login" className="px-6 py-2.5 bg-blue-600 rounded-2xl font-black shadow-lg hover:bg-blue-500 transition-colors">로그인</Link>}
          </div>
        </nav>
        <main className="pt-28">
          <Routes>
            <Route path="/" element={<Home instructorSlogan={instructorSlogan} heroImageUrl={heroImageUrl} />} />
            <Route path="/intro" element={<InstructorIntro info={instructorInfo} />} />
            <Route path="/login" element={currentUser ? <Home instructorSlogan={instructorSlogan} heroImageUrl={heroImageUrl} /> : <Login onLogin={handleLogin} />} />
            <Route path="/content" element={canAccess ? <ContentIntro contents={contents} /> : <AccessDenied />} />
            <Route path="/resources" element={canAccess ? <Resources resources={resources} onDownload={(id, name) => recordActivity('downloads', id, name)} /> : <AccessDenied />} />
            <Route path="/videos" element={canAccess ? <ReviewVideos videos={videos} onWatch={(id, title) => recordActivity('videoViews', id, title)} /> : <AccessDenied />} />
            <Route path="/qna" element={canAccess ? <QnA qna={qna} onAddQuestion={async (title, content) => {
              const id = Date.now().toString();
              await setDoc(doc(db, "qna", id), { id, title, content, author: currentUser?.name || "익명", date: new Date().toLocaleDateString(), replies: [], timestamp: serverTimestamp() });
              recordActivity('visits', id, `Q&A: ${title}`);
            }} /> : <AccessDenied />} />
            <Route path="/admin" element={currentUser?.status === 'admin' ? (
              <AdminPanel 
                users={users} onApprove={async id => updateDoc(doc(db, "users", id), { status: 'approved' })} onReject={async id => deleteDoc(doc(db, "users", id))}
                brandName={brandName} setBrandName={v => updateDoc(doc(db, "settings", "branding"), { brandName: v })}
                heroImageUrl={heroImageUrl} setHeroImageUrl={v => updateDoc(doc(db, "settings", "branding"), { heroImageUrl: v })}
                instructorSlogan={instructorSlogan} setInstructorSlogan={v => updateDoc(doc(db, "settings", "branding"), { instructorSlogan: v })}
                copyrightText={copyrightText} setCopyrightText={v => updateDoc(doc(db, "settings", "branding"), { copyrightText: v })}
                instructorInfo={instructorInfo} setInstructorInfo={v => setDoc(doc(db, "settings", "instructor"), v)}
                contents={contents} onAddContent={async c => setDoc(doc(collection(db, "contents")), c)} onDeleteContent={id => deleteDoc(doc(db, "contents", id))}
                resources={resources} onAddResource={async r => setDoc(doc(collection(db, "resources")), { ...r, date: new Date().toLocaleDateString() })} onDeleteResource={id => deleteDoc(doc(db, "resources", id))}
                videos={videos} onAddVideo={async v => setDoc(doc(collection(db, "videos")), v)} onDeleteVideo={id => deleteDoc(doc(db, "videos", id))}
                qna={qna} onAddReply={async (id, content) => updateDoc(doc(db, "qna", id), { replies: arrayUnion({ id: Date.now().toString(), author: "강사님", content, date: new Date().toLocaleDateString() }) })}
                analytics={analytics}
              />
            ) : <AccessDenied />} />
          </Routes>
        </main>
        <footer className="mt-20 py-10 border-t border-white/5 text-center text-gray-500 text-sm">
          <div className="max-w-7xl mx-auto px-6">
            <p className="whitespace-pre-wrap font-medium">{copyrightText}</p>
          </div>
        </footer>
      </div>
    </Router>
  );
};

export default App;
