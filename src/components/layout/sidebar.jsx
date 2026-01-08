import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  Box,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Collapse,
  Typography,
  Divider
} from '@mui/material';

import {
  ChevronDown,
  ChevronRight,
  BookOpen,
  LayoutDashboard,
  FileQuestion,
  LogOut,
  ClipboardList,
  Bell,     
  GraduationCap,     
  History,             
  Upload,             
  Sparkles,         
} from 'lucide-react';

import { LogoutDialog } from '@/components/LogoutDialog';

const DRAWER_WIDTH = 260;

const NavItem = ({ href, icon, title, active, onClick }) => {
  const component = onClick ? 'div' : Link;
  const extraProps = onClick ? { onClick } : { to: href };

  return (
    <ListItem disablePadding sx={{ display: 'block', mb: 0.5 }}>
      <ListItemButton
        component={component}
        {...extraProps}
        selected={active}
        sx={{
          minHeight: 48,
          px: 2.5,
          borderRadius: 1,
          '&.Mui-selected': {
            bgcolor: 'primary.main',
            color: 'primary.contrastText',
            '&:hover': {
              bgcolor: 'primary.dark',
            },
            '& .lucide': {
              color: 'inherit',
            }
          },
          ...(onClick && {
            '&:hover': {
              bgcolor: '#f4d4d5',
              color: 'error.main',
              '& .MuiListItemIcon-root': {
                color: 'error.main',
              }
            }
          })
        }}
      >
        <ListItemIcon
          sx={{
            minWidth: 0,
            mr: 2,
            justifyContent: 'center',
            color: active ? 'inherit' : 'text.secondary',
          }}
        >
          {icon}
        </ListItemIcon>
        <ListItemText primary={title} primaryTypographyProps={{ fontSize: 14, fontWeight: active ? 600 : 400 }} />
      </ListItemButton>
    </ListItem>
  );
};

const NavGroup = ({ title, icon, children, defaultOpen, activePaths }) => {
  const [open, setOpen] = useState(defaultOpen);

  const isActiveGroup = activePaths.some(path => path.includes(title.toLowerCase().replace(' ', '-')));

  return (
    <Box sx={{ mb: 0.5 }}>
      <ListItemButton
        onClick={() => setOpen(!open)}
        sx={{
          borderRadius: 1,
          bgcolor: isActiveGroup ? 'action.hover' : 'transparent',
          mb: 0.5
        }}
      >
        <ListItemIcon sx={{ minWidth: 0, mr: 2 }}>
          {icon}
        </ListItemIcon>
        <ListItemText primary={title} primaryTypographyProps={{ fontSize: 14, fontWeight: 600 }} />
        {open ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
      </ListItemButton>

      <Collapse in={open} timeout="auto" unmountOnExit>
        <List component="div" disablePadding sx={{ pl: 2 }}>
          {children}
        </List>
      </Collapse>
    </Box>
  );
};

export function Sidebar() {
  const location = useLocation();
  const currentPath = location.pathname;
  const [logoutDialogOpen, setLogoutDialogOpen] = useState(false);

  const isActive = (path) => currentPath === path;

  return (
    <>
      <Drawer
        variant="permanent"
        sx={{
          width: DRAWER_WIDTH,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: DRAWER_WIDTH,
            boxSizing: 'border-box',
            borderRight: '1px solid',
            borderColor: 'divider',
            p: 2
          },
          // Hide scrollbar for Chrome, Safari and Opera
          '&::-webkit-scrollbar': {
            display: 'none'
          },
          // Hide scrollbar for IE, Edge and Firefox
          msOverflowStyle: 'none',  // IE and Edge
          scrollbarWidth: 'none',   // Firefox

          // Keep scroll functionality
          overflowY: 'auto',
          overflowX: 'hidden'
        }}
      >
        <Box sx={{ mb: 4, mt: 1, px: 1 }}>
          <Typography variant="h5" fontWeight="bold" color="primary">
            PrepOne
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Management Portal
          </Typography>
        </Box>

        <List component="nav" disablePadding>
          <NavItem
            href="/"
            icon={<LayoutDashboard size={18} />}
            title="Dashboard"
            active={isActive("/")}
          />

          <NavGroup
            title="Class 10"
            icon={<GraduationCap size={18} />}
            activePaths={['/class-10', '/subjects/10']}
            defaultOpen={currentPath.includes('class-10') || currentPath.includes('subjects/10')}
          >
            <NavItem
              href="/subjects/10"
              icon={<BookOpen size={18} />}
              title="Subjects"
              active={isActive("/subjects/10")}
            />
            <NavItem
              href="/questions/10"
              icon={<FileQuestion size={18} />}
              title="Questions"
              active={isActive("/questions/10")}
            />
            <NavItem
              href="/mock-tests/10"
              icon={<ClipboardList size={18} />}
              title="Mock Tests"
              active={isActive("/mock-tests/10")}
            />
          </NavGroup>

          <NavGroup
            title="Class 12"
            icon={<GraduationCap size={18} />}
            activePaths={['/class-12', '/subjects/12']}
            defaultOpen={currentPath.includes('class-12') || currentPath.includes('subjects/12')}
          >
            <NavItem
              href="/subjects/12"
              icon={<BookOpen size={18} />}
              title="Subjects"
              active={isActive("/subjects/12")}
            />
            <NavItem
              href="/questions/12"
              icon={<FileQuestion size={18} />}
              title="Questions"
              active={isActive("/questions/12")}
            />
            <NavItem
              href="/mock-tests/12"
              icon={<ClipboardList size={18} />}
              title="Mock Tests"
              active={isActive("/mock-tests/12")}
            />
          </NavGroup>

          <Divider sx={{ my: 2 }} />

          <NavItem
            href="/pyqs"
            icon={<History size={18} />}
            title="Previous Year Questions"
            active={isActive("/pyqs")}
          />

          <NavItem
            href="/master-question-uploader"
            icon={<Upload size={18} />}
            title="Master Question Uploader"
            active={isActive("/master-question-uploader")}
          />

          <NavItem
            href="/mocktest-generator"
            icon={<Sparkles size={18} />}
            title="Mock Test Generator"
            active={isActive("/mocktest-generator")}
          />

          <NavItem
            href="/notifications"
            icon={<Bell size={18} />}
            title="Send Notifications"
            active={isActive("/notifications")}
          />

          <NavItem
            icon={<LogOut size={18} />}
            title="Logout"
            onClick={() => setLogoutDialogOpen(true)}
          />
        </List>
      </Drawer>

      <LogoutDialog
        open={logoutDialogOpen}
        onClose={() => setLogoutDialogOpen(false)}
      />
    </>
  );
}
