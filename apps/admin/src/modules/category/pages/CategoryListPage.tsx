import { useList, useCreate, useUpdate, useDelete } from "@refinedev/core";
import { List } from "@refinedev/antd";
import { Table, Button, Modal, Form, Input, Select, InputNumber, Space, message, Tag, Popconfirm } from "antd";
import { useState } from "react";
import { PlusOutlined } from "@ant-design/icons";

interface CategoryNode {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  parentId: string | null;
  icon: string | null;
  sortOrder: number | null;
  status: string;
  assignType: string;
  deadlineDays?: number | null;
  parent?: {
    id: string;
    name: string;
  };
  createdAt: string;
}

export const CategoryListPage = () => {
  const { result, query } = useList<CategoryNode>({
    resource: "category",
    pagination: {
      pageSize: 10,
    },
  });

  const { mutate: create } = useCreate();
  const { mutate: update } = useUpdate();
  const { mutate: deleteOne } = useDelete();

  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingRecord, setEditingRecord] = useState<any>(null);
  const [form] = Form.useForm();

  const columns = [
    { title: "名称", dataIndex: "name", width: 150 },
    { title: "别名", dataIndex: "slug", width: 150 },
    { title: "描述", dataIndex: "description", width: 200, render: (val: string) => val || "-" },
    { title: "图标", dataIndex: "icon", width: 100, render: (val: string) => val || "-" },
    { title: "排序", dataIndex: "sortOrder", width: 80, render: (val: number | null) => val ?? 0 },
    {
      title: "处理时限",
      dataIndex: "deadlineDays",
      width: 120,
      render: (days: number | null | undefined) => {
        if (days === null || days === undefined) {
          return <Tag color="default">系统默认</Tag>;
        }
        return <Tag color="blue">{days} 天</Tag>;
      }
    },
    {
      title: "状态",
      dataIndex: "status",
      width: 100,
      render: (status: string) => {
        const colors: Record<string, string> = {
          ACTIVE: "success",
          INACTIVE: "default",
        };
        const labels: Record<string, string> = {
          ACTIVE: "启用",
          INACTIVE: "禁用",
        };
        return <Tag color={colors[status] || 'default'}>{labels[status] || status}</Tag>;
      }
    },
    {
      title: "创建时间",
      dataIndex: "createdAt",
      width: 180,
      render: (date: string) => new Date(date).toLocaleString("zh-CN"),
    },
    {
      title: "操作",
      key: "actions",
      width: 150,
      fixed: "right" as const,
      render: (_: any, record: CategoryNode) => (
        <Space size="small">
          <Button
            type="link"
            size="small"
            onClick={() => handleEdit(record)}
          >
            编辑
          </Button>
          <Popconfirm
            title="确认删除"
            description="确定要删除这个分类吗？"
            onConfirm={() => handleDelete(record.id)}
            okText="确定"
            cancelText="取消"
          >
            <Button type="link" size="small" danger>
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const handleCreate = () => {
    setEditingRecord(null);
    form.resetFields();
    form.setFieldsValue({ status: "ACTIVE", sortOrder: 0 });
    setIsModalVisible(true);
  };

  const handleEdit = (record: CategoryNode) => {
    setEditingRecord(record);
    form.setFieldsValue({
      name: record.name,
      slug: record.slug,
      description: record.description,
      icon: record.icon,
      sortOrder: record.sortOrder ?? 0,
      status: record.status,
      assignType: record.assignType,
      deadlineDays: record.deadlineDays,
    });
    setIsModalVisible(true);
  };

  const handleDelete = (id: string) => {
    deleteOne(
      {
        resource: "category",
        id,
      },
      {
        onSuccess: () => {
          message.success("删除成功");
          query.refetch();
        },
        onError: () => {
          message.error("删除失败");
        },
      }
    );
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();

      // Remove id field from values (it's handled separately by dataProvider)
      const { id, ...dataValues } = values;

      // Convert string to number for numeric fields (Ant Design Input type="number" returns string)
      const numericFields = ['sortOrder', 'deadlineDays'];
      const processedValues = { ...dataValues };
      numericFields.forEach((field: string) => {
        if (processedValues[field]) {
          processedValues[field] = Number(processedValues[field]);
        }
      });

      if (editingRecord) {
        update(
          {
            resource: "category",
            id: editingRecord.id,
            values: processedValues,
          },
          {
            onSuccess: () => {
              message.success("更新成功");
              setIsModalVisible(false);
              query.refetch();
            },
            onError: () => {
              message.error("更新失败");
            },
          }
        );
      } else {
        create(
          {
            resource: "category",
            values: processedValues,
          },
          {
            onSuccess: () => {
              message.success("创建成功");
              setIsModalVisible(false);
              query.refetch();
            },
            onError: () => {
              message.error("创建失败");
            },
          }
        );
      }
    } catch (error) {
      console.error("Form validation error:", error);
    }
  };

  return (
    <div style={{ maxWidth: 1200, margin: "0 auto", padding: "24px" }}>
      <List>
        <div style={{ marginBottom: 16, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h1 style={{ margin: 0, fontSize: 24, fontWeight: "bold" }}>分类管理</h1>
          <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate}>
            新建分类
          </Button>
        </div>
        <Table
          columns={columns}
          rowKey="id"
          dataSource={result?.data || []}
          loading={query.isLoading}
          pagination={{
            current: 1,
            pageSize: 10,
            total: result?.total || 0,
            showSizeChanger: true,
          }}
          scroll={{ x: 1200 }}
        />

        <Modal
          title={editingRecord ? "编辑分类" : "新建分类"}
          open={isModalVisible}
          onOk={handleSubmit}
          onCancel={() => setIsModalVisible(false)}
          okText="确定"
          cancelText="取消"
          width={600}
        >
          <Form form={form} layout="vertical">
            <Form.Item name="name" label="名称" rules={[{ required: true, message: "请输入名称" }]}>
              <Input placeholder="请输入分类名称" />
            </Form.Item>
            <Form.Item name="slug" label="别名" rules={[{ required: true, message: "请输入别名" }]}>
              <Input placeholder="请输入分类别名" />
            </Form.Item>
            <Form.Item name="description" label="描述">
              <Input.TextArea placeholder="请输入分类描述" rows={3} />
            </Form.Item>
            <Form.Item name="icon" label="图标">
              <Input placeholder="请输入图标类名" />
            </Form.Item>
            <Form.Item name="sortOrder" label="排序">
              <Input type="number" placeholder="请输入排序数字" />
            </Form.Item>
            <Form.Item name="status" label="状态" rules={[{ required: true, message: "请选择状态" }]} initialValue="ACTIVE">
              <Select placeholder="请选择状态">
                <Select.Option value="ACTIVE">启用</Select.Option>
                <Select.Option value="INACTIVE">禁用</Select.Option>
              </Select>
            </Form.Item>
            <Form.Item
              label="处理时限（天）"
              name="deadlineDays"
              extra="留空表示使用系统默认（紧急4小时/普通24小时）"
            >
              <InputNumber
                placeholder="输入天数，如：1, 3, 7"
                min={1}
                max={365}
                style={{ width: '100%' }}
              />
            </Form.Item>

          </Form>
        </Modal>
      </List>
    </div>
  );
};
