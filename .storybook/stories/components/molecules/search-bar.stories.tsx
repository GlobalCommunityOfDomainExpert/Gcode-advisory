import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, fn } from "storybook/test";
import { SearchBar } from "@/components/molecules/search-bar";

const meta = {
  component: SearchBar,
  tags: ["ai-generated"],
  args: {
    value: "",
    onChange: fn(),
    placeholder: "Search attendees…",
  },
} satisfies Meta<typeof SearchBar>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Empty: Story = {};

export const Loading: Story = { args: { value: "priya", loading: true } };

export const WithValueShowsClearButton: Story = {
  args: { value: "priya" },
  play: async ({ canvas }) => {
    await expect(
      canvas.getByRole("button", { name: /clear search/i }),
    ).toBeVisible();
  },
};

// SearchBar is a fully controlled input — wrap with local state so typing is
// observable, instead of a story-specific harness for business logic.
export const TypingCallsOnChange: Story = {
  render: (args) => {
    function Controlled() {
      const [value, setValue] = useState(args.value);
      return <SearchBar {...args} value={value} onChange={setValue} />;
    }
    return <Controlled />;
  },
  play: async ({ canvas, userEvent }) => {
    const input = canvas.getByPlaceholderText(/search attendees/i);
    await userEvent.type(input, "priya");
    await expect(input).toHaveValue("priya");
  },
};
