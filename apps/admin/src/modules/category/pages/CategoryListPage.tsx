import { useList, useCreate, useUpdate } from "@refinedev/core";
import { List, DeleteButton } from "@refinedev/antd";
import { Table, Button, Modal, Form, Input, Select, Space, message, Tag, Checkbox } from "antd";
import { useState } from "react";

export const CategoryListPage = () => {
  const { result, query } = useList({
    resource: "category",
    pagination: {
      pageSize: 10,
    },
  });

  const { mutate: create } = useCreate();
  const { mutate: update } = useUpdate();

  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingRecord, setEditingRecord] = useState<any>(null);
  const [form] = Form.useForm();

  const columns = [
    { title: "Name", dataIndex: "name" },
    { title: "Slug", dataIndex: "slug" },
    { title: "Description", dataIndex: "description", render: (val: string) => val || "-" },
    { title: "Parent Id", dataIndex: "parentId" },
    { title: "Icon", dataIndex: "icon" },
    { title: "Sort Order", dataIndex: "sortOrder" },
    { title: "Status", dataIndex: "status", render: (status: string) => {
      const colors: Record<string, string> = {
        ACTIVE: "orange",
        INACTIVE: "green",
      };
      return <Tag color={colors[status] || 'gray'}>{status}</Tag>;
    } },
  ];

  const handleCreate = () => {
    setEditingRecord(null);
    form.resetFields();
    setIsModalVisible(true);
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();

      // Remove id field from values (it's handled separately by dataProvider)
      const { id, ...dataValues } = values;

      // Convert string to number for numeric fields (Ant Design Input type="number" returns string)
      const numericFields = ['sortOrder'];
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
          <h1 style={{ margin: 0, fontSize: 24, fontWeight: "bold" }}>Categories</h1>
          <Button type="primary" onClick={handleCreate}>
            + 新建Category
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
        />

        <Modal
          title={editingRecord ? "编辑Category" : "新建Category"}
          open={isModalVisible}
          onOk={handleSubmit}
          onCancel={() => setIsModalVisible(false)}
          okText="确定"
          cancelText="取消"
          width={600}
        >
          <Form form={form} layout="vertical">
            <Form.Item name="name" label="Name" rules={[{ required: true, message: "请输入Name" }]}>
              <Input placeholder="请输入Name" />
            </Form.Item>
            <Form.Item name="slug" label="Slug" rules={[{ required: true, message: "请输入Slug" }]}>
              <Input placeholder="请输入Slug" />
            </Form.Item>
            <Form.Item name="description" label="Description">
              <Input.TextArea placeholder="请输入Description" rows={3} />
            </Form.Item>
            <Form.Item name="parentId" label="Parent Id">
              <Input placeholder="请输入Parent Id" />
            </Form.Item>
            <Form.Item name="icon" label="Icon">
              <Input placeholder="请输入Icon" />
            </Form.Item>
            <Form.Item name="sortOrder" label="Sort Order">
              <Input type="number" placeholder="请输入Sort Order" />
            </Form.Item>
            <Form.Item name="status" label="Status" rules={[{ required: true, message: "请输入Status" }]} initialValue="ACTIVE">
              <Select placeholder="请选择Status">
                <Select.Option value="ACTIVE">ACTIVE</Select.Option>
                <Select.Option value="INACTIVE">INACTIVE</Select.Option>
              </Select>
            </Form.Item>

          </Form>
        </Modal>
      </List>
    </div>
  );
};
