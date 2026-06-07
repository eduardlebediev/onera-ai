export type DocumentStatus = "ready" | "processing" | "failed" | "uploaded"

export interface DocumentChunk {
  id: string
  content: string
  topic: string
  chunkIndex: number
}

export interface LinkedTest {
  id: string
  title: string
  questionCount: number
  status: "draft" | "published"
}

export interface DocumentVersion {
  id: string
  version: number
  uploadedAt: string
  status: DocumentStatus
}

export interface MockDocumentDetail {
  id: string
  title: string
  status: DocumentStatus
  description: string
  uploadedAt: string
  topicsCount: number
  topics: string[]
  chunks: DocumentChunk[]
  linkedTests: LinkedTest[]
  versions: DocumentVersion[]
}

export const mockDocuments: MockDocumentDetail[] = [
  {
    id: "doc-1",
    title: "Onboarding Process & HR Policies 2024",
    status: "ready",
    description:
      "Comprehensive guide covering the full employee onboarding lifecycle, HR policies, code of conduct, and benefits overview for all new hires.",
    uploadedAt: "2024-05-10",
    topicsCount: 6,
    topics: [
      "Onboarding Steps",
      "Code of Conduct",
      "Benefits & Compensation",
      "Leave Policies",
      "Performance Reviews",
      "Company Values",
    ],
    chunks: [
      {
        id: "doc-1-c1",
        topic: "Onboarding Steps",
        chunkIndex: 0,
        content:
          "The onboarding process begins on Day 1 with an orientation session covering company history, mission, and team introductions. New employees receive access to all relevant tools within the first 48 hours.",
      },
      {
        id: "doc-1-c2",
        topic: "Code of Conduct",
        chunkIndex: 1,
        content:
          "All employees are expected to act with integrity, respect, and professionalism. Violations of the code of conduct are subject to disciplinary action up to and including termination.",
      },
      {
        id: "doc-1-c3",
        topic: "Benefits & Compensation",
        chunkIndex: 2,
        content:
          "Employees are eligible for health, dental, and vision insurance from the first day of employment. Annual salary reviews occur every December based on performance ratings.",
      },
      {
        id: "doc-1-c4",
        topic: "Leave Policies",
        chunkIndex: 3,
        content:
          "Full-time employees receive 25 days of paid vacation per year, plus public holidays. Sick leave is separate and not capped. Parental leave includes 16 weeks fully paid for primary caregivers.",
      },
    ],
    linkedTests: [
      { id: "test-1", title: "HR Policies Quiz", questionCount: 15, status: "published" },
      { id: "test-2", title: "Onboarding Essentials", questionCount: 10, status: "published" },
    ],
    versions: [
      { id: "v2", version: 2, uploadedAt: "2024-05-10", status: "ready" },
      { id: "v1", version: 1, uploadedAt: "2024-05-01", status: "ready" },
    ],
  },
  {
    id: "doc-2",
    title: "Safety & Compliance Training Manual",
    status: "ready",
    description:
      "Mandatory safety training document for all operational staff. Covers workplace hazards, emergency procedures, fire safety protocols, and regulatory compliance requirements.",
    uploadedAt: "2024-06-03",
    topicsCount: 5,
    topics: [
      "Workplace Hazards",
      "Emergency Procedures",
      "Fire Safety",
      "Regulatory Compliance",
      "Incident Reporting",
    ],
    chunks: [
      {
        id: "doc-2-c1",
        topic: "Workplace Hazards",
        chunkIndex: 0,
        content:
          "Operational staff must complete a hazard identification walkthrough during their first week. All potential hazards must be reported to the safety officer immediately.",
      },
      {
        id: "doc-2-c2",
        topic: "Emergency Procedures",
        chunkIndex: 1,
        content:
          "In the event of an emergency, employees must follow the posted evacuation routes. Assembly points are located in the main parking lot (Building A) and the east garden (Building B).",
      },
      {
        id: "doc-2-c3",
        topic: "Incident Reporting",
        chunkIndex: 2,
        content:
          "Any workplace incident, regardless of severity, must be documented within 24 hours using the Incident Report form available in the HR portal. Failure to report may result in disciplinary action.",
      },
    ],
    linkedTests: [
      {
        id: "test-3",
        title: "Safety Compliance Assessment",
        questionCount: 20,
        status: "published",
      },
    ],
    versions: [{ id: "v1", version: 1, uploadedAt: "2024-06-03", status: "ready" }],
  },
  {
    id: "doc-3",
    title: "Product Architecture & Engineering Standards",
    status: "processing",
    description:
      "Internal engineering reference covering the product architecture, system boundaries, coding standards, and deployment conventions used across the engineering team.",
    uploadedAt: "2024-06-15",
    topicsCount: 4,
    topics: ["System Architecture", "Coding Standards", "Deployment Conventions", "API Design"],
    chunks: [],
    linkedTests: [],
    versions: [{ id: "v1", version: 1, uploadedAt: "2024-06-15", status: "processing" }],
  },
  {
    id: "doc-4",
    title: "Customer Support Playbook",
    status: "ready",
    description:
      "Playbook for the customer support team covering escalation paths, communication templates, SLA definitions, and common resolution patterns for tier-1 and tier-2 issues.",
    uploadedAt: "2024-04-20",
    topicsCount: 5,
    topics: [
      "Escalation Paths",
      "SLA Definitions",
      "Communication Templates",
      "Tier-1 Issues",
      "Tier-2 Issues",
    ],
    chunks: [
      {
        id: "doc-4-c1",
        topic: "SLA Definitions",
        chunkIndex: 0,
        content:
          "Tier-1 issues must receive an initial response within 2 business hours. Tier-2 issues have a 24-hour response SLA. Critical production outages are classified as P0 and require immediate acknowledgment.",
      },
      {
        id: "doc-4-c2",
        topic: "Escalation Paths",
        chunkIndex: 1,
        content:
          "If a ticket remains unresolved after 48 hours, it must be escalated to the senior support lead. P0 issues bypass standard escalation and go directly to the on-call engineering lead.",
      },
      {
        id: "doc-4-c3",
        topic: "Communication Templates",
        chunkIndex: 2,
        content:
          "All customer communications must use approved templates from the support library. Custom responses are permitted but must be reviewed by a team lead before being sent for accounts above the Enterprise tier.",
      },
    ],
    linkedTests: [
      { id: "test-4", title: "Support Protocols Quiz", questionCount: 12, status: "published" },
      { id: "test-5", title: "SLA & Escalation Test", questionCount: 8, status: "draft" },
    ],
    versions: [
      { id: "v3", version: 3, uploadedAt: "2024-04-20", status: "ready" },
      { id: "v2", version: 2, uploadedAt: "2024-04-10", status: "ready" },
      { id: "v1", version: 1, uploadedAt: "2024-03-15", status: "ready" },
    ],
  },
  {
    id: "doc-5",
    title: "Data Privacy & GDPR Guidelines",
    status: "failed",
    description:
      "Guidelines on data handling, GDPR compliance requirements, user consent management, and breach notification procedures for all staff handling personal data.",
    uploadedAt: "2024-06-18",
    topicsCount: 0,
    topics: [],
    chunks: [],
    linkedTests: [],
    versions: [{ id: "v1", version: 1, uploadedAt: "2024-06-18", status: "failed" }],
  },
]
