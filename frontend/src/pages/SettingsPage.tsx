import React, { useState, useEffect } from 'react';
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
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  ClockCircleOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { useNavigate } from 'react-router-dom';
import { useSettingsStore } from '../stores/settingsStore';
import { useAuthStore } from '../stores/authStore';

interface ShiftType {
  id: string;
  code: string;
  name: string;
  startTime: string | null;
  endTime: string | null;
  color: string;
  isWorkShift: boolean;
  isSystemDefault?: boolean;
}

const SettingsPage: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('shifts');
  const [isShiftModalOpen, setIsShiftModalOpen] = useState(false);
  const [editingShift, setEditingShift] = useState<ShiftType | null>(null);
  const [shiftForm] = Form.useForm();

  // Use stores
  const { isAuthenticated, accessToken } = useAuthStore();
  const {
    shiftTypes,
    fetchShiftTypes,
    addShiftType,
    updateShiftType,
    deleteShiftType,
  } = useSettingsStore();

  // Check authentication
  useEffect(() => {
    console.log('Auth status:', { isAuthenticated, hasToken: !!accessToken });
    if (!isAuthenticated || !accessToken) {
      message.error('กรุณาเข้าสู่ระบบก่อน');
      navigate('/login');
      return;
    }
  }, [isAuthenticated, accessToken, navigate]);

  // Fetch shift types on mount
  useEffect(() => {
    if (isAuthenticated && accessToken) {
      fetchShiftTypes();
    }
  }, [fetchShiftTypes, isAuthenticated, accessToken]);

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

      console.log('Submitting shift data:', shiftData);

      if (editingShift) {
        await updateShiftType(editingShift.id, shiftData);
        message.success('แก้ไขข้อมูลกะสำเร็จ');
      } else {
        await addShiftType(shiftData);
        message.success('เพิ่มกะใหม่สำเร็จ');
      }

      setIsShiftModalOpen(false);
      shiftForm.resetFields();
      setEditingShift(null);
    } catch (error) {
      console.error('Error submitting shift:', error);
      message.error('เกิดข้อผิดพลาดในการบันทึกข้อมูล');
    }
  };

  const handleDeleteShift = async (id: string) => {
    try {
      await deleteShiftType(id);
      message.success('ลบกะสำเร็จ');
    } catch (error) {
      console.error('Error deleting shift:', error);
      message.error('เกิดข้อผิดพลาดในการลบข้อมูล');
    }
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
            disabled={record.isSystemDefault}
          >
            <Button 
              type="text" 
              danger 
              icon={<DeleteOutlined />} 
              disabled={record.isSystemDefault}
              title={record.isSystemDefault ? 'ไม่สามารถลบกะระบบได้' : ''}
            />
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
    </div>
  );
};

export default SettingsPage;

