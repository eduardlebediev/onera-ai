import "server-only"

import { createAdminClient } from "@/lib/supabase/admin"

export type EmployeeProgressStatus = "completed" | "pending" | "overdue"
export type EmployeeMemberStatus = "invited" | "active" | "disabled"

export type EmployeeListItem = {
  id: string
  userId: string
  name: string
  email: string
  department: string
  memberStatus: EmployeeMemberStatus
  progress: number
  status: EmployeeProgressStatus
  averageScore: number | null
  lastActiveAt: string | null
  totalAssignments: number
  completedAssignments: number
  pendingAssignments: number
  overdueAssignments: number
}

export type EmployeeKpiMetrics = {
  totalEmployees: number
  averageScore: number | null
  pendingCount: number
  overdueCount: number
}

export type AssignableEmployeeTest = {
  id: string
  title: string
}

export type EmployeeManagementData = {
  employees: EmployeeListItem[]
  metrics: EmployeeKpiMetrics
  departments: string[]
  tests: AssignableEmployeeTest[]
}

type MemberRow = {
  id: string
  user_id: string | null
  invited_email: string | null
  status: string
  department: string | null
  job_title: string | null
  created_at: string
  updated_at: string
}

type ProfileRow = {
  id: string
  email: string | null
  full_name: string | null
}

type AssignmentRow = {
  id: string
  user_id: string
  status: string
  deadline: string | null
  created_at: string
  updated_at: string
}

type AttemptRow = {
  user_id: string
  status: string
  score: number | null
  started_at: string | null
  completed_at: string | null
}

type TestRow = {
  id: string
  title: string
  status: string
  is_active: boolean
  source_validity: string
}

type CreatedAssignmentRow = {
  id: string
  user_id: string
}

export class EmployeeActionError extends Error {
  constructor(
    public status: number,
    message: string
  ) {
    super(message)
    this.name = "EmployeeActionError"
  }
}

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase()
}

function normalizeDepartment(department: string | null | undefined): string {
  const value = department?.trim()
  return value ? value : "Unassigned"
}

function normalizeMemberStatus(status: string): EmployeeMemberStatus {
  if (status === "invited" || status === "active" || status === "disabled") {
    return status
  }

  return "invited"
}

function isAssignmentCompleted(assignment: AssignmentRow): boolean {
  return assignment.status === "completed"
}

function isAssignmentPending(assignment: AssignmentRow): boolean {
  return assignment.status === "not_started" || assignment.status === "in_progress"
}

function isAssignmentOverdue(assignment: AssignmentRow, now: Date): boolean {
  if (!assignment.deadline || !isAssignmentPending(assignment)) return false
  return new Date(assignment.deadline).getTime() < now.getTime()
}

function latestIsoDate(dates: Array<string | null | undefined>): string | null {
  let latest: string | null = null
  let latestTime = 0

  for (const date of dates) {
    if (!date) continue

    const time = new Date(date).getTime()
    if (Number.isNaN(time)) continue

    if (time > latestTime) {
      latest = date
      latestTime = time
    }
  }

  return latest
}

function average(values: number[]): number | null {
  if (values.length === 0) return null
  return Math.round(values.reduce((total, value) => total + value, 0) / values.length)
}

function getEmployeeStatus(input: {
  totalAssignments: number
  completedAssignments: number
  overdueAssignments: number
}): EmployeeProgressStatus {
  if (input.overdueAssignments > 0) return "overdue"
  if (input.totalAssignments > 0 && input.completedAssignments === input.totalAssignments) {
    return "completed"
  }

  return "pending"
}

function buildEmployeeListItem({
  member,
  profile,
  assignments,
  attempts,
  now,
}: {
  member: MemberRow
  profile: ProfileRow | undefined
  assignments: AssignmentRow[]
  attempts: AttemptRow[]
  now: Date
}): EmployeeListItem | null {
  if (!member.user_id) return null

  const completedAssignments = assignments.filter(isAssignmentCompleted).length
  const overdueAssignments = assignments.filter((assignment) =>
    isAssignmentOverdue(assignment, now)
  ).length
  const pendingAssignments = assignments.filter(isAssignmentPending).length
  const totalAssignments = assignments.length
  const completedScores = attempts
    .filter((attempt) => attempt.status === "completed" && typeof attempt.score === "number")
    .map((attempt) => attempt.score as number)
  const progress =
    totalAssignments > 0 ? Math.round((completedAssignments / totalAssignments) * 100) : 0
  const status = getEmployeeStatus({
    totalAssignments,
    completedAssignments,
    overdueAssignments,
  })

  return {
    id: member.user_id,
    userId: member.user_id,
    name: profile?.full_name ?? profile?.email ?? member.invited_email ?? "Invited employee",
    email: profile?.email ?? member.invited_email ?? "No email",
    department: normalizeDepartment(member.department),
    memberStatus: normalizeMemberStatus(member.status),
    progress,
    status,
    averageScore: average(completedScores),
    lastActiveAt: latestIsoDate([
      ...attempts.flatMap((attempt) => [attempt.completed_at, attempt.started_at]),
      ...assignments.flatMap((assignment) => [assignment.updated_at, assignment.created_at]),
      member.updated_at,
      member.created_at,
    ]),
    totalAssignments,
    completedAssignments,
    pendingAssignments,
    overdueAssignments,
  }
}

async function getEmployeeMembers(organizationId: string): Promise<MemberRow[]> {
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from("organization_members")
    .select("id, user_id, invited_email, status, department, job_title, created_at, updated_at")
    .eq("organization_id", organizationId)
    .eq("role", "employee")
    .in("status", ["active", "invited"])
    .not("user_id", "is", null)
    .order("created_at", { ascending: true })

  if (error) {
    throw new Error(`Failed to fetch employee members: ${error.message}`)
  }

  return (data ?? []) as MemberRow[]
}

async function getProfilesById(userIds: string[]): Promise<Map<string, ProfileRow>> {
  if (userIds.length === 0) return new Map()

  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from("profiles")
    .select("id, email, full_name")
    .in("id", userIds)

  if (error) {
    throw new Error(`Failed to fetch employee profiles: ${error.message}`)
  }

  return new Map(((data ?? []) as ProfileRow[]).map((profile) => [profile.id, profile]))
}

async function getAssignmentsByUserId(
  organizationId: string,
  userIds: string[]
): Promise<Map<string, AssignmentRow[]>> {
  const assignmentsByUserId = new Map<string, AssignmentRow[]>()
  if (userIds.length === 0) return assignmentsByUserId

  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from("test_assignments")
    .select("id, user_id, status, deadline, created_at, updated_at")
    .eq("organization_id", organizationId)
    .in("user_id", userIds)

  if (error) {
    throw new Error(`Failed to fetch employee assignments: ${error.message}`)
  }

  for (const assignment of (data ?? []) as AssignmentRow[]) {
    const current = assignmentsByUserId.get(assignment.user_id) ?? []
    current.push(assignment)
    assignmentsByUserId.set(assignment.user_id, current)
  }

  return assignmentsByUserId
}

async function getAttemptsByUserId(
  organizationId: string,
  userIds: string[]
): Promise<Map<string, AttemptRow[]>> {
  const attemptsByUserId = new Map<string, AttemptRow[]>()
  if (userIds.length === 0) return attemptsByUserId

  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from("test_attempts")
    .select("user_id, status, score, started_at, completed_at")
    .eq("organization_id", organizationId)
    .in("user_id", userIds)

  if (error) {
    throw new Error(`Failed to fetch employee attempts: ${error.message}`)
  }

  for (const attempt of (data ?? []) as AttemptRow[]) {
    const current = attemptsByUserId.get(attempt.user_id) ?? []
    current.push(attempt)
    attemptsByUserId.set(attempt.user_id, current)
  }

  return attemptsByUserId
}

export async function getAssignableEmployeeTests(
  organizationId: string
): Promise<AssignableEmployeeTest[]> {
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from("tests")
    .select("id, title, status, is_active, source_validity")
    .eq("organization_id", organizationId)
    .eq("status", "published")
    .eq("is_active", true)
    .in("source_validity", ["valid", "outdated"])
    .order("created_at", { ascending: false })

  if (error) {
    throw new Error(`Failed to fetch assignable tests: ${error.message}`)
  }

  return ((data ?? []) as TestRow[]).map((test) => ({
    id: test.id,
    title: test.title,
  }))
}

export async function getEmployeeManagementData(
  organizationId: string
): Promise<EmployeeManagementData> {
  const now = new Date()
  const members = await getEmployeeMembers(organizationId)
  const userIds = members.map((member) => member.user_id).filter((id): id is string => Boolean(id))
  const [profilesById, assignmentsByUserId, attemptsByUserId, tests] = await Promise.all([
    getProfilesById(userIds),
    getAssignmentsByUserId(organizationId, userIds),
    getAttemptsByUserId(organizationId, userIds),
    getAssignableEmployeeTests(organizationId),
  ])

  const employees = members
    .map((member) =>
      buildEmployeeListItem({
        member,
        profile: member.user_id ? profilesById.get(member.user_id) : undefined,
        assignments: member.user_id ? (assignmentsByUserId.get(member.user_id) ?? []) : [],
        attempts: member.user_id ? (attemptsByUserId.get(member.user_id) ?? []) : [],
        now,
      })
    )
    .filter((employee): employee is EmployeeListItem => employee !== null)

  const departments = Array.from(new Set(employees.map((employee) => employee.department))).sort()
  const scoredEmployees = employees
    .map((employee) => employee.averageScore)
    .filter((score): score is number => typeof score === "number")

  return {
    employees,
    departments,
    tests,
    metrics: {
      totalEmployees: employees.length,
      averageScore: average(scoredEmployees),
      pendingCount: employees.filter((employee) => employee.status === "pending").length,
      overdueCount: employees.filter((employee) => employee.status === "overdue").length,
    },
  }
}

async function assertEmailAvailable(organizationId: string, email: string): Promise<void> {
  const supabase = createAdminClient()
  const [{ data: profile, error: profileError }, { data: invitedMember, error: invitedError }] =
    await Promise.all([
      supabase.from("profiles").select("id").ilike("email", email).maybeSingle(),
      supabase
        .from("organization_members")
        .select("id")
        .eq("organization_id", organizationId)
        .ilike("invited_email", email)
        .maybeSingle(),
    ])

  if (profileError) {
    throw new Error(`Failed to check existing profile: ${profileError.message}`)
  }

  if (invitedError) {
    throw new Error(`Failed to check existing invite: ${invitedError.message}`)
  }

  if (profile || invitedMember) {
    throw new EmployeeActionError(409, "User already exists")
  }
}

export async function inviteEmployee({
  organizationId,
  invitedBy,
  fullName,
  email,
  department,
}: {
  organizationId: string
  invitedBy: string
  fullName: string
  email: string
  department: string
}): Promise<EmployeeListItem> {
  const supabase = createAdminClient()
  const normalizedEmail = normalizeEmail(email)

  await assertEmailAvailable(organizationId, normalizedEmail)

  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email: normalizedEmail,
    email_confirm: false,
    user_metadata: {
      full_name: fullName.trim(),
    },
  })

  if (authError || !authData.user) {
    const message = authError?.message ?? "Failed to create invited user"
    if (/already|registered|exists/i.test(message)) {
      throw new EmployeeActionError(409, "User already exists")
    }

    throw new Error(message)
  }

  const userId = authData.user.id

  try {
    const { error: profileError } = await supabase.from("profiles").upsert(
      {
        id: userId,
        email: normalizedEmail,
        full_name: fullName.trim(),
      },
      { onConflict: "id" }
    )

    if (profileError) {
      throw new Error(`Failed to create profile: ${profileError.message}`)
    }

    const { data: member, error: memberError } = await supabase
      .from("organization_members")
      .insert({
        organization_id: organizationId,
        user_id: userId,
        invited_email: normalizedEmail,
        role: "employee",
        status: "invited",
        department: normalizeDepartment(department),
        invited_by: invitedBy,
        invited_at: new Date().toISOString(),
      })
      .select("id, user_id, invited_email, status, department, job_title, created_at, updated_at")
      .single()

    if (memberError) {
      if (memberError.code === "23505") {
        throw new EmployeeActionError(409, "User already exists")
      }

      throw new Error(`Failed to create organization membership: ${memberError.message}`)
    }

    const employee = buildEmployeeListItem({
      member: member as MemberRow,
      profile: {
        id: userId,
        email: normalizedEmail,
        full_name: fullName.trim(),
      },
      assignments: [],
      attempts: [],
      now: new Date(),
    })

    if (!employee) {
      throw new Error("Invited employee could not be loaded")
    }

    return employee
  } catch (error) {
    await supabase.auth.admin.deleteUser(userId).catch(() => undefined)
    throw error
  }
}

async function getAssignableTest(organizationId: string, testId: string): Promise<TestRow | null> {
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from("tests")
    .select("id, title, status, is_active, source_validity")
    .eq("id", testId)
    .eq("organization_id", organizationId)
    .maybeSingle()

  if (error) {
    throw new Error(`Failed to fetch test: ${error.message}`)
  }

  return data as TestRow | null
}

async function getActiveEmployeesForDepartment({
  organizationId,
  department,
}: {
  organizationId: string
  department: string | null
}): Promise<MemberRow[]> {
  const supabase = createAdminClient()
  let query = supabase
    .from("organization_members")
    .select("id, user_id, invited_email, status, department, job_title, created_at, updated_at")
    .eq("organization_id", organizationId)
    .eq("role", "employee")
    .eq("status", "active")
    .not("user_id", "is", null)

  if (department === "Unassigned") {
    query = query.is("department", null)
  } else if (department) {
    query = query.eq("department", department)
  }

  const { data, error } = await query

  if (error) {
    throw new Error(`Failed to fetch target employees: ${error.message}`)
  }

  return (data ?? []) as MemberRow[]
}

export async function bulkAssignTestToDepartment({
  organizationId,
  assignedBy,
  testId,
  department,
}: {
  organizationId: string
  assignedBy: string
  testId: string
  department: string | null
}): Promise<{
  testId: string
  testTitle: string
  targetCount: number
  createdCount: number
  skippedCount: number
}> {
  const test = await getAssignableTest(organizationId, testId)

  if (!test) {
    throw new EmployeeActionError(404, "Test not found")
  }

  if (
    test.status !== "published" ||
    !test.is_active ||
    !["valid", "outdated"].includes(test.source_validity)
  ) {
    throw new EmployeeActionError(409, "Only active published tests can be assigned")
  }

  const members = await getActiveEmployeesForDepartment({ organizationId, department })
  const userIds = members.map((member) => member.user_id).filter((id): id is string => Boolean(id))

  if (userIds.length === 0) {
    throw new EmployeeActionError(422, "No employees found in department")
  }

  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from("test_assignments")
    .upsert(
      userIds.map((userId) => ({
        organization_id: organizationId,
        test_id: test.id,
        user_id: userId,
        assigned_by: assignedBy,
        status: "not_started",
      })),
      { onConflict: "test_id,user_id", ignoreDuplicates: true }
    )
    .select("id, user_id")

  if (error) {
    throw new Error(`Failed to create bulk assignments: ${error.message}`)
  }

  const created = (data ?? []) as CreatedAssignmentRow[]

  return {
    testId: test.id,
    testTitle: test.title,
    targetCount: userIds.length,
    createdCount: created.length,
    skippedCount: userIds.length - created.length,
  }
}

async function getEmployeeStatuses(
  organizationId: string,
  employeeUserIds: string[]
): Promise<Map<string, EmployeeProgressStatus>> {
  const members = await getEmployeeMembers(organizationId)
  const requestedUserIds = new Set(employeeUserIds)
  const validMembers = members.filter(
    (member) => member.user_id && requestedUserIds.has(member.user_id)
  )

  if (validMembers.length !== requestedUserIds.size) {
    throw new EmployeeActionError(404, "Employee not found")
  }

  const userIds = validMembers
    .map((member) => member.user_id)
    .filter((userId): userId is string => Boolean(userId))
  const assignmentsByUserId = await getAssignmentsByUserId(organizationId, userIds)
  const now = new Date()

  return new Map(
    userIds.map((userId) => {
      const assignments = assignmentsByUserId.get(userId) ?? []
      const status = getEmployeeStatus({
        totalAssignments: assignments.length,
        completedAssignments: assignments.filter(isAssignmentCompleted).length,
        overdueAssignments: assignments.filter((assignment) => isAssignmentOverdue(assignment, now))
          .length,
      })

      return [userId, status]
    })
  )
}

export async function logEmployeeNudges({
  organizationId,
  nudgedBy,
  employeeUserIds,
  reason,
  channel = "email",
}: {
  organizationId: string
  nudgedBy: string
  employeeUserIds: string[]
  reason: string
  channel?: "demo" | "email" | "slack"
}): Promise<{ nudgedCount: number }> {
  const uniqueUserIds = Array.from(new Set(employeeUserIds))

  if (uniqueUserIds.length === 0) {
    throw new EmployeeActionError(400, "Select at least one employee")
  }

  const statuses = await getEmployeeStatuses(organizationId, uniqueUserIds)

  if (uniqueUserIds.some((userId) => statuses.get(userId) === "completed")) {
    throw new EmployeeActionError(409, "Employee already completed")
  }

  const supabase = createAdminClient()
  const { error } = await supabase.from("employee_nudge_events").insert(
    uniqueUserIds.map((userId) => ({
      organization_id: organizationId,
      employee_user_id: userId,
      nudged_by: nudgedBy,
      channel,
      reason,
    }))
  )

  if (error) {
    throw new Error(`Failed to log nudge events: ${error.message}`)
  }

  return { nudgedCount: uniqueUserIds.length }
}
