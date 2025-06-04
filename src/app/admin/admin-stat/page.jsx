'use client'

import { useState, useEffect } from 'react';
import { Tabs, Tab, Box, Typography, Paper, Grid, CircularProgress } from '@mui/material';
import axios from 'axios';
import { BarChart, PieChart, LineChart } from '@mui/x-charts';
import './stat.css';

export default function AdminStat() {
  const [tabValue, setTabValue] = useState(0);
  const [memberStats, setMemberStats] = useState({ ageData: [], genderData: [] });
  const [memberCounts, setMemberCounts] = useState({ totalMember: 0, newMember: 0, dailyNewMembers: [] });
  const [postStats, setPostStats] = useState({ weeklyPostCount: 0, weeklyCommentCount: 0, weeklyPostAndCom: [], bestPosts: [] });
  const [reportStats, setReportStats] = useState({ totalCount: 0, weeklyCount: 0, typeStats: {}, reasonStats: {} });
  const [blockStats, setBlockStats] = useState({ totalCount: 0, weeklyCount: 0, reasonStats: {}, userToUserStats: { totalCount: 0, weeklyCount: 0 } });
  const [loading, setLoading] = useState(true);

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        const [
          memberRes,
          memberCountRes,
          weeklyPostCountRes,
          weeklyCommentCountRes,
          weeklyPostAndComRes,
          bestPostsRes,
          reportRes,
          reportTypeRes,
          reportReasonRes,
          blockRes,
          blockReasonRes,
          blockUserToUserRes,
        ] = await Promise.all([
          axios.get('http://localhost:80/stat/member-group'),
          axios.get('http://localhost:80/stat/member-count'),
          axios.get('http://localhost:80/stat/weekly-count-post'),
          axios.get('http://localhost:80/stat/weekly-count-comment'),
          axios.get('http://localhost:80/stat/weekly-post-com'),
          axios.get('http://localhost:80/stat/best-post'),
          axios.get('http://localhost:80/stat/report'),
          axios.get('http://localhost:80/stat/report-type'),
          axios.get('http://localhost:80/stat/report-reason'),
          axios.get('http://localhost:80/stat/block'),
          axios.get('http://localhost:80/stat/block-reason'),
          axios.get('http://localhost:80/stat/block-usertouser'),
        ]);

        const ageData = [];
        const genderData = [];

        (memberRes.data || []).forEach(item => {
          if (item.type === 'AGE') ageData.push({ label: item.label, count: item.count });
          if (item.type === 'GENDER') genderData.push({ label: item.label, count: item.count });
        });

        setMemberStats({ ageData, genderData });

        const memberCountData = memberCountRes.data[0] || {};
        const dailyNewMembers = Array(7).fill(0);
        dailyNewMembers[6] = memberCountData.new_member || 0;

        setMemberCounts({
          totalMember: memberCountData.total_member || 0,
          newMember: memberCountData.new_member || 0,
          dailyNewMembers,
        });

        const weeklyPostAndComData = (weeklyPostAndComRes.data || []).map(item => ({
          boardName: item.board_name || '게시판',
          postCount: item.post_count || 0,
          commentCount: item.comment_count || 0,
        }));

        setPostStats({
          weeklyPostCount: weeklyPostCountRes.data || 0,
          weeklyCommentCount: weeklyCommentCountRes.data || 0,
          weeklyPostAndCom: weeklyPostAndComData,
          bestPosts: bestPostsRes.data || [],
        });

        const reportData = reportRes.data[0] || {};
        setReportStats({
          totalCount: reportData.total_count || 0,
          weeklyCount: reportData.weekly_count || 0,
          typeStats: reportTypeRes.data || {},
          reasonStats: reportReasonRes.data || {},
        });

        setBlockStats({
          totalCount: blockRes.data?.total_count || 0,
          weeklyCount: blockRes.data?.weekly_count || 0,
          reasonStats: blockReasonRes.data || {},
          userToUserStats: {
            totalCount: blockUserToUserRes.data?.total_count || 0,
            weeklyCount: blockUserToUserRes.data?.weekly_count || 0,
          },
        });
      } catch (error) {
        console.error('통계 데이터를 가져오는 중 오류 발생:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const getBoardPostChartData = () => {
    const sorted = postStats.weeklyPostAndCom.sort((a, b) => b.postCount - a.postCount);
    const topN = 4;
    const topItems = sorted.slice(0, topN);
    const otherTotal = sorted.slice(topN).reduce((sum, item) => sum + item.postCount, 0);
    const finalData = [...topItems];
    if (otherTotal > 0) finalData.push({ boardName: '기타', postCount: otherTotal });

    return {
      labels: finalData.map(d => d.boardName),
      data: finalData.map(d => d.postCount),
    };
  };

  const getReportReasonChartData = () => Object.entries(reportStats.reasonStats || {}).map(([label, value]) => ({ label, value }));
  const getBlockReasonChartData = () => Object.entries(blockStats.reasonStats || {}).map(([label, value]) => ({ label, value }));

  if (loading) {
    return (
        <Box className="loading-container">
          <CircularProgress />
          <Typography className="loading-text">통계 데이터를 불러오는 중...</Typography>
        </Box>
    );
  }

  return (
      <Box className="stat-container">
        <Typography
            className="stat-title"
            sx={{
              fontWeight: 600,
              fontSize: '24px',
              borderBottom: '2px solid #eee',
              paddingBottom: '8px', // (살짝 여백 주면 밑줄 깔끔함)
              marginBottom: '20px'
            }}
        >
          통계 관리
        </Typography>

        <Paper className="stat-paper">
          <Tabs value={tabValue} onChange={handleTabChange} variant="fullWidth" indicatorColor="primary" textColor="primary">
            <Tab label="회원 통계" />
            <Tab label="게시글 통계" />
            <Tab label="신고 통계" />
            <Tab label="차단 통계" />
          </Tabs>

          {/* 회원 통계 */}
          {tabValue === 0 && (
              <Box className="tab-content">
                <Typography className="tab-summary">총 회원: <strong>{memberCounts.totalMember}</strong> | 오늘 신규: <strong>{memberCounts.newMember}</strong></Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} md={3}>
                    <Paper className="chart-paper">
                      <Typography className="chart-title">성별 분포</Typography>
                      <Box className="chart-container">
                        <PieChart
                            series={[{ data: memberStats.genderData.map((item, idx) => ({
                                id: idx, value: item.count, label: item.label,
                                color: item.label === '남자' ? 'rgba(54, 162, 235, 0.6)' : 'rgba(255, 99, 132, 0.6)',
                              })) }]}
                            width={240} height={240} slotProps={{ legend: { hidden: true } }}
                        />
                      </Box>
                    </Paper>
                  </Grid>

                  <Grid item xs={12} md={3}>
                    <Paper className="chart-paper">
                      <Typography className="chart-title">연령별 분포</Typography>
                      <Box className="chart-container">
                        <BarChart
                            xAxis={[{ scaleType: 'band', data: memberStats.ageData.map(item => item.label), tickLabelStyle: { fontSize: 10 } }]}
                            series={[{ data: memberStats.ageData.map(item => item.count), color: 'rgba(153, 102, 255, 0.6)' }]}
                            width={240} height={240} slotProps={{ legend: { hidden: true } }}
                        />
                      </Box>
                    </Paper>
                  </Grid>
                </Grid>
              </Box>
          )}

          {/* 게시글 통계 */}
          {tabValue === 1 && (
              <Box className="tab-content">
                <Typography className="tab-summary">주간 게시글: <strong>{postStats.weeklyPostCount}</strong> | 주간 댓글: <strong>{postStats.weeklyCommentCount}</strong></Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} md={3}>
                    <Paper className="chart-paper">
                      <Typography className="chart-title">주간 게시글 vs 댓글</Typography>
                      <Box className="chart-container">
                        <PieChart
                            series={[{ data: [
                                { id: 0, value: postStats.weeklyPostCount, label: '게시글', color: 'rgba(54, 162, 235, 0.6)' },
                                { id: 1, value: postStats.weeklyCommentCount, label: '댓글', color: 'rgba(255, 206, 86, 0.6)' },
                              ]}]}
                            width={240} height={240} slotProps={{ legend: { hidden: true } }}
                        />
                      </Box>
                    </Paper>
                  </Grid>

                  <Grid item xs={12} md={3}>
                    <Paper className="chart-paper">
                      <Typography className="chart-title">게시판별 게시글 수</Typography>
                      <Box className="chart-container">
                        <BarChart
                            xAxis={[{ scaleType: 'band', data: getBoardPostChartData().labels, tickLabelStyle: { fontSize: 10 } }]}
                            series={[{ data: getBoardPostChartData().data, color: 'rgba(255, 99, 132, 0.6)' }]}
                            width={300} height={240} slotProps={{ legend: { hidden: true } }}
                        />
                      </Box>
                    </Paper>
                  </Grid>

                  <Grid item xs={12} md={6}>
                    <Paper className="chart-paper">
                      <Typography className="chart-title">주간 인기 게시글</Typography>
                      <Box className="table-container">
                        <table className="stat-table">
                          <thead><tr><th>제목</th><th>작성자</th><th>추천</th><th>조회</th></tr></thead>
                          <tbody>
                          {postStats.bestPosts.slice(0, 5).map((post, idx) => (
                              <tr key={idx}><td className="title-cell">{post.post_title}</td><td>{post.id}</td><td>{post.like_count}</td><td>{post.post_view_cnt}</td></tr>
                          ))}
                          </tbody>
                        </table>
                      </Box>
                    </Paper>
                  </Grid>
                </Grid>
              </Box>
          )}

          {/* 신고 통계 */}
          {tabValue === 2 && (
              <Box className="tab-content">
                <Typography className="tab-summary">전체 신고: <strong>{reportStats.totalCount}</strong> | 주간 신고: <strong>{reportStats.weeklyCount}</strong></Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} md={3}>
                    <Paper className="chart-paper">
                      <Typography className="chart-title">신고 유형별</Typography>
                      <Box className="chart-container">
                        <PieChart
                            series={[{ data: Object.entries(reportStats.typeStats).map(([label, value], idx) => ({
                                id: idx, value, label, color: ['rgba(255,99,132,0.6)', 'rgba(54,162,235,0.6)', 'rgba(255,206,86,0.6)'][idx%3]
                              })) }]}
                            width={240} height={240} slotProps={{ legend: { hidden: true } }}
                        />
                      </Box>
                    </Paper>
                  </Grid>

                  <Grid item xs={12} md={3}>
                    <Paper className="chart-paper">
                      <Typography className="chart-title">신고 사유별</Typography>
                      <Box className="chart-container">
                        <BarChart
                            xAxis={[{ scaleType: 'band', data: getReportReasonChartData().map(d => d.label), tickLabelStyle: { fontSize: 10 } }]}
                            series={[{ data: getReportReasonChartData().map(d => d.value), color: 'rgba(75,192,192,0.6)' }]}
                            width={300} height={240}
                        />
                      </Box>
                    </Paper>
                  </Grid>

                  <Grid item xs={12} md={6}>
                    <Paper className="chart-paper">
                      <Typography className="chart-title">신고 상세</Typography>
                      <Box className="table-container">
                        <table className="stat-table">
                          <thead><tr><th>유형</th><th>전체</th></tr></thead>
                          <tbody>{Object.entries(reportStats.typeStats).map(([label,value],idx)=>(
                              <tr key={idx}><td>{label}</td><td>{value}</td></tr>
                          ))}</tbody>
                        </table>
                      </Box>
                    </Paper>
                  </Grid>
                </Grid>
              </Box>
          )}

          {/* 차단 통계 */}
          {tabValue === 3 && (
              <Box className="tab-content">
                <Typography className="tab-summary">전체 차단: <strong>{blockStats.totalCount}</strong> | 주간 차단: <strong>{blockStats.weeklyCount}</strong></Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} md={4}>
                    <Paper className="chart-paper">
                      <Typography className="chart-title">차단 사유별</Typography>
                      <Box className="chart-container">
                        <BarChart
                            xAxis={[{ scaleType: 'band', data: getBlockReasonChartData().map(d => d.label), tickLabelStyle: { fontSize: 10 } }]}
                            series={[{ data: getBlockReasonChartData().map(d => d.value), color: 'rgba(153,102,255,0.6)' }]}
                            width={300} height={240}
                        />
                      </Box>
                    </Paper>
                  </Grid>

                  <Grid item xs={12} md={4}>
                    <Paper className="chart-paper">
                      <Typography className="chart-title">유저간 차단</Typography>
                      <Box className="chart-container">
                        <PieChart
                            series={[{ data: [
                                { id: 0, value: blockStats.totalCount, label: '전체', color: 'rgba(54,162,235,0.6)' },
                                { id: 1, value: blockStats.userToUserStats.totalCount, label: '유저간', color: 'rgba(255,206,86,0.6)' },
                              ]}]}
                            width={240} height={240}
                        />
                      </Box>
                    </Paper>
                  </Grid>

                  <Grid item xs={12} md={4}>
                    <Paper className="chart-paper">
                      <Typography className="chart-title">차단 상세</Typography>
                      <Box className="table-container">
                        <table className="stat-table">
                          <thead><tr><th>사유</th><th>건수</th></tr></thead>
                          <tbody>{Object.entries(blockStats.reasonStats).map(([label,value],idx)=>(
                              <tr key={idx}><td>{label}</td><td>{value}</td></tr>
                          ))}</tbody>
                        </table>
                      </Box>
                    </Paper>
                  </Grid>
                </Grid>
              </Box>
          )}

        </Paper>
      </Box>
  );
}
