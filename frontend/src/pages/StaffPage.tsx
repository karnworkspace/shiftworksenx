import React, { useState, useEffect, useMemo } from 'react';
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
  UpOutlined,
  DownOutlined,
} from '@ant-design/icons';
import { useStaffStore } from '../stores/staffStore';
import { useProjectStore } from '../stores/projectStore';
import { useSettingsStore } from '../stores/settingsStore';
import { useAuthStore } from '../stores/authStore';

interface Staff {
  id: string;
  code: string;
  name: string;
  position: string;
  positionId?: string;
  phone?: string;
  wagePerDay: number;
  displayOrder?: number | null;
  isActive: boolean;
  projectId: string;
  defaultShift?: string;
  weeklyOffDay?: number | null;
}

const StaffPage: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState<Staff | null>(null);
  const [defaultShiftUpdatingId, setDefaultShiftUpdatingId] = useState<string | null>(null);
  const [weeklyOffUpdatingId, setWeeklyOffUpdatingId] = useState<string | null>(null);
  const [reorderingId, setReorderingId] = useState<string | null>(null);
  const [selectedPositionId, setSelectedPositionId] = useState<string | undefined>(undefined);
  const [selectedDefaultShift, setSelectedDefaultShift] = useState<string | undefined>(undefined);

  // Use global stores
  const { projects, fetchProjects, selectedProjectId, setSelectedProjectId, getProject } = useProjectStore();
  const { addStaff, updateStaff, setStaffInactive, getStaffByProject, fetchStaff, applyDefaultShift, applyWeeklyOffDay, reorderStaff } = useStaffStore();
  const { positions, fetchPositions, shiftTypes, fetchShiftTypes } = useSettingsStore();
  const { user } = useAuthStore();

  const [form] = Form.useForm();

  // Fetch projects on mount
  useEffect(() => {
    fetchProjects();
    fetchPositions();
    if (shiftTypes.length === 0) {
      fetchShiftTypes();
    }
  }, [fetchProjects, fetchPositions, fetchShiftTypes, shiftTypes.length]);

  // Fetch staff when project changes
  useEffect(() => {
    if (selectedProjectId) {
      fetchStaff(selectedProjectId, true);
    }
  }, [selectedProjectId]);

  // Ordered staff list comes from store (already sorted)
  const orderedStaffAll = getStaffByProject(selectedProjectId);
  const currentProject = getProject(selectedProjectId);
  const subProjects = Array.isArray(currentProject?.subProjects) ? currentProject?.subProjects : [];

  const filterPositionName = useMemo(() => {
    if (!selectedPositionId) return undefined;
    return positions.find((p) => p.id === selectedPositionId)?.name;
  }, [positions, selectedPositionId]);

  const filtersActive = !!selectedPositionId || !!selectedDefaultShift;

  // Filter staff by selected project + filters
  const filteredStaff = useMemo(() => {
    return orderedStaffAll.filter((staff) => {
      if (selectedPositionId) {
        const matchById = staff.positionId && staff.positionId === selectedPositionId;
        const matchByName = filterPositionName && staff.position === filterPositionName;
        if (!matchById && !matchByName) return false;
      }
      if (selectedDefaultShift) {
        if ((staff.defaultShift || 'OFF') !== selectedDefaultShift) return false;
      }
      return true;
    });
  }, [orderedStaffAll, selectedPositionId, filterPositionName, selectedDefaultShift]);
  const canEditDefaults = user?.role === 'SUPER_ADMIN';
  const weekOptions = [
    { value: null, label: 'ไม่กำหนด' },
    { value: 0, label: 'อาทิตย์' },
    { value: 1, label: 'จันทร์' },
    { value: 2, label: 'อังคาร' },
    { value: 3, label: 'พุธ' },
    { value: 4, label: 'พฤหัสบดี' },
    { value: 5, label: 'ศุกร์' },
    { value: 6, label: 'เสาร์' },
  ];
  const getShiftLabel = (shift: any) => {
    if (shift?.isWorkShift && shift?.startTime && shift?.endTime) {
      return `${shift.name} (${shift.code}) ${shift.startTime}-${shift.endTime}`;
    }
    return `${shift?.name ?? ''} (${shift?.code ?? ''})`.trim();
  };

  const handleCreate = () => {
    setEditingStaff(null);
    form.resetFields();
    form.setFieldsValue({
      isActive: true,
    });
    setIsModalOpen(true);
  };

  const handleEdit = (staff: Staff) => {
    setEditingStaff(staff);
    const matchedPosition = positions.find((p) => p.name === staff.position);
    form.setFieldsValue({
      code: staff.code,
      name: staff.name,
      positionId: staff.positionId || matchedPosition?.id,
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
          code: values.code,
          name: values.name,
          positionId: values.positionId,
          phone: values.phone,
          wagePerDay: values.wagePerDay,
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
          code: values.code,
          name: values.name,
          positionId: values.positionId,
          phone: values.phone,
          wagePerDay: values.wagePerDay,
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

  const handleDefaultShiftChange = (staff: Staff, nextShift: string) => {
    const currentShift = staff.defaultShift || 'OFF';
    if (nextShift === currentShift) return;
    Modal.confirm({
      title: 'ยืนยันการตั้งค่ากะเริ่มต้น',
      content:
        'การตั้งค่านี้จะมีผลกับเดือนปัจจุบันและเดือนถัดไปเท่านั้น และจะไม่เปลี่ยนวันที่แก้ไขแล้วในเดือนที่ผ่านมา',
      onOk: async () => {
        setDefaultShiftUpdatingId(staff.id);
        const result = await applyDefaultShift(staff.id, nextShift);
        if (result) {
          message.success('อัปเดตกะเริ่มต้นเรียบร้อย');
        } else {
          message.error('อัปเดตกะเริ่มต้นไม่สำเร็จ');
        }
        setDefaultShiftUpdatingId(null);
      },
    });
  };

  const handleWeeklyOffDayChange = (staff: Staff, nextOffDay: number | null) => {
    const currentOff = staff.weeklyOffDay ?? null;
    if (nextOffDay === currentOff) return;
    Modal.confirm({
      title: 'ยืนยันการตั้งค่าวันหยุดประจำสัปดาห์',
      content:
        'การตั้งค่านี้จะมีผลกับเดือนปัจจุบันและเดือนถัดไปเท่านั้น และจะไม่เปลี่ยนวันที่แก้ไขแล้วในเดือนที่ผ่านมา',
      onOk: async () => {
        setWeeklyOffUpdatingId(staff.id);
        const result = await applyWeeklyOffDay(staff.id, nextOffDay);
        if (result) {
          message.success('อัปเดตวันหยุดประจำสัปดาห์เรียบร้อย');
        } else {
          message.error('อัปเดตวันหยุดประจำสัปดาห์ไม่สำเร็จ');
        }
        setWeeklyOffUpdatingId(null);
      },
    });
  };

  const handleMove = async (staffId: string, direction: 'up' | 'down') => {
    if (!selectedProjectId) return;
    if (filtersActive) {
      message.warning('กรุณาปิดตัวกรองก่อนจัดลำดับ');
      return;
    }

    const orderedIds = orderedStaffAll.map((s) => s.id);
    const currentIndex = orderedIds.indexOf(staffId);
    if (currentIndex === -1) return;
    const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    if (targetIndex < 0 || targetIndex >= orderedIds.length) return;

    const newOrder = [...orderedIds];
    [newOrder[currentIndex], newOrder[targetIndex]] = [newOrder[targetIndex], newOrder[currentIndex]];

    setReorderingId(staffId);
    const result = await reorderStaff(selectedProjectId, newOrder);
    if (!result) {
      message.error('จัดลำดับไม่สำเร็จ');
    }
    setReorderingId(null);
  };

  const columns = [
    {
      title: 'ลำดับ',
      key: 'order',
      width: 80,
      render: (_: any, record: Staff) => (
        <Space size={4}>
          <Button
            size="small"
            icon={<UpOutlined />}
            onClick={() => handleMove(record.id, 'up')}
            disabled={filtersActive || reorderingId !== null}
          />
          <Button
            size="small"
            icon={<DownOutlined />}
            onClick={() => handleMove(record.id, 'down')}
            disabled={filtersActive || reorderingId !== null}
          />
        </Space>
      ),
    },
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
      title: 'กะเริ่มต้น',
      key: 'defaultShift',
      render: (_: any, record: Staff) => (
        <Select
          size="small"
          style={{ width: 140 }}
          value={record.defaultShift || 'OFF'}
          loading={defaultShiftUpdatingId === record.id}
          disabled={!canEditDefaults || defaultShiftUpdatingId === record.id}
          onChange={(value) => handleDefaultShiftChange(record, value)}
        >
          {shiftTypes.map((shift) => (
            <Select.Option key={shift.code} value={shift.code}>
              {getShiftLabel(shift)}
            </Select.Option>
          ))}
        </Select>
      ),
    },
    {
      title: 'วันหยุดประจำสัปดาห์',
      key: 'weeklyOffDay',
      render: (_: any, record: Staff) => (
        <Select
          size="small"
          style={{ width: 140 }}
          value={record.weeklyOffDay ?? null}
          loading={weeklyOffUpdatingId === record.id}
          disabled={!canEditDefaults || weeklyOffUpdatingId === record.id}
          onChange={(value) => handleWeeklyOffDayChange(record, value ?? null)}
        >
          {weekOptions.map((opt) => (
            <Select.Option key={String(opt.value)} value={opt.value as any}>
              {opt.label}
            </Select.Option>
          ))}
        </Select>
      ),
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
            <Select
              placeholder="ตำแหน่ง"
              style={{ width: 200 }}
              allowClear
              value={selectedPositionId}
              onChange={(value) => setSelectedPositionId(value)}
            >
              {positions.map((p) => (
                <Select.Option key={p.id} value={p.id}>
                  {p.name}
                </Select.Option>
              ))}
            </Select>
            <Select
              placeholder="กะเริ่มต้น"
              style={{ width: 200 }}
              allowClear
              value={selectedDefaultShift}
              onChange={(value) => setSelectedDefaultShift(value)}
            >
              {shiftTypes.map((shift) => (
                <Select.Option key={shift.code} value={shift.code}>
                  {shift.name} ({shift.code})
                </Select.Option>
              ))}
            </Select>
            <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate}>
              เพิ่มพนักงาน
            </Button>
          </Space>
        }
      >
        {subProjects.length > 0 && (
          <div style={{ marginBottom: 12 }}>
            <Space wrap size={8}>
              <Tag color="blue">โครงการย่อย</Tag>
              {subProjects.map((sp: any, idx: number) => (
                <Tag key={`${sp?.name ?? 'sub'}-${idx}`} color="geekblue">
                  {sp?.name ?? '-'} {Number.isFinite(Number(sp?.percentage)) ? `(${Number(sp?.percentage)}%)` : ''}
                </Tag>
              ))}
            </Space>
          </div>
        )}
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
            name="positionId"
            rules={[{ required: true, message: 'กรุณาเลือกตำแหน่ง' }]}
          >
            <Select
              placeholder="เลือกตำแหน่ง"
              onChange={(value) => {
                const selected = positions.find((p) => p.id === value);
                if (selected) {
                  form.setFieldsValue({ wagePerDay: selected.defaultWage });
                }
              }}
            >
              {positions.map((p) => (
                <Select.Option key={p.id} value={p.id}>
                  {p.name}
                </Select.Option>
              ))}
            </Select>
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
