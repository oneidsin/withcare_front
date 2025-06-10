"use client";

import { useState, useEffect } from 'react';
import styles from './SidebarLayout.module.css';

export default function SidebarLayout({
  children,
  profileImage = '/defaultProfileImg.png',
  userName = '',
  writeButton,
  sidebarContent
}) {
  const [userProfilePic, setUserProfilePic] = useState('/defaultProfileImg.png');
  const [userDisplayName, setUserDisplayName] = useState('');
  const [imageError, setImageError] = useState(false);
  const [isClient, setIsClient] = useState(false);
  
  // 사용자 정보 가져오기 함수
  const fetchUserInfo = () => {
    try {
      const storedProfilePic = sessionStorage.getItem('profilePic');
      const storedName = sessionStorage.getItem('name') || sessionStorage.getItem('id');
      
      // 프로필 이미지 처리
      if (storedProfilePic) {
        console.log('사이드바 프로필 이미지 업데이트:', storedProfilePic);
        setUserProfilePic(storedProfilePic);
        setImageError(false); // 이미지 오류 상태 초기화
      } else {
        // 프로필 이미지가 없으면 기본 이미지 사용
        console.log('프로필 이미지가 없어서 기본 이미지 사용');
        setUserProfilePic('/defaultProfileImg.png');
        setImageError(false);
      }
      
      if (storedName) {
        console.log('사이드바 사용자 이름 업데이트:', storedName);
        setUserDisplayName(storedName);
      }
    } catch (error) {
      console.error('사용자 정보를 가져오는데 실패했습니다:', error);
    }
  };
  
  useEffect(() => {
    // 클라이언트 사이드임을 표시
    setIsClient(true);
    
    // 초기 로드 시 사용자 정보 가져오기
    fetchUserInfo();
    
    // 세션 스토리지 변경 이벤트 리스너 (커스텀 이벤트)
    const handleStorageChange = (e) => {
      if (e.key === 'profilePic' || e.key === 'name' || e.key === 'id') {
        console.log('세션 스토리지 변경 감지:', e.key, e.newValue);
        fetchUserInfo();
      }
    };
    
    // 페이지 포커스를 얻을 때마다 정보 새로고침
    const handleFocus = () => {
      console.log('페이지가 포커스를 얻었습니다. 프로필 정보 새로고침');
      fetchUserInfo();
    };
    
    // 이벤트 리스너 등록
    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('focus', handleFocus);
    
    // 커스텀 이벤트 등록 - 프로필 업데이트 시 발생
    window.addEventListener('profileUpdated', fetchUserInfo);
    
    // 컴포넌트 언마운트 시 이벤트 리스너 제거
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('profileUpdated', fetchUserInfo);
    };
  }, []);
  
  const handleImageError = () => {
    setImageError(true);
    setUserProfilePic('/defaultProfileImg.png');
  };

  return (
    <div className={styles['sidebar-layout']}>
      {/* 왼쪽 사이드바 */}
      <aside className={styles.sidebar}>
        {/* 사용자 프로필 */}
        <div className={styles['user-profile']}>
          <img
            src={imageError ? '/defaultProfileImg.png' : (isClient ? userProfilePic : '/defaultProfileImg.png')}
            alt={isClient ? userDisplayName : ''}
            className="sidebar-profile-pic"
            onError={handleImageError}
          />
          <div className={styles['user-name']}>{isClient ? userDisplayName : ''}</div>
        </div>

        {/* 작성하기 버튼 */}
        {writeButton}

        {/* 사이드바 내용 */}
        <nav className={styles['sidebar-nav']}>
          {sidebarContent}
        </nav>
      </aside>

      {/* 오른쪽 중앙 박스 - 내용 표시 영역 */}
      <section className={styles['content-box']}>
        {children}
      </section>
    </div>
  );
} 