"use client"

export default function Badge(){
    return (
        <div style={{ padding: '20px', textAlign: 'center' }}>
            <h1>내 배지</h1>
            <div style={{ 
                padding: '60px 20px', 
                background: '#f9f9f9', 
                borderRadius: '12px', 
                border: '1px dashed #ddd',
                marginTop: '20px'
            }}>
                <p style={{ fontSize: '16px', color: '#666', marginBottom: '10px' }}>
                    아직 획득한 배지가 없습니다.
                </p>
                <p style={{ fontSize: '14px', color: '#999', margin: '0' }}>
                    활동을 통해 배지를 획득해보세요!
                </p>
            </div>
        </div>
    );
}