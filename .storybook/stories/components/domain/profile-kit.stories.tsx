import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { ProfileSection } from "@/components/domain/profile-kit";
import { Cell, CellGrid } from "../../_cell";
import {
  AvailabilityPill,
  ExperienceList,
  FactGrid,
  OpenToPill,
  ProfileStats,
  ProjectCard,
  ReviewCards,
  ServiceRows,
  SkillChips,
} from "@/components/domain/profile-kit";

const meta = {
  component: ProfileSection,
  tags: ["ai-generated"],
  args: { title: "About", hasContent: true, owner: true },
} satisfies Meta<typeof ProfileSection>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Every state, laid out like the wireframe components page. */
export const States: Story = {
  render: () => (
    <CellGrid>
      <Cell label="Section card · owner (edit)" fill tint>
        <ProfileSection title="About" hasContent owner sub="Public" onEdit={() => {}}>
          <p className="text-body text-text-secondary">Ten years in product strategy.</p>
        </ProfileSection>
      </Cell>
      <Cell label="Section card · empty (owner)" kind="empty" fill tint>
        <ProfileSection title="Projects" hasContent={false} owner prompt="Add a project so people can see your work." onAdd={() => {}} />
      </Cell>
      <Cell label="Section card · empty (visitor)" kind="empty" fill tint>
        <ProfileSection title="Projects" hasContent={false} owner={false} />
        <p className="text-small text-text-secondary italic">Renders nothing for visitors.</p>
      </Cell>
      <Cell label="Fact grid" fill>
        <FactGrid rows={[["Industry", "Fintech"], ["Stage", "Seed"], ["Team", "12 people"], ["Founded", "2023"]]} />
      </Cell>
      <Cell label="Skill chips" fill><SkillChips items={["Pricing", "Figma", "SQL", "Roadmapping"]} /></Cell>
      <Cell label="Availability / open-to pills" kind="variant">
        <AvailabilityPill>Next: Tue 10:00</AvailabilityPill>
        <OpenToPill>Open to internships</OpenToPill>
      </Cell>
      <Cell label="Stat strip" fill><ProfileStats cells={[["4.8", "Rating"], ["24", "Sessions"], ["₹1,200", "From"]]} /></Cell>
      <Cell label="Experience list" fill>
        <ExperienceList
          items={[
            { title: "Head of Product", sub: "Brightpath", period: "2022 – now", desc: "Led pricing and onboarding." },
            { title: "Product Manager", sub: "PaySprint", period: "2019 – 2022" },
          ]}
        />
      </Cell>
      <Cell label="Service rows" w2 fill>
        <ServiceRows
          items={[
            { name: "Strategy session", desc: "Roadmap and pricing review.", duration: "45 min", price: "₹1,200", when: "Weekdays", next: "Next: Tue 10:00" },
          ]}
        />
      </Cell>
      <Cell label="Project card" fill><ProjectCard title="GreenLoop pilot" desc="Circular packaging MVP." link="greenloop.in/pilot" /></Cell>
      <Cell label="Review cards" wide fill>
        <ReviewCards
          reviews={[
            { name: "Nisha Menon", role: "Co-founder · PaySprint", text: "Cut through weeks of debate in one session. We left with a prioritised plan and an owner for every item.", avatarSrc: "https://randomuser.me/api/portraits/women/17.jpg" },
            { name: "Karan Bhatia", role: "Founder · GreenLoop", text: "Sharp, kind and very practical. The written next-steps note alone was worth the fee.", avatarSrc: "https://randomuser.me/api/portraits/men/41.jpg" },
          ]}
        />
      </Cell>
    </CellGrid>
  ),
};
