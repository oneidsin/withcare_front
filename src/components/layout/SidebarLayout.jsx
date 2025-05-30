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
  const [userProfilePic, setUserProfilePic] = useState(profileImage);
  const [userDisplayName, setUserDisplayName] = useState(userName);
  const [imageError, setImageError] = useState(false);
  
  useEffect(() => {
    // 세션 스토리지에서 사용자 정보 가져오기 시도
    const fetchUserInfo = async () => {
      try {
        const storedProfilePic = sessionStorage.getItem('profilePic');
        const storedName = sessionStorage.getItem('name') || sessionStorage.getItem('id');
        
        if (storedProfilePic) {
          setUserProfilePic(storedProfilePic);
        }
        
        if (storedName) {
          setUserDisplayName(storedName);
        }
      } catch (error) {
        console.error('사용자 정보를 가져오는데 실패했습니다:', error);
      }
    };
    
    fetchUserInfo();
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
            src={imageError ? '/defaultProfileImg.png' : userProfilePic}
            alt={userDisplayName}
            className={styles['profile-pic']}
            onError={handleImageError}
          />
          <div className={styles['user-name']}>{userDisplayName}</div>
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