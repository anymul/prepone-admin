import { useEffect, useState } from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Tabs,
  Tab,
  Button,
  Stack,
  Skeleton,
  Paper,
  Divider
} from "@mui/material";
import {
  MenuBook,
  Class,
  Quiz,
  Assignment
} from "@mui/icons-material";
import { useAuth } from "@/lib/auth-context";
import { Link } from "react-router-dom";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3000/api/v1";

function TabPanel({ children, value, index }) {
  return (
    <div role="tabpanel" hidden={value !== index}>
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
}

const StatCard = ({ title, value, icon: Icon, loading, to }) => (
  <Card
    component={Link}
    to={to}
    sx={{
      textDecoration: 'none',
      height: '100%',
      transition: 'all 0.2s',
      '&:hover': {
        boxShadow: 4,
        transform: 'translateY(-2px)'
      }
    }}
  >
    <CardContent>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
        <Typography variant="body2" color="text.secondary" fontWeight={500}>
          {title}
        </Typography>
        <Icon sx={{ color: 'primary.main' }} />
      </Box>
      {loading ? (
        <Skeleton variant="rectangular" height={40} />
      ) : (
        <>
          <Typography variant="h3" fontWeight="bold" gutterBottom>
            {value.toLocaleString()}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Total {title.toLowerCase()}
          </Typography>
        </>
      )}
    </CardContent>
  </Card>
);

export default function Dashboard() {
  const { user } = useAuth();
  const [counts, setCounts] = useState({
    10: { subjects: 0, chapters: 0, questions: 0 },
    12: { subjects: 0, chapters: 0, questions: 0 },
  });
  const [loading, setLoading] = useState(true);
  const [tabValue, setTabValue] = useState(0);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const token = localStorage.getItem('token');
      try {
        // Single call returns both classes at once
        const res = await fetch(`${API_BASE_URL}/utility/counts`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!res.ok) throw new Error('Failed to fetch counts');
        const data = await res.json(); 
        setCounts(data);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const classLevels = [
    { value: 0, label: 'Class 10', level: 10 },
    { value: 1, label: 'Class 12', level: 12 }
  ];

  return (
    <Box sx={{ maxWidth: 1400, mx: 'auto' }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" fontWeight="bold" gutterBottom>
          Welcome, {user?.name}
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Manage mock tests for Bihar Board students
        </Typography>
      </Box>

      {/* Tabs */}
      <Paper variant="outlined" sx={{ mb: 3 }}>
        <Tabs
          value={tabValue}
          onChange={(e, newValue) => setTabValue(newValue)}
          sx={{ borderBottom: 1, borderColor: 'divider' }}
        >
          {classLevels.map((cls) => (
            <Tab key={cls.value} label={cls.label} />
          ))}
        </Tabs>

        {classLevels.map((cls) => (
          <TabPanel key={cls.value} value={tabValue} index={cls.value}>
            {/* Statistics Cards - Using Box with flexbox instead of Grid */}
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: {
                  xs: '1fr',
                  sm: 'repeat(2, 1fr)',
                  md: 'repeat(4, 1fr)'
                },
                gap: 3,
                mb: 3
              }}
            >
              <StatCard
                title="Subjects"
                value={counts[cls.level].subjects}
                icon={MenuBook}
                loading={loading}
                to={`/subjects/${cls.level}`}
              />
              <StatCard
                title="Chapters"
                value={counts[cls.level].chapters}
                icon={Class}
                loading={loading}
                to={`/subjects/${cls.level}`}
              />
              <StatCard
                title="Questions"
                value={counts[cls.level].questions}
                icon={Quiz}
                loading={loading}
                to={`/questions/${cls.level}`}
              />
              <StatCard
                title="Mock Tests"
                value={0}
                icon={Assignment}
                loading={loading}
                to={`/mock-tests/${cls.level}`}
              />
            </Box>

            {/* Additional Cards */}
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: {
                  xs: '1fr',
                  md: 'repeat(2, 1fr)'
                },
                gap: 3
              }}
            >
              {/* Recent Actions */}
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="h6" fontWeight="600" gutterBottom>
                    Recent Actions
                  </Typography>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Your recent activities
                  </Typography>
                  <Divider sx={{ my: 2 }} />
                  <Box sx={{ py: 3, textAlign: 'center' }}>
                    <Typography variant="body2" color="text.secondary">
                      No recent actions
                    </Typography>
                  </Box>
                </CardContent>
              </Card>

              {/* Quick Actions */}
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="h6" fontWeight="600" gutterBottom>
                    Quick Actions
                  </Typography>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Common tasks
                  </Typography>
                  <Divider sx={{ my: 2 }} />
                  <Stack spacing={1.5}>
                    <Button
                      component={Link}
                      to={`/subjects/${cls.level}`}
                      variant="outlined"
                      startIcon={<MenuBook />}
                      fullWidth
                      sx={{ justifyContent: 'flex-start', textTransform: 'none' }}
                    >
                      Manage Class {cls.level} Subjects
                    </Button>
                    <Button
                      component={Link}
                      to={`/questions/${cls.level}`}
                      variant="outlined"
                      startIcon={<Quiz />}
                      fullWidth
                      sx={{ justifyContent: 'flex-start', textTransform: 'none' }}
                    >
                      Add Class {cls.level} Questions
                    </Button>
                    <Button
                      component={Link}
                      to={`/mock-tests/${cls.level}`}
                      variant="outlined"
                      startIcon={<Assignment />}
                      fullWidth
                      sx={{ justifyContent: 'flex-start', textTransform: 'none' }}
                    >
                      Create Class {cls.level} Mock Test
                    </Button>
                  </Stack>
                </CardContent>
              </Card>
            </Box>
          </TabPanel>
        ))}
      </Paper>
    </Box>
  );
}
