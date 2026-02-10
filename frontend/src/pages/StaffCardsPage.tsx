import React, { useState } from 'react';
import {
  Card,
  Row,
  Col,
  Button,
  Space,
  Tag,
  Input,
  Modal,
  Form,
  InputNumber,
  Select,
  message,
  Popconfirm,
  Badge,
  Typography,
  Divider,
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  UserOutlined,
  PhoneOutlined,
  IdcardOutlined,
  DollarOutlined,
} from '@ant-design/icons';
import { useProjectStore } from '../stores/projectStore';
import { useStaffStore } from '../stores/staffStore';
import { useEffect } from 'react';

const { Search } = Input;
const { Text } = Typography;

interface Staff {
  id: string;
  name: string;
  position: string;
  phone?: string;
  wagePerDay: number;
  staffType: 'REGULAR' | 'SPARE';
  code: string;
  availability: 'AVAILABLE' | 'TEMPORARILY_OFF' | 'ON_LEAVE';
  isActive: boolean;
  projectId: string;
  project?: {
    id: string;
    name: string;
    themeColor?: string;
  };
}

const StaffCardsPage: React.FC = () => {
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  const [searchText, setSearchText] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState<Staff | null>(null);
  const [form] = Form.useForm();

  // Use global stores
  const { projects, fetchProjects } = useProjectStore();
  const { staff, fetchAllStaff, addStaff, updateStaff, deleteStaff, fetchStaff } = useStaffStore();

  // Fetch data on mount
  useEffect(() => {
    fetchProjects();
  }, []);

  // Set default project when projects loaded
  useEffect(() => {
    if (projects.length > 0 && !selectedProjectId) {
      setSelectedProjectId(projects[0].id);
      fetchAllStaff(projects.map(p => p.id));
    }
  }, [projects.length]);

  // Filter staff by project and search
  const filteredStaff = staff.filter((s) => {
    const matchProject = s.projectId === selectedProjectId;
    const matchSearch =
      s.name.toLowerCase().includes(searchText.toLowerCase()) ||
      s.position.toLowerCase().includes(searchText.toLowerCase()) ||
      s.code.toLowerCase().includes(searchText.toLowerCase());
    return matchProject && (searchText === '' || matchSearch) && s.isActive;
  });

  // Get availability badge
  const getAvailabilityBadge = (availability: string) => {
    const config = {
      AVAILABLE: { text: 'พร้อมลงเวร', color: 'success' as const },
      TEMPORARILY_OFF: { text: 'หยุดชั่วคราว', color: 'warning' as const },
      ON_LEAVE: { text: 'ลาพัก', color: 'default' as const },
    };
    return config[availability as keyof typeof config] || config.AVAILABLE;
  };

  const handleCreate = () => {
    setEditingStaff(null);
    form.resetFields();
    form.setFieldsValue({
      projectId: selectedProjectId,
      staffType: 'REGULAR',
      code: 'Code 1',
      availability: 'AVAILABLE',
    });
    setIsModalOpen(true);
  };

  const handleEdit = (staff: Staff) => {
    setEditingStaff(staff);
    form.setFieldsValue({
      name: staff.name,
      position: staff.position,
      phone: staff.phone,
      wagePerDay: staff.wagePerDay,
      staffType: staff.staffType,
      code: staff.code,
      availability: staff.availability,
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      console.log('Save staff:', editingStaff ? 'edit' : 'create', values);
      
      const staffData = {
        name: values.name,
        position: values.position,
        phone: values.phone || undefined,
        wagePerDay: values.wagePerDay,
        staffType: values.staffType,
        code: values.code,
        availability: values.availability,
        projectId: selectedProjectId,
      };

      if (editingStaff) {
        const result = await updateStaff(editingStaff.id, staffData);
        if (result) {
          message.success('แก้ไขพนักงานสำเร็จ');
          await fetchStaff(selectedProjectId, true);
        } else {
          message.error('ไม่สามารถแก้ไขพนักงานได้');
        }
      } else {
        const result = await addStaff(staffData);
        if (result) {
          message.success('เพิ่มพนักงานสำเร็จ');
          await fetchStaff(selectedProjectId, true);
        } else {
          message.error('ไม่สามารถเพิ่มพนักงานได้');
        }
      }
      setIsModalOpen(false);
      form.resetFields();
      setEditingStaff(null);
    } catch (error) {
      console.error('Validation failed or submission error:', error);
      message.error('เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const result = await deleteStaff(id);
      if (result) {
        message.success('ลบพนักงานสำเร็จ');
        await fetchStaff(selectedProjectId, true);
      } else {
        message.error('ไม่สามารถลบพนักงานได้');
      }
    } catch (error) {
      console.error('Delete failed:', error);
      message.error('เกิดข้อผิดพลาดในการลบข้อมูล');
    }
  };

  const currentProject = projects.find((p) => p.id === selectedProjectId);

  return (
    <div style={{ padding: '24px' }}>
      {/* Header */}
      <Card>
        <Row gutter={[16, 16]} align="middle">
          <Col flex="auto">
            <Space size="large">
              <Select
                value={selectedProjectId}
                onChange={setSelectedProjectId}
                style={{ width: 300 }}
                size="large"
              >
                {projects.map((proj) => (
                  <Select.Option key={proj.id} value={proj.id}>
                    {proj.name}
                  </Select.Option>
                ))}
              </Select>

              <Search
                placeholder="ค้นหาชื่อ หรือ ตำแหน่ง..."
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                style={{ width: 300 }}
                size="large"
                allowClear
              />
            </Space>
          </Col>

          <Col>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={handleCreate}
              size="large"
            >
              เพิ่มพนักงานใหม่
            </Button>
          </Col>
        </Row>
      </Card>

      {/* Staff Cards */}
      <div style={{ marginTop: '24px' }}>
        <Text type="secondary">
          แสดง {filteredStaff.length} คน จากทั้งหมด{' '}
          {staff.filter((s) => s.projectId === selectedProjectId).length} คน
        </Text>

        <Row gutter={[16, 16]} style={{ marginTop: '16px' }}>
          {filteredStaff.map((staff) => {
            const availabilityBadge = getAvailabilityBadge(staff.availability);

            return (
              <Col xs={24} sm={12} md={8} lg={6} key={staff.id}>
                <Badge.Ribbon
                  text={availabilityBadge.text}
                  color={availabilityBadge.color}
                >
                  <Card
                    hoverable
                    actions={[
                      <EditOutlined
                        key="edit"
                        onClick={() => handleEdit(staff)}
                      />,
                      <Popconfirm
                        title="ยืนยันการลบ?"
                        description="คุณแน่ใจหรือไม่?"
                        onConfirm={() => handleDelete(staff.id)}
                        key="delete"
                      >
                        <DeleteOutlined style={{ color: '#ff4d4f' }} />
                      </Popconfirm>,
                    ]}
                  >
                    <div
                      style={{
                        textAlign: 'center',
                        marginBottom: '16px',
                      }}
                    >
                      <div
                        style={{
                          width: '64px',
                          height: '64px',
                          borderRadius: '50%',
                          backgroundColor: currentProject?.themeColor || '#1890ff',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          margin: '0 auto',
                          marginBottom: '12px',
                        }}
                      >
                        <UserOutlined
                          style={{ fontSize: '32px', color: '#fff' }}
                        />
                      </div>

                      <div style={{ fontWeight: 'bold', fontSize: '16px' }}>
                        {staff.name}
                      </div>
                      <div style={{ color: '#999', fontSize: '13px' }}>
                        {staff.position}
                      </div>

                      {staff.staffType === 'SPARE' && (
                        <Tag color="orange" style={{ marginTop: '8px' }}>
                          สแปร์
                        </Tag>
                      )}
                    </div>

                    <Divider style={{ margin: '12px 0' }} />

                    <Space direction="vertical" style={{ width: '100%' }}>
                      <div>
                        <IdcardOutlined style={{ marginRight: '8px' }} />
                        <Text type="secondary">คอร์ด: </Text>
                        <Tag color="blue">{staff.code}</Tag>
                      </div>

                      <div>
                        <DollarOutlined style={{ marginRight: '8px' }} />
                        <Text type="secondary">ค่าแรง: </Text>
                        <Text strong>
                          {staff.wagePerDay.toLocaleString()} บ./วัน
                        </Text>
                      </div>

                      {staff.phone && (
                        <div>
                          <PhoneOutlined style={{ marginRight: '8px' }} />
                          <Text type="secondary">{staff.phone}</Text>
                        </div>
                      )}
                    </Space>
                  </Card>
                </Badge.Ribbon>
              </Col>
            );
          })}
        </Row>
      </div>

      {/* Create/Edit Modal */}
      <Modal
        title={
          editingStaff ? (
            <span>
              <EditOutlined /> แก้ไขพนักงาน
            </span>
          ) : (
            <span>
              <PlusOutlined /> เพิ่มพนักงานใหม่
            </span>
          )
        }
        open={isModalOpen}
        onOk={handleSubmit}
        onCancel={() => setIsModalOpen(false)}
        okText="บันทึก"
        cancelText="ยกเลิก"
        width={600}
      >
        <Form form={form} layout="vertical" style={{ marginTop: 20 }}>
          <Form.Item
            label="ชื่อพนักงาน"
            name="name"
            rules={[{ required: true, message: 'กรุณากรอกชื่อพนักงาน' }]}
          >
            <Input placeholder="เช่น น.ส.สมหญิง ใจดี" prefix={<UserOutlined />} />
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="ตำแหน่ง"
                name="position"
                rules={[{ required: true, message: 'กรุณากรอกตำแหน่ง' }]}
              >
                <Input placeholder="เช่น ผู้จัดการอาคาร" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="รหัสพนักงาน (Code)"
                name="code"
                rules={[{ required: true, message: 'กรุณาเลือก Code' }]}
              >
                <Select>
                  <Select.Option value="Code 1">Code 1</Select.Option>
                  <Select.Option value="Code 2">Code 2</Select.Option>
                  <Select.Option value="Code 3">Code 3</Select.Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item label="เบอร์โทร" name="phone">
                <Input
                  placeholder="081-234-5678"
                  prefix={<PhoneOutlined />}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="ค่าแรงต่อวัน (บาท)"
                name="wagePerDay"
                rules={[
                  { required: true, message: 'กรุณากรอกค่าแรง' },
                  { type: 'number', min: 0, message: 'ค่าแรงต้องมากกว่า 0' },
                ]}
              >
                <InputNumber
                  style={{ width: '100%' }}
                  placeholder="500"
                  min={0}
                  prefix="฿"
                  formatter={(value) =>
                    `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')
                  }
                />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="ประเภทพนักงาน"
                name="staffType"
                initialValue="REGULAR"
              >
                <Select>
                  <Select.Option value="REGULAR">พนักงานประจำ</Select.Option>
                  <Select.Option value="SPARE">พนักงานสแปร์</Select.Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="สถานะความพร้อม"
                name="availability"
                initialValue="AVAILABLE"
              >
                <Select>
                  <Select.Option value="AVAILABLE">พร้อมลงเวร</Select.Option>
                  <Select.Option value="TEMPORARILY_OFF">
                    หยุดชั่วคราว
                  </Select.Option>
                  <Select.Option value="ON_LEAVE">ลาพัก</Select.Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>
    </div>
  );
};

export default StaffCardsPage;
