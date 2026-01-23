import React, { useState } from 'react';
import { Form, Input, Button, Card, message } from 'antd';
import { UserOutlined, LockOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { authService } from '../services/auth.service';
import { useAuthStore } from '../stores/authStore';
import senxLogoUrl from '../assets/senx-logo.webp';
import loginBgUrl from '../assets/login-bg.png';

const LoginPage: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { setUser, setAccessToken } = useAuthStore();

  const onFinish = async (values: { email: string; password: string }) => {
    setLoading(true);
    try {
      const data = await authService.login(values);
      setUser({ ...data.user, permissions: data.user.permissions ?? [] });
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
    <div
      style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        padding: 24,
        backgroundImage: `linear-gradient(rgba(255,255,255,0.70), rgba(255,255,255,0.70)), url(${loginBgUrl})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      <Card
        style={{
          width: 440,
          borderRadius: 14,
          overflow: 'hidden',
          boxShadow: '0 10px 30px rgba(0, 0, 0, 0.10)',
        }}
        bodyStyle={{ padding: 24 }}
      >
        <div
          style={{
            background: '#141414',
            border: '1px solid rgba(255,255,255,0.10)',
            borderRadius: 12,
            padding: '14px 12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 16,
          }}
        >
          <img
            src={senxLogoUrl}
            alt="Sen-X"
            style={{ height: 52, width: 'auto', objectFit: 'contain' }}
          />
        </div>

        <div style={{ textAlign: 'center', marginBottom: 20 }}>
          <div
            style={{
              fontSize: 26,
              fontWeight: 800,
              lineHeight: 1.2,
              letterSpacing: '-0.3px',
              color: '#1f1f1f',
            }}
          >
            เข้าสู่ระบบ
          </div>
          <div
            style={{
              marginTop: 8,
              fontSize: 14,
              color: '#595959',
              fontWeight: 600,
              letterSpacing: '0.2px',
            }}
          >
            ระบบบันทึกเวลาทำงาน
          </div>
        </div>

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
