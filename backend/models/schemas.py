"""Pydantic response models for the API.

These give FastAPI a real, documented schema for each endpoint (visible
in /docs) instead of an untyped dict, and validate that graph.py's
return shapes stay consistent -- if a method's output ever drifts from
what it's supposed to return, FastAPI raises a clear validation error
at request time instead of silently serving malformed data to whatever
frontend consumes it.

Field types were verified against backend/sample_networks/sample_network.py
(all node/edge attributes are constructed as plain ints there) rather
than guessed from node.py's lack of type hints.
"""

from typing import List
from pydantic import BaseModel


class HomeResponse(BaseModel):
    message: str
    status: str


class RiskReportItem(BaseModel):
    name: str
    type: str
    risk_score: int


class ShortestPathResponse(BaseModel):
    start: str
    target: str
    cost: int
    path: List[str]


class CriticalNodeItem(BaseModel):
    name: str
    reachable_assets: int


class MostCriticalNode(BaseModel):
    name: str
    impact: int


class CriticalNodesResponse(BaseModel):
    report: List[CriticalNodeItem]
    most_critical: MostCriticalNode


class NetworkNode(BaseModel):
    id: int
    name: str
    type: str
    vulnerability_score: int
    criticality_score: int
    asset_value: int
    risk_score: int


class NetworkEdge(BaseModel):
    source: str
    target: str
    connection_type: str
    access_level: int


class NetworkResponse(BaseModel):
    nodes: List[NetworkNode]
    edges: List[NetworkEdge]


class NetworkSummary(BaseModel):
    id: int
    name: str


class NetworkCreateRequest(BaseModel):
    name: str


class NodeCreateRequest(BaseModel):
    name: str
    type: str
    vulnerability_score: int
    criticality_score: int
    asset_value: int


class EdgeCreateRequest(BaseModel):
    source_node_id: int
    target_node_id: int
    connection_type: str
    access_level: int
