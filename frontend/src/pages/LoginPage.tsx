import React, { useState } from 'react';
import { Form, Input, Button, Card, message } from 'antd';
import { UserOutlined, LockOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { authService } from '../services/auth.service';
import { useAuthStore } from '../stores/authStore';

const LoginPage: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { setUser, setAccessToken } = useAuthStore();

  const onFinish = async (values: { email: string; password: string }) => {
    setLoading(true);
    try {
      const data = await authService.login(values);
      setUser(data.user);
      setAccessToken(data.accessToken);
      message.success('เข้าสู่ระบบสำเร็จ');
      navigate('/dashboard');
    } catch (error: any) {
      message.error(error.response?.data?.error || 'เข้าสู่ระบบล้มเหลว');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center', 
      minHeight: '100vh',
      background: '#ffffff',
      backgroundImage: `
        linear-gradient(45deg, rgba(24, 144, 255, 0.03) 25%, transparent 25%, transparent 75%, rgba(24, 144, 255, 0.03) 75%, rgba(24, 144, 255, 0.03)),
        linear-gradient(45deg, rgba(24, 144, 255, 0.03) 25%, transparent 25%, transparent 75%, rgba(24, 144, 255, 0.03) 75%, rgba(24, 144, 255, 0.03))
      `,
      backgroundSize: '60px 60px',
      backgroundPosition: '0 0, 30px 30px',
      position: 'relative'
    }}>
      {/* Subtle overlay with building icon pattern */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundImage: 'url("data:image/svg+xml,%3Csvg width="100" height="100" xmlns="http://www.w3.org/2000/svg"%3E%3Cg fill="%231890ff" fill-opacity="0.02"%3E%3Crect x="20" y="30" width="15" height="40" rx="2"/%3E%3Crect x="40" y="20" width="15" height="50" rx="2"/%3E%3Crect x="60" y="35" width="15" height="35" rx="2"/%3E%3C/g%3E%3C/svg%3E")',
        backgroundSize: '200px 200px',
        opacity: 0.4,
        pointerEvents: 'none'
      }} />
      <Card 
        title="เข้าสู่ระบบ" 
        style={{ width: 400 }}
        headStyle={{ textAlign: 'center', fontSize: '24px', fontWeight: 'bold' }}
      >
        <h2 style={{ textAlign: 'center', marginBottom: '24px', color: '#1890ff' }}>
          ระบบบันทึกเวลาทำงาน
        </h2>
        <Form
          name="login"
          onFinish={onFinish}
          autoComplete="off"
          layout="vertical"
        >
          <Form.Item
            label="อีเมล"
            name="email"
            rules={[
              { required: true, message: 'กรุณากรอกอีเมล' },
              { type: 'email', message: 'รูปแบบอีเมลไม่ถูกต้อง' },
            ]}
          >
            <Input 
              prefix={<UserOutlined />} 
              placeholder="admin@senx.com"
              size="large"
            />
          </Form.Item>

          <Form.Item
            label="รหัสผ่าน"
            name="password"
            rules={[{ required: true, message: 'กรุณากรอกรหัสผ่าน' }]}
          >
            <Input.Password
              prefix={<LockOutlined />}
              placeholder="รหัสผ่าน"
              size="large"
            />
          </Form.Item>

          <Form.Item>
            <Button 
              type="primary" 
              htmlType="submit" 
              block 
              size="large"
              loading={loading}
            >
              เข้าสู่ระบบ
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
};

export default LoginPage;
