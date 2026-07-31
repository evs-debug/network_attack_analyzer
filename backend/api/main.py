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