// apps/admin/src/modules/role/components/RoleForm.tsx
import { Form, Input, InputNumber, Row, Col } from "antd";

interface RoleFormProps {
  form: any;
  isEdit?: boolean;
  isSystemRole?: boolean;
}

export const RoleForm = ({ form, isEdit = false, isSystemRole = false }: RoleFormProps) => {
  return (
    <Form form={form} layout="vertical">
      <Row gutter={16}>
        <Col span={12}>
          <Form.Item
            name="name"
            label="角色名称"
            rules={[
              { required: true, message: "请输入角色名称" },
            ]}
          >
            <Input placeholder="请输入角色名称" />
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item
            name="slug"
            label="角色标识"
            rules={[
              { required: true, message: "请输入角色标识" },
            ]}
          >
            <Input
              placeholder="请输入角色标识（如：editor）"
              disabled={isSystemRole}
            />
          </Form.Item>
        </Col>
      </Row>

      <Form.Item
        name="description"
        label="描述"
      >
        <Input.TextArea placeholder="请输入角色描述" rows={3} />
      </Form.Item>

      <Form.Item
        name="level"
        label="层级"
        rules={[
          { required: true, message: "请输入层级" },
          { type: "number", min: 0, max: 1000, message: "层级必须在 0-1000 之间" },
        ]}
        initialValue={100}
      >
        <InputNumber
          placeholder="请输入层级"
          style={{ width: "100%" }}
          min={0}
          max={1000}
        />
      </Form.Item>
    </Form>
  );
};
