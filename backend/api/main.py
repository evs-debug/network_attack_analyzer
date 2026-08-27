from fastapi import FastAPI

from backend.sample_networks.sample_network import (
    create_sample_network
)

app = FastAPI(
    title="Network Attack Analyzer API",
    version="0.4.0"
)


@app.get("/")
def home():
    return {
        "message": "Network Attack Analyzer API",
        "status": "running"
    }


@app.get("/risk-report")
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

@app.get("/shortest-path")
def shortest_path(start: str, target: str):

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
        return {"error": "Invalid start or target node name"}

    result = graph.shortest_path(start_node, target_node)

    if result is None:
        return {"error": "No path found"}

    return result

@app.get("/critical-nodes")
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

@app.get("/network")
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