from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from typing import List

from backend.models.schemas import (
    HomeResponse,
    RiskReportItem,
    ShortestPathResponse,
    CriticalNodesResponse,
    NetworkResponse,
)

from backend.sample_networks.sample_network import (
    create_sample_network
)

app = FastAPI(
    title="Network Attack Analyzer API",
    version="0.4.0"
)

# Allow the local Vite dev server (and the common alternate port) to
# call this API directly from the browser. Tighten this list before
# any real deployment -- wildcard/dev origins should never ship.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_methods=["GET"],
    allow_headers=["*"],
)


@app.get("/", response_model=HomeResponse)
def home():
    return {
        "message": "Network Attack Analyzer API",
        "status": "running"
    }


@app.get("/risk-report", response_model=List[RiskReportItem])
def risk_report():

    (
        graph,
        internet,
        web_server,
        database,
        domain_controller,
        vpn_gateway
    ) = create_sample_network()

    return graph.risk_report()

@app.get("/shortest-path", response_model=ShortestPathResponse)
def shortest_path(
    start: str = Query(..., min_length=1, description="Name of the starting node"),
    target: str = Query(..., min_length=1, description="Name of the target node"),
):

    (
        graph,
        internet,
        web_server,
        database,
        domain_controller,
        vpn_gateway
    ) = create_sample_network()

    nodes_by_name = {}
    for node in graph.nodes:
        nodes_by_name[node.name] = node

    start_node = nodes_by_name.get(start)
    target_node = nodes_by_name.get(target)

    if not start_node or not target_node:
        raise HTTPException(status_code=404, detail=f"Invalid start or target node name: start={start!r}, target={target!r}")

    result = graph.shortest_path(start_node, target_node)

    if result is None:
        raise HTTPException(status_code=404, detail=f"No path found between {start!r} and {target!r}")

    return result

@app.get("/critical-nodes", response_model=CriticalNodesResponse)
def critical_nodes():

    (
        graph,
        internet,
        web_server,
        database,
        domain_controller,
        vpn_gateway
    ) = create_sample_network()

    return {
        "report": graph.critical_node_report_data(),
        "most_critical": graph.most_critical_node_data()
    }

@app.get("/network", response_model=NetworkResponse)
def network():

    (
        graph,
        internet,
        web_server,
        database,
        domain_controller,
        vpn_gateway
    ) = create_sample_network()

    return graph.network_data()
