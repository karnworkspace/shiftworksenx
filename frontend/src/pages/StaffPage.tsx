import React, { useState, useEffect } from 'react';
import {
  Card,
  Table,
  Button,
  Space,
  Tag,
  Modal,
  Form,
  Input,
  InputNumber,
  Select,
  message,
  Popconfirm,
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  StopOutlined,
  CheckCircleOutlined,
} from '@ant-design/icons';
import { useStaffStore } from '../stores/staffStore';
import { useProjectStore } from '../stores/projectStore';

interface Staff {
  id: string;
  code: string;
  name: string;
  position: string;
  phone?: string;
  wagePerDay: number;
  availability: string;
  isActive: boolean;
  projectId: string;
}

const StaffPage: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState<Staff | null>(null);

  // Use global stores
  const { projects, fetchProjects } = useProjectStore();
  const { addStaff, updateStaff, setStaffInactive, getStaffByProject, fetchStaff } = useStaffStore();

  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  const [form] = Form.useForm();

  // Fetch projects on mount
  useEffect(() => {
    fetchProjects();
  }, []);

  // Set default project when projects are loaded
  useEffect(() => {
    if (projects.length > 0 && !selectedProjectId) {
      setSelectedProjectId(projects[0].id);
    }
  }, [projects]);

  // Fetch staff when project changes
  useEffect(() => {
    if (selectedProjectId) {
      fetchStaff(selectedProjectId, true);
    }
  }, [selectedProjectId]);

  // Filter staff by selected project
  const filteredStaff = getStaffByProject(selectedProjectId);

  const handleCreate = () => {
    setEditingStaff(null);
    form.resetFields();
    form.setFieldsValue({
      isActive: true,
      wagePerDay: 500,
    });
    setIsModalOpen(true);
  };

  const handleEdit = (staff: Staff) => {
    setEditingStaff(staff);
    form.setFieldsValue({
      code: staff.code,
      name: staff.name,
      position: staff.position,
      phone: staff.phone,
      wagePerDay: staff.wagePerDay,
      isActive: staff.isActive,
      remark: (staff as any).remark,
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();

      console.log('Form values:', values);

      if (editingStaff) {
        console.log('Updating staff:', editingStaff.id, values);
        const result = await updateStaff(editingStaff.id, {
          name: values.name,
          position: values.position,
          phone: values.phone,
          wagePerDay: values.wagePerDay || 500,
          isActive: values.isActive,
          remark: values.remark,
        });
        console.log('Update result:', result);
        if (result) {
          message.success('แก้ไขพนักงานสำเร็จ');
        } else {
          message.error('แก้ไขพนักงานไม่สำเร็จ');
          return;
        }
      } else {
        console.log('Creating new staff');
        const result = await addStaff({
          name: values.name,
          position: values.position,
          phone: values.phone,
          wagePerDay: values.wagePerDay || 500,
          staffType: 'REGULAR',
          defaultShift: 'OFF',
          projectId: selectedProjectId,
          remark: values.remark,
        });
        console.log('Create result:', result);
        if (result) {
          message.success('เพิ่มพนักงานสำเร็จ');
        } else {
          message.error('เพิ่มพนักงานไม่สำเร็จ');
          return;
        }
      }

      setIsModalOpen(false);
      form.resetFields();
      setEditingStaff(null);
    } catch (error: any) {
      console.error('Submit error:', error);
      console.error('Error response:', error.response?.data);
      message.error(error.response?.data?.error || 'เกิดข้อผิดพลาด');
    }
  };

  const handleInactive = async (id: string) => {
    const result = await setStaffInactive(id);
    if (result) {
      message.success('อัพเดทสถานะสำเร็จ');
    } else {
      message.error('เปลี่ยนสถานะไม่สำเร็จ');
    }
  };

  const columns = [
    {
      title: 'รหัส',
      dataIndex: 'code',
      key: 'code',
      render: (text: string) => <Tag color="blue">{text}</Tag>,
    },
    {
      title: 'ชื่อพนักงาน',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: 'ตำแหน่ง',
      dataIndex: 'position',
      key: 'position',
    },
    {
      title: 'เบอร์โทร',
      dataIndex: 'phone',
      key: 'phone',
      render: (text: string) => text || '-',
    },
    {
      title: 'ค่าแรง/วัน',
      dataIndex: 'wagePerDay',
      key: 'wagePerDay',
      render: (value: number) => `฿${value.toLocaleString()}`,
    },
    {
      title: 'สถานะ',
      dataIndex: 'isActive',
      key: 'isActive',
      render: (isActive: boolean) => {
        return (
          <Tag color={isActive ? 'green' : 'red'}>
            {isActive ? 'Active' : 'Inactive'}
          </Tag>
        );
      },
    },
    {
      title: 'จัดการ',
      key: 'action',
      render: (_: any, record: Staff) => (
        <Space>
          <Button
            type="text"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
          />
          <Popconfirm
            title={record.isActive ? "ยืนยันการระงับการใช้งาน?" : "ยืนยันการเปิดใช้งาน?"}
            description={record.isActive ? "คุณต้องการเปลี่ยนสถานะพนักงานเป็น Inactive หรือไม่?" : "คุณต้องการเปลี่ยนสถานะพนักงานเป็น Active หรือไม่?"}
            onConfirm={() => handleInactive(record.id)}
            okText="ยืนยัน"
            cancelText="ยกเลิก"
          >
            <Button
              type="text"
              danger={record.isActive}
              icon={record.isActive ? <StopOutlined /> : <CheckCircleOutlined />}
              title={record.isActive ? "ระงับการใช้งาน" : "เปิดใช้งาน"}
            />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <Card
        title={<span style={{ fontSize: '20px', fontWeight: 'bold' }}>👥 จัดการพนักงาน</span>}
        extra={
          <Space>
            <Select
              placeholder="เลือกโครงการ"
              style={{ width: 250 }}
              onChange={setSelectedProjectId}
              value={selectedProjectId}
            >
              {projects.map((p) => (
                <Select.Option key={p.id} value={p.id}>
                  {p.name}
                </Select.Option>
              ))}
            </Select>
            <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate}>
              เพิ่มพนักงาน
            </Button>
          </Space>
        }
      >
        <Table
          columns={columns}
          dataSource={filteredStaff}
          rowKey="id"
        />
      </Card>

      {/* Create/Edit Modal */}
      <Modal
        title={editingStaff ? 'แก้ไขพนักงาน' : 'เพิ่มพนักงานใหม่'}
        open={isModalOpen}
        onOk={handleSubmit}
        onCancel={() => setIsModalOpen(false)}
        width={600}
      >
        <Form form={form} layout="vertical" style={{ marginTop: 20 }}>
          <Form.Item
            label="รหัสพนักงาน"
            name="code"
            rules={[{ required: true, message: 'กรุณากรอกรหัสพนักงาน' }]}
          >
            <Input placeholder="เช่น A01" />
          </Form.Item>

          <Form.Item
            label="ชื่อพนักงาน"
            name="name"
            rules={[{ required: true, message: 'กรุณากรอกชื่อพนักงาน' }]}
          >
            <Input placeholder="เช่น สมชาย ใจดี" />
          </Form.Item>

          <Form.Item
            label="ตำแหน่ง"
            name="position"
            rules={[{ required: true, message: 'กรุณากรอกตำแหน่ง' }]}
          >
            <Input placeholder="เช่น เจ้าหน้าที่รักษาความปลอดภัย" />
          </Form.Item>

          <Form.Item label="เบอร์โทร" name="phone">
            <Input placeholder="0812345678" />
          </Form.Item>

          <Form.Item
            label="ค่าแรง/วัน (บาท)"
            name="wagePerDay"
            rules={[{ required: true, message: 'กรุณากรอกค่าแรงต่อวัน' }]}
          >
            <InputNumber
              placeholder="500"
              min={0}
              style={{ width: '100%' }}
              formatter={(value) => `฿ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
            />
          </Form.Item>

          <Form.Item
            label="สถานะการทำงาน"
            name="isActive"
            rules={[{ required: true, message: 'กรุณาเลือกสถานะการทำงาน' }]}
          >
            <Select placeholder="เลือกสถานะ">
              <Select.Option value={true}>Active</Select.Option>
              <Select.Option value={false}>Inactive</Select.Option>
            </Select>
          </Form.Item>

          <Form.Item
            label="หมายเหตุ"
            name="remark"
          >
            <Input.TextArea rows={3} placeholder="หมายเหตุเพิ่มเติม (ถ้ามี)" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default StaffPage;
