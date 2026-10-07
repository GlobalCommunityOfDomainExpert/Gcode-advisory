import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { DirCard, DirCardSkeleton, type DirCardProps } from "@/components/domain/dir-card";
import { Cell, CellGrid } from "../../_cell";

const meta = {
  component: DirCard,
  tags: ["ai-generated"],
  args: { name: "Ashish Khanna", headline: "Director", badge: { text: "Paid sessions" }, location: "Bengaluru, India", tags: [], pitch: "", footer: { kind: "fact", label: "Industry", value: "Consulting" } },
} satisfies Meta<typeof DirCard>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Every state, laid out like the wireframe components page. */
const photo = (g: string, n: number) => `https://randomuser.me/api/portraits/${g}/${n}.jpg`;

const expert: DirCardProps = {
  name: "Ashish Khanna",
  headline: "Director, Digital Transformation · Nimbus",
  photoSrc: photo("men", 32),
  certified: true,
  badge: { text: "Paid sessions" },
  rating: 4.8,
  reviewCount: 32,
  location: "Bengaluru, India",
  meta: "Senior",
  tags: ["Consulting", "Business Transformation", "Information Technology (IT)"],
  moreTags: 2,
  pitch: "I help startups and MSMEs modernise operations and plan technology roadmaps that teams can actually execute.",
  cue: { text: "Next: Mon, 28 Sep · 10:00 AM", tone: "success", dot: true },
  footer: { kind: "price", label: "From", value: "₹1,200", suffix: " / session" },
  primaryAction: "book",
};

const notBookable: DirCardProps = {
  name: "Arup Mohanty",
  headline: "VP Engineering · Cloudline",
  photoSrc: photo("men", 52),
  badge: { text: "Paid sessions" },
  rating: 4.6,
  reviewCount: 11,
  location: "Hyderabad, India",
  meta: "Senior",
  tags: ["Information Technology (IT)", "Engineering", "Hiring"],
  pitch: "Engineering leadership, hiring and scaling teams from 5 to 50.",
  cue: { text: "Hasn’t set up availability yet", tone: "muted" },
  footer: { kind: "status", text: "Not bookable yet", tone: "warning" },
};

const startup: DirCardProps = {
  name: "PaySprint",
  headline: "Instant invoicing for small businesses",
  badge: { text: "Hiring", dot: true },
  location: "Bengaluru, India",
  meta: "Early revenue · 12 people",
  tags: ["Early revenue", "Seed"],
  pitch: "We help small businesses get paid faster with instant invoicing and automated reconciliation — cutting payment delays from 45 days to 9.",
  cue: { text: "2 open roles", tone: "success", dot: true },
  footer: { kind: "fact", label: "Industry", value: "Finance" },
  primaryAction: "connect",
};

const intern: DirCardProps = {
  name: "Ananya Rao",
  headline: "Final-year B.Tech · Computer Science",
  photoSrc: photo("women", 12),
  badge: { text: "Open to internships" },
  location: "Bengaluru, India",
  meta: "Fresher",
  tags: ["Python", "SQL", "Figma"],
  moreTags: 1,
  pitch: "I turn ideas into working prototypes — and learn in public.",
  footer: { kind: "fact", label: "Field", value: "Final-year B.Tech" },
  primaryAction: "connect",
};

const institution: DirCardProps = {
  name: "GCODE Institute of Technology",
  headline: "University",
  badge: { text: "University" },
  location: "Bengaluru, India",
  meta: "6,000 students",
  tags: ["Engineering", "Design", "Management"],
  pitch: "Where industry and campus meet.",
  footer: { kind: "fact", label: "Type", value: "Education" },
  primaryAction: "connect",
};

export const States: Story = {
  render: () => (
    <CellGrid>
      <Cell label="Expert · bookable" fill><DirCard {...expert} /></Cell>
      <Cell label="Expert · bookmarked" kind="selected" fill><DirCard {...expert} saved /></Cell>
      <Cell label="Expert · not bookable" kind="disabled" fill><DirCard {...notBookable} /></Cell>
      <Cell label="Startup · hiring" kind="variant" fill><DirCard {...startup} /></Cell>
      <Cell label="Fresher / intern" kind="variant" fill><DirCard {...intern} /></Cell>
      <Cell label="Institution" kind="variant" fill><DirCard {...institution} /></Cell>
      <Cell label="Loading skeleton" kind="empty" fill><DirCardSkeleton /></Cell>
    </CellGrid>
  ),
};
