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
  Spin,
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
} from '@ant-design/icons';
import { useProjectStore } from '../stores/projectStore';
import { useStaffStore } from '../stores/staffStore';

interface Project {
  id: string;
  name: string;
  themeColor: string;
  managerId?: string;
  location?: string;
  isActive: boolean;
  costSharingFrom?: Array<{
    id?: string;
    destinationProjectId: string;
    percentage: number;
  }>;
}

const ProjectsPage: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [form] = Form.useForm();

  // Use global stores
  const { projects, addProject, updateProject, deleteProject, fetchProjects, loading } = useProjectStore();
  const { getActiveStaffByProject, fetchStaff } = useStaffStore();

  // Fetch projects on mount
  useEffect(() => {
    fetchProjects();
  }, []);

  // Fetch staff for all projects
  useEffect(() => {
    if (projects.length > 0) {
      projects.forEach(p => fetchStaff(p.id, true));
    }
  }, [projects.length]);

  // Count staff per project
  const getStaffCount = (projectId: string) => {
    return getActiveStaffByProject(projectId).length;
  };

  const handleCreate = () => {
    setEditingProject(null);
    form.resetFields();
    form.setFieldsValue({
      themeColor: '#3b82f6',
      isActive: true,
    });
    setIsModalOpen(true);
  };

  const handleEdit = (project: any) => {
    setEditingProject(project);
    form.setFieldsValue({
      name: project.name,
      location: project.location,
      costSharingFrom: project.costSharingFrom || [],
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      
      // Get color value
      const themeColor = typeof values.themeColor === 'string' 
        ? values.themeColor 
        : values.themeColor?.toHexString?.() || '#3b82f6';
      
      if (editingProject) {
        const result = await updateProject(editingProject.id, {
          name: values.name,
          location: values.location,
          themeColor,
          isActive: values.isActive ?? true,
          costSharingFrom: values.costSharingFrom || [],
        });
        if (result) {
          message.success('แก้ไขโครงการสำเร็จ');
          setIsModalOpen(false);
          form.resetFields();
          setEditingProject(null);
        } else {
          message.error('ไม่สามารถแก้ไขโครงการได้');
        }
      } else {
        const result = await addProject({
          name: values.name,
          location: values.location,
          themeColor,
          isActive: values.isActive ?? true,
          costSharingFrom: values.costSharingFrom || [],
        });
        if (result) {
          message.success('สร้างโครงการสำเร็จ');
          setIsModalOpen(false);
          form.resetFields();
          setEditingProject(null);
        } else {
          message.error('ไม่สามารถสร้างโครงการได้');
        }
      }
    } catch (error) {
      console.error('Form validation or submission failed:', error);
      message.error('เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const result = await deleteProject(id);
      if (result) {
        message.success('ลบโครงการสำเร็จ');
      } else {
        message.error('ไม่สามารถลบโครงการได้');
      }
    } catch (error) {
      console.error('Delete failed:', error);
      message.error('เกิดข้อผิดพลาดในการลบโครงการ');
    }
  };

  const columns = [
    {
      title: 'โครงการ',
      dataIndex: 'name',
      key: 'name',
      render: (text: string, record: any) => (
        <Space>
          <div
            style={{
              width: 12,
              height: 12,
              borderRadius: '50%',
              backgroundColor: record.themeColor,
            }}
          />
          {text}
        </Space>
      ),
    },
    {
      title: 'สถานที่',
      dataIndex: 'location',
      key: 'location',
      render: (text: string) => text || '-',
    },
    {
      title: 'จำนวนพนักงาน',
      key: 'staffCount',
      render: (_: any, record: any) => (
        <Tag color="blue">{getStaffCount(record.id)} คน</Tag>
      ),
    },
    {
      title: 'Cost Sharing',
      key: 'costSharingFrom',
      render: (_: any, record: any) => {
        if (!record.costSharingFrom || record.costSharingFrom.length === 0) return '-';
        return (
          <Space direction="vertical" size="small">
            {record.costSharingFrom.map((cs: any, idx: number) => {
              const destProject = projects.find((p) => p.id === cs.destinationProjectId);
              return (
                <Tag key={idx} color="orange">
                  {destProject?.name || 'N/A'}: {cs.percentage}%
                </Tag>
              );
            })}
          </Space>
        );
      },
    },
    {
      title: 'สถานะ',
      key: 'isActive',
      render: (_: any, record: any) => (
        <Tag color={record.isActive ? 'green' : 'red'}>
          {record.isActive ? 'ใช้งาน' : 'ปิด'}
        </Tag>
      ),
    },
    {
      title: 'จัดการ',
      key: 'action',
      render: (_: any, record: any) => (
        <Space>
          <Button
            type="text"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
          />
          <Popconfirm
            title="ยืนยันการลบ?"
            description="คุณแน่ใจหรือไม่ว่าต้องการลบโครงการนี้?"
            onConfirm={() => handleDelete(record.id)}
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
        title={<span style={{ fontSize: '20px', fontWeight: 'bold' }}>📁 จัดการโครงการ</span>}
        extra={
          <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate}>
            เพิ่มโครงการ
          </Button>
        }
      >
        <Spin spinning={loading}>
          <Table
            columns={columns}
            dataSource={projects}
            rowKey="id"
          />
        </Spin>
      </Card>

      {/* Create/Edit Modal */}
      <Modal
        title={editingProject ? 'แก้ไขโครงการ' : 'สร้างโครงการใหม่'}
        open={isModalOpen}
        onOk={handleSubmit}
        onCancel={() => setIsModalOpen(false)}
        width={700}
      >
        <Form form={form} layout="vertical" style={{ marginTop: 20 }}>
          <Form.Item
            label="ชื่อโครงการ"
            name="name"
            rules={[{ required: true, message: 'กรุณากรอกชื่อโครงการ' }]}
          >
            <Input placeholder="เช่น โครงการ Condo A" />
          </Form.Item>

          <Form.Item label="สถานที่" name="location">
            <Input placeholder="เช่น กรุงเทพฯ" />
          </Form.Item>

          <Form.Item label="Cost Sharing (แบ่งค่าใช้จ่ายให้โครงการอื่น)">
            <p style={{ fontSize: '12px', color: '#666', marginBottom: 8 }}>
              กำหนดว่าโครงการนี้จะแบ่งค่าใช้จ่าย (เงินเดือนพนักงาน) ให้กับโครงการอื่นกี่ %
            </p>
            <Form.List name="costSharingFrom">
              {(fields, { add, remove }) => (
                <>
                  {fields.map(({ key, name, ...restField }) => (
                    <Space key={key} style={{ display: 'flex', marginBottom: 8 }} align="baseline">
                      <Form.Item
                        {...restField}
                        name={[name, 'destinationProjectId']}
                        rules={[{ required: true, message: 'เลือกโครงการ' }]}
                        style={{ marginBottom: 0 }}
                      >
                        <Select
                          placeholder="เลือกโครงการปลายทาง"
                          style={{ width: 280 }}
                        >
                          {projects
                            .filter((p) => p.id !== editingProject?.id)
                            .map((p) => (
                              <Select.Option key={p.id} value={p.id}>
                                {p.name}
                              </Select.Option>
                            ))}
                        </Select>
                      </Form.Item>
                      <Form.Item
                        {...restField}
                        name={[name, 'percentage']}
                        rules={[
                          { required: true, message: 'กรอก %' },
                          { type: 'number', min: 0, max: 100, message: '0-100' },
                        ]}
                        style={{ marginBottom: 0 }}
                      >
                        <InputNumber
                          placeholder="%"
                          min={0}
                          max={100}
                          style={{ width: 100 }}
                          addonAfter="%"
                        />
                      </Form.Item>
                      <Button danger onClick={() => remove(name)}>
                        ลบ
                      </Button>
                    </Space>
                  ))}
                  <Form.Item style={{ marginBottom: 0 }}>
                    <Button type="dashed" onClick={() => add()} block icon={<PlusOutlined />}>
                      เพิ่มการแชร์ค่าใช้จ่าย
                    </Button>
                  </Form.Item>
                </>
              )}
            </Form.List>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default ProjectsPage;
