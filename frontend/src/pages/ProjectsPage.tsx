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
import { SearchOutlined } from '@ant-design/icons';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  MinusCircleOutlined,
} from '@ant-design/icons';
import { useMemo } from 'react';
import { useProjectStore } from '../stores/projectStore';
import { useStaffStore } from '../stores/staffStore';
import { useAuthStore } from '../stores/authStore';

interface Project {
  id: string;
  name: string;
  themeColor: string;
  managerId?: string;
  location?: string;
  projectType?: 'HORIZONTAL' | 'VERTICAL' | 'GROUP';
  subProjects?: { name: string; percentage: number }[];
  isActive: boolean;
  editCutoffDay?: number;
  editCutoffNextMonth?: boolean;
}

const ProjectsPage: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [form] = Form.useForm();

  // Use global stores
  const { projects, addProject, updateProject, deleteProject, fetchProjects, loading } = useProjectStore();
  const { getActiveStaffByProject, fetchAllStaff } = useStaffStore();
  const { user } = useAuthStore();
  const isSuperAdmin = user?.role === 'SUPER_ADMIN';

  // Fetch projects on mount
  useEffect(() => {
    fetchProjects();
  }, []);

  // Fetch staff for all projects (sequential ผ่าน fetchAllStaff แทน concurrent forEach)
  useEffect(() => {
    if (projects.length > 0) {
      fetchAllStaff(projects.map(p => p.id));
    }
  }, [projects.length]);

  // Count staff per project
  const getStaffCount = (projectId: string) => {
    return getActiveStaffByProject(projectId).length;
  };

  const filteredProjects = useMemo(() => {
    if (!searchText.trim()) return projects;
    const keyword = searchText.trim().toLowerCase();
    return projects.filter(p => p.name.toLowerCase().includes(keyword));
  }, [projects, searchText]);

  const handleCreate = () => {
    setEditingProject(null);
    form.resetFields();
    form.setFieldsValue({
      themeColor: '#3b82f6',
      isActive: true,
      projectType: 'VERTICAL',
      subProjects: [],
      ...(isSuperAdmin ? { editCutoffDay: 2, editCutoffNextMonth: true } : {}),
    });
    setIsModalOpen(true);
  };

  const handleEdit = (project: any) => {
    setEditingProject(project);
    form.setFieldsValue({
      name: project.name,
      location: project.location,
      projectType: project.projectType || 'VERTICAL',
      editCutoffDay: project.editCutoffDay ?? 2,
      editCutoffNextMonth: project.editCutoffNextMonth ?? true,
      subProjects: Array.isArray(project.subProjects)
        ? project.subProjects.map((sp: any) => ({
            name: sp?.name ?? '',
            percentage: sp?.percentage ?? 0,
          }))
        : [],
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async () => {
    if (isSubmitting) return; // ป้องกันการส่งซ้ำ
    setIsSubmitting(true);
    try {
      const values = await form.validateFields();
      
      // Get color value
      const themeColor = typeof values.themeColor === 'string' 
        ? values.themeColor 
        : values.themeColor?.toHexString?.() || '#3b82f6';
      
      if (editingProject) {
        const normalizedSubProjects = Array.isArray(values.subProjects)
          ? values.subProjects
              .map((sp: any) => ({
                name: typeof sp?.name === 'string' ? sp.name.trim() : '',
                percentage: Number(sp?.percentage),
              }))
              .filter((sp: any) => sp.name && Number.isFinite(sp.percentage))
          : [];
        const payload: any = {
          name: values.name,
          location: values.location,
          themeColor,
          projectType: values.projectType || 'VERTICAL',
          isActive: values.isActive ?? true,
          subProjects: normalizedSubProjects,
        };
        if (isSuperAdmin) {
          payload.editCutoffDay = values.editCutoffDay ?? 2;
          payload.editCutoffNextMonth = values.editCutoffNextMonth ?? true;
        }
        const result = await updateProject(editingProject.id, payload);
        if (result) {
          message.success('แก้ไขโครงการสำเร็จ');
          setIsModalOpen(false);
          form.resetFields();
          setEditingProject(null);
        } else {
          message.error('ไม่สามารถแก้ไขโครงการได้');
        }
        setIsSubmitting(false);
      } else {
        const normalizedSubProjects = Array.isArray(values.subProjects)
          ? values.subProjects
              .map((sp: any) => ({
                name: typeof sp?.name === 'string' ? sp.name.trim() : '',
                percentage: Number(sp?.percentage),
              }))
              .filter((sp: any) => sp.name && Number.isFinite(sp.percentage))
          : [];
        const payload: any = {
          name: values.name,
          location: values.location,
          themeColor,
          projectType: values.projectType || 'VERTICAL',
          isActive: values.isActive ?? true,
          subProjects: normalizedSubProjects,
        };
        if (isSuperAdmin) {
          payload.editCutoffDay = values.editCutoffDay ?? 2;
          payload.editCutoffNextMonth = values.editCutoffNextMonth ?? true;
        }
        const result = await addProject(payload);
        if (result) {
          message.success('สร้างโครงการสำเร็จ');
          setIsModalOpen(false);
          form.resetFields();
          setEditingProject(null);
        } else {
          message.error('ไม่สามารถสร้างโครงการได้');
        }
        setIsSubmitting(false);
      }
    } catch (error) {
      console.error('Form validation or submission failed:', error);
      message.error('เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง');
      setIsSubmitting(false);
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
      title: 'ประเภทโครงการ',
      dataIndex: 'projectType',
      key: 'projectType',
      render: (value: string) => {
        const map: Record<string, { label: string; color: string }> = {
          HORIZONTAL: { label: 'แนวราบ', color: 'orange' },
          VERTICAL: { label: 'แนวสูง', color: 'geekblue' },
          GROUP: { label: 'กลุ่มโครงการ', color: 'purple' },
        };
        const { label, color } = map[value] ?? { label: value, color: 'default' };
        return <Tag color={color}>{label}</Tag>;
      },
    },
    {
      title: 'โครงการย่อย',
      key: 'subProjects',
      render: (_: any, record: any) => {
        if (!record.subProjects || record.subProjects.length === 0) {
          return <span style={{ color: '#999' }}>-</span>;
        }
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            {record.subProjects.map((sp: any, index: number) => (
              <div key={index} style={{ fontSize: '12px', color: '#333' }}>
                <div>📍 {sp.name}</div>
                <div style={{ color: '#666', fontSize: '11px', marginLeft: '8px' }}>
                  {sp.percentage}%
                </div>
              </div>
            ))}
          </div>
        );
      },
    },
    {
      title: 'จำนวนพนักงาน',
      key: 'staffCount',
      render: (_: any, record: any) => (
        <Tag color="blue">{getStaffCount(record.id)} คน</Tag>
      ),
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
      title: 'แก้ไขได้ถึง',
      dataIndex: 'editCutoffDay',
      key: 'editCutoffDay',
      render: (_: any, record: any) =>
        `วันที่ ${record.editCutoffDay || 2} ของ${record.editCutoffNextMonth === false ? 'เดือนเดียวกัน' : 'เดือนถัดไป'}`,
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
        <div style={{ marginBottom: 16 }}>
          <Input
            placeholder="ค้นหาชื่อโครงการ..."
            prefix={<SearchOutlined style={{ color: '#bfbfbf' }} />}
            allowClear
            value={searchText}
            onChange={e => setSearchText(e.target.value)}
            style={{ maxWidth: 320 }}
          />
        </div>
        <Spin spinning={loading}>
          <Table
            columns={columns}
            dataSource={filteredProjects}
            rowKey="id"
          />
        </Spin>
      </Card>

      {/* Create/Edit Modal */}
      <Modal
        title={editingProject ? 'แก้ไขโครงการ' : 'สร้างโครงการใหม่'}
        open={isModalOpen}
        onOk={handleSubmit}
        okButtonProps={{ disabled: isSubmitting }}
        cancelButtonProps={{ disabled: isSubmitting }}
        onCancel={() => !isSubmitting && setIsModalOpen(false)}
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

          <Form.Item
            label="ประเภทโครงการ"
            name="projectType"
            rules={[{ required: true, message: 'กรุณาเลือกประเภทโครงการ' }]}
          >
            <Select placeholder="เลือกประเภทโครงการ">
              <Select.Option value="VERTICAL">แนวสูง</Select.Option>
              <Select.Option value="HORIZONTAL">แนวราบ</Select.Option>
              <Select.Option value="GROUP">กลุ่มโครงการ</Select.Option>
            </Select>
          </Form.Item>

          <Form.Item
            label="โครงการย่อย (สำหรับแสดงในรายงาน)"
            style={{ marginBottom: 8 }}
          >
            <Form.List name="subProjects">
              {(fields, { add, remove }) => (
                <div>
                  {fields.map(({ key, name, ...restField }) => (
                    <Space key={key} align="baseline" style={{ display: 'flex', marginBottom: 8 }}>
                      <Form.Item
                        {...restField}
                        name={[name, 'name']}
                        rules={[{ required: true, message: 'กรุณาใส่ชื่อโครงการย่อย' }]}
                      >
                        <Input placeholder="ชื่อโครงการย่อย" />
                      </Form.Item>
                      <Form.Item
                        {...restField}
                        name={[name, 'percentage']}
                        rules={[
                          { required: true, message: 'กรุณาใส่ %' },
                          { type: 'number', min: 0, max: 100, message: 'กรุณาใส่ 0-100' },
                        ]}
                      >
                        <InputNumber
                          min={0}
                          max={100}
                          style={{ width: 140 }}
                          formatter={(value) => `${value ?? ''}%`}
                          parser={(value) => Number((value || '').toString().replace('%', '')) as 0 | 100}
                        />
                      </Form.Item>
                      <Button
                        type="text"
                        danger
                        icon={<MinusCircleOutlined />}
                        onClick={() => remove(name)}
                      />
                    </Space>
                  ))}
                  <Button type="dashed" onClick={() => add()} icon={<PlusOutlined />}>
                    เพิ่มโครงการย่อย
                  </Button>
                </div>
              )}
            </Form.List>
          </Form.Item>


          <Form.Item
            label={
              <span>
                วันสุดท้ายที่แก้ไขตารางเวร
                <span style={{ fontSize: 12, color: '#888', marginLeft: 8 }}>
                  หมายเหตุ: หากต้องการกำหนดเป็นสิ้นเดือน ให้ใส่วันที่ 31
                </span>
              </span>
            }
            name="editCutoffDay"
            rules={
              isSuperAdmin
                ? [
                    { required: true, message: 'กรุณาระบุวันสุดท้ายที่แก้ไขได้' },
                    { type: 'number', min: 1, max: 31, message: 'ระบุได้ 1-31' },
                  ]
                : []
            }
          >
            <InputNumber min={1} max={31} style={{ width: '100%' }} disabled={!isSuperAdmin} />
          </Form.Item>

          <Form.Item
            label="อ้างอิงเดือน"
            name="editCutoffNextMonth"
            rules={isSuperAdmin ? [{ required: true, message: 'กรุณาเลือกอ้างอิงเดือน' }] : []}
          >
            <Select disabled={!isSuperAdmin}>
              <Select.Option value={true}>เดือนถัดไป</Select.Option>
              <Select.Option value={false}>เดือนเดียวกัน</Select.Option>
            </Select>
          </Form.Item>

        </Form>
      </Modal>
    </div>
  );
};

export default ProjectsPage;
