// apps/admin/src/modules/role/pages/RoleListPage.tsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useList, useCreate, useUpdate, useDelete } from "@refinedev/core";
import { List, DeleteButton } from "@refinedev/antd";
import {
  Table,
  Button,
  Modal,
  Form,
  Input,
  InputNumber,
  Space,
  message,
  Tag,
  Card,
  Row,
  Col,
} from "antd";
import { PlusOutlined, SearchOutlined, TeamOutlined, KeyOutlined, SettingOutlined } from "@ant-design/icons";
import { RoleForm } from "../components/RoleForm";

interface Role {
  id: string;
  name: string;
  slug: string;
  description?: string;
  level: number;
  isSystem: boolean;
  createdAt: Date;
  _count: {
    users: number;
    permissions: number;
  };
}

export const RoleListPage = () => {
  const navigate = useNavigate();
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingRecord, setEditingRecord] = useState<Role | null>(null);
  const [searchText, setSearchText] = useState("");
  const [form] = Form.useForm();

  const { mutate: create } = useCreate();
  const { mutate: update } = useUpdate();
  const { result, query } = useList<Role>({
    resource: "role",
    pagination: {
      pageSize: 10,
    },
    filters: searchText
      ? [{ field: "search", operator: "contains", value: searchText } as any]
      : [],
  });

  const handleCreate = () => {
    setEditingRecord(null);
    form.resetFields();
    setIsModalVisible(true);
  };

  const handleEdit = (record: Role) => {
    setEditingRecord(record);
    form.setFieldsValue(record);
    setIsModalVisible(true);
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();

      if (editingRecord) {
        update(
          {
            resource: "role",
            id: editingRecord.id,
            values: {
              ...values,
              // Prevent modifying slug for system roles
              slug: editingRecord.isSystem ? editingRecord.slug : values.slug,
            },
          },
          {
            onSuccess: () => {
              message.success("更新成功");
              setIsModalVisible(false);
              query.refetch();
            },
            onError: (error: any) => {
              message.error("更新失败");
            },
          }
        );
      } else {
        create(
          {
            resource: "role",
            values: values,
          },
          {
            onSuccess: () => {
              message.success("创建成功");
              setIsModalVisible(false);
              query.refetch();
            },
            onError: (error: any) => {
              message.error("创建失败");
            },
          }
        );
      }
    } catch (error) {
      console.error("Form validation error:", error);
    }
  };

  const columns = [
    {
      title: "ID",
      dataIndex: "id",
      width: 80,
      render: (id: string) => <span style={{ fontSize: 12, color: "#999" }}>{id.slice(0, 8)}...</span>,
    },
    {
      title: "角色名称",
      dataIndex: "name",
      width: 130,
      render: (name: string, record: Role) => (
        <Space>
          <span>{name}</span>
          {record.isSystem && <Tag color="blue">系统</Tag>}
        </Space>
      ),
    },
    {
      title: "标识",
      dataIndex: "slug",
      width: 120,
      render: (slug: string) => <Tag color="default">{slug}</Tag>,
    },
    {
      title: "描述",
      dataIndex: "description",
      width: 180,
      render: (desc: string) => desc || "-",
    },
    {
      title: "层级",
      dataIndex: "level",
      width: 80,
      render: (level: number) => (
        <Tag color={level < 50 ? "red" : level < 100 ? "orange" : "default"}>
          {level}
        </Tag>
      ),
    },
    {
      title: "用户数",
      dataIndex: "_count",
      width: 90,
      render: (count: Role["_count"]) => (
        <Tag icon={<TeamOutlined />} color="blue">
          {count.users}
        </Tag>
      ),
    },
    {
      title: "权限数",
      dataIndex: "_count",
      width: 90,
      render: (count: Role["_count"]) => (
        <Tag icon={<KeyOutlined />} color="green">
          {count.permissions}
        </Tag>
      ),
    },
    {
      title: "操作",
      width: 180,
      render: (_: any, record: Role) => (
        <Space size="small">
          <Button size="small" type="link" onClick={() => handleEdit(record)}>
            编辑
          </Button>
          <Button
            size="small"
            type="link"
            onClick={() => navigate(`/roles/${record.id}`)}
            icon={<KeyOutlined />}
          >
            权限
          </Button>
          <DeleteButton
            hideText
            recordItemId={record.id}
            resource="role"
            disabled={record.isSystem}
            onSuccess={() => {
              message.success("删除成功");
              query.refetch();
            }}
          />
        </Space>
      ),
    },
  ];

  return (
    <div style={{ maxWidth: 1200, margin: "0 auto", padding: "24px" }}>
      <List>
        <Card>
          <Row justify="space-between" align="middle" style={{ marginBottom: 16 }}>
            <Col>
              <h1 style={{ margin: 0, fontSize: 24, fontWeight: "bold" }}>角色管理</h1>
            </Col>
            <Col>
              <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate}>
                新建角色
              </Button>
            </Col>
          </Row>

          {/* Search */}
          <Input
            placeholder="搜索角色名称或标识"
            prefix={<SearchOutlined />}
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            style={{ width: 300, marginBottom: 16 }}
            allowClear
          />

          <Table
            columns={columns}
            rowKey="id"
            dataSource={result?.data || []}
            loading={query.isLoading}
            pagination={{
              current: result?.page || 1,
              pageSize: result?.pageSize || 10,
              total: result?.total || 0,
              showSizeChanger: true,
              showTotal: (total) => `共 ${total} 条`,
            }}
          />

          <Modal
            title={editingRecord ? "编辑角色" : "新建角色"}
            open={isModalVisible}
            onOk={handleSubmit}
            onCancel={() => setIsModalVisible(false)}
            okText="确定"
            cancelText="取消"
            width={600}
          >
            <RoleForm form={form} isEdit={!!editingRecord} isSystemRole={editingRecord?.isSystem} />
          </Modal>
        </Card>
      </List>
    </div>
  );
};
