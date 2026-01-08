import { useState, useEffect } from 'react';
import {
    Box,
    Card,
    CardContent,
    CardHeader,
    Typography,
    Button,
    TextField,
    Select,
    MenuItem,
    FormControl,
    InputLabel,
    Grid,
    Paper,
    Tabs,
    Tab,
    CircularProgress,
    Alert,
    Snackbar,
    Avatar,
    Divider,
    Stack
} from '@mui/material';
import {
    Send,
    People,
    Notifications,
    TrendingUp,
    Campaign,
    EmojiEvents,
    AccessTime,
    Announcement
} from '@mui/icons-material';

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3000/api/v1";

function TabPanel({ children, value, index }) {
    return (
        <div role="tabpanel" hidden={value !== index}>
            {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
        </div>
    );
}

const notificationTypes = [
    { value: 'general', label: 'General', icon: Campaign },
    { value: 'achievement', label: 'Achievement', icon: EmojiEvents },
    { value: 'reminder', label: 'Reminder', icon: AccessTime },
    { value: 'announcement', label: 'Announcement', icon: Announcement }
];

export default function NotificationSender() {
    const [stats, setStats] = useState({
        totalUsers: 0,
        usersWithTokens: 0,
        usersWithoutTokens: 0,
        usersByClass: []
    });
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);
    const [tabValue, setTabValue] = useState(0);

    // Form state
    const [title, setTitle] = useState('');
    const [body, setBody] = useState('');
    const [selectedClass, setSelectedClass] = useState('all');
    const [notificationType, setNotificationType] = useState('general');

    // Toast state
    const [toast, setToast] = useState({ open: false, message: '', severity: 'success' });

    useEffect(() => {
        fetchStats();
    }, []);

    const fetchStats = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${API_BASE_URL}/notifications/stats`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
            });

            if (!response.ok) {
                // Handle 404 gracefully if endpoint doesn't exist yet
                if (response.status === 404) {
                    console.warn('Stats endpoint not available yet');
                    setStats({
                        totalUsers: 0,
                        usersWithTokens: 0,
                        usersWithoutTokens: 0,
                        usersByClass: []
                    });
                    return;
                }
                throw new Error('Failed to fetch stats');
            }

            const data = await response.json();
            setStats(data);
        } catch (error) {
            console.error('Error fetching stats:', error);
            setToast({ open: true, message: 'Failed to load statistics', severity: 'error' });
        } finally {
            setLoading(false);
        }
    };


    const handleSendNotification = async () => {
        if (!title.trim() || !body.trim()) {
            setToast({ open: true, message: 'Please fill in title and message', severity: 'error' });
            return;
        }

        setSending(true);
        try {
            const token = localStorage.getItem('token');
            const endpoint = selectedClass === 'all' ? '/send-all' : '/send-class';

            const payload = {
                title,
                body,
                type: notificationType,
                ...(selectedClass !== 'all' && { studentClass: parseInt(selectedClass) })
            };

            const response = await fetch(`${API_BASE_URL}/notifications${endpoint}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify(payload),
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.message || 'Failed to send notification');
            }

            const data = await response.json();

            setToast({
                open: true,
                message: `Notification sent successfully to ${data.successCount || 0} devices${data.failureCount > 0 ? `. ${data.failureCount} failed` : ''}`,
                severity: 'success'
            });

            // Clear form
            setTitle('');
            setBody('');
            setNotificationType('general');
            fetchStats();
        } catch (error) {
            console.error('Error sending notification:', error);
            setToast({
                open: true,
                message: error.message || 'Failed to send notification',
                severity: 'error'
            });
        } finally {
            setSending(false);
        }
    };


    const StatCard = ({ title, value, icon: Icon, description, color }) => (
        <Card variant="outlined">
            <CardContent>
                <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                    <Box>
                        <Typography variant="body2" color="text.secondary" fontWeight={500} gutterBottom>
                            {title}
                        </Typography>
                        <Typography variant="h4" fontWeight="700" sx={{ mb: 0.5 }}>
                            {value}
                        </Typography>
                        {description && (
                            <Typography variant="caption" color="text.secondary">
                                {description}
                            </Typography>
                        )}
                    </Box>
                    <Avatar
                        sx={{
                            width: 56,
                            height: 56,
                            color: `${color}.main`,
                            bgcolor: `${color}.lighter`,
                            boxShadow: 1
                        }}
                    >
                        <Icon sx={{ fontSize: 28 }} />
                    </Avatar>
                </Stack>
            </CardContent>
        </Card>
    );

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
                <CircularProgress size={48} />
            </Box>
        );
    }

    const reachRate = stats.totalUsers > 0
        ? Math.round((stats.usersWithTokens / stats.totalUsers) * 100)
        : 0;

    return (
        <Box sx={{ maxWidth: 1400, mx: 'auto', p: { xs: 2, md: 3 } }}>
            {/* Header */}
            <Box sx={{ mb: 4 }}>
                <Typography variant="h4" fontWeight="bold" gutterBottom>
                    Push Notifications
                </Typography>
                <Typography variant="body1" color="text.secondary">
                    Send notifications to your app users instantly
                </Typography>
            </Box>

            {/* Statistics */}
            <Grid container spacing={3} sx={{ mb: 4 }}>
                <Grid item xs={12} md={4}>
                    <StatCard
                        title="Total Users"
                        value={stats.totalUsers.toLocaleString()}
                        icon={People}
                        description="Registered users"
                        color="primary"
                    />
                </Grid>
                <Grid item xs={12} md={4}>
                    <StatCard
                        title="Active Devices"
                        value={stats.usersWithTokens.toLocaleString()}
                        icon={Notifications}
                        description="Users with notifications enabled"
                        color="success"
                    />
                </Grid>
                <Grid item xs={12} md={4}>
                    <StatCard
                        title="Reach Rate"
                        value={`${reachRate}%`}
                        icon={TrendingUp}
                        description={`${stats.usersWithoutTokens} users without FCM token`}
                        color="info"
                    />
                </Grid>
            </Grid>

            {/* Users by Class */}
            {stats.usersByClass.length > 0 && (
                <Card variant="outlined" sx={{ mb: 4 }}>
                    <CardHeader
                        title="Distribution by Class"
                        subheader="Active users per class with notification enabled"
                        titleTypographyProps={{ variant: 'h6', fontWeight: 600 }}
                    />
                    <Divider />
                    <CardContent>
                        <Grid container spacing={2}>
                            {stats.usersByClass.map((item) => (
                                <Grid item xs={6} sm={4} md={3} lg={2} key={item._id}>
                                    <Paper
                                        variant="outlined"
                                        sx={{
                                            p: 2.5,
                                            textAlign: 'center',
                                            bgcolor: 'action.hover',
                                            transition: 'all 0.2s',
                                            '&:hover': {
                                                bgcolor: 'action.selected',
                                                transform: 'translateY(-2px)',
                                                boxShadow: 2
                                            }
                                        }}
                                    >
                                        <Typography variant="h5" fontWeight="bold" color="primary.main">
                                            {item._id}
                                        </Typography>
                                        <Typography variant="caption" color="text.secondary" fontWeight={500}>
                                            Class
                                        </Typography>
                                        <Divider sx={{ my: 1 }} />
                                        <Typography variant="body2" fontWeight="600">
                                            {item.count} users
                                        </Typography>
                                    </Paper>
                                </Grid>
                            ))}
                        </Grid>
                    </CardContent>
                </Card>
            )}

            {/* Notification Composer */}
            <Card variant="outlined">
                <CardHeader
                    title="Compose Notification"
                    subheader="Create and send push notifications to your users"
                    titleTypographyProps={{ variant: 'h6', fontWeight: 600 }}
                />
                <Divider />
                <CardContent>
                    <Tabs
                        value={tabValue}
                        onChange={(e, v) => setTabValue(v)}
                        sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}
                    >
                        <Tab label="Compose" />
                        <Tab label="Preview" />
                    </Tabs>

                    <TabPanel value={tabValue} index={0}>
                        <Stack spacing={3}>
                            {/* Target Audience */}
                            <FormControl fullWidth>
                                <InputLabel>Target Audience</InputLabel>
                                <Select
                                    value={selectedClass}
                                    onChange={(e) => setSelectedClass(e.target.value)}
                                    label="Target Audience"
                                >
                                    <MenuItem value="all">
                                        All Users ({stats.usersWithTokens.toLocaleString()} devices)
                                    </MenuItem>
                                    {stats.usersByClass.map((item) => (
                                        <MenuItem key={item._id} value={item._id.toString()}>
                                            Class {item._id} ({item.count.toLocaleString()} devices)
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>

                            {/* Notification Type */}
                            <FormControl fullWidth>
                                <InputLabel>Notification Type</InputLabel>
                                <Select
                                    value={notificationType}
                                    onChange={(e) => setNotificationType(e.target.value)}
                                    label="Notification Type"
                                >
                                    {notificationTypes.map((type) => (
                                        <MenuItem key={type.value} value={type.value}>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                <type.icon sx={{ fontSize: 20 }} />
                                                {type.label}
                                            </Box>
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>

                            {/* Title */}
                            <Box>
                                <TextField
                                    fullWidth
                                    label="Title"
                                    placeholder="Enter notification title"
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    inputProps={{ maxLength: 50 }}
                                />
                                <Typography
                                    variant="caption"
                                    color="text.secondary"
                                    sx={{ display: 'block', textAlign: 'right', mt: 0.5 }}
                                >
                                    {title.length}/50 characters
                                </Typography>
                            </Box>

                            {/* Body */}
                            <Box>
                                <TextField
                                    fullWidth
                                    multiline
                                    rows={4}
                                    label="Message"
                                    placeholder="Enter notification message"
                                    value={body}
                                    onChange={(e) => setBody(e.target.value)}
                                    inputProps={{ maxLength: 200 }}
                                />
                                <Typography
                                    variant="caption"
                                    color="text.secondary"
                                    sx={{ display: 'block', textAlign: 'right', mt: 0.5 }}
                                >
                                    {body.length}/200 characters
                                </Typography>
                            </Box>

                            {/* Send Button */}
                            <Button
                                variant="contained"
                                size="large"
                                fullWidth
                                onClick={handleSendNotification}
                                disabled={sending || !title.trim() || !body.trim()}
                                startIcon={sending ? <CircularProgress size={20} color="inherit" /> : <Send />}
                                sx={{ py: 1.5, fontWeight: 600 }}
                            >
                                {sending ? 'Sending Notification...' : 'Send Notification'}
                            </Button>
                        </Stack>
                    </TabPanel>

                    <TabPanel value={tabValue} index={1}>
                        {/* Mobile Preview */}
                        <Box sx={{ maxWidth: 400, mx: 'auto' }}>
                            <Paper
                                elevation={4}
                                sx={{
                                    borderRadius: 4,
                                    border: '3px solid',
                                    borderColor: 'divider',
                                    overflow: 'hidden',
                                    bgcolor: 'grey.900'
                                }}
                            >
                                {/* Phone Notch */}
                                <Box
                                    sx={{
                                        height: 28,
                                        bgcolor: 'grey.900',
                                        display: 'flex',
                                        justifyContent: 'center',
                                        alignItems: 'center'
                                    }}
                                >
                                    <Box
                                        sx={{
                                            width: 120,
                                            height: 18,
                                            bgcolor: 'black',
                                            borderBottomLeftRadius: 12,
                                            borderBottomRightRadius: 12
                                        }}
                                    />
                                </Box>

                                {/* Notification */}
                                <Box sx={{ bgcolor: 'background.default', p: 2, minHeight: 400 }}>
                                    <Paper
                                        variant="outlined"
                                        sx={{
                                            p: 2,
                                            display: 'flex',
                                            gap: 1.5,
                                            bgcolor: 'background.paper',
                                            borderRadius: 2,
                                            boxShadow: 1
                                        }}
                                    >
                                        <Avatar
                                            sx={{
                                                width: 48,
                                                height: 48,
                                                bgcolor: 'primary.main',
                                                flexShrink: 0
                                            }}
                                        >
                                            <Notifications />
                                        </Avatar>
                                        <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                                            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                                                <Typography variant="body2" fontWeight="600">
                                                    PrepOne
                                                </Typography>
                                                <Typography variant="caption" color="text.secondary">
                                                    now
                                                </Typography>
                                            </Box>
                                            <Typography variant="subtitle2" fontWeight="600" gutterBottom>
                                                {title || 'Notification Title'}
                                            </Typography>
                                            <Typography
                                                variant="body2"
                                                color="text.secondary"
                                                sx={{
                                                    display: '-webkit-box',
                                                    WebkitLineClamp: 3,
                                                    WebkitBoxOrient: 'vertical',
                                                    overflow: 'hidden'
                                                }}
                                            >
                                                {body || 'Your notification message will appear here. This preview shows how it will look on user devices.'}
                                            </Typography>
                                        </Box>
                                    </Paper>
                                </Box>

                                {/* Phone Bottom Bar */}
                                <Box sx={{ height: 28, bgcolor: 'grey.900' }} />
                            </Paper>

                            <Alert severity="info" sx={{ mt: 3 }}>
                                <Typography variant="body2" fontWeight={500}>
                                    Preview of notification appearance on user devices
                                </Typography>
                            </Alert>
                        </Box>
                    </TabPanel>
                </CardContent>
            </Card>

            {/* Toast Notification */}
            <Snackbar
                open={toast.open}
                autoHideDuration={6000}
                onClose={() => setToast({ ...toast, open: false })}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            >
                <Alert
                    onClose={() => setToast({ ...toast, open: false })}
                    severity={toast.severity}
                    variant="filled"
                    sx={{ width: '100%' }}
                >
                    {toast.message}
                </Alert>
            </Snackbar>
        </Box>
    );
}
