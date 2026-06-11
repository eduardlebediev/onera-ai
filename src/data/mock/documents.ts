export type DocumentStatus = "ready" | "processing" | "failed" | "uploaded"
export type DocumentFileType = "pdf" | "docx" | "pptx" | "txt"

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
  fileType: DocumentFileType
  fileSizeMb: number
  description: string
  uploadedAt: string
  /** Full document text when available from backend extraction. */
  extractedText?: string
  /** @deprecated use topics.length instead */
  topicsCount: number
  topics: string[]
  chunks: DocumentChunk[]
  linkedTests: LinkedTest[]
  versions: DocumentVersion[]
}

export const mockDocuments: MockDocumentDetail[] = [
  {
    id: "doc-1",
    title: "Security Guidelines",
    status: "ready",
    fileType: "pdf",
    fileSizeMb: 1.8,
    description:
      "Company-wide security standards covering password policy, data classification, access control, and phishing awareness for all employees.",
    uploadedAt: "2024-05-10",
    topicsCount: 4,
    topics: [
      "Password Policy",
      "Data Classification",
      "Access Control",
      "Phishing & Social Engineering",
    ],
    chunks: [
      {
        id: "doc-1-c1",
        topic: "Password Policy",
        chunkIndex: 0,
        content:
          "All employee accounts must use passwords of at least 12 characters including uppercase, lowercase, numbers, and symbols. Multi-factor authentication (MFA) is required for all systems handling company data.",
      },
      {
        id: "doc-1-c2",
        topic: "Data Classification",
        chunkIndex: 1,
        content:
          "Company data is classified as Public, Internal, Confidential, or Restricted. Customer personally identifiable information (PII) must always be treated as Confidential and stored only in approved systems.",
      },
      {
        id: "doc-1-c3",
        topic: "Access Control",
        chunkIndex: 2,
        content:
          "Access to systems and data follows the principle of least privilege. Employees receive only the permissions necessary for their role. Access requests must be approved by the employee's manager and reviewed quarterly.",
      },
      {
        id: "doc-1-c4",
        topic: "Phishing & Social Engineering",
        chunkIndex: 3,
        content:
          "Employees must report suspicious emails to the security team immediately using the Report Phishing button in their email client. Never click links or download attachments from unknown senders. Security will never ask for your password via email.",
      },
    ],
    linkedTests: [
      {
        id: "test-1",
        title: "Security Guidelines Knowledge Test",
        questionCount: 5,
        status: "published",
      },
      {
        id: "test-3",
        title: "Security Essentials (Draft)",
        questionCount: 3,
        status: "draft",
      },
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
    fileType: "pdf",
    fileSizeMb: 3.2,
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
        id: "test-2",
        title: "Safety & Compliance Assessment",
        questionCount: 4,
        status: "published",
      },
    ],
    versions: [{ id: "v1", version: 1, uploadedAt: "2024-06-03", status: "ready" }],
  },
  {
    id: "doc-3",
    title: "Product Architecture & Engineering Standards",
    status: "processing",
    fileType: "docx",
    fileSizeMb: 0.9,
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
    fileType: "docx",
    fileSizeMb: 2.1,
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
      { id: "test-4", title: "Support Protocols Test", questionCount: 4, status: "published" },
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
    fileType: "pdf",
    fileSizeMb: 4.7,
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
