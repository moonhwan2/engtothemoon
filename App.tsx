
import React, { useState, useEffect, useRef } from 'react';
import { 
  HashRouter as Router, 
  Routes, 
  Route, 
  Navigate 
} from 'react-router-dom';
import { onAuthStateChanged, signOut } from "firebase/auth";
import { 
  collection, 
  doc, 
  onSnapshot, 
  setDoc, 
  updateDoc, 
  deleteDoc,
  query,
  orderBy,
  addDoc,
  getDocs,
  where
} from "firebase/firestore";
import { db, auth } from './firebase';
import { 
  Upload, 
  Plus, 
  Trash2, 
  Save, 
  Video as VideoIcon, 
  Layout, 
  User as UserIcon, 
  BookOpen, 
  Settings,
  Image as ImageIcon,
  CheckCircle,
  X,
  AlertCircle,
  Sparkles
} from 'lucide-react';

// Types
import { 
  User as UserType, 
  CourseContent, 
  ResourceFile, 
  ReviewVideo, 
  QnAPost,
  InstructorInfo
} from './types';

// Components
import { Navbar, Footer } from './Layout';
// Import Gemini slogan generation service
import { generateSlogan } from './src/services/geminiService';

const App: React.FC = () => {
  // --- STATE ---
  const [currentUser, setCurrentUser] = useState<UserType | null>(null);
  const [isDemoMode, setIsDemoMode] = useState(false);
  
  // Data States
  const [instructorInfo, setInstructorInfo] = useState<InstructorInfo>({
    name: "엘리트 강사",
    role: "대표 강사 / 수석 연구원",
    profileImageUrl: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=400",
    bio: "최고의 강의로 여러분의 미래를 바꿉니다.",
    achievements: ["S대 교육학 석사", "전국 모의고사 출제위원"]
  });
  const [contents, setContents] = useState<CourseContent[]>([]);
  const [resources, setResources] = useState<ResourceFile[]>([]);
  const [videos, setVideos] = useState<ReviewVideo[]>([]);
  const [qna, setQna] = useState<QnAPost[]>([]);
  
  // Branding States
  const [brandName, setBrandName] = useState("ELITE HUB");
  const [heroImageUrl, setHeroImageUrl] = useState("https://images.unsplash.com/photo-1516979187457-637abb4f9353?auto=format&fit=crop&q=80&w=1920");
  const [instructorSlogan, setInstructorSlogan] = useState("성공을 향한 가장 확실한 선택");
  const [copyrightText, setCopyrightText] = useState("© 2024 ELITE HUB. All rights reserved.");

  // --- ACCESS CHECK ---
  const canAccess = currentUser?.status === 'approved' || currentUser?.status === 'admin';

  // --- DATA PERSISTENCE HELPER ---
  const saveLocal = (key: string, data: any) => {
    localStorage.setItem(`elite_hub_${key}`, JSON.stringify(data));
  };

  const loadLocal = () => {
    const b = localStorage.getItem('elite_hub_branding');
    if (b) {
      const d = JSON.parse(b);
      setBrandName(d.brandName);
      setInstructorSlogan(d.instructorSlogan);
      setCopyrightText(d.copyrightText);
      setHeroImageUrl(d.heroImageUrl);
    }
    const inst = localStorage.getItem('elite_hub_instructor');
    if (inst) setInstructorInfo(JSON.parse(inst));
    
    const ct = localStorage.getItem('elite_hub_contents');
    if (ct) setContents(JSON.parse(ct));

    const vd = localStorage.getItem('elite_hub_videos');
    if (vd) setVideos(JSON.parse(vd));
  };

  // --- DATA SYNC ---
  useEffect(() => {
    loadLocal(); // Load local data first

    const unsubscribes: (() => void)[] = [];

    const handleFirebaseError = (err: any) => {
      if (err.code === 'permission-denied') {
        console.warn("Firestore permission denied. Switching to Demo Mode (Local Storage).");
        setIsDemoMode(true);
      } else {
        console.error("Firestore Error:", err);
      }
    };

    // Firestore data synchronization
    const syncData = () => {
      try {
        // Branding sync
        unsubscribes.push(onSnapshot(doc(db, "settings", "branding"), (snap) => {
          if (snap.exists()) {
            const data = snap.data();
            setBrandName(data.brandName || "ELITE HUB");
            setHeroImageUrl(data.heroImageUrl || "");
            setInstructorSlogan(data.instructorSlogan || "");
            setCopyrightText(data.copyrightText || "");
          }
        }, handleFirebaseError));

        // Instructor sync
        unsubscribes.push(onSnapshot(doc(db, "settings", "instructor"), (snap) => {
          if (snap.exists()) setInstructorInfo(snap.data() as InstructorInfo);
        }, handleFirebaseError));

        // Contents sync
        unsubscribes.push(onSnapshot(collection(db, "contents"), (snap) => {
          const list = snap.docs.map(d => ({ id: d.id, ...d.data() } as CourseContent));
          setContents(list);
          saveLocal('contents', list);
        }, handleFirebaseError));

        // Videos sync
        unsubscribes.push(onSnapshot(collection(db, "videos"), (snap) => {
          const list = snap.docs.map(d => ({ id: d.id, ...d.data() } as ReviewVideo));
          setVideos(list);
          saveLocal('videos', list);
        }, handleFirebaseError));

      } catch (e) {
        setIsDemoMode(true);
      }
    };

    const unsubAuth = onAuthStateChanged(auth, (fbUser) => {
      if (fbUser) {
        const userDocRef = doc(db, "users", fbUser.uid);
        onSnapshot(userDocRef, (snap) => {
          if (snap.exists()) {
            setCurrentUser({ id: snap.id, ...snap.data() } as UserType);
          }
        }, (err) => {
          console.warn("Auth status fetch failed, user may not exist in Firestore yet.");
        });
      } else {
        if (currentUser?.id !== 'admin-account') setCurrentUser(null);
      }
    });

    syncData();

    return () => {
      unsubAuth();
      unsubscribes.forEach(u => u());
    };
  }, []);

  const handleLogout = () => {
    signOut(auth);
    setCurrentUser(null);
  };

  return (
    <Router>
      <div className="min-h-screen bg-[#0f172a] text-white">
        {isDemoMode && (
          <div className="fixed bottom-4 right-4 z-[100] bg-amber-600/90 backdrop-blur-md px-6 py-3 rounded-2xl flex flex-col gap-1 text-xs font-bold shadow-2xl">
            <div className="flex items-center gap-2">
              <AlertCircle size={16} /> Firestore 권한 또는 연결 확인 중
            </div>
            <p className="font-medium opacity-80">서버와 연결할 수 없어 로컬 모드로 작동 중입니다.</p>
          </div>
        )}
        
        <Navbar 
          brandName={brandName} 
          currentUser={currentUser} 
          onLogout={handleLogout} 
          canAccess={canAccess}
          
          copyrightText={copyrightText}
        />
        
        <main className="pt-28">
         <Routes>
  <Route path="/" element={<HomeView instructorSlogan={instructorSlogan} heroImageUrl={heroImageUrl} />} />
  <Route path="/intro" element={<InstructorView info={instructorInfo} />} />
  
  {/* 회원가입 라우트 추가 */}
  <Route path="/signup" element={currentUser ? <Navigate to="/" /> : <SignUpView />} />
  
  <Route path="/login" element={currentUser ? <Navigate to="/" /> : <LoginView onLogin={(u) => setCurrentUser(u)} />} />
  
  <Route path="/content" element={canAccess ? <ContentView contents={contents} /> : <Navigate to="/login" />} />
  <Route path="/resources" element={canAccess ? <ResourceView resources={resources} /> : <Navigate to="/login" />} />
  <Route path="/videos" element={canAccess ? <VideoView videos={videos} /> : <Navigate to="/login" />} />
  <Route path="/qna" element={canAccess ? <QnaView qna={qna} /> : <Navigate to="/login" />} />
  
  <Route path="/admin" element={currentUser?.status === 'admin' ? (
    <AdminPanel 
      instructorInfo={instructorInfo}
      brandName={brandName}
      heroImageUrl={heroImageUrl}
      instructorSlogan={instructorSlogan}
      copyrightText={copyrightText}
      contents={contents}
      videos={videos}
      saveLocal={saveLocal}
      isDemoMode={isDemoMode}
    />
  ) : <Navigate to="/login" />} />
  
  {/* 관리자 회원 승인 페이지 추가 */}
  <Route path="/admin/approval" element={currentUser?.status === 'admin' ? <AdminApprovalView /> : <Navigate to="/login" />} />
  
  <Route path="*" element={<Navigate to="/" />} />
</Routes>
        </main>

        <Footer copyrightText={copyrightText} />
      </div>
    </Router>
  );
};

// --- VIEWS ---

const HomeView: React.FC<{ instructorSlogan: string; heroImageUrl: string }> = ({ instructorSlogan, heroImageUrl }) => (
  <div className="relative w-full h-[100vh] -mt-28 flex items-center justify-center overflow-hidden">
    <div className="absolute inset-0 bg-cover bg-center transition-all duration-1000" style={{ backgroundImage: `url(${heroImageUrl})` }}>
      <div className="absolute inset-0 bg-black/50 backdrop-blur-[2px]"></div>
    </div>
    <div className="relative z-10 text-center animate-fade-in-up px-6">
      <h1 className="text-5xl md:text-8xl font-script text-white drop-shadow-2xl leading-tight">
        {instructorSlogan || "The Future Belongs to You"}
      </h1>
    </div>
  </div>
);

const InstructorView: React.FC<{ info: InstructorInfo }> = ({ info }) => (
  <div className="max-w-5xl mx-auto px-6 py-12 animate-fade-in-up">
    <h2 className="text-4xl font-bold mb-8 flex items-center gap-3">
      <UserIcon className="text-blue-500" /> 강사 소개
    </h2>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
      <div className="glass-card rounded-3xl overflow-hidden p-2">
        <img src={info.profileImageUrl || "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=400"} className="w-full rounded-2xl aspect-[4/5] object-cover" alt="profile" />
      </div>
      <div className="space-y-6">
        <div>
          <h3 className="text-4xl font-black text-blue-400 mb-1">{info.name}</h3>
          <p className="text-xl text-gray-400 font-medium">{info.role}</p>
        </div>
        <p className="text-gray-300 leading-relaxed whitespace-pre-wrap text-lg">{info.bio}</p>
        <div className="space-y-3 pt-4">
          <p className="text-sm font-bold text-gray-500 uppercase tracking-widest">Major Achievements</p>
          {info.achievements?.map((a, i) => (
            <div key={i} className="flex gap-3 items-start text-gray-300">
              <CheckCircle size={20} className="text-blue-500 mt-1 flex-shrink-0" />
              <span className="text-lg">{a}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  </div>
);

const ContentView: React.FC<{ contents: CourseContent[] }> = ({ contents }) => (
  <div className="max-w-7xl mx-auto px-6 py-12">
    <h2 className="text-4xl font-bold mb-8">강의 컨텐츠</h2>
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
      {contents.map(item => (
        <div key={item.id} className="glass-card rounded-3xl overflow-hidden hover:scale-[1.02] transition-transform group">
          <div className="h-56 overflow-hidden">
            <img src={item.imageUrl} alt={item.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
          </div>
          <div className="p-6">
            <h3 className="text-xl font-bold mb-3">{item.title}</h3>
            <p className="text-gray-400 text-sm whitespace-pre-wrap leading-relaxed">{item.description}</p>
          </div>
        </div>
      ))}
      {contents.length === 0 && <p className="col-span-full text-center py-24 text-gray-500 italic">등록된 컨텐츠가 없습니다. 관리자 대시보드에서 추가해주세요.</p>}
    </div>
  </div>
);

const ResourceView: React.FC<{ resources: ResourceFile[] }> = ({ resources }) => (
  <div className="max-w-7xl mx-auto px-6 py-12">
    <h2 className="text-4xl font-bold mb-8">학습 자료실</h2>
    <div className="space-y-4">
      {resources.map(file => (
        <div key={file.id} className="glass-card p-6 rounded-2xl flex justify-between items-center group">
          <div className="flex gap-5 items-center">
            <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center text-blue-400 group-hover:bg-blue-500 group-hover:text-white transition-colors">
              <BookOpen size={24} />
            </div>
            <div>
              <h3 className="text-lg font-bold">{file.name}</h3>
              <p className="text-sm text-gray-400">{file.description}</p>
            </div>
          </div>
          <a href={file.url} target="_blank" rel="noopener noreferrer" className="px-6 py-2 bg-blue-600 rounded-xl font-bold hover:bg-blue-500 transition-colors shadow-lg">다운로드</a>
        </div>
      ))}
      {resources.length === 0 && <p className="text-center py-24 text-gray-500">등록된 학습 자료가 없습니다.</p>}
    </div>
  </div>
);

const VideoView: React.FC<{ videos: ReviewVideo[] }> = ({ videos }) => (
  <div className="max-w-7xl mx-auto px-6 py-12">
    <h2 className="text-4xl font-bold mb-8">복습 영상</h2>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
      {videos.map(video => (
        <div key={video.id} className="glass-card p-6 rounded-[2.5rem] space-y-5">
          <div className="aspect-video rounded-3xl overflow-hidden bg-black shadow-2xl">
            <iframe 
              className="w-full h-full"
              src={`https://www.youtube.com/embed/${video.youtubeId}`}
              title={video.title}
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            ></iframe>
          </div>
          <div className="px-2">
            <h3 className="text-2xl font-bold mb-2">{video.title}</h3>
            <p className="text-gray-400 text-sm whitespace-pre-wrap leading-relaxed">{video.description}</p>
          </div>
        </div>
      ))}
      {videos.length === 0 && <p className="col-span-full text-center py-24 text-gray-500">업로드된 복습 영상이 없습니다.</p>}
    </div>
  </div>
);

const QnaView: React.FC<{ qna: QnAPost[] }> = ({ qna }) => (
  <div className="max-w-5xl mx-auto px-6 py-12">
    <h2 className="text-4xl font-bold mb-8">Q&A 커뮤니티</h2>
    <div className="space-y-6">
      {qna.map(post => (
        <div key={post.id} className="glass-card p-8 rounded-3xl">
          <div className="flex justify-between items-center mb-5">
            <h3 className="text-xl font-bold text-blue-400">{post.title}</h3>
            <span className="text-xs text-gray-500 font-mono">{post.date}</span>
          </div>
          <p className="text-gray-300 mb-8 leading-relaxed">{post.content}</p>
          <div className="space-y-4 ml-6 border-l-2 border-blue-500/20 pl-8">
            {post.replies?.map(reply => (
              <div key={reply.id} className="bg-white/5 p-5 rounded-2xl relative">
                <div className="absolute -left-[33px] top-6 w-4 h-0.5 bg-blue-500/20"></div>
                <p className="text-sm font-black text-blue-500 mb-1 uppercase">{reply.author}</p>
                <p className="text-sm text-gray-400">{reply.content}</p>
              </div>
            ))}
          </div>
        </div>
      ))}
      {qna.length === 0 && <p className="text-center py-24 text-gray-500 italic">첫 질문의 주인공이 되어보세요!</p>}
    </div>
  </div>
);

// --- ADMIN PANEL ---

const AdminPanel: React.FC<{
  instructorInfo: InstructorInfo;
  brandName: string;
  heroImageUrl: string;
  instructorSlogan: string;
  copyrightText: string;
  contents: CourseContent[];
  videos: ReviewVideo[];
  saveLocal: (k: string, d: any) => void;
  isDemoMode: boolean;
}> = (props) => {
  const [activeTab, setActiveTab] = useState('branding');
  
  // State management
  const [brandName, setBrandName] = useState(props.brandName);
  const [slogan, setSlogan] = useState(props.instructorSlogan);
  const [copyright, setCopyright] = useState(props.copyrightText);
  const [heroImg, setHeroImg] = useState(props.heroImageUrl);
  const [instructor, setInstructor] = useState<InstructorInfo>(props.instructorInfo);
  const [newContent, setNewContent] = useState({ title: '', description: '', imageUrl: '' });
  const [newVideo, setNewVideo] = useState({ title: '', description: '', youtubeUrl: '' });
  const [isGeneratingSlogan, setIsGeneratingSlogan] = useState(false);

  const heroFileRef = useRef<HTMLInputElement>(null);
  const instructorFileRef = useRef<HTMLInputElement>(null);
  const contentFileRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, callback: (base64: string) => void) => {
    {activeTab === 'files' && (
  <div className="glass-card p-10 rounded-[3rem] space-y-8 animate-fade-in-up border-white/10">
    <h3 className="text-2xl font-black flex items-center gap-3">
      <Upload className="text-blue-500" /> 학습 자료 업로드
    </h3>
    
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      <div className="space-y-6">
        <div>
          <label className="text-xs text-gray-500 font-black mb-2 block">파일명</label>
          <input 
            type="text"
            placeholder="자료 제목을 입력하세요"
            className="w-full bg-white/5 border border-white/10 px-6 py-4 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500 font-bold"
          />
        </div>
        
        <div>
          <label className="text-xs text-gray-500 font-black mb-2 block">설명</label>
          <textarea 
            placeholder="자료에 대한 설명을 입력하세요"
            className="w-full bg-white/5 border border-white/10 px-6 py-4 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500 h-32"
          />
        </div>
      </div>
      
      <div className="space-y-4">
        <label className="text-xs text-gray-500 font-black block">파일 선택</label>
        <div className="border-2 border-dashed border-white/20 rounded-3xl p-8 text-center bg-white/5">
          <input
            type="file"
            accept=".jpg,.jpeg,.png,.gif,.webp,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt"
            className="hidden"
            id="file-upload"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file && file.size > 10 * 1024 * 1024) {
                alert('파일 크기는 10MB 이하여야 합니다.');
                return;
              }
              // 파일 처리 로직
            }}
          />
          <label htmlFor="file-upload" className="cursor-pointer">
            <Upload size={48} className="mx-auto mb-4 text-gray-500" />
            <p className="font-bold text-lg mb-2">파일을 선택하세요</p>
            <p className="text-xs text-gray-500">
              이미지, PDF, Word, Excel, PowerPoint, TXT<br/>
              최대 10MB
            </p>
          </label>
        </div>
      </div>
    </div>
    
    <button 
      className="w-full py-5 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-[2rem] font-black text-xl flex items-center justify-center gap-3 active:scale-95 transition-all"
    >
      <Upload size={24}/> 파일 업로드
    </button>
  </div>
)}
  const saveBranding = async () => {
    const data = { brandName, instructorSlogan: slogan, copyrightText: copyright, heroImageUrl: heroImg };
    try {
      await setDoc(doc(db, "settings", "branding"), data);
      props.saveLocal('branding', data);
      alert("브랜딩 설정이 서버에 저장되었습니다.");
    } catch (e: any) {
      console.error(e);
      alert(`저장 중 오류가 발생했습니다: ${e.message}`);
      props.saveLocal('branding', data);
    }
  };

  const handleAISlogan = async () => {
    if (isGeneratingSlogan) return;
    setIsGeneratingSlogan(true);
    try {
      const result = await generateSlogan(brandName || "교육");
      setSlogan(result);
    } catch (error) {
      console.error(error);
    } finally {
      setIsGeneratingSlogan(false);
    }
  };

  const saveInstructor = async () => {
    try {
      await setDoc(doc(db, "settings", "instructor"), instructor);
      props.saveLocal('instructor', instructor);
      alert("강사 정보가 서버에 저장되었습니다.");
    } catch (e: any) {
      alert(`저장 실패: ${e.message}`);
      props.saveLocal('instructor', instructor);
    }
  };

  const addContent = async () => {
    if (!newContent.title || !newContent.imageUrl) return alert("제목과 이미지를 등록해주세요.");
    try {
      await addDoc(collection(db, "contents"), newContent);
      setNewContent({ title: '', description: '', imageUrl: '' });
      alert("컨텐츠가 등록되었습니다.");
    } catch (e: any) {
      alert(`등록 실패: ${e.message}`);
    }
  };

  const addVideo = async () => {
    if (!newVideo.title || !newVideo.youtubeUrl) return alert("제목과 URL을 입력해주세요.");
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = newVideo.youtubeUrl.match(regExp);
    const youtubeId = (match && match[2].length === 11) ? match[2] : null;
    if (!youtubeId) return alert("유효한 유튜브 주소가 아닙니다.");

    try {
      await addDoc(collection(db, "videos"), {
        title: newVideo.title,
        description: newVideo.description,
        youtubeId
      });
      setNewVideo({ title: '', description: '', youtubeUrl: '' });
      alert("영상이 등록되었습니다.");
    } catch (e: any) {
      alert(`등록 실패: ${e.message}`);
    }
  };

  const deleteItem = async (col: string, id: string) => {
    if (window.confirm("정말 삭제하시겠습니까?")) {
      try {
        await deleteDoc(doc(db, col, id));
      } catch (e: any) {
        alert(`삭제 실패: ${e.message}`);
      }
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-6 py-12">
      <div className="flex items-center justify-between mb-10">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-blue-600 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-blue-500/20">
            <Settings size={30} />
          </div>
          <div>
            <h2 className="text-4xl font-black uppercase">Admin Panel</h2>
            <p className="text-gray-500 text-sm font-medium">실시간 데이터 관리 도구</p>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-3 mb-12 bg-white/5 p-2 rounded-[2rem] border border-white/5">
        {[
          { id: 'branding', label: '메인/브랜딩', icon: <Layout size={20} /> },
          { id: 'instructor', label: '강사 프로필', icon: <UserIcon size={20} /> },
          { id: 'contents', label: '컨텐츠 업로드', icon: <BookOpen size={20} /> },
          { id: 'videos', label: '복습 영상', icon: <VideoIcon size={20} /> },
        ].map(tab => (
          <button 
            key={tab.id} 
            onClick={() => setActiveTab(tab.id)} 
            className={`flex items-center gap-3 px-8 py-3.5 rounded-[1.5rem] font-bold transition-all duration-300 ${activeTab === tab.id ? 'bg-blue-600 text-white shadow-xl shadow-blue-600/30 scale-105' : 'text-gray-400 hover:bg-white/10 hover:text-white'}`}
          >
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      <div className="space-y-10 min-h-[600px]">
        {activeTab === 'branding' && (
          <div className="glass-card p-10 rounded-[3rem] space-y-8 animate-fade-in-up border-white/10">
            <h3 className="text-2xl font-black flex items-center gap-3"><Layout className="text-blue-500" /> 사이트 브랜딩 설정</h3>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
              <div className="space-y-6">
                <div className="group">
                  <label className="text-xs text-gray-500 font-black uppercase tracking-widest mb-2 block">Brand Name</label>
                  <input className="w-full bg-white/5 border border-white/10 px-6 py-4 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500 font-bold" value={brandName} onChange={e => setBrandName(e.target.value)} />
                </div>
                <div className="group relative">
                  <label className="text-xs text-gray-500 font-black uppercase tracking-widest mb-2 block">Main Slogan</label>
                  <div className="relative">
                    <input className="w-full bg-white/5 border border-white/10 px-6 py-4 pr-16 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500 font-bold" value={slogan} onChange={e => setSlogan(e.target.value)} />
                    <button 
                      onClick={handleAISlogan}
                      disabled={isGeneratingSlogan}
                      className="absolute right-3 top-1/2 -translate-y-1/2 p-2 bg-blue-600 rounded-xl hover:bg-blue-500 disabled:opacity-50 transition-all text-white"
                    >
                      <Sparkles size={18} className={isGeneratingSlogan ? "animate-pulse" : ""} />
                    </button>
                  </div>
                </div>
                <div className="group">
                  <label className="text-xs text-gray-500 font-black uppercase tracking-widest mb-2 block">Footer Copyright</label>
                  {/* Fixed copyright variable names to match local state in AdminPanel */}
                  <textarea className="w-full bg-white/5 border border-white/10 px-6 py-4 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500 h-32" value={copyright} onChange={e => setCopyright(e.target.value)} />
                </div>
              </div>
              <div className="space-y-4">
                <label className="text-xs text-gray-500 font-black uppercase tracking-widest block">Hero Image</label>
                <div className="aspect-video rounded-[2.5rem] overflow-hidden border-2 border-white/10 relative group shadow-2xl">
                  <img src={heroImg} className="w-full h-full object-cover" alt="Hero Preview" />
                  <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => heroFileRef.current?.click()} className="bg-white text-black px-6 py-3 rounded-full font-black flex items-center gap-2 hover:scale-105 transition-transform"><Upload size={20}/> 사진 변경</button>
                  </div>
                  <input type="file" ref={heroFileRef} className="hidden" accept="image/*" onChange={e => handleFileUpload(e, setHeroImg)} />
                </div>
              </div>
            </div>
            <button onClick={saveBranding} className="w-full py-5 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-[2rem] font-black text-xl flex items-center justify-center gap-3 active:scale-95 transition-all"><Save size={24}/> 설정을 서버에 저장</button>
          </div>
        )}

        {activeTab === 'instructor' && (
          <div className="glass-card p-10 rounded-[3rem] space-y-10 animate-fade-in-up">
            <h3 className="text-2xl font-black flex items-center gap-3"><UserIcon className="text-blue-500" /> 강사 프로필 상세 편집</h3>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-gray-500 font-black mb-2 block">이름</label>
                    <input className="w-full bg-white/5 border border-white/10 px-5 py-3.5 rounded-2xl font-bold" value={instructor.name} onChange={e => setInstructor({...instructor, name: e.target.value})} />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 font-black mb-2 block">직함</label>
                    <input className="w-full bg-white/5 border border-white/10 px-5 py-3.5 rounded-2xl font-bold" value={instructor.role} onChange={e => setInstructor({...instructor, role: e.target.value})} />
                  </div>
                </div>
                <div>
                  <label className="text-xs text-gray-500 font-black mb-2 block">바이오</label>
                  <textarea className="w-full bg-white/5 border border-white/10 px-5 py-3.5 rounded-2xl h-48 leading-relaxed" value={instructor.bio} onChange={e => setInstructor({...instructor, bio: e.target.value})} />
                </div>
              </div>
              <div className="space-y-6">
                <label className="text-xs text-gray-500 font-black block">프로필 이미지</label>
                <div className="flex gap-8 items-start">
                  <div className="w-48 h-64 rounded-3xl overflow-hidden border-2 border-white/10 relative group shadow-xl">
                    <img src={instructor.profileImageUrl} className="w-full h-full object-cover" alt="Profile" />
                    <button onClick={() => instructorFileRef.current?.click()} className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center font-bold text-xs">사진 수정</button>
                    <input type="file" ref={instructorFileRef} className="hidden" accept="image/*" onChange={e => handleFileUpload(e, b => setInstructor({...instructor, profileImageUrl: b}))} />
                  </div>
                  <div className="flex-1 space-y-3">
                    <div className="flex justify-between items-center">
                      <label className="text-xs text-gray-500 font-black uppercase">약력 리스트</label>
                      <button onClick={() => setInstructor({...instructor, achievements: [...instructor.achievements, '']})} className="text-[10px] bg-blue-500/20 text-blue-400 px-3 py-1 rounded-full font-black hover:bg-blue-500 hover:text-white transition-all">+ 추가</button>
                    </div>
                    <div className="space-y-3 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
                      {instructor.achievements?.map((ach, idx) => (
                        <div key={idx} className="flex gap-2">
                          <input className="flex-1 bg-white/5 border border-white/10 px-4 py-2 rounded-xl text-sm font-medium" value={ach} onChange={e => {
                            const newAch = [...instructor.achievements];
                            newAch[idx] = e.target.value;
                            setInstructor({...instructor, achievements: newAch});
                          }} />
                          <button onClick={() => setInstructor({...instructor, achievements: instructor.achievements.filter((_, i) => i !== idx)})} className="text-red-400 p-2"><X size={16}/></button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <button onClick={saveInstructor} className="w-full py-5 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-[2rem] font-black text-xl flex items-center justify-center gap-3 hover:shadow-2xl transition-all"><Save size={24}/> 프로필 업데이트</button>
          </div>
        )}

        {activeTab === 'contents' && (
          <div className="space-y-10 animate-fade-in-up">
            <div className="glass-card p-10 rounded-[3rem] space-y-8 border-white/10">
              <h3 className="text-2xl font-black flex items-center gap-3"><BookOpen className="text-blue-500" /> 신규 강의 컨텐츠 등록</h3>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                <div className="space-y-6">
                  <div className="group">
                    <label className="text-xs text-gray-500 font-black mb-2 block">강의 제목</label>
                    <input className="w-full bg-white/5 border border-white/10 px-6 py-4 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500 font-bold" value={newContent.title} onChange={e => setNewContent({...newContent, title: e.target.value})} />
                  </div>
                  <div className="group">
                    <label className="text-xs text-gray-500 font-black mb-2 block">설명</label>
                    <textarea className="w-full bg-white/5 border border-white/10 px-6 py-4 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500 h-32" value={newContent.description} onChange={e => setNewContent({...newContent, description: e.target.value})} />
                  </div>
                </div>
                <div className="space-y-4">
                  <label className="text-xs text-gray-500 font-black block">강의 대표 이미지</label>
                  <div className="aspect-video rounded-[2.5rem] bg-white/5 border-2 border-dashed border-white/10 flex flex-col items-center justify-center overflow-hidden relative group">
                    {newContent.imageUrl ? (
                      <img src={newContent.imageUrl} className="w-full h-full object-cover" alt="Preview" />
                    ) : (
                      <div className="text-center text-gray-500">
                         <ImageIcon size={32} className="mx-auto mb-4" />
                         <p className="font-bold">이미지 선택</p>
                      </div>
                    )}
                    <button onClick={() => contentFileRef.current?.click()} className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center font-black">사진 업로드</button>
                    <input type="file" ref={contentFileRef} className="hidden" accept="image/*" onChange={e => handleFileUpload(e, b => setNewContent({...newContent, imageUrl: b}))} />
                  </div>
                </div>
              </div>
              <button onClick={addContent} className="w-full py-5 bg-blue-600 rounded-[2rem] font-black text-xl flex items-center justify-center gap-3 active:scale-95 shadow-xl shadow-blue-600/20 transition-all"><Plus size={24}/> 강의 등록하기</button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {props.contents.map(c => (
                <div key={c.id} className="glass-card rounded-3xl overflow-hidden relative group">
                  <div className="h-40 overflow-hidden">
                    <img src={c.imageUrl} className="w-full h-full object-cover" alt={c.title} />
                  </div>
                  <div className="p-5">
                    <h4 className="font-bold text-sm truncate mb-1">{c.title}</h4>
                    <p className="text-[10px] text-gray-500 truncate">{c.description}</p>
                  </div>
                  <button onClick={() => deleteItem('contents', c.id)} className="absolute top-3 right-3 p-2 bg-red-600 text-white rounded-xl opacity-0 group-hover:opacity-100 transition-all"><Trash2 size={16}/></button>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'videos' && (
          <div className="space-y-10 animate-fade-in-up">
            <div className="glass-card p-10 rounded-[3rem] space-y-8 border-white/10">
              <h3 className="text-2xl font-black flex items-center gap-3"><VideoIcon className="text-red-500" /> 유튜브 복습 영상 등록</h3>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                <div className="space-y-6">
                  <div className="group">
                    <label className="text-xs text-gray-500 font-black mb-2 block">영상 제목</label>
                    <input className="w-full bg-white/5 border border-white/10 px-6 py-4 rounded-2xl outline-none focus:ring-2 focus:ring-red-500 font-bold" value={newVideo.title} onChange={e => setNewVideo({...newVideo, title: e.target.value})} />
                  </div>
                  <div className="group">
                    <label className="text-xs text-gray-500 font-black mb-2 block">유튜브 주소</label>
                    <input className="w-full bg-white/5 border border-white/10 px-6 py-4 rounded-2xl outline-none focus:ring-2 focus:ring-red-500 font-mono text-sm" placeholder="https://www.youtube.com/watch?v=..." value={newVideo.youtubeUrl} onChange={e => setNewVideo({...newVideo, youtubeUrl: e.target.value})} />
                  </div>
                </div>
                <div className="group">
                  <label className="text-xs text-gray-500 font-black mb-2 block">설명 요약</label>
                  <textarea className="w-full bg-white/5 border border-white/10 px-6 py-4 rounded-2xl outline-none focus:ring-2 focus:ring-red-500 h-full min-h-[160px]" value={newVideo.description} onChange={e => setNewVideo({...newVideo, description: e.target.value})} />
                </div>
              </div>
              <button onClick={addVideo} className="w-full py-5 bg-red-600 rounded-[2rem] font-black text-xl flex items-center justify-center gap-3 active:scale-95 shadow-xl shadow-red-600/20 transition-all"><Plus size={24}/> 영상 등록하기</button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {props.videos.map(v => (
                <div key={v.id} className="glass-card p-5 rounded-[2.5rem] flex gap-6 items-center group relative">
                  <div className="w-40 aspect-video bg-black rounded-2xl overflow-hidden shadow-lg flex-shrink-0">
                    <img src={`https://img.youtube.com/vi/${v.youtubeId}/mqdefault.jpg`} className="w-full h-full object-cover" alt="thumb" />
                  </div>
                  <div className="flex-1 pr-10">
                    <h4 className="font-black text-lg mb-1 truncate">{v.title}</h4>
                    <p className="text-xs text-gray-500 line-clamp-2">{v.description}</p>
                  </div>
                  <button onClick={() => deleteItem('videos', v.id)} className="absolute right-6 p-3 text-red-400 hover:bg-red-400/10 rounded-2xl transition-all opacity-0 group-hover:opacity-100"><Trash2 size={22}/></button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
const SignUpView: React.FC = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    name: '',
    phone: '',
    academy: ''
  });
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.password !== formData.confirmPassword) {
      setMessage('비밀번호가 일치하지 않습니다.');
      return;
    }

    if (formData.password.length < 6) {
      setMessage('비밀번호는 6자 이상이어야 합니다.');
      return;
    }

    setIsLoading(true);
    
    try {
      // Firestore에 회원가입 신청 저장
      await addDoc(collection(db, "pendingUsers"), {
        email: formData.email,
        name: formData.name,
        phone: formData.phone,
        academy: formData.academy || 'Elite Hub',
        password: formData.password, // 실제 프로덕션에서는 해싱 필요
        status: 'pending',
        createdAt: new Date().toISOString()
      });

      setMessage('회원가입 신청이 완료되었습니다. 관리자 승인을 기다려주세요.');
      setFormData({
        email: '',
        password: '',
        confirmPassword: '',
        name: '',
        phone: '',
        academy: ''
      });
    } catch (error: any) {
      console.error(error);
      setMessage(`회원가입 신청 중 오류가 발생했습니다: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto py-20 px-6">
      <div className="glass-card p-12 rounded-[3.5rem] shadow-2xl border-white/10">
        <div className="text-center mb-10">
          <h2 className="text-4xl font-black mb-2 uppercase tracking-tight">회원가입</h2>
          <p className="text-gray-500 text-sm">학생 정보를 입력하여 가입을 신청하세요.</p>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <input
              name="name"
              type="text"
              placeholder="이름"
              value={formData.name}
              onChange={handleChange}
              required
              className="w-full bg-white/5 border border-white/10 px-6 py-4 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500 font-bold transition-all"
            />
          </div>

          <div>
            <input
              name="phone"
              type="tel"
              placeholder="전화번호"
              value={formData.phone}
              onChange={handleChange}
              required
              className="w-full bg-white/5 border border-white/10 px-6 py-4 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500 font-bold transition-all"
            />
          </div>

          <div>
            <input
              name="email"
              type="email"
              placeholder="이메일"
              value={formData.email}
              onChange={handleChange}
              required
              className="w-full bg-white/5 border border-white/10 px-6 py-4 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500 font-bold transition-all"
            />
          </div>

          <div>
            <input
              name="academy"
              type="text"
              placeholder="학원명 (선택)"
              value={formData.academy}
              onChange={handleChange}
              className="w-full bg-white/5 border border-white/10 px-6 py-4 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500 font-bold transition-all"
            />
          </div>

          <div>
            <input
              name="password"
              type="password"
              placeholder="비밀번호 (6자 이상)"
              value={formData.password}
              onChange={handleChange}
              required
              className="w-full bg-white/5 border border-white/10 px-6 py-4 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500 font-bold transition-all"
            />
          </div>

          <div>
            <input
              name="confirmPassword"
              type="password"
              placeholder="비밀번호 확인"
              value={formData.confirmPassword}
              onChange={handleChange}
              required
              className="w-full bg-white/5 border border-white/10 px-6 py-4 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500 font-bold transition-all"
            />
          </div>

          {message && (
            <div className={`p-4 rounded-2xl text-sm font-bold ${message.includes('완료') ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
              {message}
            </div>
          )}

          <button 
            type="submit" 
            disabled={isLoading}
            className="w-full bg-blue-600 py-5 rounded-2xl font-black text-xl shadow-xl shadow-blue-600/20 active:scale-95 transition-all disabled:opacity-50"
          >
            {isLoading ? '처리 중...' : '회원가입 신청'}
          </button>

          <div className="text-center pt-4">
            <a href="#/login" className="text-sm text-gray-400 hover:text-white transition-colors">
              이미 계정이 있으신가요? <span className="text-blue-400 font-bold">로그인</span>
            </a>
          </div>
        </form>
      </div>
    </div>
  );
};

const AdminApprovalView: React.FC = () => {
  const [pendingUsers, setPendingUsers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, "pendingUsers"), (snapshot) => {
      const users = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setPendingUsers(users);
      setIsLoading(false);
    }, (error) => {
      console.error("승인 대기 목록 불러오기 실패:", error);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleApprove = async (userId: string, userData: any) => {
    try {
      // users 컬렉션에 추가
      await addDoc(collection(db, "users"), {
        name: userData.name,
        phone: userData.phone,
        email: userData.email,
        academy: userData.academy || 'Elite Hub',
        status: 'approved',
        approvedAt: new Date().toISOString()
      });

      // pendingUsers에서 삭제
      await deleteDoc(doc(db, "pendingUsers", userId));

      alert(`${userData.name}님이 승인되었습니다.`);
    } catch (error: any) {
      console.error("승인 처리 실패:", error);
      alert(`승인 처리 중 오류가 발생했습니다: ${error.message}`);
    }
  };

  const handleReject = async (userId: string, userName: string) => {
    if (window.confirm(`${userName}님의 가입 신청을 거부하시겠습니까?`)) {
      try {
        await deleteDoc(doc(db, "pendingUsers", userId));
        alert("거부되었습니다.");
      } catch (error: any) {
        console.error("거부 처리 실패:", error);
        alert(`거부 처리 중 오류가 발생했습니다: ${error.message}`);
      }
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-6xl mx-auto px-6 py-12">
        <div className="glass-card p-10 rounded-[3rem]">
          <p className="text-center text-gray-400">로딩 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-6 py-12">
      <div className="glass-card p-10 rounded-[3rem] space-y-8">
        <div className="flex items-center justify-between">
          <h2 className="text-3xl font-black flex items-center gap-3">
            <UserIcon className="text-blue-500" size={32} />
            회원 가입 승인 관리
          </h2>
          <div className="px-4 py-2 bg-blue-500/20 rounded-xl">
            <span className="text-sm font-bold text-blue-400">
              대기 중: {pendingUsers.filter(u => u.status === 'pending').length}명
            </span>
          </div>
        </div>

        {pendingUsers.length === 0 ? (
          <div className="text-center py-24">
            <CheckCircle size={64} className="mx-auto mb-4 text-gray-600" />
            <p className="text-gray-500 text-lg">승인 대기 중인 회원이 없습니다.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {pendingUsers.map((user) => (
              <div 
                key={user.id} 
                className="bg-white/5 border border-white/10 rounded-2xl p-6 flex items-center justify-between hover:bg-white/10 transition-all"
              >
                <div className="flex-1 grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <p className="text-xs text-gray-500 mb-1">이름</p>
                    <p className="font-bold text-lg">{user.name}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">전화번호</p>
                    <p className="font-mono text-sm text-gray-300">{user.phone}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">이메일</p>
                    <p className="text-sm text-gray-300">{user.email}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">신청일</p>
                    <p className="text-sm text-gray-300">
                      {new Date(user.createdAt).toLocaleDateString('ko-KR')}
                    </p>
                  </div>
                </div>
                
                <div className="flex gap-3 ml-6">
                  <button
                    onClick={() => handleApprove(user.id, user)}
                    className="px-6 py-3 bg-green-600 rounded-xl font-bold hover:bg-green-500 transition-all flex items-center gap-2 shadow-lg"
                  >
                    <CheckCircle size={18} />
                    승인
                  </button>
                  <button
                    onClick={() => handleReject(user.id, user.name)}
                    className="px-6 py-3 bg-red-600 rounded-xl font-bold hover:bg-red-500 transition-all flex items-center gap-2 shadow-lg"
                  >
                    <X size={18} />
                    거부
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
// --- LOGIN VIEW ---

const LoginView: React.FC<{ onLogin: (u: UserType) => void }> = ({ onLogin }) => {
  const [isAdmin, setIsAdmin] = useState(false);
  const [formData, setFormData] = useState({ name: '', phone: '', password: '' });

  const handleAdminSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.password === '3823!!') {
      onLogin({ id: 'admin-account', name: '대표 관리자', phone: '', academy: 'Elite Hub', status: 'admin' });
    } else {
      alert('관리자 비밀번호가 올바르지 않습니다.');
    }
  };

  const handleStudentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const q = query(collection(db, "users"), where("name", "==", formData.name), where("phone", "==", formData.phone));
      const snap = await getDocs(q);
      if (!snap.empty) {
        const userData = snap.docs[0].data();
        onLogin({ id: snap.docs[0].id, ...userData } as UserType);
      } else {
        alert('등록된 수강생 정보를 찾을 수 없습니다.');
      }
    } catch(err) {
      alert('서버 연결에 실패했습니다. (보안 규칙 또는 네트워크 확인)');
    }
  };

  return (
    <div className="max-w-md mx-auto py-20 px-6">
      <div className="glass-card p-12 rounded-[3.5rem] shadow-2xl border-white/10">
        <div className="flex bg-white/5 p-1.5 rounded-2xl mb-12 shadow-inner">
          <button onClick={() => setIsAdmin(false)} className={`flex-1 py-4 rounded-xl font-black transition-all ${!isAdmin ? 'bg-white text-indigo-950 shadow-xl' : 'text-gray-500'}`}>수강생</button>
          <button onClick={() => setIsAdmin(true)} className={`flex-1 py-4 rounded-xl font-black transition-all ${isAdmin ? 'bg-white text-indigo-950 shadow-xl' : 'text-gray-500'}`}>관리자</button>
        </div>
        
        <div className="text-center mb-10">
          <h2 className="text-4xl font-black mb-2 uppercase tracking-tight">{isAdmin ? 'Admin' : 'Student'}</h2>
          <p className="text-gray-500 text-sm">{isAdmin ? '시스템 관리를 위해 로그인하세요.' : '등록된 정보를 입력하세요.'}</p>
        </div>
        
        <form className="space-y-5" onSubmit={isAdmin ? handleAdminSubmit : handleStudentSubmit}>
          {!isAdmin ? (
            <>
              <input type="text" placeholder="성함" required className="w-full bg-white/5 border border-white/10 px-6 py-5 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500 font-bold transition-all" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
              <input type="tel" placeholder="전화번호" required className="w-full bg-white/5 border border-white/10 px-6 py-5 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500 font-bold transition-all" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} />
              <button type="submit" className="w-full bg-blue-600 py-5 rounded-2xl font-black text-xl shadow-xl shadow-blue-600/20 active:scale-95 transition-all">입장하기</button>
            </>
          ) : (
            <>
              <input type="password" placeholder="관리자 비밀번호" required className="w-full bg-white/5 border border-white/10 px-6 py-5 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500 font-bold transition-all" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} />
              <button type="submit" className="w-full bg-indigo-600 py-5 rounded-2xl font-black text-xl shadow-xl shadow-indigo-600/20 active:scale-95 transition-all">관리자 접속</button>
            </>
          )}
        </form>
      </div>
    </div>
  );
};
<form className="space-y-5" onSubmit={isAdmin ? handleAdminSubmit : handleStudentSubmit}>
  {!isAdmin ? (
    <>
      <input type="text" placeholder="성함" required className="w-full bg-white/5 border border-white/10 px-6 py-5 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500 font-bold transition-all" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
      <input type="tel" placeholder="전화번호" required className="w-full bg-white/5 border border-white/10 px-6 py-5 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500 font-bold transition-all" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} />
      <button type="submit" className="w-full bg-blue-600 py-5 rounded-2xl font-black text-xl shadow-xl shadow-blue-600/20 active:scale-95 transition-all">입장하기</button>
      
      {/* 회원가입 버튼 추가 */}
      <div className="text-center pt-2">
        <a href="#/signup" className="text-sm text-gray-400 hover:text-white transition-colors">
          계정이 없으신가요? <span className="text-blue-400 font-bold">회원가입</span>
        </a>
      </div>
    </>
  ) : (
    <>
      <input type="password" placeholder="관리자 비밀번호" required className="w-full bg-white/5 border border-white/10 px-6 py-5 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500 font-bold transition-all" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} />
      <button type="submit" className="w-full bg-indigo-600 py-5 rounded-2xl font-black text-xl shadow-xl shadow-indigo-600/20 active:scale-95 transition-all">관리자 접속</button>
    </>
  )}
</form>
export default App;
