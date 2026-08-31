import type {
  HomeResponse,
  RiskReportItem,
  ShortestPathResponse,
  CriticalNodesResponse,
  NetworkResponse,
  ApiError,
} from './types';

const BASE_URL = 'http://127.0.0.1:8000';

// Thrown on any non-2xx response, carrying FastAPI's actual error
// detail (works for both HTTPException's string detail and pydantic's
// validation-error array shape from 422s).
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

async function get<T>(path: string): Promise<T> {
  const response = await fetch(`${BASE_URL}${path}`);
  if (!response.ok) {
    const body: ApiError = await response.json().catch(() => ({ detail: response.statusText }));
    throw new ApiRequestError(response.status, extractErrorMessage(body));
  }
  return response.json();
}

export const api = {
  home: () => get<HomeResponse>('/'),
  riskReport: () => get<RiskReportItem[]>('/risk-report'),
  criticalNodes: () => get<CriticalNodesResponse>('/critical-nodes'),
  network: () => get<NetworkResponse>('/network'),
  shortestPath: (start: string, target: string) =>
    get<ShortestPathResponse>(`/shortest-path?start=${encodeURIComponent(start)}&target=${encodeURIComponent(target)}`),
};
