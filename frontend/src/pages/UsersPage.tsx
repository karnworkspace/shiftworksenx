import { useState } from 'react';
import {
    Card,
    Table,
    Button,
    Space,
    Modal,
    Form,
    Input,
    Select,
    Tag,
    message,
    Popconfirm,
    Typography,
    Checkbox,
    Row,
    Col,
} from 'antd';
import {
    PlusOutlined,
    EditOutlined,
    DeleteOutlined,
    KeyOutlined,
    UserOutlined,
} from '@ant-design/icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { userService, User, CreateUserData, UpdateUserData } from '../services/user.service';
import { projectService, Project } from '../services/project.service';

const { Title, Text } = Typography;

const roleOptions = [
    { value: 'SUPER_ADMIN', label: 'Super Admin', color: 'red' },
    { value: 'AREA_MANAGER', label: 'Area Manager', color: 'blue' },
    { value: 'SITE_MANAGER', label: 'Site Manager', color: 'green' },
];

const MENU_PERMISSIONS = [
    { key: 'reports', label: 'รายงาน' },
    { key: 'roster', label: 'ตารางเวลาทำงาน' },
    { key: 'staff', label: 'พนักงาน' },
    { key: 'projects', label: 'โครงการ' },
    { key: 'users', label: 'จัดการผู้ใช้' },
    { key: 'settings', label: 'ตั้งค่า' },
];

const getRoleColor = (role: string) => {
    const found = roleOptions.find((r) => r.value === role);
    return found?.color || 'default';
};

const getRoleLabel = (role: string) => {
    const found = roleOptions.find((r) => r.value === role);
    return found?.label || role;
};

const getPermissionLabel = (key: string) => {
    const found = MENU_PERMISSIONS.find((m) => m.key === key);
    return found?.label || key;
};

export default function UsersPage() {
    const queryClient = useQueryClient();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
    const [editingUser, setEditingUser] = useState<User | null>(null);
    const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
    const [form] = Form.useForm();
    const [passwordForm] = Form.useForm();
    const selectedRole = Form.useWatch('role', form);
    const selectedProjectIds = Form.useWatch('projectIds', form) || [];

    // Fetch projects for access assignment
    const { data: projects = [], isLoading: isProjectsLoading } = useQuery({
        queryKey: ['projects'],
        queryFn: projectService.getAll,
    });

    // Fetch users
    const { data: users = [], isLoading } = useQuery({
        queryKey: ['users'],
        queryFn: userService.getAll,
    });

    // Create user mutation
    const createMutation = useMutation({
        mutationFn: (data: CreateUserData) => userService.create(data),
        onSuccess: () => {
            message.success('สร้างผู้ใช้สำเร็จ');
            queryClient.invalidateQueries({ queryKey: ['users'] });
            handleCloseModal();
        },
        onError: (error: any) => {
            message.error(error.response?.data?.error || 'สร้างผู้ใช้ไม่สำเร็จ');
        },
    });

    // Update user mutation
    const updateMutation = useMutation({
        mutationFn: ({ id, data }: { id: string; data: UpdateUserData }) =>
            userService.update(id, data),
        onSuccess: () => {
            message.success('แก้ไขผู้ใช้สำเร็จ');
            queryClient.invalidateQueries({ queryKey: ['users'] });
            handleCloseModal();
        },
        onError: (error: any) => {
            message.error(error.response?.data?.error || 'แก้ไขผู้ใช้ไม่สำเร็จ');
        },
    });

    // Delete user mutation
    const deleteMutation = useMutation({
        mutationFn: (id: string) => userService.delete(id),
        onSuccess: () => {
            message.success('ลบผู้ใช้สำเร็จ');
            queryClient.invalidateQueries({ queryKey: ['users'] });
        },
        onError: (error: any) => {
            message.error(error.response?.data?.error || 'ลบผู้ใช้ไม่สำเร็จ');
        },
    });

    // Change password mutation
    const changePasswordMutation = useMutation({
        mutationFn: ({ id, newPassword }: { id: string; newPassword: string }) =>
            userService.changePassword(id, { newPassword }),
        onSuccess: () => {
            message.success('เปลี่ยนรหัสผ่านสำเร็จ');
            handleClosePasswordModal();
        },
        onError: (error: any) => {
            message.error(error.response?.data?.error || 'เปลี่ยนรหัสผ่านไม่สำเร็จ');
        },
    });

    const handleOpenModal = (user?: User) => {
        if (user) {
            setEditingUser(user);
            form.setFieldsValue({
                email: user.email,
                name: user.name,
                role: user.role,
                permissions: user.permissions || [],
                projectIds: user.projectAccesses?.map((pa) => pa.projectId) || [],
            });
        } else {
            setEditingUser(null);
            form.resetFields();
            form.setFieldsValue({
                permissions: ['reports', 'roster', 'staff', 'projects'],
                projectIds: [],
            });
        }
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingUser(null);
        form.resetFields();
    };

    const handleOpenPasswordModal = (userId: string) => {
        setSelectedUserId(userId);
        setIsPasswordModalOpen(true);
    };

    const handleClosePasswordModal = () => {
        setIsPasswordModalOpen(false);
        setSelectedUserId(null);
        passwordForm.resetFields();
    };

    const handleSubmit = async (values: any) => {
        if (editingUser) {
            updateMutation.mutate({
                id: editingUser.id,
                data: {
                    email: values.email,
                    name: values.name,
                    role: values.role,
                    permissions: values.permissions,
                    projectIds: values.projectIds,
                },
            });
        } else {
            createMutation.mutate({
                email: values.email,
                password: values.password,
                name: values.name,
                role: values.role,
                permissions: values.permissions,
                projectIds: values.projectIds,
            });
        }
    };

    const handleChangePassword = async (values: any) => {
        if (selectedUserId) {
            changePasswordMutation.mutate({
                id: selectedUserId,
                newPassword: values.newPassword,
            });
        }
    };

    const allProjectIds = projects.map((project) => project.id);
    const isAllSelected =
        allProjectIds.length > 0 && selectedProjectIds.length === allProjectIds.length;
    const isIndeterminate =
        selectedProjectIds.length > 0 && selectedProjectIds.length < allProjectIds.length;

    const columns = [
        {
            title: 'ชื่อ',
            dataIndex: 'name',
            key: 'name',
            render: (name: string) => (
                <Space>
                    <UserOutlined />
                    {name}
                </Space>
            ),
        },
        {
            title: 'อีเมล',
            dataIndex: 'email',
            key: 'email',
        },
        {
            title: 'บทบาท',
            dataIndex: 'role',
            key: 'role',
            render: (role: string) => (
                <Tag color={getRoleColor(role)}>{getRoleLabel(role)}</Tag>
            ),
        },
        {
            title: 'เมนูที่เข้าถึงได้',
            dataIndex: 'permissions',
            key: 'permissions',
            render: (permissions: string[]) =>
                permissions?.length > 0 ? (
                    <Space wrap>
                        {permissions.map((perm) => (
                            <Tag key={perm} color="blue">{getPermissionLabel(perm)}</Tag>
                        ))}
                    </Space>
                ) : (
                    <span style={{ color: '#999' }}>-</span>
                ),
        },
        {
            title: 'โครงการที่เข้าถึงได้',
            dataIndex: 'projectAccesses',
            key: 'projectAccesses',
            render: (_: any, record: User) => {
                if (record.role === 'SUPER_ADMIN') {
                    return <Tag color="gold">ทั้งหมด</Tag>;
                }
                const accesses = record.projectAccesses || [];
                if (accesses.length === 0) {
                    return <span style={{ color: '#999' }}>-</span>;
                }
                return (
                    <Space wrap>
                        {accesses.map((access) => (
                            <Tag key={access.projectId} color="green">
                                {access.project?.name || access.projectId}
                            </Tag>
                        ))}
                    </Space>
                );
            },
        },
        {
            title: 'วันที่สร้าง',
            dataIndex: 'createdAt',
            key: 'createdAt',
            render: (date: string) => new Date(date).toLocaleDateString('th-TH'),
        },
        {
            title: 'จัดการ',
            key: 'actions',
            render: (_: any, record: User) => (
                <Space>
                    <Button
                        type="text"
                        icon={<EditOutlined />}
                        onClick={() => handleOpenModal(record)}
                    />
                    <Button
                        type="text"
                        icon={<KeyOutlined />}
                        onClick={() => handleOpenPasswordModal(record.id)}
                    />
                    <Popconfirm
                        title="ยืนยันการลบ"
                        description="คุณแน่ใจที่จะลบผู้ใช้นี้หรือไม่?"
                        onConfirm={() => deleteMutation.mutate(record.id)}
                        okText="ลบ"
                        cancelText="ยกเลิก"
                    >
                        <Button type="text" danger icon={<DeleteOutlined />} />
                    </Popconfirm>
                </Space>
            ),
        },
    ];

    return (
        <div style={{ padding: 24 }}>
            <Card>
                <div
                    style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginBottom: 16,
                    }}
                >
                    <Title level={4} style={{ margin: 0 }}>
                        จัดการผู้ใช้
                    </Title>
                    <Button
                        type="primary"
                        icon={<PlusOutlined />}
                        onClick={() => handleOpenModal()}
                    >
                        เพิ่มผู้ใช้
                    </Button>
                </div>

                <Table
                    dataSource={users}
                    columns={columns}
                    rowKey="id"
                    loading={isLoading}
                    pagination={{ pageSize: 10 }}
                />
            </Card>

            {/* Create/Edit User Modal */}
            <Modal
                title={editingUser ? 'แก้ไขผู้ใช้' : 'เพิ่มผู้ใช้ใหม่'}
                open={isModalOpen}
                onCancel={handleCloseModal}
                footer={null}
                width={600}
            >
                <Form form={form} layout="vertical" onFinish={handleSubmit}>
                    <Form.Item
                        name="name"
                        label="ชื่อ"
                        rules={[{ required: true, message: 'กรุณาระบุชื่อ' }]}
                    >
                        <Input placeholder="ชื่อผู้ใช้" />
                    </Form.Item>

                    <Form.Item
                        name="email"
                        label="อีเมล"
                        rules={[
                            { required: true, message: 'กรุณาระบุอีเมล' },
                            { type: 'email', message: 'รูปแบบอีเมลไม่ถูกต้อง' },
                        ]}
                    >
                        <Input placeholder="email@example.com" />
                    </Form.Item>

                    {!editingUser && (
                        <Form.Item
                            name="password"
                            label="รหัสผ่าน"
                            rules={[
                                { required: true, message: 'กรุณาระบุรหัสผ่าน' },
                                { min: 6, message: 'รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร' },
                            ]}
                        >
                            <Input.Password placeholder="รหัสผ่าน" />
                        </Form.Item>
                    )}

                    <Form.Item
                        name="role"
                        label="บทบาท"
                        rules={[{ required: true, message: 'กรุณาเลือกบทบาท' }]}
                    >
                        <Select
                            placeholder="เลือกบทบาท"
                            onChange={(value) => {
                                if (value === 'SUPER_ADMIN') {
                                    form.setFieldsValue({ projectIds: [] });
                                }
                            }}
                        >
                            {roleOptions.map((option) => (
                                <Select.Option key={option.value} value={option.value}>
                                    {option.label}
                                </Select.Option>
                            ))}
                        </Select>
                    </Form.Item>

                    <Form.Item
                        name="permissions"
                        label="เมนูที่สามารถเข้าถึงได้"
                        rules={[{ required: true, message: 'กรุณาเลือกอย่างน้อย 1 เมนู' }]}
                    >
                        <Checkbox.Group style={{ width: '100%' }}>
                            <Row gutter={[16, 8]}>
                                {MENU_PERMISSIONS.map((menu) => (
                                    <Col span={8} key={menu.key}>
                                        <Checkbox value={menu.key}>{menu.label}</Checkbox>
                                    </Col>
                                ))}
                            </Row>
                        </Checkbox.Group>
                    </Form.Item>

                    <Form.Item label="โครงการที่เข้าถึงได้" required>
                        <div style={{ marginBottom: 8, display: 'flex', alignItems: 'center', gap: 12 }}>
                            <Checkbox
                                checked={isAllSelected}
                                disabled={selectedRole === 'SUPER_ADMIN' || isProjectsLoading || projects.length === 0}
                                onChange={(e) =>
                                    form.setFieldsValue({
                                        projectIds: e.target.checked ? allProjectIds : [],
                                    })
                                }
                            >
                                เลือกทั้งหมด
                            </Checkbox>
                            {selectedProjectIds.length > 0 && !isAllSelected && (
                                <Text type="secondary">
                                    เลือกแล้ว {selectedProjectIds.length}/{allProjectIds.length}
                                </Text>
                            )}
                            {selectedRole === 'SUPER_ADMIN' && (
                                <Text type="secondary">SUPER_ADMIN เห็นทุกโครงการโดยอัตโนมัติ</Text>
                            )}
                        </div>
                        <Form.Item
                            name="projectIds"
                            rules={[
                                {
                                    validator: (_, value) => {
                                        if (selectedRole === 'SUPER_ADMIN') return Promise.resolve();
                                        if (!value || value.length === 0) {
                                            return Promise.reject(new Error('กรุณาเลือกอย่างน้อย 1 โครงการ'));
                                        }
                                        return Promise.resolve();
                                    },
                                },
                            ]}
                            noStyle
                        >
                            <Checkbox.Group
                                style={{ width: '100%' }}
                                disabled={selectedRole === 'SUPER_ADMIN' || isProjectsLoading || projects.length === 0}
                            >
                                <Row gutter={[16, 8]}>
                                    {projects.map((project: Project) => (
                                        <Col span={12} key={project.id}>
                                            <Checkbox value={project.id}>{project.name}</Checkbox>
                                        </Col>
                                    ))}
                                </Row>
                            </Checkbox.Group>
                        </Form.Item>
                        <Form.Item shouldUpdate noStyle>
                            {({ getFieldError }) => (
                                <div style={{ marginTop: 8 }}>
                                    <Form.ErrorList errors={getFieldError('projectIds')} />
                                </div>
                            )}
                        </Form.Item>
                    </Form.Item>

                    <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
                        <Space>
                            <Button onClick={handleCloseModal}>ยกเลิก</Button>
                            <Button
                                type="primary"
                                htmlType="submit"
                                loading={createMutation.isPending || updateMutation.isPending}
                            >
                                {editingUser ? 'บันทึก' : 'สร้าง'}
                            </Button>
                        </Space>
                    </Form.Item>
                </Form>
            </Modal>

            {/* Change Password Modal */}
            <Modal
                title="เปลี่ยนรหัสผ่าน"
                open={isPasswordModalOpen}
                onCancel={handleClosePasswordModal}
                footer={null}
            >
                <Form form={passwordForm} layout="vertical" onFinish={handleChangePassword}>
                    <Form.Item
                        name="newPassword"
                        label="รหัสผ่านใหม่"
                        rules={[
                            { required: true, message: 'กรุณาระบุรหัสผ่านใหม่' },
                            { min: 6, message: 'รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร' },
                        ]}
                    >
                        <Input.Password placeholder="รหัสผ่านใหม่" />
                    </Form.Item>

                    <Form.Item
                        name="confirmPassword"
                        label="ยืนยันรหัสผ่าน"
                        dependencies={['newPassword']}
                        rules={[
                            { required: true, message: 'กรุณายืนยันรหัสผ่าน' },
                            ({ getFieldValue }) => ({
                                validator(_, value) {
                                    if (!value || getFieldValue('newPassword') === value) {
                                        return Promise.resolve();
                                    }
                                    return Promise.reject(new Error('รหัสผ่านไม่ตรงกัน'));
                                },
                            }),
                        ]}
                    >
                        <Input.Password placeholder="ยืนยันรหัสผ่าน" />
                    </Form.Item>

                    <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
                        <Space>
                            <Button onClick={handleClosePasswordModal}>ยกเลิก</Button>
                            <Button
                                type="primary"
                                htmlType="submit"
                                loading={changePasswordMutation.isPending}
                            >
                                เปลี่ยนรหัสผ่าน
                            </Button>
                        </Space>
                    </Form.Item>
                </Form>
            </Modal>
        </div>
    );
}

