import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, fn } from "storybook/test";
import { Table, TableColumn } from "@/components/molecules/table";

interface Row {
  id: string;
  name: string;
  role: string;
}

const rows: Row[] = [
  { id: "1", name: "Priya Sharma", role: "Fresher" },
  { id: "2", name: "Rahul Verma", role: "Domain Expert" },
];

const columns: TableColumn<Row>[] = [
  { key: "name", header: "Name", render: (row) => row.name },
  { key: "role", header: "Role", render: (row) => row.role },
];

const meta = {
  component: Table,
  tags: ["ai-generated"],
  args: {
    columns,
    rows,
    rowKey: (row: Row) => row.id,
  },
} satisfies Meta<typeof Table<Row>>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  play: async ({ canvas }) => {
    await expect(canvas.getByText("Priya Sharma")).toBeVisible();
  },
};

export const Empty: Story = {
  args: { rows: [] },
  play: async ({ canvas }) => {
    await expect(canvas.getByText(/nothing here yet/i)).toBeVisible();
  },
};

export const SelectableRowClickFiresOnToggleRow: Story = {
  args: {
    selectable: true,
    selectedKeys: new Set<string>(),
    onToggleRow: fn(),
    onToggleAll: fn(),
  },
  play: async ({ canvas, userEvent, args }) => {
    const rowCheckboxes = canvas.getAllByRole("checkbox", {
      name: /select row/i,
    });
    await userEvent.click(rowCheckboxes[0]);
    await expect(args.onToggleRow).toHaveBeenCalledWith("1");
  },
};
