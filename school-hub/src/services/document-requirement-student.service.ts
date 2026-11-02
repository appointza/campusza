import apiClient, { ActionRes } from "./api.service";

export interface DocumentRequirementStudentPayload {
  id?: string;
  organizationid?: string;
  documentrequirementid: string;
  studentid: string;
  status: "pending" | "issued" | "collected" | "not_required";
  notes?: string;
  isactive?: boolean;
  createdby?: string;
  updatedby?: string;
}

class DocumentRequirementStudentService {
  private static instance: DocumentRequirementStudentService;
  private endpoint = "/campusza/documentrequirementstudent";

  static getInstance(): DocumentRequirementStudentService {
    if (!DocumentRequirementStudentService.instance) {
      DocumentRequirementStudentService.instance = new DocumentRequirementStudentService();
    }
    return DocumentRequirementStudentService.instance;
  }

  async select(request: {
    organizationid?: string;
    documentrequirementid?: string;
    studentid?: string;
  }): Promise<DocumentRequirementStudentPayload[]> {
    const response = await apiClient.post<ActionRes<DocumentRequirementStudentPayload[]>>(
      `${this.endpoint}/Select`,
      { item: request }
    );
    return response.data.item || [];
  }

  async save(item: DocumentRequirementStudentPayload): Promise<DocumentRequirementStudentPayload> {
    const response = await apiClient.post<ActionRes<DocumentRequirementStudentPayload>>(
      `${this.endpoint}/Save`,
      { item }
    );
    return response.data.item || item;
  }
}

export const documentRequirementStudentService = DocumentRequirementStudentService.getInstance();
