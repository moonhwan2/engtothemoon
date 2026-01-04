import React, { useState, useEffect } from 'react';
import {
  HashRouter as Router,
  Routes,
  Route
} from 'react-router-dom';

import { onAuthStateChanged } from "firebase/auth";
import { auth } from './firebase';

/* ✅ 기존 컴포넌트들 (이미 있는 것들) */
import Home from './pages/Home';
import Login from './pages/Login';
import AdminPanel from './pages/AdminPanel';
import ContentIntro from './pages/ContentIntro';
import Resources from './pages/Resources';
import ReviewVideos from './pages/ReviewVideos';
import QnA from './pages/QnA';
import AccessDenied from './pages/AccessDenied';

/* =========================
   App
========================= */

function App() {
  /* ✅ state는 무조건 컴포넌트 안 */
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);

  /* ✅ Firebase Auth 상태 감시 */
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user ?? null);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  /* ✅ 로딩 중엔 라우터 자체를 안 그림 */
  if (loading) {
    return (
      <div style={{ padding: 40, textAlign: 'center' }}>
        Loading...
      </div>
    );
  }

  /* 🔑 접근 권한 예시 */
  const canAccess = !!currentUser;
  const isAdmin = currentUser?.email === 'admin@email.com'; // 필요시 수정

  return (
    <Router>
      <Routes>

        {/* 홈 */}
        <Route
          path="/"
          element={<Home />}
        />

        {/* 로그인 */}
        <Route
          path="/login"
          element={
            currentUser
              ? <Home />
              : <Login />
          }
        />

        {/* 콘텐츠 */}
        <Route
          path="/content"
          element={
            canAccess
              ? <ContentIntro />
              : <AccessDenied />
          }
        />

        {/* 자료실 */}
        <Route
          path="/resources"
          element={
            canAccess
              ? <Resources />
              : <AccessDenied />
          }
        />

        {/* 영상 */}
        <Route
          path="/videos"
          element={
            canAccess
              ? <ReviewVideos />
              : <AccessDenied />
          }
        />

        {/* QnA */}
        <Route
          path="/qna"
          element={
            canAccess
              ? <QnA />
              : <AccessDenied />
          }
        />

        {/* 관리자 */}
        <Route
          path="/admin"
          element={
            isAdmin
              ? <AdminPanel />
              : <AccessDenied />
          }
        />

      </Routes>
    </Router>
  );
}

export default App;
