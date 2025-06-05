'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';
import './UserIcons.css';

// 사용자 아이콘 정보를 캐시하는 전역 객체
const userIconsCache = {};

// 사용자 아이콘 정보 가져오기
const fetchUserIcons = async (userId) => {
    if (userIconsCache[userId] || !userId || userId === '익명') {
        return userIconsCache[userId] || null;
    }

    try {
        const response = await axios.get(`http://localhost/profile/public/${userId}`);
        
        if (response.data?.status === "success") {
            const profile = response.data.profile;
            const levelInfo = response.data.levelInfo;
            const mainBadge = response.data.mainBadge;
            
            let levelIconUrl = null;
            let levelName = '새싹';
            
            // 레벨 정보가 없거나 아이콘이 없는 경우 별도로 레벨 목록에서 찾기
            if (levelInfo?.lv_idx) {
                try {
                    const token = sessionStorage.getItem('token');
                    const levelRes = await axios.get("http://localhost:80/admin/level", {
                        headers: { Authorization: token }
                    });
                    
                    const levels = Array.isArray(levelRes.data) ? levelRes.data : levelRes.data.result || [];
                    const userLevel = levels.find(level => Number(level.lv_idx) === Number(levelInfo.lv_idx));
                    
                    if (userLevel) {
                        levelIconUrl = userLevel.lv_icon;
                        levelName = userLevel.lv_name;
                    }
                } catch (levelError) {
                    // 기본 정보 사용
                    if (levelInfo?.lv_icon) {
                        levelIconUrl = levelInfo.lv_icon.startsWith('http') ? levelInfo.lv_icon : `http://localhost:80/file/${levelInfo.lv_icon}`;
                    }
                    levelName = levelInfo?.lv_name || '새싹';
                }
            }
            
            // 배지 아이콘 URL 처리
            let badgeIconUrl = null;
            if (mainBadge?.bdg_icon) {
                if (mainBadge.bdg_icon.startsWith('http')) {
                    badgeIconUrl = mainBadge.bdg_icon;
                } else {
                    badgeIconUrl = `http://localhost:80/file/${mainBadge.bdg_icon}`;
                }
            }
            
            const iconData = {
                levelIcon: levelIconUrl,
                levelName: levelName,
                badgeIcon: badgeIconUrl,
                badgeName: mainBadge?.bdg_name || null
            };
            
            userIconsCache[userId] = iconData;
            return iconData;
        }
    } catch (error) {
        console.log(`사용자 ${userId} 아이콘 정보 로딩 실패:`, error.message);
    }
    
    return null;
};

// 사용자 아이콘 렌더링 컴포넌트
export default function UserIcons({ userId, isAnonymousBoard = false, showLoading = true }) {
    const [icons, setIcons] = useState(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (userId && userId !== '익명' && !isAnonymousBoard) {
            setLoading(true);
            fetchUserIcons(userId).then((data) => {
                setIcons(data);
                setLoading(false);
            });
        }
    }, [userId, isAnonymousBoard]);

    if (isAnonymousBoard || !userId || userId === '익명') return null;
    if (loading && showLoading) return <span className="icon-loading">⏳</span>;
    if (!icons) return null;

    return (
        <div className="user-icons">
            {icons.levelIcon && (
                <img 
                    src={icons.levelIcon} 
                    alt={icons.levelName}
                    className="level-icon-small"
                    title={`레벨: ${icons.levelName}`}
                    onError={(e) => {
                        e.target.style.display = 'none';
                    }}
                />
            )}
            {icons.badgeIcon && (
                <img 
                    src={icons.badgeIcon}
                    alt={icons.badgeName}
                    className="badge-icon-small"
                    title={`배지: ${icons.badgeName}`}
                    onError={(e) => {
                        e.target.style.display = 'none';
                    }}
                />
            )}
        </div>
    );
}

// 사용자 이름과 아이콘을 함께 표시하는 컴포넌트
export function UserWithIcons({ userId, isAnonymousBoard = false, onClick = null, className = "" }) {
    if (isAnonymousBoard || !userId || userId === '익명') {
        return <span className={className}>익명</span>;
    }

    return (
        <div className="user-with-icons">
            <span 
                className={`${className} ${onClick ? 'clickable-author' : ''}`}
                onClick={onClick ? () => onClick(userId) : undefined}
            >
                {userId}
            </span>
            <UserIcons userId={userId} isAnonymousBoard={isAnonymousBoard} showLoading={false} />
        </div>
    );
} 