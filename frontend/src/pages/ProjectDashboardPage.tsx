import React, { useState } from 'react';
import {
  Card,
  Row,
  Col,
  Input,
  Typography,
  Space,
  Badge,
  Divider,
} from 'antd';
import {
  ProjectOutlined,
  UserOutlined,
  EnvironmentOutlined,
  SearchOutlined,
  PhoneOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useProjectStore } from '../stores/projectStore';
import { useStaffStore } from '../stores/staffStore';
import { useEffect } from 'react';

const { Search } = Input;
const { Title, Text } = Typography;

const ProjectDashboardPage: React.FC = () => {
  const [searchText, setSearchText] = useState('');
  const [searchResponsible, setSearchResponsible] = useState('');
  const navigate = useNavigate();

  // Use global stores
  const { projects, fetchProjects } = useProjectStore();
  const { getActiveStaffByProject, fetchAllStaff } = useStaffStore();

  // Fetch data on mount
  useEffect(() => {
    fetchProjects();
    if (projects.length > 0) {
      fetchAllStaff(projects.map(p => p.id));
    }
  }, [projects.length]);

  // Filter projects
  const filteredProjects = projects.filter((project) => {
    const matchName = project.name
      .toLowerCase()
      .includes(searchText.toLowerCase());
    const matchLocation =
      project.location?.toLowerCase().includes(searchText.toLowerCase()) ||
      false;
    const matchResponsible =
      project.manager?.name
        ?.toLowerCase()
        .includes(searchResponsible.toLowerCase()) || false;

    return matchName || matchLocation || (searchResponsible && matchResponsible);
  });

  // Count staff per project
  const getStaffCount = (projectId: string) => {
    return getActiveStaffByProject(projectId).length;
  };

  const handleProjectClick = (projectId: string) => {
    // นำทางไปหน้าตารางเวรของโครงการนั้น
    navigate(`/roster?project=${projectId}`);
  };

  return (
    <div style={{ padding: '24px' }}>
      {/* Header */}
      <Card>
        <Title level={3}>
          <ProjectOutlined /> ระบบจัดการเวรนิติบุคคล
        </Title>
        <Text type="secondary">
          กรุณาเลือกโครงการที่ต้องการจัดการเวรของการทำงาน
        </Text>

        <Divider />

        <Row gutter={16}>
          <Col xs={24} sm={12}>
            <Search
              placeholder="ค้นหาโครงการ หรือ ที่ตั้ง..."
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              size="large"
              allowClear
              prefix={<SearchOutlined />}
            />
          </Col>
          <Col xs={24} sm={12}>
            <Search
              placeholder="ค้นหาชื่อผู้รับผิดชอบ..."
              value={searchResponsible}
              onChange={(e) => setSearchResponsible(e.target.value)}
              size="large"
              allowClear
              prefix={<UserOutlined />}
            />
          </Col>
        </Row>
      </Card>

      {/* Projects Grid */}
      <div style={{ marginTop: '24px' }}>
        <Text type="secondary">
          แสดง {filteredProjects.length} โครงการ จากทั้งหมด{' '}
          {projects.length} โครงการ
        </Text>

        <Row gutter={[16, 16]} style={{ marginTop: '16px' }}>
          {filteredProjects.map((project) => {
            const staffCount = getStaffCount(project.id);

            return (
              <Col xs={24} sm={12} md={8} key={project.id}>
                <Badge.Ribbon
                  text="แอคทีฟ"
                  color="green"
                  style={{ display: project.isActive ? 'block' : 'none' }}
                >
                  <Card
                    hoverable
                    onClick={() => handleProjectClick(project.id)}
                    style={{
                      borderTop: `4px solid ${project.themeColor}`,
                      height: '100%',
                    }}
                  >
                    <Space direction="vertical" style={{ width: '100%' }}>
                      {/* Icon and Name */}
                      <div style={{ textAlign: 'center' }}>
                        <div
                          style={{
                            width: '64px',
                            height: '64px',
                            borderRadius: '12px',
                            backgroundColor: project.themeColor,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            margin: '0 auto 12px',
                          }}
                        >
                          <ProjectOutlined
                            style={{ fontSize: '32px', color: '#fff' }}
                          />
                        </div>
                        <Title level={4} style={{ marginBottom: '4px' }}>
                          {project.name}
                        </Title>
                      </div>

                      <Divider style={{ margin: '12px 0' }} />

                      {/* Location */}
                      <div>
                        <EnvironmentOutlined
                          style={{ marginRight: '8px', color: '#999' }}
                        />
                        <Text type="secondary">{project.location}</Text>
                      </div>

                      {/* Responsible Person */}
                      <div>
                        <UserOutlined
                          style={{ marginRight: '8px', color: '#999' }}
                        />
                        <Text type="secondary">
                          {project.manager?.name || '-'}
                        </Text>
                      </div>

                      {/* Staff Count */}
                      <div>
                        <UserOutlined
                          style={{ marginRight: '8px', color: '#999' }}
                        />
                        <Text>
                          พนักงาน: <Text strong>{staffCount} คน</Text>
                        </Text>
                      </div>
                    </Space>
                  </Card>
                </Badge.Ribbon>
              </Col>
            );
          })}
        </Row>

        {filteredProjects.length === 0 && (
          <Card style={{ marginTop: '16px', textAlign: 'center' }}>
            <Text type="secondary">ไม่พบโครงการที่ค้นหา</Text>
          </Card>
        )}
      </div>

      {/* Contact Section */}
      <Card style={{ marginTop: '24px' }} size="small">
        <Space>
          <PhoneOutlined style={{ fontSize: '18px', color: '#1890ff' }} />
          <Text>
            <Text strong>ติดต่อเจ้าหน้าที่:</Text>{' '}
            <Text type="secondary">เพื่อติดต่อเราทาง LINE</Text>
          </Text>
        </Space>
      </Card>
    </div>
  );
};

export default ProjectDashboardPage;
