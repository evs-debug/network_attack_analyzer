import type {
  HomeResponse,
  RiskReportItem,
  ShortestPathResponse,
  CriticalNodesResponse,
  NetworkResponse,
  NetworkSummary,
  NodeCreateRequest,
  EdgeCreateRequest,
  ApiError,
  TemplateSummary,
  TokenResponse,
  UserSummary,
  CompromiseStep,
} from './types';

const BASE_URL = 'http://127.0.0.1:8000';
const TOKEN_STORAGE_KEY = 'naa_auth_token';

export function getStoredToken(): string | null {
  return localStorage.getItem(TOKEN_STORAGE_KEY);
}
export function setStoredToken(token: string) {
  localStorage.setItem(TOKEN_STORAGE_KEY, token);
}
export function clearStoredToken() {
  localStorage.removeItem(TOKEN_STORAGE_KEY);
}

export class ApiRequestError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
    this.name = 'ApiRequestError';
  }
}

function extractErrorMessage(body: ApiError): string {
  if (typeof body.detail === 'string') return body.detail;
  if (Array.isArray(body.detail)) {
    return body.detail.map((e) => e.msg).join('; ');
  }
  return 'Unknown API error';
}

function authHeaders(): Record<string, string> {
  const token = getStoredToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function handle<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const body: ApiError = await response.json().catch(() => ({ detail: response.statusText }));
    throw new ApiRequestError(response.status, extractErrorMessage(body));
  }
  return response.json();
}

async function get<T>(path: string): Promise<T> {
  return handle<T>(await fetch(`${BASE_URL}${path}`, { headers: { ...authHeaders() } }));
}

async function post<T>(path: string, body: unknown): Promise<T> {
  return handle<T>(
    await fetch(`${BASE_URL}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify(body),
    })
  );
}

async function del<T>(path: string): Promise<T> {
  return handle<T>(await fetch(`${BASE_URL}${path}`, { method: 'DELETE', headers: { ...authHeaders() } }));
}

export const api = {
  home: () => get<HomeResponse>('/'),

  riskReport: () => get<RiskReportItem[]>('/risk-report'),
  criticalNodes: () => get<CriticalNodesResponse>('/critical-nodes'),
  network: () => get<NetworkResponse>('/network'),
  shortestPath: (start: string, target: string) =>
    get<ShortestPathResponse>(`/shortest-path?start=${encodeURIComponent(start)}&target=${encodeURIComponent(target)}`),

  listNetworks: () => get<NetworkSummary[]>('/networks'),
  createNetwork: (name: string) => post<NetworkSummary>('/networks', { name }),
  deleteNetwork: (id: number) => del<NetworkSummary[]>(`/networks/${id}`),
  networkById: (id: number) => get<NetworkResponse>(`/networks/${id}`),
  addNode: (networkId: number, payload: NodeCreateRequest) =>
    post<NetworkResponse>(`/networks/${networkId}/nodes`, payload),
  deleteNode: (networkId: number, nodeId: number) =>
    del<NetworkResponse>(`/networks/${networkId}/nodes/${nodeId}`),
  addEdge: (networkId: number, payload: EdgeCreateRequest) =>
    post<NetworkResponse>(`/networks/${networkId}/edges`, payload),
  deleteEdge: (networkId: number, edgeId: number) =>
    del<NetworkResponse>(`/networks/${networkId}/edges/${edgeId}`),

  riskReportFor: (networkId: number) => get<RiskReportItem[]>(`/networks/${networkId}/risk-report`),
  criticalNodesFor: (networkId: number) => get<CriticalNodesResponse>(`/networks/${networkId}/critical-nodes`),
  shortestPathFor: (networkId: number, start: string, target: string) =>
    get<ShortestPathResponse>(`/networks/${networkId}/shortest-path?start=${encodeURIComponent(start)}&target=${encodeURIComponent(target)}`),

  listTemplates: () => get<TemplateSummary[]>('/templates'),

  compromiseSimulationFor: (networkId: number, start: string) => get<CompromiseStep[]>(`/networks/${networkId}/compromise-simulation?start=${encodeURIComponent(start)}`),
  createNetworkFromTemplate: (templateId: string, name: string) =>
    post<NetworkSummary>('/networks/from-template', { template_id: templateId, name }),

  signup: (email: string, password: string) => post<TokenResponse>('/auth/signup', { email, password }),
  login: (email: string, password: string) => post<TokenResponse>('/auth/login', { email, password }),
  me: () => get<UserSummary>('/auth/me'),
};
