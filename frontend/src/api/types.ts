// Matches backend/models/schemas.py exactly -- keep these in sync
// manually if the backend schemas change.

export interface HomeResponse {
  message: string;
  status: string;
}

export interface RiskReportItem {
  name: string;
  type: string;
  risk_score: number;
}

export interface ShortestPathResponse {
  start: string;
  target: string;
  cost: number;
  path: string[];
}

export interface CriticalNodeItem {
  name: string;
  reachable_assets: number;
}

export interface MostCriticalNode {
  name: string;
  impact: number;
}

export interface CriticalNodesResponse {
  report: CriticalNodeItem[];
  most_critical: MostCriticalNode;
}

export interface NetworkNode {
  id: number;
  name: string;
  type: string;
  vulnerability_score: number;
  criticality_score: number;
  asset_value: number;
  risk_score: number;
}

export interface NetworkEdge {
  source: string;
  target: string;
  connection_type: string;
  access_level: number;
}

export interface NetworkResponse {
  nodes: NetworkNode[];
  edges: NetworkEdge[];
}

export interface NetworkSummary {
  id: number;
  name: string;
}

export interface NodeCreateRequest {
  name: string;
  type: string;
  vulnerability_score: number;
  criticality_score: number;
  asset_value: number;
}

export interface EdgeCreateRequest {
  source_node_id: number;
  target_node_id: number;
  connection_type: string;
  access_level: number;
}

// Shape of FastAPI's error response body (HTTPException / validation errors)
export interface ApiError {
  detail: string | { msg: string; loc: string[] }[];
}
