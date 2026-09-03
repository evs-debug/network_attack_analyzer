from fastapi import FastAPI, HTTPException, Query, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from typing import List

from backend.db import Base, engine, get_db
from backend.models.schemas import (
    HomeResponse,
    RiskReportItem,
    ShortestPathResponse,
    CriticalNodesResponse,
    NetworkResponse,
    NetworkSummary,
    NetworkCreateRequest,
    NodeCreateRequest,
    EdgeCreateRequest,
    TemplateSummary,
    TemplateInstantiateRequest,
)
from backend import repository

Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Network Attack Analyzer API",
    version="0.5.0"
)

# Allow the local Vite dev server (and the common alternate port) to
# call this API directly from the browser. Tighten this list before
# any real deployment -- wildcard/dev origins should never ship.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_methods=["GET", "POST", "DELETE"],
    allow_headers=["*"],
)


@app.get("/", response_model=HomeResponse)
def home():
    return {"message": "Network Attack Analyzer API", "status": "running"}


# ---------------------------------------------------------------------
# Network management
# ---------------------------------------------------------------------

@app.post("/networks", response_model=NetworkSummary)
def create_network(payload: NetworkCreateRequest, db: Session = Depends(get_db)):
    record = repository.create_network(db, payload.name)
    return {"id": record.id, "name": record.name}


@app.get("/networks", response_model=List[NetworkSummary])
def list_networks(db: Session = Depends(get_db)):
    repository.seed_sample_network(db)
    records = repository.list_networks(db)
    return [{"id": r.id, "name": r.name} for r in records]


@app.get("/networks/{network_id}", response_model=NetworkResponse)
def get_network(network_id: int, db: Session = Depends(get_db)):
    if repository.get_network(db, network_id) is None:
        raise HTTPException(status_code=404, detail=f"Network {network_id} not found")
    graph = repository.load_attack_graph(db, network_id)
    return graph.network_data()


@app.post("/networks/{network_id}/nodes", response_model=NetworkResponse)
def add_node(network_id: int, payload: NodeCreateRequest, db: Session = Depends(get_db)):
    if repository.get_network(db, network_id) is None:
        raise HTTPException(status_code=404, detail=f"Network {network_id} not found")
    repository.add_node(
        db, network_id, payload.name, payload.type,
        payload.vulnerability_score, payload.criticality_score, payload.asset_value,
    )
    graph = repository.load_attack_graph(db, network_id)
    return graph.network_data()


@app.delete("/networks/{network_id}/nodes/{node_id}", response_model=NetworkResponse)
def delete_node(network_id: int, node_id: int, db: Session = Depends(get_db)):
    if repository.get_network(db, network_id) is None:
        raise HTTPException(status_code=404, detail=f"Network {network_id} not found")
    if not repository.delete_node(db, network_id, node_id):
        raise HTTPException(status_code=404, detail=f"Node {node_id} not found in network {network_id}")
    graph = repository.load_attack_graph(db, network_id)
    return graph.network_data()


@app.post("/networks/{network_id}/edges", response_model=NetworkResponse)
def add_edge(network_id: int, payload: EdgeCreateRequest, db: Session = Depends(get_db)):
    if repository.get_network(db, network_id) is None:
        raise HTTPException(status_code=404, detail=f"Network {network_id} not found")
    record = repository.add_edge(
        db, network_id, payload.source_node_id, payload.target_node_id,
        payload.connection_type, payload.access_level,
    )
    if record is None:
        raise HTTPException(status_code=404, detail="source_node_id or target_node_id not found in this network")
    graph = repository.load_attack_graph(db, network_id)
    return graph.network_data()


@app.delete("/networks/{network_id}/edges/{edge_id}", response_model=NetworkResponse)
def delete_edge(network_id: int, edge_id: int, db: Session = Depends(get_db)):
    if repository.get_network(db, network_id) is None:
        raise HTTPException(status_code=404, detail=f"Network {network_id} not found")
    if not repository.delete_edge(db, network_id, edge_id):
        raise HTTPException(status_code=404, detail=f"Edge {edge_id} not found in network {network_id}")
    graph = repository.load_attack_graph(db, network_id)
    return graph.network_data()


# ---------------------------------------------------------------------
# Analysis endpoints, scoped to a specific network
# ---------------------------------------------------------------------

@app.get("/networks/{network_id}/risk-report", response_model=List[RiskReportItem])
def network_risk_report(network_id: int, db: Session = Depends(get_db)):
    if repository.get_network(db, network_id) is None:
        raise HTTPException(status_code=404, detail=f"Network {network_id} not found")
    graph = repository.load_attack_graph(db, network_id)
    return graph.risk_report()


@app.get("/networks/{network_id}/critical-nodes", response_model=CriticalNodesResponse)
def network_critical_nodes(network_id: int, db: Session = Depends(get_db)):
    if repository.get_network(db, network_id) is None:
        raise HTTPException(status_code=404, detail=f"Network {network_id} not found")
    graph = repository.load_attack_graph(db, network_id)
    return {
        "report": graph.critical_node_report_data(),
        "most_critical": graph.most_critical_node_data(),
    }


@app.get("/networks/{network_id}/shortest-path", response_model=ShortestPathResponse)
def network_shortest_path(
    network_id: int,
    start: str = Query(..., min_length=1),
    target: str = Query(..., min_length=1),
    db: Session = Depends(get_db),
):
    if repository.get_network(db, network_id) is None:
        raise HTTPException(status_code=404, detail=f"Network {network_id} not found")
    graph = repository.load_attack_graph(db, network_id)

    nodes_by_name = {node.name: node for node in graph.nodes}
    start_node = nodes_by_name.get(start)
    target_node = nodes_by_name.get(target)

    if not start_node or not target_node:
        raise HTTPException(status_code=404, detail=f"Invalid start or target node name: start={start!r}, target={target!r}")

    result = graph.shortest_path(start_node, target_node)
    if result is None:
        raise HTTPException(status_code=404, detail=f"No path found between {start!r} and {target!r}")
    return result

@app.get("/templates", response_model=List[TemplateSummary])
def list_templates():
    return repository.list_templates()


@app.post("/networks/from-template", response_model=NetworkSummary)
def create_network_from_template(payload: TemplateInstantiateRequest, db: Session = Depends(get_db)):
    network_id = repository.instantiate_template(db, payload.template_id, payload.name)
    if network_id is None:
        raise HTTPException(status_code=404, detail=f"Unknown template_id: {payload.template_id!r}")
    record = repository.get_network(db, network_id)
    return {"id": record.id, "name": record.name}




# ---------------------------------------------------------------------
# Legacy unscoped endpoints -- kept working against the seeded sample
# network so the existing frontend pages don't break while the UI
# migrates to network-scoped requests. Each call re-seeds idempotently
# (a no-op if it already exists) rather than relying on a startup
# event, since startup events don't fire under a plain TestClient()
# instance and this needs to work correctly under pytest too.
# ---------------------------------------------------------------------

@app.get("/risk-report", response_model=List[RiskReportItem])
def risk_report(db: Session = Depends(get_db)):
    sample_id = repository.seed_sample_network(db)
    return network_risk_report(sample_id, db)


@app.get("/critical-nodes", response_model=CriticalNodesResponse)
def critical_nodes(db: Session = Depends(get_db)):
    sample_id = repository.seed_sample_network(db)
    return network_critical_nodes(sample_id, db)


@app.get("/shortest-path", response_model=ShortestPathResponse)
def shortest_path(
    start: str = Query(..., min_length=1),
    target: str = Query(..., min_length=1),
    db: Session = Depends(get_db),
):
    sample_id = repository.seed_sample_network(db)
    return network_shortest_path(sample_id, start, target, db)


@app.get("/network", response_model=NetworkResponse)
def network(db: Session = Depends(get_db)):
    sample_id = repository.seed_sample_network(db)
    return get_network(sample_id, db)
