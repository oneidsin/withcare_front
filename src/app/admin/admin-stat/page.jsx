'use client';

import { useState, useEffect } from 'react';
import { Tabs, Tab, Box, Typography, Paper, Grid, CircularProgress } from '@mui/material';
import axios from 'axios';
import { BarChart, PieChart, LineChart } from '@mui/x-charts';
import './stat.css';

export default function AdminStat() {
  const [tabValue, setTabValue] = useState(0);
  const [memberStats, setMemberStats] = useState({
    ageData: [],
    genderData: []
  });
  const [memberCounts, setMemberCounts] = useState({
    totalMember: 0,
    newMember: 0,
    dailyNewMembers: []
  });
  const [postStats, setPostStats] = useState({
    weeklyPostCount: 0,
    weeklyCommentCount: 0,
    weeklyPostAndCom: [],
    bestPosts: []
  });
  const [reportStats, setReportStats] = useState({
    totalCount: 0,
    weeklyCount: 0,
    typeStats: [],
    reasonStats: []
  });
  const [blockStats, setBlockStats] = useState({
    totalCount: 0,
    weeklyCount: 0,
    reasonStats: {},
    userToUserStats: {
      totalCount: 0,
      weeklyCount: 0
    }
  });
  const [loading, setLoading] = useState(true);

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        // 회원 통계 데이터 가져오기
        const memberResponse = await axios.get('http://localhost:80/stat/member-group');
        const memberCountResponse = await axios.get('http://localhost:80/stat/member-count');

        // 게시글 통계 데이터 가져오기
        const weeklyPostCountResponse = await axios.get('http://localhost:80/stat/weekly-count-post');
        const weeklyCommentCountResponse = await axios.get('http://localhost:80/stat/weekly-count-comment');
        const weeklyPostAndComResponse = await axios.get('http://localhost:80/stat/weekly-post-com');
        const bestPostsResponse = await axios.get('http://localhost:80/stat/best-post');

        // 신고 통계 데이터 가져오기
        const reportResponse = await axios.get('http://localhost:80/stat/report');
        const reportTypeResponse = await axios.get('http://localhost:80/stat/report-type');
        const reportReasonResponse = await axios.get('http://localhost:80/stat/report-reason');

        // 차단 통계 데이터 가져오기
        const blockResponse = await axios.get('http://localhost:80/stat/block');
        const blockReasonResponse = await axios.get('http://localhost:80/stat/block-reason');
        const blockUserToUserResponse = await axios.get('http://localhost:80/stat/block-usertouser');

        // 회원 통계 데이터 처리
        const ageData = [];
        const genderData = [];

        if (memberResponse.data && Array.isArray(memberResponse.data)) {
          memberResponse.data.forEach(item => {
            if (item.type === 'AGE') {
              ageData.push({
                label: item.label,
                count: item.count
              });
            } else if (item.type === 'GENDER') {
              genderData.push({
                label: item.label,
                count: item.count
              });
            }
          });
        }

        setMemberStats({
          ageData,
          genderData
        });

        // 회원 수 통계 데이터 처리
        if (memberCountResponse.data && Array.isArray(memberCountResponse.data) && memberCountResponse.data.length > 0) {
          const memberCountData = memberCountResponse.data[0];
          // 일간 신규 가입자 수 데이터는 실제 데이터가 없으므로 최신 데이터만 사용
          const dailyNewMembers = Array(7).fill(0);
          dailyNewMembers[6] = memberCountData.new_member || 0; // 마지막 날짜(오늘)에 신규 가입자 수 설정

          setMemberCounts({
            totalMember: memberCountData.total_member || 0,
            newMember: memberCountData.new_member || 0,
            dailyNewMembers
          });
        }

        // 게시글 통계 데이터 처리
        const boardPostCounts = [];

        if (weeklyPostAndComResponse.data && Array.isArray(weeklyPostAndComResponse.data)) {
          weeklyPostAndComResponse.data.forEach(item => {
            boardPostCounts.push({
              boardName: item.board_name || '게시판',
              postCount: item.post_count || 0,
              commentCount: item.comment_count || 0
            });
          });
        }

        setPostStats({
          weeklyPostCount: weeklyPostCountResponse.data || 0,
          weeklyCommentCount: weeklyCommentCountResponse.data || 0,
          weeklyPostAndCom: boardPostCounts,
          bestPosts: bestPostsResponse.data || []
        });

        // 신고 통계 데이터 처리
        let totalReportCount = 0;
        let weeklyReportCount = 0;

        if (reportResponse.data && Array.isArray(reportResponse.data) && reportResponse.data.length > 0) {
          const reportData = reportResponse.data[0];
          totalReportCount = reportData.total_count || 0;
          weeklyReportCount = reportData.weekly_count || 0;
        }

        setReportStats({
          totalCount: totalReportCount,
          weeklyCount: weeklyReportCount,
          typeStats: reportTypeResponse.data || [],
          reasonStats: reportReasonResponse.data || []
        });

        // 차단 통계 데이터 처리
        setBlockStats({
          totalCount: blockResponse.data?.total_count || 0,
          weeklyCount: blockResponse.data?.weekly_count || 0,
          reasonStats: blockReasonResponse.data || {},
          userToUserStats: {
            totalCount: blockUserToUserResponse.data?.total_count || 0,
            weeklyCount: blockUserToUserResponse.data?.weekly_count || 0
          }
        });

      } catch (error) {
        console.error('통계 데이터를 가져오는 중 오류 발생:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // 차트 데이터 가공
  const getAgeChartData = () => {
    const labels = memberStats.ageData.map(item => item.label);
    const data = memberStats.ageData.map(item => item.count);

    return {
      labels,
      data
    };
  };

  const getGenderChartData = () => {
    return memberStats.genderData.map((item, index) => ({
      id: index,
      value: item.count,
      label: item.label,
      color: item.label === '남성' ? 'rgba(54, 162, 235, 0.6)' : 'rgba(255, 99, 132, 0.6)'
    }));
  };

  const getBoardPostChartData = () => {
    return postStats.weeklyPostAndCom.map((item, index) => ({
      id: index,
      value: item.postCount,
      label: item.boardName,
      color: [
        'rgba(255, 99, 132, 0.6)',
        'rgba(54, 162, 235, 0.6)',
        'rgba(255, 206, 86, 0.6)',
        'rgba(75, 192, 192, 0.6)',
        'rgba(153, 102, 255, 0.6)'
      ][index % 5]
    }));
  };

  const getReportReasonChartData = () => {
    return reportStats.reasonStats.map((item, index) => ({
      id: index,
      value: item.weekly_count,
      label: item.cate_name,
      color: [
        'rgba(255, 99, 132, 0.6)',
        'rgba(54, 162, 235, 0.6)',
        'rgba(255, 206, 86, 0.6)',
        'rgba(75, 192, 192, 0.6)',
        'rgba(153, 102, 255, 0.6)'
      ][index % 5]
    }));
  };

  const getReportTypeChartData = () => {
    return reportStats.typeStats.map((item, index) => ({
      id: index,
      value: item.weekly_count,
      label: item.rep_item_type,
      color: [
        'rgba(255, 99, 132, 0.6)',
        'rgba(54, 162, 235, 0.6)',
        'rgba(255, 206, 86, 0.6)'
      ][index % 3]
    }));
  };

  const getBlockReasonChartData = () => {
    if (!blockStats.reasonStats || Object.keys(blockStats.reasonStats).length === 0) {
      return [];
    }

    const reasons = blockStats.reasonStats;
    return Object.keys(reasons).map((key, index) => ({
      id: index,
      value: reasons[key],
      label: key,
      color: [
        'rgba(255, 99, 132, 0.6)',
        'rgba(54, 162, 235, 0.6)',
        'rgba(255, 206, 86, 0.6)',
        'rgba(75, 192, 192, 0.6)',
        'rgba(153, 102, 255, 0.6)'
      ][index % 5]
    }));
  };
  
  const ageChartData = getAgeChartData();
  const genderChartData = getGenderChartData();
  const boardPostChartData = getBoardPostChartData();
  const reportReasonChartData = getReportReasonChartData();
  const reportTypeChartData = getReportTypeChartData();
  const blockReasonChartData = getBlockReasonChartData();

  // 로딩 중 표시
  if (loading) {
    return (
      <Box className="loading-container">
        <CircularProgress />
        <Typography variant="h6" className="loading-text">
          통계 데이터를 불러오는 중...
        </Typography>
      </Box>
    );
  }

  return (
    <Box className="stat-container">
      <Typography variant="h4" className="stat-title">
        통계 관리
      </Typography>
      
      <Paper className="stat-paper">
        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          variant="fullWidth"
          indicatorColor="primary"
          textColor="primary"
        >
          <Tab label="회원 통계" />
          <Tab label="게시글 통계" />
          <Tab label="신고 통계" />
          <Tab label="차단 통계" />
        </Tabs>
        
        {/* 회원 통계 탭 */}
        {tabValue === 0 && (
          <Box className="tab-content">
            <Typography variant="h6" className="tab-title">
              회원 통계
            </Typography>
            
            {memberStats.ageData.length === 0 && memberStats.genderData.length === 0 ? (
              <Box className="no-data-box">
                <Typography variant="body1">
                  회원 통계 데이터가 없습니다.
                </Typography>
              </Box>
            ) : (
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <Paper className="chart-paper">
                    <Typography variant="subtitle1" className="chart-title">
                      성별 분포
                    </Typography>
                    <Box className="chart-container">
                      {genderChartData.length > 0 ? (
                        <PieChart
                          series={[
                            {
                              data: genderChartData,
                              innerRadius: 30,
                              outerRadius: 100,
                              paddingAngle: 2,
                              cornerRadius: 5,
                              startAngle: -90,
                              endAngle: 270,
                              cx: 150,
                              cy: 150,
                            },
                          ]}
                          width={300}
                          height={300}
                        />
                      ) : (
                        <Typography variant="body2" className="no-chart-data">
                          성별 분포 데이터가 없습니다.
                        </Typography>
                      )}
                    </Box>
                  </Paper>
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <Paper className="chart-paper">
                    <Typography variant="subtitle1" className="chart-title">
                      연령별 분포
                    </Typography>
                    <Box className="chart-container">
                      {ageChartData.labels.length > 0 ? (
                        <BarChart
                          xAxis={[{ scaleType: 'band', data: ageChartData.labels }]}
                          series={[
                            {
                              data: ageChartData.data,
                              color: 'rgba(153, 102, 255, 0.6)',
                            },
                          ]}
                          width={300}
                          height={300}
                        />
                      ) : (
                        <Typography variant="body2" className="no-chart-data">
                          연령별 분포 데이터가 없습니다.
                        </Typography>
                      )}
                    </Box>
                  </Paper>
                </Grid>
                
                <Grid item xs={12}>
                  <Paper className="chart-paper">
                    <Typography variant="subtitle1" className="chart-title">
                      일간 신규 가입자 수 (오늘: {memberCounts.newMember}명)
                    </Typography>
                    <Box className="chart-container">
                      <LineChart
                        xAxis={[{ 
                          data: [1, 2, 3, 4, 5, 6, 7], 
                          label: '일자',
                          valueFormatter: (value) => ['6일전', '5일전', '4일전', '3일전', '2일전', '1일전', '오늘'][value-1]
                        }]}
                        yAxis={[{ label: '가입자 수' }]}
                        series={[
                          {
                            data: memberCounts.dailyNewMembers,
                            label: '신규 가입자',
                            color: 'rgba(75, 192, 192, 1)',
                          },
                        ]}
                        width={800}
                        height={300}
                      />
                    </Box>
                  </Paper>
                </Grid>
              </Grid>
            )}
          </Box>
        )}
        
        {/* 게시글 통계 탭 */}
        {tabValue === 1 && (
          <Box className="tab-content">
            <Typography variant="h6" className="tab-title">
              게시글 통계
            </Typography>
            
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Paper className="chart-paper">
                  <Typography variant="subtitle1" className="chart-title">
                    주간 게시글 및 댓글 작성 수
                  </Typography>
                  <Box className="chart-container">
                    <BarChart
                      xAxis={[{ scaleType: 'band', data: ['게시글', '댓글'] }]}
                      series={[
                        {
                          data: [postStats.weeklyPostCount || 0, postStats.weeklyCommentCount || 0],
                          color: 'rgba(255, 99, 132, 0.6)',
                        },
                      ]}
                      width={300}
                      height={300}
                    />
                  </Box>
                </Paper>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <Paper className="chart-paper">
                  <Typography variant="subtitle1" className="chart-title">
                    게시판별 게시글 수
                  </Typography>
                  <Box className="chart-container">
                    {boardPostChartData.length > 0 ? (
                      <PieChart
                        series={[
                          {
                            data: boardPostChartData,
                            innerRadius: 30,
                            outerRadius: 100,
                            paddingAngle: 2,
                            cornerRadius: 5,
                            startAngle: -90,
                            endAngle: 270,
                            cx: 150,
                            cy: 150,
                          },
                        ]}
                        width={300}
                        height={300}
                      />
                    ) : (
                      <Typography variant="body2" className="no-chart-data">
                        게시판별 게시글 데이터가 없습니다.
                      </Typography>
                    )}
                  </Box>
                </Paper>
              </Grid>
              
              <Grid item xs={12}>
                <Paper className="chart-paper">
                  <Typography variant="subtitle1" className="chart-title">
                    주간 인기 게시글 (추천수 기준)
                  </Typography>
                  <Box className="table-container">
                    <table className="stat-table">
                      <thead>
                        <tr>
                          <th>제목</th>
                          <th>작성자</th>
                          <th>추천수</th>
                          <th>조회수</th>
                        </tr>
                      </thead>
                      <tbody>
                        {Array.isArray(postStats.bestPosts) && postStats.bestPosts.length > 0 ? (
                          postStats.bestPosts.map((post, index) => (
                            <tr key={index}>
                              <td>{post.post_title || '제목 없음'}</td>
                              <td>{post.id || '-'}</td>
                              <td>{post.like_count || 0}</td>
                              <td>{post.post_view_cnt || 0}</td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan={4} className="no-data-cell">
                              인기 게시글 데이터가 없습니다.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </Box>
                </Paper>
              </Grid>
            </Grid>
          </Box>
        )}
        
        {/* 신고 통계 탭 */}
        {tabValue === 2 && (
          <Box className="tab-content">
            <Typography variant="h6" className="tab-title">
              신고 통계 (전체: {reportStats.totalCount}건, 주간: {reportStats.weeklyCount}건)
            </Typography>
            
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Paper className="chart-paper">
                  <Typography variant="subtitle1" className="chart-title">
                    신고 유형별 분포
                  </Typography>
                  <Box className="chart-container">
                    {reportTypeChartData.length > 0 ? (
                      <PieChart
                        series={[
                          {
                            data: reportTypeChartData,
                            innerRadius: 30,
                            outerRadius: 100,
                            paddingAngle: 2,
                            cornerRadius: 5,
                            startAngle: -90,
                            endAngle: 270,
                            cx: 150,
                            cy: 150,
                          },
                        ]}
                        width={300}
                        height={300}
                      />
                    ) : (
                      <Typography variant="body2" className="no-chart-data">
                        신고 유형별 데이터가 없습니다.
                      </Typography>
                    )}
                  </Box>
                </Paper>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <Paper className="chart-paper">
                  <Typography variant="subtitle1" className="chart-title">
                    신고 사유별 분포
                  </Typography>
                  <Box className="chart-container">
                    {reportReasonChartData.length > 0 ? (
                      <PieChart
                        series={[
                          {
                            data: reportReasonChartData,
                            innerRadius: 30,
                            outerRadius: 100,
                            paddingAngle: 2,
                            cornerRadius: 5,
                            startAngle: -90,
                            endAngle: 270,
                            cx: 150,
                            cy: 150,
                          },
                        ]}
                        width={300}
                        height={300}
                      />
                    ) : (
                      <Typography variant="body2" className="no-chart-data">
                        신고 사유별 데이터가 없습니다.
                      </Typography>
                    )}
                  </Box>
                </Paper>
              </Grid>
              
              <Grid item xs={12}>
                <Paper className="chart-paper">
                  <Typography variant="subtitle1" className="chart-title">
                    신고 유형별 상세 통계
                  </Typography>
                  <Box className="table-container">
                    <table className="stat-table">
                      <thead>
                        <tr>
                          <th>유형</th>
                          <th>전체 건수</th>
                          <th>주간 건수</th>
                        </tr>
                      </thead>
                      <tbody>
                        {Array.isArray(reportStats.typeStats) && reportStats.typeStats.length > 0 ? (
                          reportStats.typeStats.map((item, index) => (
                            <tr key={index}>
                              <td>{item.rep_item_type || '-'}</td>
                              <td>{item.total_count || 0}</td>
                              <td>{item.weekly_count || 0}</td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan={3} className="no-data-cell">
                              신고 유형별 상세 통계 데이터가 없습니다.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </Box>
                </Paper>
              </Grid>
            </Grid>
          </Box>
        )}
        
        {/* 차단 통계 탭 */}
        {tabValue === 3 && (
          <Box className="tab-content">
            <Typography variant="h6" className="tab-title">
              차단 통계 (전체: {blockStats.totalCount}건, 주간: {blockStats.weeklyCount}건)
            </Typography>
            
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Paper className="chart-paper">
                  <Typography variant="subtitle1" className="chart-title">
                    차단 사유별 분포
                  </Typography>
                  <Box className="chart-container">
                    {blockReasonChartData.length > 0 ? (
                      <PieChart
                        series={[
                          {
                            data: blockReasonChartData,
                            innerRadius: 30,
                            outerRadius: 100,
                            paddingAngle: 2,
                            cornerRadius: 5,
                            startAngle: -90,
                            endAngle: 270,
                            cx: 150,
                            cy: 150,
                          },
                        ]}
                        width={300}
                        height={300}
                      />
                    ) : (
                      <Typography variant="body2" className="no-chart-data">
                        차단 사유별 데이터가 없습니다.
                      </Typography>
                    )}
                  </Box>
                </Paper>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <Paper className="chart-paper">
                  <Typography variant="subtitle1" className="chart-title">
                    유저간 차단 통계
                  </Typography>
                  <Box className="chart-container">
                    <BarChart
                      xAxis={[{ scaleType: 'band', data: ['전체 차단', '유저간 차단'] }]}
                      series={[
                        {
                          data: [blockStats.totalCount || 0, blockStats.userToUserStats.totalCount || 0],
                          color: 'rgba(54, 162, 235, 0.6)',
                        },
                      ]}
                      width={300}
                      height={300}
                    />
                  </Box>
                </Paper>
              </Grid>
              
              <Grid item xs={12}>
                <Paper className="chart-paper">
                  <Typography variant="subtitle1" className="chart-title">
                    차단 사유 상세
                  </Typography>
                  <Box className="table-container">
                    <table className="stat-table">
                      <thead>
                        <tr>
                          <th>차단 사유</th>
                          <th>건수</th>
                        </tr>
                      </thead>
                      <tbody>
                        {blockStats.reasonStats && Object.keys(blockStats.reasonStats).length > 0 ? (
                          Object.entries(blockStats.reasonStats).map(([reason, count], index) => (
                            <tr key={index}>
                              <td>{reason || '-'}</td>
                              <td>{count || 0}</td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan={2} className="no-data-cell">
                              차단 사유 상세 데이터가 없습니다.
                            </td>
                          </tr>
                        )}
                      </tbody>
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
