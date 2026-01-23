import { useList, useCreate, useUpdate, useDelete, useList as useDepartments } from "@refinedev/core";
import { List } from "@refinedev/antd";
import { Table, Button, Modal, Form, Input, InputNumber, Space, message, Popconfirm, Tag, Switch, Select } from "antd";
import { useState } from "react";
import { PlusOutlined } from "@ant-design/icons";

interface AreaNode {
  id: string;
  name: string;
  code: string;
  sortOrder: number | null;
  isActive: boolean;
  department?: {
    id: string;
    name: string;
    code: string;
  };
  createdAt: string;
}

export const AreaListPage = () => {
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingRecord, setEditingRecord] = useState<AreaNode | null>(null);
  const [form] = Form.useForm();

  const { result, query } = useList<AreaNode>({
    resource: "area",
    pagination: {
      pageSize: 10,
    },
  });

  // 获取部门列表用于下拉选择
  const { result: departmentsResult } = useDepartments({
    resource: "department",
    pagination: { pageSize: 100 },
    sorters: [{ field: "name", order: "asc" }],
  });

  const departments = departmentsResult?.data || [];

  const { mutate: create } = useCreate();
  const { mutate: update } = useUpdate();
  const { mutate: deleteOne } = useDelete();

  const columns = [
    {
      title: "区域名称",
      dataIndex: "name",
      key: "name",
      width: 200,
    },
    {
      title: "区域编码",
      dataIndex: "code",
      key: "code",
      width: 150,
    },
    {
      title: "所属部门",
      dataIndex: ["department", "name"],
      key: "department",
      width: 150,
      render: (val: string) => val || <Tag color="default">未分配</Tag>,
    },
    {
      title: "排序",
      dataIndex: "sortOrder",
      key: "sortOrder",
      width: 100,
      render: (order: number | null) => order ?? 0,
    },
    {
      title: "状态",
      dataIndex: "isActive",
      key: "isActive",
      width: 100,
      render: (active: boolean) => (
        <Tag color={active ? "success" : "default"}>
          {active ? "启用" : "禁用"}
        </Tag>
      ),
    },
    {
      title: "创建时间",
      dataIndex: "createdAt",
      key: "createdAt",
      width: 180,
      render: (date: string) => new Date(date).toLocaleString("zh-CN"),
    },
    {
      title: "操作",
      key: "actions",
      width: 200,
      fixed: "right" as const,
      render: (_: any, record: AreaNode) => (
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
            description="确定要删除这个区域吗？"
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
    form.setFieldsValue({ isActive: true, sortOrder: 0 });
    setIsModalVisible(true);
  };

  const handleEdit = (record: AreaNode) => {
    setEditingRecord(record);
    form.setFieldsValue({
      name: record.name,
      code: record.code,
      departmentId: record.department?.id,
      sortOrder: record.sortOrder ?? 0,
      isActive: record.isActive,
    });
    setIsModalVisible(true);
  };

  const handleDelete = (id: string) => {
    deleteOne(
      {
        resource: "area",
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

      if (editingRecord) {
        update(
          {
            resource: "area",
            id: editingRecord.id,
            values: values,
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
            resource: "area",
            values: values,
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
    <div style={{ padding: "24px" }}>
      <List>
        <div style={{ marginBottom: 16, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h1 style={{ margin: 0, fontSize: 24, fontWeight: "bold" }}>地点管理</h1>
          <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate}>
            新建区域
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
          scroll={{ x: 1100 }}
        />

        <Modal
          title={editingRecord ? "编辑区域" : "新建区域"}
          open={isModalVisible}
          onOk={handleSubmit}
          onCancel={() => setIsModalVisible(false)}
          okText="确定"
          cancelText="取消"
          width={500}
        >
          <Form form={form} layout="vertical">
            <Form.Item name="name" label="区域名称" rules={[{ required: true, message: "请输入区域名称" }]}>
              <Input placeholder="请输入区域名称" />
            </Form.Item>
            <Form.Item name="code" label="区域编码" rules={[{ required: true, message: "请输入区域编码" }]}>
              <Input placeholder="请输入区域编码" />
            </Form.Item>
            <Form.Item name="departmentId" label="所属部门">
              <Select
                placeholder="请选择所属部门"
                allowClear
                showSearch
                optionFilterProp="label"
                options={departments.map((dept: any) => ({
                  label: dept.name,
                  value: dept.id,
                }))}
              />
            </Form.Item>
            <Form.Item name="sortOrder" label="排序" initialValue={0}>
              <InputNumber min={0} style={{ width: "100%" }} placeholder="排序值，越小越靠前" />
            </Form.Item>
            <Form.Item name="isActive" label="状态" valuePropName="checked" initialValue={true}>
              <Switch checkedChildren="启用" unCheckedChildren="禁用" />
            </Form.Item>
          </Form>
        </Modal>
      </List>
    </div>
  );
};
