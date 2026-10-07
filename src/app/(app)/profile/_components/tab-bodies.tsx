"use client";

import { Briefcase, Building2, Globe, Link as LinkIcon, Mail, MapPin, Phone, User, Users } from "lucide-react";
import { Banner, UploadZone } from "@/components/molecules";
import { FormField } from "@/components/molecules";
import { Input } from "@/components/atoms";
import { DOMAINS, FUNDING_STATUS, INSTITUTE_TYPES, STARTUP_STAGES } from "@/lib/profile/options";
import { ROLE_LABEL, type ContactItem, type CareerItem, type DayOff, type EducationItem, type FileKind, type ProfileDoc, type ProfileLists, type ProjectItem, type SectionId, type Service } from "@/lib/profile/types";
import { ChipGroup, Grid2, GroupLabel, ListEditor, SelectField, SkillsField, TextAreaField, TextField } from "./fields";
import { EngagementChooser, ServicesTab } from "./services-tab";

export interface TabContext {
  doc: ProfileDoc;
  setField: (key: string, value: string) => void;
  setList: <K extends keyof ProfileLists>(key: K, rows: ProfileLists[K]) => void;
  setServices: (next: Service[]) => void;
  setDaysOff: (next: DayOff[]) => void;
  upload: (kind: FileKind, file: File) => void;
  uploading: FileKind | null;
  uploadError: { kind: FileKind; message: string } | null;
}

const IMAGE_ACCEPT = "image/png,image/jpeg";

const blankCareer: CareerItem = { title: "", org: "", period: "", desc: "" };
const blankEducation: EducationItem = { institution: "", degree: "", period: "" };
const blankProject: ProjectItem = { title: "", desc: "", link: "" };
const blankContact: ContactItem = { name: "", role: "", email: "", phone: "" };

export function TabBody({ section, ctx }: { section: SectionId; ctx: TabContext }) {
  const { doc, setField, setList } = ctx;
  const f = (k: string) => doc.fields[k] ?? "";
  const toggle = (name: "domains" | "skills", v: string) => setList(name, doc.lists[name].includes(v) ? doc.lists[name].filter((x) => x !== v) : [...doc.lists[name], v]);

  const zone = (kind: FileKind, label: string, hint: string, accept: string) => (
    <UploadZone
      label={label}
      hint={hint}
      accept={accept}
      fileName={doc.files[kind]?.name}
      uploading={ctx.uploading === kind}
      disabled={ctx.uploading !== null}
      error={ctx.uploadError?.kind === kind ? ctx.uploadError.message : undefined}
      onSelect={(file) => ctx.upload(kind, file)}
    />
  );

  switch (section) {
    case "basic":
      return (
        <div className="space-y-5">
          <TextField id="f-fullName" label={doc.role === "startup" || doc.role === "institute" ? "Account holder name" : "Full name"} icon={User} value={f("fullName")} onChange={(v) => setField("fullName", v)} maxLength={100} hint="Shown on your public profile." />
          {doc.role !== "startup" && <TextField id="f-location" label="Location" icon={MapPin} value={f("location")} onChange={(v) => setField("location", v)} maxLength={120} placeholder="City, Country" hint="Shown on directory cards. Optional." />}
          {zone("photo", doc.role === "startup" || doc.role === "institute" ? "Logo" : "Profile photo", "Square, JPG or PNG, up to 5 MB", IMAGE_ACCEPT)}
          <FormField label="Stakeholder type" htmlFor="f-role" hint="Chosen at sign-up. It’s part of your identity on GCODE.">
            <Input id="f-role" value={ROLE_LABEL[doc.role]} disabled readOnly />
          </FormField>
          <Banner tone="info">
            Your <b>email and phone are private</b>: they’re never shown on your profile. Account settings arrive in a later sprint.
          </Banner>
        </div>
      );

    case "expertise":
      return (
        <div className="space-y-5">
          <EngagementChooser value={f("engagement")} onChange={(v) => setField("engagement", v)} />
          <ChipGroup id="grp-domains" label="Primary domains" hint="Select all that apply." options={DOMAINS} selected={doc.lists.domains} onToggle={(v) => toggle("domains", v)} />
          <TextField id="f-currentTitle" label="Current title" icon={Briefcase} value={f("currentTitle")} onChange={(v) => setField("currentTitle", v)} placeholder="e.g. Head of Strategy" maxLength={120} />
          <SkillsField skills={doc.lists.skills} onChange={(s) => setList("skills", s)} />
        </div>
      );

    case "journey":
      return (
        <div className="space-y-6">
          <div className="space-y-2">
            <GroupLabel>Career journey</GroupLabel>
            <ListEditor
              name="career"
              entryTitle="Role"
              rows={doc.lists.career}
              blank={blankCareer}
              addLabel="Add role"
              onChange={(r) => setList("career", r)}
              fields={[
                { key: "title", label: "Job title", placeholder: "e.g. Senior Consultant", max: 120 },
                { key: "org", label: "Company", placeholder: "e.g. Acme Corp", max: 120 },
                { key: "period", label: "Period", placeholder: "e.g. 2019 – Present", wide: true, max: 60 },
                { key: "desc", label: "What you did", placeholder: "Key responsibilities and outcomes", area: true, wide: true, max: 500 },
              ]}
            />
          </div>
          <div className="space-y-2">
            <GroupLabel>Education journey</GroupLabel>
            <ListEditor
              name="education"
              entryTitle="Education"
              rows={doc.lists.education}
              blank={blankEducation}
              addLabel="Add education"
              onChange={(r) => setList("education", r)}
              fields={[
                { key: "institution", label: "Institution", placeholder: "e.g. IIT Bombay", max: 150 },
                { key: "degree", label: "Degree / course", placeholder: "e.g. B.Tech, Computer Science", max: 120 },
                { key: "period", label: "Period", placeholder: "e.g. 2015 – 2019", wide: true, max: 60 },
              ]}
            />
          </div>
        </div>
      );

    case "about":
      return (
        <div className="space-y-5">
          <TextAreaField id="f-bio" label="Bio" rows={5} max={600} value={f("bio")} onChange={(v) => setField("bio", v)} placeholder="Tell people about your background and what you care about." />
          <TextAreaField id="f-pitch" label="Elevator pitch" rows={3} max={300} value={f("pitch")} onChange={(v) => setField("pitch", v)} placeholder="A 30-second summary of who you are and what you offer." hint="Shown at the top of your public profile." />
        </div>
      );

    case "services":
      return (
        <ServicesTab
          engagement={f("engagement")}
          services={doc.services}
          daysOff={doc.daysOff}
          payoutSet={doc.payoutSet}
          onEngagement={(v) => setField("engagement", v)}
          onServices={ctx.setServices}
          onDaysOff={ctx.setDaysOff}
        />
      );

    case "profile":
      return (
        <div className="space-y-5">
          <TextField id="f-currentTitle" label="Current title" icon={Briefcase} value={f("currentTitle")} onChange={(v) => setField("currentTitle", v)} placeholder="e.g. Final-year B.Tech student" maxLength={120} />
          <SkillsField skills={doc.lists.skills} onChange={(s) => setList("skills", s)} />
          <TextAreaField id="f-bio" label="Bio" rows={5} max={600} value={f("bio")} onChange={(v) => setField("bio", v)} placeholder="Tell people about yourself." />
          <TextAreaField id="f-pitch" label="Elevator pitch" rows={3} max={300} value={f("pitch")} onChange={(v) => setField("pitch", v)} placeholder="A 30-second summary of who you are and what you’re looking for." />
        </div>
      );

    case "projects":
      return (
        <ListEditor
          name="projects"
          entryTitle="Project"
          rows={doc.lists.projects}
          blank={blankProject}
          addLabel="Add project"
          onChange={(r) => setList("projects", r)}
          fields={[
            { key: "title", label: "Project title", placeholder: "e.g. Student portfolio site", wide: true, max: 120 },
            { key: "desc", label: "Description", placeholder: "What it does and what you built", area: true, wide: true, max: 500 },
            { key: "link", label: "Link to the project", placeholder: "https://", type: "url", wide: true, max: 300 },
          ]}
        />
      );

    case "pitch":
      return <TextAreaField id="f-pitch" label="Elevator pitch" rows={4} max={300} value={f("pitch")} onChange={(v) => setField("pitch", v)} placeholder="What you’re building, for whom, and why it matters." hint="Keep it to a few sentences." />;

    case "company":
      return (
        <div className="space-y-5">
          <Grid2>
            <SelectField id="f-stage" label="Startup stage" options={STARTUP_STAGES} value={f("stage")} onChange={(v) => setField("stage", v)} />
            <SelectField id="f-funding" label="Funding status" options={FUNDING_STATUS} value={f("funding")} onChange={(v) => setField("funding", v)} />
          </Grid2>
          <Grid2>
            <TextField id="f-teamSize" label="Team size" icon={Users} type="number" placeholder="e.g. 8" value={f("teamSize")} maxLength={6} onChange={(v) => setField("teamSize", v.replace(/[^\d]/g, ""))} />
            <SelectField id="f-industry" label="Industry" options={DOMAINS} value={f("industry")} onChange={(v) => setField("industry", v)} />
          </Grid2>
          <TextField id="f-location" label="Location" icon={MapPin} placeholder="City, Country" value={f("location")} maxLength={120} onChange={(v) => setField("location", v)} />
          <Grid2>
            <TextField id="f-linkedin" label="LinkedIn page" icon={LinkIcon} type="url" placeholder="https://linkedin.com/company/…" value={f("linkedin")} maxLength={300} onChange={(v) => setField("linkedin", v)} />
            <TextField id="f-domain" label="Public domain" icon={Globe} type="url" placeholder="https://yourstartup.com" value={f("domain")} maxLength={300} onChange={(v) => setField("domain", v)} />
          </Grid2>
          {zone("deck", "Pitch deck (PDF)", "PDF, up to 10 MB", "application/pdf")}
        </div>
      );

    case "team":
      return (
        <ListEditor
          name="contacts"
          entryTitle="Contact"
          rows={doc.lists.contacts}
          blank={blankContact}
          addLabel="Add team member"
          max={10}
          onChange={(r) => setList("contacts", r)}
          fields={[
            { key: "name", label: "Name", placeholder: "Full name", max: 100 },
            { key: "role", label: "Role", placeholder: "e.g. Co-founder & CEO", max: 100 },
            { key: "email", label: "Email", placeholder: "name@company.com", type: "email", max: 254 },
            { key: "phone", label: "Phone", placeholder: "+91 …", type: "tel", max: 20 },
          ]}
        />
      );

    case "info":
      return (
        <div className="space-y-5">
          <Grid2>
            <TextField id="f-instName" label="Institute name" icon={Building2} placeholder="e.g. GCODE Institute of Technology" value={f("instName")} maxLength={150} onChange={(v) => setField("instName", v)} />
            <SelectField id="f-instType" label="Type of institute" options={INSTITUTE_TYPES} value={f("instType")} onChange={(v) => setField("instType", v)} />
          </Grid2>
          <TextField id="f-website" label="Official website" icon={Globe} type="url" placeholder="https://" value={f("website")} maxLength={300} onChange={(v) => setField("website", v)} />
          <TextAreaField id="f-about" label="About the institute" rows={5} max={800} value={f("about")} onChange={(v) => setField("about", v)} placeholder="Programs, campus, and what makes you unique." />
          <Grid2>
            {zone("banner", "Banner", "Recommended 1200 × 300, JPG or PNG", IMAGE_ACCEPT)}
            {zone("logo", "Logo", "Square, JPG or PNG", IMAGE_ACCEPT)}
          </Grid2>
        </div>
      );

    case "contact":
      return (
        <div className="space-y-5">
          <TextField id="f-cName" label="Contact name" icon={User} placeholder="Full name" value={f("cName")} maxLength={100} onChange={(v) => setField("cName", v)} />
          <Grid2>
            <TextField id="f-cEmail" label="Contact email" icon={Mail} type="email" placeholder="name@institute.edu" value={f("cEmail")} maxLength={254} onChange={(v) => setField("cEmail", v)} />
            <TextField id="f-cPhone" label="Contact phone" icon={Phone} type="tel" placeholder="+91 …" value={f("cPhone")} maxLength={20} onChange={(v) => setField("cPhone", v)} />
          </Grid2>
        </div>
      );
  }
}

