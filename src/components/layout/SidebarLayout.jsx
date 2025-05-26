"use client";

import styles from './SidebarLayout.module.css';

export default function SidebarLayout({
  children,
  profileImage = '/defaultProfileImg.png',
  userName = '',
  sidebarContent
}) {
  return (
    <div className={styles['sidebar-layout']}>
      {/* 왼쪽 사이드바 */}
      <aside className={styles.sidebar}>
        {/* 사용자 프로필 */}
        <div className={styles['user-profile']}>
          <img
            src={profileImage}
            alt={userName}
            className={styles['profile-pic']}
          />
          <div className={styles['user-name']}>{userName}</div>
        </div>

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