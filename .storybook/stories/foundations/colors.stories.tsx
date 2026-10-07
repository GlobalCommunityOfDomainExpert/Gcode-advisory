import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Cell, CellGrid } from "../_cell";

const meta = {
  title: "Foundations/Colors",
  tags: ["ai-generated"],
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

function Swatch({ cls, name, hex, use }: { cls: string; name: string; hex: string; use?: string }) {
  return (
    <div className="flex min-w-0 items-center gap-3">
      <span className={`${cls} border-border-hover size-11 shrink-0 rounded-sm border`} />
      <span className="text-small min-w-0">
        <span className="text-text-primary block font-semibold">{name}</span>
        <span className="text-text-secondary block font-mono">{hex}</span>
        {use && <span className="text-text-secondary block">{use}</span>}
      </span>
    </div>
  );
}

/** Neutral by default. Red only for CTAs, errors and the active tab; navy for structure; one accent per screen. */
export const States: Story = {
  render: () => (
    <CellGrid>
      <Cell label="Brand" kind="variant" w2>
        <div className="grid gap-4 sm:grid-cols-2">
          <Swatch cls="bg-primary" name="primary" hex="#1b3041" use="structure, nav, buttons" />
          <Swatch cls="bg-primary-hover" name="primary-hover" hex="#234157" />
          <Swatch cls="bg-secondary" name="secondary" hex="#e60000" use="CTA, error, active tab" />
          <Swatch cls="bg-secondary-hover" name="secondary-hover" hex="#c20000" />
        </div>
      </Cell>
      <Cell label="Status" kind="variant">
        <div className="grid gap-4">
          <Swatch cls="bg-success" name="success" hex="#29a356" />
          <Swatch cls="bg-warning" name="warning" hex="#f59f0a" />
          <Swatch cls="bg-danger" name="danger" hex="#c52020" />
        </div>
      </Cell>
      <Cell label="Neutrals" kind="variant" wide>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          <Swatch cls="bg-page" name="page" hex="#f5f5f5" />
          <Swatch cls="bg-bg-light" name="bg-light" hex="#e8e8e8" />
          <Swatch cls="bg-bg-subtle" name="bg-subtle" hex="#fafaf9" />
          <Swatch cls="bg-surface-light" name="surface-light" hex="#ffffff" />
          <Swatch cls="bg-text-primary" name="text-primary" hex="#211f1c" />
          <Swatch cls="bg-text-secondary" name="text-secondary" hex="#5a6672" />
        </div>
      </Cell>
      <Cell label="Tints (8–10 %)" kind="variant" wide>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <Swatch cls="bg-primary-light" name="primary-light" hex="navy 8%" />
          <Swatch cls="bg-secondary-light" name="secondary-light" hex="red 8%" />
          <Swatch cls="bg-success-light" name="success-light" hex="green 10%" />
          <Swatch cls="bg-warning-light" name="warning-light" hex="amber 10%" />
          <Swatch cls="bg-danger-light" name="danger-light" hex="red 10%" />
          <Swatch cls="bg-border-light" name="border-light" hex="navy 8%" />
          <Swatch cls="bg-border-hover" name="border-hover" hex="navy 16%" />
        </div>
      </Cell>
    </CellGrid>
  ),
};
