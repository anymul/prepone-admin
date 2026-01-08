// import { createTheme } from '@mui/material/styles';

// const theme = createTheme({
//     palette: {
//         mode: 'light',
//         primary: {
//             main: '#2563eb', // Modern blue
//             light: '#3b82f6',
//             dark: '#1e40af',
//             contrastText: '#ffffff',
//         },
//         secondary: {
//             main: '#a855f7', // Purple accent
//             light: '#c084fc',
//             dark: '#7e22ce',
//             contrastText: '#ffffff',
//         },
//         success: {
//             main: '#10b981',
//             light: '#34d399',
//             dark: '#059669',
//         },
//         warning: {
//             main: '#f59e0b',
//             light: '#fbbf24',
//             dark: '#d97706',
//         },
//         error: {
//             main: '#ef4444',
//             light: '#f87171',
//             dark: '#dc2626',
//         },
//         info: {
//             main: '#3b82f6',
//             light: '#60a5fa',
//             dark: '#2563eb',
//         },
//         background: {
//             default: '#f9fafb',
//             paper: '#ffffff',
//         },
//         text: {
//             primary: '#111827',
//             secondary: '#6b7280',
//         },
//         divider: '#e5e7eb',
//         action: {
//             hover: '#f3f4f6',
//             selected: '#e5e7eb',
//         }
//     },
//     typography: {
//         fontFamily: [
//             'Inter',
//             '-apple-system',
//             'BlinkMacSystemFont',
//             '"Segoe UI"',
//             'Roboto',
//             '"Helvetica Neue"',
//             'Arial',
//             'sans-serif',
//             '"Apple Color Emoji"',
//             '"Segoe UI Emoji"',
//             '"Segoe UI Symbol"',
//         ].join(','),

//         // Headings
//         h1: {
//             fontWeight: 800,
//             fontSize: '2.5rem',
//             lineHeight: 1.2,
//             letterSpacing: '-0.025em',
//         },
//         h2: {
//             fontWeight: 700,
//             fontSize: '2rem',
//             lineHeight: 1.25,
//             letterSpacing: '-0.02em',
//         },
//         h3: {
//             fontWeight: 700,
//             fontSize: '1.75rem',
//             lineHeight: 1.3,
//             letterSpacing: '-0.015em',
//         },
//         h4: {
//             fontWeight: 700,
//             fontSize: '1.5rem',
//             lineHeight: 1.35,
//             letterSpacing: '-0.01em',
//         },
//         h5: {
//             fontWeight: 600,
//             fontSize: '1.25rem',
//             lineHeight: 1.4,
//         },
//         h6: {
//             fontWeight: 600,
//             fontSize: '1.125rem',
//             lineHeight: 1.4,
//         },

//         // Body text
//         body1: {
//             fontSize: '1rem',
//             lineHeight: 1.6,
//             letterSpacing: '0.00938em',
//         },
//         body2: {
//             fontSize: '0.875rem',
//             lineHeight: 1.57,
//             letterSpacing: '0.00714em',
//         },

//         // Other variants
//         subtitle1: {
//             fontSize: '1rem',
//             fontWeight: 600,
//             lineHeight: 1.5,
//             letterSpacing: '0.00938em',
//         },
//         subtitle2: {
//             fontSize: '0.875rem',
//             fontWeight: 600,
//             lineHeight: 1.57,
//             letterSpacing: '0.00714em',
//         },
//         button: {
//             fontSize: '0.875rem',
//             fontWeight: 600,
//             lineHeight: 1.75,
//             letterSpacing: '0.02857em',
//             textTransform: 'none', // No uppercase
//         },
//         caption: {
//             fontSize: '0.75rem',
//             fontWeight: 400,
//             lineHeight: 1.66,
//             letterSpacing: '0.03333em',
//         },
//         overline: {
//             fontSize: '0.75rem',
//             fontWeight: 600,
//             lineHeight: 2.66,
//             letterSpacing: '0.08333em',
//             textTransform: 'uppercase',
//         },
//     },
//     shape: {
//         borderRadius: 8,
//     },
//     shadows: [
//         'none',
//         '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
//         '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px -1px rgba(0, 0, 0, 0.1)',
//         '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1)',
//         '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.1)',
//         '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
//         '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
//         // ... rest of shadows
//         ...Array(18).fill('0 25px 50px -12px rgba(0, 0, 0, 0.25)'),
//     ],
//     components: {
//         MuiButton: {
//             styleOverrides: {
//                 root: {
//                     borderRadius: 8,
//                     fontWeight: 600,
//                     padding: '10px 20px',
//                     boxShadow: 'none',
//                     '&:hover': {
//                         boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
//                     },
//                 },
//             },
//         },
//         MuiCard: {
//             styleOverrides: {
//                 root: {
//                     borderRadius: 12,
//                     boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
//                 },
//             },
//         },
//         MuiTextField: {
//             styleOverrides: {
//                 root: {
//                     '& .MuiOutlinedInput-root': {
//                         borderRadius: 8,
//                     },
//                 },
//             },
//         },
//     },
// });

// export default theme;

import { createTheme } from '@mui/material/styles';

const theme = createTheme({
    palette: {
        mode: 'light',
        primary: {
            main: '#2563eb', // Modern blue
            light: '#3b82f6',
            dark: '#1e40af',
            contrastText: '#ffffff',
        },
        secondary: {
            main: '#a855f7', // Purple accent
            light: '#c084fc',
            dark: '#7e22ce',
            contrastText: '#ffffff',
        },
        success: {
            main: '#10b981',
            light: '#34d399',
            dark: '#059669',
        },
        warning: {
            main: '#f59e0b',
            light: '#fbbf24',
            dark: '#d97706',
        },
        error: {
            main: '#ef4444',
            light: '#f87171',
            dark: '#dc2626',
        },
        info: {
            main: '#3b82f6',
            light: '#60a5fa',
            dark: '#2563eb',
        },
        background: {
            default: '#f9fafb',
            paper: '#ffffff',
        },
        text: {
            primary: '#111827',
            secondary: '#6b7280',
        },
        divider: '#e5e7eb',
        action: {
            hover: '#f3f4f6',
            selected: '#e5e7eb',
        }
    },
    typography: {
        fontFamily: [
            'DM Sans',
            '-apple-system',
            'BlinkMacSystemFont',
            '"Segoe UI"',
            'Roboto',
            '"Helvetica Neue"',
            'Arial',
            'sans-serif',
        ].join(','),

        // Headings
        h1: {
            fontWeight: 700,
            fontSize: '2.5rem',
            lineHeight: 1.2,
            letterSpacing: '-0.02em',
        },
        h2: {
            fontWeight: 700,
            fontSize: '2rem',
            lineHeight: 1.25,
            letterSpacing: '-0.015em',
        },
        h3: {
            fontWeight: 700,
            fontSize: '1.75rem',
            lineHeight: 1.3,
            letterSpacing: '-0.01em',
        },
        h4: {
            fontWeight: 700,
            fontSize: '1.5rem',
            lineHeight: 1.35,
            letterSpacing: '-0.005em',
        },
        h5: {
            fontWeight: 600,
            fontSize: '1.25rem',
            lineHeight: 1.4,
        },
        h6: {
            fontWeight: 600,
            fontSize: '1.125rem',
            lineHeight: 1.4,
        },

        // Body text
        body1: {
            fontSize: '1rem',
            lineHeight: 1.6,
            fontWeight: 400,
        },
        body2: {
            fontSize: '0.875rem',
            lineHeight: 1.57,
            fontWeight: 400,
        },

        // Other variants
        subtitle1: {
            fontSize: '1rem',
            fontWeight: 600,
            lineHeight: 1.5,
        },
        subtitle2: {
            fontSize: '0.875rem',
            fontWeight: 600,
            lineHeight: 1.57,
        },
        button: {
            fontSize: '0.875rem',
            fontWeight: 600,
            lineHeight: 1.75,
            letterSpacing: '0.01em',
            textTransform: 'none',
        },
        caption: {
            fontSize: '0.75rem',
            fontWeight: 400,
            lineHeight: 1.66,
        },
        overline: {
            fontSize: '0.75rem',
            fontWeight: 700,
            lineHeight: 2.66,
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
        },
    },
    shape: {
        borderRadius: 8,
    },
    shadows: [
        'none',
        '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
        '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px -1px rgba(0, 0, 0, 0.1)',
        '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1)',
        '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.1)',
        '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
        '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
        ...Array(18).fill('0 25px 50px -12px rgba(0, 0, 0, 0.25)'),
    ],
    components: {
        MuiButton: {
            styleOverrides: {
                root: {
                    borderRadius: 8,
                    fontWeight: 600,
                    padding: '10px 20px',
                    boxShadow: 'none',
                    '&:hover': {
                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                    },
                },
            },
        },
        MuiCard: {
            styleOverrides: {
                root: {
                    borderRadius: 12,
                    boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
                },
            },
        },
        MuiTextField: {
            styleOverrides: {
                root: {
                    '& .MuiOutlinedInput-root': {
                        borderRadius: 8,
                    },
                },
            },
        },
    },
});

export default theme;
