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

/* =========================
   HELPERS / CONSTANTS
========================= */

const extractYoutubeId = (url: string) => {
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
  const match = url.match(regExp);
  return (match && match[2].length === 11) ? match[2] : null;
};

const DEFAULT_INSTRUCTOR: InstructorInfo = {
  name: "강사 성함",
  role: "대표 강사 / 교육 전문가",
  profileImageUrl: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=400",
  bio: "수강생 여러분의 무한한 성장을 위해 최고의 교육 환경을 제공합니다.",
  achievements: ["주요 학력 및 경력 1", "주요 학력 및 경력 2", "주요 저서 및 연구"]
};

/* =========================
   UI COMPONENTS
   (네가 쓴 것 전부 그대로)
========================= */
/* NavItem, SectionTitle, Home, Login, AdminPanel 등
   👉 여기 아래는 네가 올린 코드 그대로 두면 됨
*/

/* =========================
   ✅ 핵심: App 컴포넌트
========================= */

function App() {
  /* 🔴 문제였던 부분 — 이제 여기 있음 */
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);

  /* Firebase 로그인 상태 감시 */
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      if (user) {
        setCurrentUser(user);
      } else {
        setCurrentUser(null);
      }
      setLoading(false);
    });
    return () => unsub();
  }, []);

  /* 로딩 중 차단 */
  if (loading) {
    return (
      <div style={{ padding: 40, textAlign: "center" }}>
        Loading...
      </div>
    );
  }

  return (
    <Router>
      <Routes>
        {/* 예시 — 기존 Route 그대로 유지 */}
        {/* <Route path="/" element={<Home />} /> */}
        {/* <Route path="/login" element={<Login onLogin={...} />} /> */}
        {/* <Route path="/admin" element={<AdminPanel ... />} /> */}
      </Routes>
    </Router>
  );
}

export default App;

