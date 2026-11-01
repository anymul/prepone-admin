import { createTheme } from '@mui/material/styles';

// Design tokens. The visual language comes from the exam hall: ink-blue pen for actions,
// examiner's red only for "needs attention", a tick green only for "done", ruled-paper greys.
export const tokens = {
    ink: '#3F2170',
    inkDark: '#2B1650',
    inkTint: '#F0E8F8',
    paper: '#FAF5EC',
    sheet: '#FFFDFA',
    rule: '#E9E0D2',
    text: '#2A1F33',
    muted: '#6E6275',
    red: '#C42B2B',
    redTint: '#FBEAEA',
    green: '#1D7A4C',
    greenTint: '#E4F3EB',
    amber: '#A86A0B',
    accent: '#F5AA36',
    accentTint: '#FDF1DA',
    amberTint: '#FBF1DC',
};

export const FONT_DEVANAGARI = [
    '"Noto Serif Devanagari"',
    '"IBM Plex Sans Devanagari"',
    '"Noto Sans Devanagari"',
    'serif',
].join(',');

export const FONT = [
    'Outfit',
    '"Noto Serif Devanagari"',
    '"IBM Plex Sans Devanagari"',
    '"Noto Sans Devanagari"',
    '-apple-system',
    'BlinkMacSystemFont',
    '"Segoe UI"',
    'Roboto',
    'Arial',
    'sans-serif',
].join(',');

const theme = createTheme({
    palette: {
        mode: 'light',
        primary: { main: tokens.ink, light: '#6A45A8', dark: tokens.inkDark, contrastText: '#ffffff' },
        secondary: { main: '#6E6275', contrastText: '#ffffff' },
        success: { main: tokens.green, light: '#3E9A6C', dark: '#14583A' },
        warning: { main: tokens.amber, light: '#C98A2A', dark: '#7D4C05' },
        error: { main: tokens.red, light: '#D95252', dark: '#9A1F1F' },
        info: { main: tokens.ink, light: '#6A45A8', dark: tokens.inkDark },
        background: { default: tokens.paper, paper: tokens.sheet },
        text: { primary: tokens.text, secondary: tokens.muted },
        divider: tokens.rule,
        action: {
            hover: 'rgba(63, 33, 112, 0.05)',
            selected: tokens.inkTint,
            focus: 'rgba(63, 33, 112, 0.12)',
        },
        grey: { 50: '#FCF8F1', 100: tokens.paper, 200: '#EFE6D8', 300: tokens.rule, 400: '#BFB3A4', 500: '#948879', 600: tokens.muted, 700: '#4D4357', 800: '#3A2F44', 900: tokens.text },
    },
    typography: {
        fontFamily: FONT,
        fontSize: 15,
        h1: { fontWeight: 600, fontSize: '2rem', lineHeight: 1.2, letterSpacing: '-0.02em' },
        h2: { fontWeight: 600, fontSize: '1.75rem', lineHeight: 1.25, letterSpacing: '-0.018em' },
        h3: { fontWeight: 600, fontSize: '1.5rem', lineHeight: 1.3, letterSpacing: '-0.015em' },
        h4: { fontWeight: 600, fontSize: '1.5rem', lineHeight: 1.3, letterSpacing: '-0.015em' },
        h5: { fontWeight: 600, fontSize: '1.125rem', lineHeight: 1.4, letterSpacing: '-0.01em' },
        h6: { fontWeight: 600, fontSize: '1rem', lineHeight: 1.4, letterSpacing: '-0.005em' },
        subtitle1: { fontSize: '1rem', fontWeight: 600, lineHeight: 1.5 },
        subtitle2: { fontSize: '0.875rem', fontWeight: 600, lineHeight: 1.5 },
        body1: { fontSize: '1rem', lineHeight: 1.6 },
        body2: { fontSize: '0.875rem', lineHeight: 1.55 },
        button: { fontSize: '0.875rem', fontWeight: 600, lineHeight: 1.5, letterSpacing: 0, textTransform: 'none' },
        caption: { fontSize: '0.8125rem', lineHeight: 1.45 },
        overline: { fontSize: '0.75rem', fontWeight: 600, lineHeight: 1.5, letterSpacing: 0, textTransform: 'none' },
    },
    shape: { borderRadius: 10 },
    // Depth comes from hairline rules, not shadows. Only floating layers (menus, dialogs) lift.
    shadows: [
        'none',
        'none',
        '0 1px 2px rgba(42, 31, 51, 0.06)',
        '0 2px 6px rgba(42, 31, 51, 0.08)',
        '0 4px 12px rgba(42, 31, 51, 0.10)',
        '0 8px 24px rgba(42, 31, 51, 0.12)',
        ...Array(19).fill('0 12px 32px rgba(42, 31, 51, 0.16)'),
    ],
    components: {
        MuiCssBaseline: {
            styleOverrides: {
                html: { WebkitFontSmoothing: 'antialiased', MozOsxFontSmoothing: 'grayscale' },
                body: { fontVariantNumeric: 'tabular-nums', fontFeatureSettings: '"tnum" 1' },
                ':lang(hi), [lang="hi"], .font-hindi, .hindi-text': {
                    fontFamily: `${FONT_DEVANAGARI} !important`,
                },
                '*:focus-visible': { outline: `2px solid ${tokens.ink}`, outlineOffset: 2 },
                '@media (prefers-reduced-motion: reduce)': {
                    '*, *::before, *::after': {
                        animationDuration: '0.01ms !important',
                        animationIterationCount: '1 !important',
                        transitionDuration: '0.01ms !important',
                        scrollBehavior: 'auto !important',
                    },
                },
            },
        },
        MuiButtonBase: { defaultProps: { disableRipple: true } },
        MuiButton: {
            defaultProps: { disableElevation: true },
            styleOverrides: {
                root: { borderRadius: 8, padding: '8px 18px', boxShadow: 'none', '&:hover': { boxShadow: 'none' } },
                sizeLarge: { padding: '11px 22px', fontSize: '0.9375rem' },
                sizeSmall: { padding: '5px 12px' },
                outlined: { borderColor: tokens.rule, color: tokens.text, '&:hover': { borderColor: '#B4BAC8', backgroundColor: 'rgba(63, 33, 112, 0.05)' } },
                outlinedPrimary: { borderColor: tokens.rule, '&:hover': { borderColor: tokens.ink } },
                textPrimary: { '&:hover': { backgroundColor: tokens.inkTint } },
            },
        },
        MuiIconButton: { styleOverrides: { root: { borderRadius: 5 } } },
        MuiPaper: {
            defaultProps: { elevation: 0 },
            styleOverrides: {
                root: { backgroundImage: 'none' },
                outlined: { borderColor: tokens.rule },
                rounded: { borderRadius: 10 },
            },
        },
        MuiCard: {
            defaultProps: { elevation: 0 },
            styleOverrides: { root: { borderRadius: 12, boxShadow: 'none', border: `1px solid ${tokens.rule}` } },
        },
        MuiCardContent: { styleOverrides: { root: { padding: 24, '&:last-child': { paddingBottom: 24 } } } },
        MuiCardHeader: { styleOverrides: { root: { padding: '18px 24px' } } },
        MuiDivider: { styleOverrides: { root: { borderColor: tokens.rule } } },
        MuiTextField: { defaultProps: { size: 'small' } },
        MuiFormControl: { defaultProps: { size: 'small' } },
        MuiSelect: { defaultProps: { size: 'small' } },
        MuiOutlinedInput: {
            styleOverrides: {
                root: {
                    borderRadius: 8,
                    backgroundColor: tokens.sheet,
                    fontSize: '0.9375rem',
                    '& .MuiOutlinedInput-input': { padding: '11px 14px' },
                    '& .MuiInputBase-inputSizeSmall': { padding: '11px 14px' },
                    '& .MuiOutlinedInput-notchedOutline': { borderColor: '#D9CDBB' },
                    '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#A39283' },
                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: tokens.ink, borderWidth: 1 },
                    '&.Mui-focused': { boxShadow: `0 0 0 3px ${tokens.inkTint}` },
                    '&.Mui-disabled': { backgroundColor: tokens.paper },
                },
            },
        },
        MuiInputLabel: { styleOverrides: { root: { fontSize: '0.875rem' } } },
        MuiChip: {
            styleOverrides: {
                root: { borderRadius: 6, fontWeight: 500, fontSize: '0.8125rem', height: 28 },
                sizeSmall: { height: 24 },
                outlined: { borderColor: tokens.rule },
            },
        },
        MuiTabs: {
            styleOverrides: {
                root: { minHeight: 48 },
                indicator: { height: 2, backgroundColor: tokens.ink },
            },
        },
        MuiTab: {
            styleOverrides: {
                root: { minHeight: 48, padding: '10px 18px', fontWeight: 500, color: tokens.muted, '&.Mui-selected': { color: tokens.ink, fontWeight: 600 } },
            },
        },
        MuiTableCell: {
            styleOverrides: {
                root: { borderBottom: `1px solid ${tokens.rule}`, padding: '14px 18px', fontSize: '0.875rem' },
                head: { backgroundColor: '#F6EFE3', color: tokens.muted, fontWeight: 600, fontSize: '0.8125rem', whiteSpace: 'nowrap' },
            },
        },
        MuiTableRow: { styleOverrides: { root: { '&.MuiTableRow-hover:hover': { backgroundColor: 'rgba(63, 33, 112, 0.04)' } } } },
        MuiDialog: { styleOverrides: { paper: { borderRadius: 14, boxShadow: '0 16px 48px rgba(42, 31, 51, 0.22)' } } },
        MuiDialogTitle: { styleOverrides: { root: { fontSize: '1.0625rem', fontWeight: 600, padding: '24px 28px 8px' } } },
        MuiDialogActions: { styleOverrides: { root: { padding: '16px 28px 24px' } } },
        MuiAlert: {
            styleOverrides: {
                root: { borderRadius: 10, alignItems: 'flex-start', fontSize: '0.875rem', padding: '10px 16px' },
                standardError: { backgroundColor: tokens.redTint, color: '#7B1B1B', border: `1px solid #F0C9C9` },
                standardWarning: { backgroundColor: tokens.amberTint, color: '#6B4309', border: `1px solid #EDD9A8` },
                standardSuccess: { backgroundColor: tokens.greenTint, color: '#12512F', border: `1px solid #BFE0CE` },
                standardInfo: { backgroundColor: tokens.inkTint, color: '#2B1650', border: `1px solid #DCCBEF` },
            },
        },
        MuiTooltip: {
            defaultProps: { arrow: false },
            styleOverrides: { tooltip: { backgroundColor: tokens.text, fontSize: '0.8125rem', fontWeight: 500, borderRadius: 6, padding: '6px 10px' } },
        },
        MuiLinearProgress: { styleOverrides: { root: { borderRadius: 4, backgroundColor: '#EFE6D8' } } },
        MuiMenu: { styleOverrides: { paper: { border: `1px solid ${tokens.rule}`, boxShadow: '0 8px 24px rgba(42, 31, 51, 0.14)' } } },
        MuiMenuItem: { styleOverrides: { root: { fontSize: '0.875rem', minHeight: 40 } } },
        MuiLink: { defaultProps: { underline: 'hover' } },
        MuiDrawer: { styleOverrides: { paper: { backgroundImage: 'none' } } },
        MuiToggleButton: {
            styleOverrides: {
                root: { textTransform: 'none', fontWeight: 500, borderColor: tokens.rule, color: tokens.muted, '&.Mui-selected': { backgroundColor: tokens.inkTint, color: tokens.ink, fontWeight: 600 } },
            },
        },
        MuiSkeleton: { styleOverrides: { root: { backgroundColor: '#EFE6D8' } } },
    },
});

export default theme;
