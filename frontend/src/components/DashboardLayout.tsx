import React, { useMemo } from 'react';
import { Layout, Menu, Avatar, Dropdown } from 'antd';
import {
  ProjectOutlined,
  TeamOutlined,
  CalendarOutlined,
  BarChartOutlined,
  UserOutlined,
  SettingOutlined,
  LogoutOutlined
} from '@ant-design/icons';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';

const { Header, Sider, Content } = Layout;

// กำหนด permission key สำหรับแต่ละเมนู
const allMenuItems = [
  {
    key: '/dashboard/reports',
    icon: <BarChartOutlined />,
    label: 'รายงาน',
    permission: 'reports',
  },
  {
    key: '/dashboard/roster',
    icon: <CalendarOutlined />,
    label: 'ตารางเวลาทำงาน',
    permission: 'roster',
  },
  {
    key: '/dashboard/staff',
    icon: <TeamOutlined />,
    label: 'พนักงาน',
    permission: 'staff',
  },
  {
    key: '/dashboard/projects',
    icon: <ProjectOutlined />,
    label: 'โครงการ',
    permission: 'projects',
  },
  {
    key: '/dashboard/users',
    icon: <UserOutlined />,
    label: 'จัดการผู้ใช้',
    permission: 'users',
  },
  {
    key: '/dashboard/settings',
    icon: <SettingOutlined />,
    label: 'ตั้งค่า',
    permission: 'settings',
  },
];

const DashboardLayout: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout, hasPermission } = useAuthStore();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Filter เมนูตาม permissions ของผู้ใช้
  const menuItems = useMemo(() => {
    return allMenuItems.filter((item) => hasPermission(item.permission));
  }, [hasPermission, user]);

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Header style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        background: '#001529',
        padding: '0 24px'
      }}>
        <div style={{ color: 'white', fontSize: '20px', fontWeight: 'bold' }}>
          🏢 SENX Juristic
        </div>
        <Dropdown
          menu={{
            items: [
              {
                key: 'logout',
                icon: <LogoutOutlined />,
                label: 'ออกจากระบบ',
                onClick: handleLogout,
              },
            ],
          }}
          placement="bottomRight"
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
            <Avatar icon={<UserOutlined />} />
            <span style={{ color: 'white' }}>{user?.name || 'Admin'}</span>
          </div>
        </Dropdown>
      </Header>
      <Layout>
        <Sider width={200} theme="light">
          <Menu
            mode="inline"
            selectedKeys={[location.pathname]}
            items={menuItems}
            onClick={({ key }) => navigate(key)}
            style={{ height: '100%', borderRight: 0 }}
          />
        </Sider>
        <Layout style={{ padding: '24px' }}>
          <Content
            style={{
              background: '#fff',
              padding: 24,
              margin: 0,
              minHeight: 280,
              borderRadius: '8px',
            }}
          >
            <Outlet />
          </Content>
        </Layout>
      </Layout>
    </Layout>
  );
};

export default DashboardLayout;

