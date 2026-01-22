import React, { useState } from 'react';
import {
  Card,
  Tabs,
  Table,
  Button,
  Space,
  Tag,
  Modal,
  Form,
  Input,
  Switch,
  TimePicker,
  message,
  Popconfirm,
  Row,
  Col,
  ColorPicker,
  Checkbox,
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  ClockCircleOutlined,
  UserOutlined,
  LockOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { useSettingsStore } from '../stores/settingsStore';

interface ShiftType {
  id: string;
  code: string;
  name: string;
  startTime: string | null;
  endTime: string | null;
  color: string;
  isWorkShift: boolean;
}

interface User {
  id: string;
  username: string;
  name: string;
  role: string;
  permissions: string[];
  isActive: boolean;
}

const MENU_PERMISSIONS = [
  { key: 'reports', label: 'รายงาน' },
  { key: 'roster', label: 'ตารางเวลาทำงาน' },
  { key: 'staff', label: 'พนักงาน' },
  { key: 'projects', label: 'โครงการ' },
  { key: 'settings', label: 'ตั้งค่า' },
];

const SettingsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState('shifts');
  const [isShiftModalOpen, setIsShiftModalOpen] = useState(false);
  const [editingShift, setEditingShift] = useState<ShiftType | null>(null);
  const [shiftForm] = Form.useForm();
  
  // User management states
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [userForm] = Form.useForm();
  const [mockUsers, setMockUsers] = useState<User[]>([
    {
      id: '1',
      username: 'admin',
      name: 'ผู้ดูแลระบบ',
      role: 'Admin',
      permissions: ['reports', 'roster', 'staff', 'projects', 'settings'],
      isActive: true,
    },
    {
      id: '2',
      username: 'manager',
      name: 'ผู้จัดการ',
      role: 'Manager',
      permissions: ['reports', 'roster', 'staff', 'projects'],
      isActive: true,
    },
  ]);

  // Use settings store
  const {
    shiftTypes,
    addShiftType,
    updateShiftType,
    deleteShiftType,
  } = useSettingsStore();

  // Shift handlers
  const handleCreateShift = () => {
    setEditingShift(null);
    shiftForm.resetFields();
    shiftForm.setFieldsValue({
      color: '#1890ff',
      isWorkShift: true,
    });
    setIsShiftModalOpen(true);
  };

  const handleEditShift = (shift: ShiftType) => {
    setEditingShift(shift);
    shiftForm.setFieldsValue({
      code: shift.code,
      name: shift.name,
      startTime: shift.startTime ? dayjs(shift.startTime, 'HH:mm') : null,
      endTime: shift.endTime ? dayjs(shift.endTime, 'HH:mm') : null,
      color: shift.color,
      isWorkShift: shift.isWorkShift,
    });
    setIsShiftModalOpen(true);
  };

  const handleSubmitShift = async () => {
    try {
      const values = await shiftForm.validateFields();
      
      const color = typeof values.color === 'string' 
        ? values.color 
        : values.color?.toHexString?.() || '#1890ff';
      
      const shiftData = {
        code: values.code,
        name: values.name,
        startTime: values.startTime ? values.startTime.format('HH:mm') : null,
        endTime: values.endTime ? values.endTime.format('HH:mm') : null,
        color,
        isWorkShift: values.isWorkShift ?? true,
      };

      if (editingShift) {
        updateShiftType(editingShift.id, shiftData);
        message.success('แก้ไขข้อมูลกะสำเร็จ');
      } else {
        addShiftType(shiftData);
        message.success('เพิ่มกะใหม่สำเร็จ');
      }

      setIsShiftModalOpen(false);
      shiftForm.resetFields();
      setEditingShift(null);
    } catch (error) {
      console.error('Validation failed:', error);
    }
  };

  const handleDeleteShift = (id: string) => {
    deleteShiftType(id);
    message.success('ลบกะสำเร็จ');
  };

  // User handlers
  const handleCreateUser = () => {
    setEditingUser(null);
    userForm.resetFields();
    userForm.setFieldsValue({
      isActive: true,
      permissions: [],
    });
    setIsUserModalOpen(true);
  };

  const handleEditUser = (user: User) => {
    setEditingUser(user);
    userForm.setFieldsValue({
      username: user.username,
      name: user.name,
      role: user.role,
      permissions: user.permissions,
      isActive: user.isActive,
    });
    setIsUserModalOpen(true);
  };

  const handleSubmitUser = async () => {
    try {
      const values = await userForm.validateFields();
      
      if (editingUser) {
        setMockUsers(prev => prev.map(u => 
          u.id === editingUser.id 
            ? { ...u, ...values }
            : u
        ));
        message.success('แก้ไขผู้ใช้สำเร็จ');
      } else {
        const newUser: User = {
          id: Date.now().toString(),
          ...values,
        };
        setMockUsers(prev => [...prev, newUser]);
        message.success('เพิ่มผู้ใช้สำเร็จ');
      }
      
      setIsUserModalOpen(false);
      userForm.resetFields();
      setEditingUser(null);
    } catch (error) {
      console.error('Validation failed:', error);
    }
  };

  const handleDeleteUser = (id: string) => {
    setMockUsers(prev => prev.filter(u => u.id !== id));
    message.success('ลบผู้ใช้สำเร็จ');
  };

  const handleToggleUserStatus = (id: string) => {
    setMockUsers(prev => prev.map(u => 
      u.id === id 
        ? { ...u, isActive: !u.isActive }
        : u
    ));
    message.success('เปลี่ยนสถานะผู้ใช้สำเร็จ');
  };

  // Shift columns
  const shiftColumns = [
    {
      title: 'รหัส',
      dataIndex: 'code',
      key: 'code',
      width: 80,
      render: (text: string, record: ShiftType) => (
        <Tag
          style={{
            backgroundColor: record.color,
            color: record.isWorkShift ? '#fff' : '#000',
            fontWeight: 'bold',
          }}
        >
          {text}
        </Tag>
      ),
    },
    {
      title: 'ชื่อกะ',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: 'เวลาเริ่ม',
      dataIndex: 'startTime',
      key: 'startTime',
      render: (text: string | null) => text || '-',
    },
    {
      title: 'เวลาสิ้นสุด',
      dataIndex: 'endTime',
      key: 'endTime',
      render: (text: string | null) => text || '-',
    },
    {
      title: 'ประเภท',
      dataIndex: 'isWorkShift',
      key: 'isWorkShift',
      render: (isWorkShift: boolean) => (
        <Tag color={isWorkShift ? 'green' : 'default'}>
          {isWorkShift ? 'กะทำงาน' : 'ไม่ใช่กะทำงาน'}
        </Tag>
      ),
    },
    {
      title: 'สี',
      dataIndex: 'color',
      key: 'color',
      render: (color: string) => (
        <div
          style={{
            width: 30,
            height: 20,
            backgroundColor: color,
            borderRadius: 4,
            border: '1px solid #d9d9d9',
          }}
        />
      ),
    },
    {
      title: 'จัดการ',
      key: 'action',
      render: (_: any, record: ShiftType) => (
        <Space>
          <Button
            type="text"
            icon={<EditOutlined />}
            onClick={() => handleEditShift(record)}
          />
          <Popconfirm
            title="ยืนยันการลบ?"
            description="คุณแน่ใจหรือไม่ว่าต้องการลบกะนี้?"
            onConfirm={() => handleDeleteShift(record.id)}
          >
            <Button type="text" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  // User columns
  const userColumns = [
    {
      title: 'ชื่อผู้ใช้',
      dataIndex: 'username',
      key: 'username',
      render: (text: string) => <Tag color="blue">{text}</Tag>,
    },
    {
      title: 'ชื่อ-นามสกุล',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: 'บทบาท',
      dataIndex: 'role',
      key: 'role',
      render: (text: string) => <Tag color="purple">{text}</Tag>,
    },
    {
      title: 'สิทธิ์การเข้าถึง',
      dataIndex: 'permissions',
      key: 'permissions',
      render: (permissions: string[]) => (
        <Space wrap>
          {permissions.map(perm => {
            const menuItem = MENU_PERMISSIONS.find(m => m.key === perm);
            return menuItem ? (
              <Tag key={perm} color="green">{menuItem.label}</Tag>
            ) : null;
          })}
        </Space>
      ),
    },
    {
      title: 'สถานะ',
      dataIndex: 'isActive',
      key: 'isActive',
      render: (isActive: boolean, record: User) => (
        <Switch 
          checked={isActive} 
          onChange={() => handleToggleUserStatus(record.id)}
          checkedChildren="เปิด" 
          unCheckedChildren="ปิด"
        />
      ),
    },
    {
      title: 'จัดการ',
      key: 'action',
      render: (_: any, record: User) => (
        <Space>
          <Button
            type="text"
            icon={<EditOutlined />}
            onClick={() => handleEditUser(record)}
          />
          <Popconfirm
            title="ยืนยันการลบ?"
            description="คุณแน่ใจหรือไม่ว่าต้องการลบผู้ใช้นี้?"
            onConfirm={() => handleDeleteUser(record.id)}
          >
            <Button type="text" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <Card
        title={
          <span style={{ fontSize: '20px', fontWeight: 'bold' }}>
            ⚙️ ตั้งค่าระบบ
          </span>
        }
      >
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          items={[
            {
              key: 'shifts',
              label: (
                <span>
                  <ClockCircleOutlined /> ข้อมูลกะ
                </span>
              ),
              children: (
                <div>
                  <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between' }}>
                    <p style={{ color: '#666' }}>
                      กำหนดประเภทกะการทำงาน รหัส เวลาเริ่ม-สิ้นสุด และสีที่ใช้แสดงในตารางเวร
                    </p>
                    <Button
                      type="primary"
                      icon={<PlusOutlined />}
                      onClick={handleCreateShift}
                    >
                      เพิ่มกะใหม่
                    </Button>
                  </div>
                  <Table
                    columns={shiftColumns}
                    dataSource={shiftTypes}
                    rowKey="id"
                    pagination={false}
                  />
                </div>
              ),
            },
            {
              key: 'users',
              label: (
                <span>
                  <UserOutlined /> จัดการผู้ใช้
                </span>
              ),
              children: (
                <div>
                  <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between' }}>
                    <p style={{ color: '#666' }}>
                      จัดการบัญชีผู้ใช้และกำหนดสิทธิ์การเข้าถึงเมนูต่างๆ ในระบบ
                    </p>
                    <Button
                      type="primary"
                      icon={<PlusOutlined />}
                      onClick={handleCreateUser}
                    >
                      เพิ่มผู้ใช้ใหม่
                    </Button>
                  </div>
                  <Table
                    columns={userColumns}
                    dataSource={mockUsers}
                    rowKey="id"
                    pagination={{ pageSize: 10 }}
                  />
                </div>
              ),
            },
          ]}
        />
      </Card>

      {/* Shift Modal */}
      <Modal
        title={editingShift ? 'แก้ไขข้อมูลกะ' : 'เพิ่มกะใหม่'}
        open={isShiftModalOpen}
        onOk={handleSubmitShift}
        onCancel={() => {
          setIsShiftModalOpen(false);
          setEditingShift(null);
        }}
        width={500}
      >
        <Form form={shiftForm} layout="vertical" style={{ marginTop: 20 }}>
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item
                label="รหัสกะ"
                name="code"
                rules={[{ required: true, message: 'กรุณากรอกรหัส' }]}
              >
                <Input placeholder="เช่น 1, 2, OFF" />
              </Form.Item>
            </Col>
            <Col span={16}>
              <Form.Item
                label="ชื่อกะ"
                name="name"
                rules={[{ required: true, message: 'กรุณากรอกชื่อกะ' }]}
              >
                <Input placeholder="เช่น กะเช้า" />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item label="เวลาเริ่ม" name="startTime">
                <TimePicker format="HH:mm" style={{ width: '100%' }} needConfirm={false} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="เวลาสิ้นสุด" name="endTime">
                <TimePicker format="HH:mm" style={{ width: '100%' }} needConfirm={false} />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item label="สี" name="color">
                <ColorPicker format="hex" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="เป็นกะทำงาน"
                name="isWorkShift"
                valuePropName="checked"
              >
                <Switch checkedChildren="ใช่" unCheckedChildren="ไม่" />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>

      {/* User Modal */}
      <Modal
        title={editingUser ? 'แก้ไขผู้ใช้' : 'เพิ่มผู้ใช้ใหม่'}
        open={isUserModalOpen}
        onOk={handleSubmitUser}
        onCancel={() => {
          setIsUserModalOpen(false);
          setEditingUser(null);
        }}
        width={600}
      >
        <Form form={userForm} layout="vertical" style={{ marginTop: 20 }}>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="ชื่อผู้ใช้ (Username)"
                name="username"
                rules={[{ required: true, message: 'กรุณากรอกชื่อผู้ใช้' }]}
              >
                <Input placeholder="เช่น john.doe" prefix={<UserOutlined />} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="ชื่อ-นามสกุล"
                name="name"
                rules={[{ required: true, message: 'กรุณากรอกชื่อ-นามสกุล' }]}
              >
                <Input placeholder="เช่น จอห์น โด" />
              </Form.Item>
            </Col>
          </Row>

          {!editingUser && (
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  label="รหัสผ่าน"
                  name="password"
                  rules={[{ required: true, message: 'กรุณากรอกรหัสผ่าน' }]}
                >
                  <Input.Password placeholder="รหัสผ่าน" prefix={<LockOutlined />} />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  label="ยืนยันรหัสผ่าน"
                  name="confirmPassword"
                  dependencies={['password']}
                  rules={[
                    { required: true, message: 'กรุณายืนยันรหัสผ่าน' },
                    ({ getFieldValue }) => ({
                      validator(_, value) {
                        if (!value || getFieldValue('password') === value) {
                          return Promise.resolve();
                        }
                        return Promise.reject(new Error('รหัสผ่านไม่ตรงกัน'));
                      },
                    }),
                  ]}
                >
                  <Input.Password placeholder="ยืนยันรหัสผ่าน" prefix={<LockOutlined />} />
                </Form.Item>
              </Col>
            </Row>
          )}

          <Form.Item
            label="บทบาท"
            name="role"
            rules={[{ required: true, message: 'กรุณากรอกบทบาท' }]}
          >
            <Input placeholder="เช่น Admin, Manager, User" />
          </Form.Item>

          <Form.Item
            label="สิทธิ์การเข้าถึงเมนู"
            name="permissions"
            rules={[{ required: true, message: 'กรุณาเลือกสิทธิ์การเข้าถึงอย่างน้อย 1 รายการ' }]}
          >
            <Checkbox.Group style={{ width: '100%' }}>
              <Row gutter={[16, 16]}>
                {MENU_PERMISSIONS.map(menu => (
                  <Col span={12} key={menu.key}>
                    <Checkbox value={menu.key}>{menu.label}</Checkbox>
                  </Col>
                ))}
              </Row>
            </Checkbox.Group>
          </Form.Item>

          <Form.Item
            label="สถานะ"
            name="isActive"
            valuePropName="checked"
          >
            <Switch checkedChildren="เปิดใช้งาน" unCheckedChildren="ปิดใช้งาน" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default SettingsPage;
