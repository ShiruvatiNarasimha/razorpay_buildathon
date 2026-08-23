// Typed API client for the Opusgen backend. Responses are validated with zod
// (invariant #5: typed boundaries). The bearer token comes from the dev-login
// session (see lib/auth).
import { z } from "zod";

export const API_BASE =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

export const SessionSchema = z.object({
  access_token: z.string(),
  token_type: z.string(),
  expires_in: z.number(),
  user_id: z.string(),
  firm_id: z.string(),
  role: z.enum(["owner", "staff"]),
});
export type Session = z.infer<typeof SessionSchema>;

export const ClientSchema = z.object({
  id: z.string(),
  name: z.string(),
  client_type: z.enum(["individual", "entity"]),
  tin_masked: z.string().nullable(),
  created_at: z.string(),
});
export type Client = z.infer<typeof ClientSchema>;

export const DocumentSchema = z.object({
  id: z.string(),
  client_id: z.string().nullable(),
  original_filename: z.string(),
  content_type: z.string(),
  size_bytes: z.number(),
  doc_type: z.enum(["unknown", "notice", "return", "statement", "other"]),
  status: z.enum(["uploaded", "processing", "parsed", "failed"]),
  parse_method: z.enum(["text", "vision"]).nullable(),
  page_count: z.number().nullable(),
  error: z.string().nullable(),
  created_at: z.string(),
});
export type DocumentSummary = z.infer<typeof DocumentSchema>;

export const DocumentDetailSchema = DocumentSchema.extend({
  parsed_text: z.string().nullable(),
});
export type DocumentDetail = z.infer<typeof DocumentDetailSchema>;

class ApiError extends Error {}

async function request(
  path: string,
  opts: { method?: string; token?: string; body?: unknown; form?: FormData } = {},
): Promise<unknown> {
  const headers: Record<string, string> = {};
  if (opts.token) headers["Authorization"] = `Bearer ${opts.token}`;
  let body: BodyInit | undefined;
  if (opts.form) {
    body = opts.form;
  } else if (opts.body !== undefined) {
    headers["Content-Type"] = "application/json";
    body = JSON.stringify(opts.body);
  }
  const res = await fetch(`${API_BASE}${path}`, {
    method: opts.method ?? "GET",
    headers,
    body,
  });
  if (!res.ok) {
    let message = `Request failed (${res.status})`;
    try {
      const data = (await res.json()) as { error?: { message?: string } };
      if (data.error?.message) message = data.error.message;
    } catch {
      // non-JSON error
    }
    throw new ApiError(message);
  }
  return res.json();
}

export async function devLogin(email: string, firmName: string): Promise<Session> {
  const data = await request("/auth/dev-login", {
    method: "POST",
    body: { email, firm_name: firmName },
  });
  return SessionSchema.parse(data);
}

export async function listClients(token: string): Promise<Client[]> {
  return z.array(ClientSchema).parse(await request("/clients", { token }));
}

export async function createClient(
  token: string,
  input: { name: string; client_type: Client["client_type"]; tin?: string },
): Promise<Client> {
  return ClientSchema.parse(
    await request("/clients", { method: "POST", token, body: input }),
  );
}

export async function getClient(token: string, id: string): Promise<Client> {
  return ClientSchema.parse(await request(`/clients/${id}`, { token }));
}

export async function listDocuments(token: string): Promise<DocumentSummary[]> {
  return z.array(DocumentSchema).parse(await request("/documents", { token }));
}

export async function getDocument(
  token: string,
  id: string,
): Promise<DocumentDetail> {
  return DocumentDetailSchema.parse(await request(`/documents/${id}`, { token }));
}

export async function uploadDocument(
  token: string,
  file: File,
  clientId?: string,
): Promise<DocumentSummary> {
  const form = new FormData();
  form.append("file", file);
  if (clientId) form.append("client_id", clientId);
  return DocumentSchema.parse(
    await request("/documents", { method: "POST", token, form }),
  );
}

export function documentContentUrl(id: string): string {
  return `${API_BASE}/documents/${id}/content`;
}
