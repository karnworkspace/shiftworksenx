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
  InputNumber,
  Select,
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
  TeamOutlined,
  SyncOutlined,
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

interface Position {
  id: string;
  name: string;
  defaultWage: number;
}

const SettingsPage: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('shifts');
  const [isShiftModalOpen, setIsShiftModalOpen] = useState(false);
  const [editingShift, setEditingShift] = useState<ShiftType | null>(null);
  const [shiftForm] = Form.useForm();
  const [isPositionModalOpen, setIsPositionModalOpen] = useState(false);
  const [editingPosition, setEditingPosition] = useState<Position | null>(null);
  const [positionForm] = Form.useForm();
  const [isApplyWageModalOpen, setIsApplyWageModalOpen] = useState(false);
  const [targetPosition, setTargetPosition] = useState<Position | null>(null);
  const [applyMode, setApplyMode] = useState<'all' | 'not_overridden'>('all');

  // Use stores
  const { isAuthenticated, accessToken } = useAuthStore();
  const {
    shiftTypes,
    fetchShiftTypes,
    addShiftType,
    updateShiftType,
    deleteShiftType,
    positions,
    fetchPositions,
    addPosition,
    updatePosition,
    deletePosition,
    applyPositionDefaultWage,
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
      fetchPositions();
    }
  }, [fetchShiftTypes, fetchPositions, isAuthenticated, accessToken]);

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
    } catch (error: any) {
      console.error('Error submitting shift:', error);
      const errorMessage = error.response?.data?.error || 'เกิดข้อผิดพลาดในการบันทึกข้อมูล';
      if (errorMessage.includes('already exists') || errorMessage.includes('ซ้ำ')) {
        message.error('รหัสกะซ้ำ กรุณาใช้รหัสอื่น');
      } else {
        message.error(errorMessage);
      }
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

  // Position handlers
  const handleCreatePosition = () => {
    setEditingPosition(null);
    positionForm.resetFields();
    positionForm.setFieldsValue({ defaultWage: 0 });
    setIsPositionModalOpen(true);
  };

  const handleEditPosition = (position: Position) => {
    setEditingPosition(position);
    positionForm.setFieldsValue({
      name: position.name,
      defaultWage: position.defaultWage,
    });
    setIsPositionModalOpen(true);
  };

  const handleSubmitPosition = async () => {
    try {
      const values = await positionForm.validateFields();
      const payload = {
        name: values.name,
        defaultWage: values.defaultWage ?? 0,
      };

      if (editingPosition) {
        await updatePosition(editingPosition.id, payload);
        message.success('แก้ไขตำแหน่งสำเร็จ');
      } else {
        await addPosition(payload);
        message.success('เพิ่มตำแหน่งสำเร็จ');
      }

      setIsPositionModalOpen(false);
      positionForm.resetFields();
      setEditingPosition(null);
    } catch (error) {
      console.error('Error submitting position:', error);
      message.error('เกิดข้อผิดพลาดในการบันทึกตำแหน่ง');
    }
  };

  const handleDeletePosition = async (id: string) => {
    try {
      await deletePosition(id);
      message.success('ลบตำแหน่งสำเร็จ');
    } catch (error: any) {
      console.error('Error deleting position:', error);
      message.error(error.response?.data?.error || 'ลบตำแหน่งไม่สำเร็จ');
    }
  };

  const handleOpenApplyWage = (position: Position) => {
    setTargetPosition(position);
    setApplyMode('all');
    setIsApplyWageModalOpen(true);
  };

  const handleApplyWage = async () => {
    if (!targetPosition) return;
    try {
      const count = await applyPositionDefaultWage(targetPosition.id, applyMode);
      message.success(`อัปเดตค่าแรงพนักงานสำเร็จ ${count} คน`);
      setIsApplyWageModalOpen(false);
      setTargetPosition(null);
    } catch (error: any) {
      console.error('Error applying wage:', error);
      message.error(error.response?.data?.error || 'อัปเดตค่าแรงไม่สำเร็จ');
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

  const positionColumns = [
    {
      title: 'ตำแหน่ง',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: 'ค่าแรง/วัน (บาท)',
      dataIndex: 'defaultWage',
      key: 'defaultWage',
      render: (value: number) => `฿${Number(value).toLocaleString()}`,
    },
    {
      title: 'จัดการ',
      key: 'action',
      render: (_: any, record: Position) => (
        <Space>
          <Button
            type="text"
            icon={<SyncOutlined />}
            title="อัปเดตค่าแรงพนักงานตามตำแหน่ง"
            onClick={() => handleOpenApplyWage(record)}
          />
          <Button
            type="text"
            icon={<EditOutlined />}
            onClick={() => handleEditPosition(record)}
          />
          <Popconfirm
            title="ยืนยันการลบ?"
            description="คุณแน่ใจหรือไม่ว่าต้องการลบตำแหน่งนี้?"
            onConfirm={() => handleDeletePosition(record.id)}
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
                    dataSource={[...shiftTypes].sort((a, b) => {
                      // Natural sort for shift codes (e.g., 1, 2, 9, 13 instead of 1, 13, 2, 9)
                      const aNum = parseInt(a.code, 10);
                      const bNum = parseInt(b.code, 10);
                      if (!isNaN(aNum) && !isNaN(bNum)) {
                        return aNum - bNum;
                      }
                      return a.code.localeCompare(b.code);
                    })}
                    rowKey="id"
                    pagination={false}
                  />
                </div>
              ),
            },
            {
              key: 'positions',
              label: (
                <span>
                  <TeamOutlined /> ตำแหน่ง
                </span>
              ),
              children: (
                <div>
                  <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between' }}>
                    <p style={{ color: '#666' }}>
                      กำหนดตำแหน่งพนักงานและค่าแรง/วันเริ่มต้น
                    </p>
                    <Button
                      type="primary"
                      icon={<PlusOutlined />}
                      onClick={handleCreatePosition}
                    >
                      เพิ่มตำแหน่ง
                    </Button>
                  </div>
                  <Table
                    columns={positionColumns}
                    dataSource={positions}
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

      {/* Position Modal */}
      <Modal
        title={editingPosition ? 'แก้ไขตำแหน่ง' : 'เพิ่มตำแหน่งใหม่'}
        open={isPositionModalOpen}
        onOk={handleSubmitPosition}
        onCancel={() => {
          setIsPositionModalOpen(false);
          setEditingPosition(null);
        }}
        width={480}
      >
        <Form form={positionForm} layout="vertical" style={{ marginTop: 20 }}>
          <Form.Item
            label="ชื่อตำแหน่ง"
            name="name"
            rules={[{ required: true, message: 'กรุณากรอกชื่อตำแหน่ง' }]}
          >
            <Input placeholder="เช่น เจ้าหน้าที่รักษาความปลอดภัย" />
          </Form.Item>
          <Form.Item
            label="ค่าแรง/วัน (บาท)"
            name="defaultWage"
            rules={[{ required: true, message: 'กรุณากรอกค่าแรง/วัน' }]}
          >
            <InputNumber
              placeholder="500"
              min={0}
              style={{ width: '100%' }}
              formatter={(value) => `฿ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
            />
          </Form.Item>
        </Form>
      </Modal>

      {/* Apply Position Wage Modal */}
      <Modal
        title="อัปเดตค่าแรงพนักงานตามตำแหน่ง"
        open={isApplyWageModalOpen}
        onOk={handleApplyWage}
        onCancel={() => {
          setIsApplyWageModalOpen(false);
          setTargetPosition(null);
        }}
        okText="อัปเดต"
        cancelText="ยกเลิก"
        width={520}
      >
        <p style={{ marginBottom: 16 }}>
          ตำแหน่ง: <strong>{targetPosition?.name}</strong> (ค่าแรง/วันเริ่มต้น: ฿{Number(targetPosition?.defaultWage || 0).toLocaleString()})
        </p>
        <Form layout="vertical">
          <Form.Item label="เลือกรูปแบบการอัปเดต">
            <Select
              value={applyMode}
              onChange={(value) => setApplyMode(value)}
              options={[
                { value: 'all', label: 'ทุกคนในตำแหน่งนี้' },
                { value: 'not_overridden', label: 'เฉพาะคนที่ยังไม่ได้แก้ค่าแรงเอง' },
              ]}
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default SettingsPage;

