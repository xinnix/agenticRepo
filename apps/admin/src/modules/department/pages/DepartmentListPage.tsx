import { useList, useCreate, useUpdate, useDelete } from "@refinedev/core";
import { List } from "@refinedev/antd";
import { Table, Button, Modal, Form, Input, Space, message, Popconfirm } from "antd";
import { useState } from "react";
import { PlusOutlined } from "@ant-design/icons";

interface DepartmentNode {
  id: string;
  name: string;
  code: string;
  createdAt: string;
}

export const DepartmentListPage = () => {
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingRecord, setEditingRecord] = useState<DepartmentNode | null>(null);
  const [form] = Form.useForm();

  const { result, query } = useList<DepartmentNode>({
    resource: "department",
    pagination: {
      pageSize: 10,
    },
  });

  const { mutate: create } = useCreate();
  const { mutate: update } = useUpdate();
  const { mutate: deleteOne } = useDelete();

  const columns = [
    {
      title: "部门名称",
      dataIndex: "name",
      key: "name",
      width: 250,
    },
    {
      title: "部门编码",
      dataIndex: "code",
      key: "code",
      width: 150,
    },
    {
      title: "创建时间",
      dataIndex: "createdAt",
      key: "createdAt",
      width: 200,
      render: (date: string) => new Date(date).toLocaleString("zh-CN"),
    },
    {
      title: "操作",
      key: "actions",
      width: 150,
      fixed: "right" as const,
      render: (_: any, record: DepartmentNode) => (
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
            description="确定要删除这个部门吗？"
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
    setIsModalVisible(true);
  };

  const handleEdit = (record: DepartmentNode) => {
    setEditingRecord(record);
    form.setFieldsValue({
      name: record.name,
      code: record.code,
    });
    setIsModalVisible(true);
  };

  const handleDelete = (id: string) => {
    deleteOne(
      {
        resource: "department",
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
            resource: "department",
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
            resource: "department",
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
          <h1 style={{ margin: 0, fontSize: 24, fontWeight: "bold" }}>部门管理</h1>
          <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate}>
            新建部门
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
          scroll={{ x: 800 }}
        />

        <Modal
          title={editingRecord ? "编辑部门" : "新建部门"}
          open={isModalVisible}
          onOk={handleSubmit}
          onCancel={() => setIsModalVisible(false)}
          okText="确定"
          cancelText="取消"
          width={500}
        >
          <Form form={form} layout="vertical">
            <Form.Item name="name" label="部门名称" rules={[{ required: true, message: "请输入部门名称" }]}>
              <Input placeholder="请输入部门名称" />
            </Form.Item>
            <Form.Item name="code" label="部门编码" rules={[{ required: true, message: "请输入部门编码" }]}>
              <Input placeholder="请输入部门编码" />
            </Form.Item>
          </Form>
        </Modal>
      </List>
    </div>
  );
};
