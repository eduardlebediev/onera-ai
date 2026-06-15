import "server-only"

import { listSelectableDocumentsForOrganization } from "@/features/documents/lib/selectable-documents"

export async function getNewTestRoute(organizationId: string): Promise<string> {
  const documents = await listSelectableDocumentsForOrganization(organizationId)
  const firstDocument = documents[0]

  if (firstDocument) {
    return `/admin/documents/${firstDocument.id}/generate-test`
  }

  return "/admin/documents"
}
