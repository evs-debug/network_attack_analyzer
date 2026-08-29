from fastapi.testclient import TestClient
from backend.api.main import app

client = TestClient(app)


def test_home():
    response = client.get("/")
    assert response.status_code == 200
    assert response.json()["status"] == "running"


def test_risk_report():
    response = client.get("/risk-report")
    assert response.status_code == 200


def test_critical_nodes():
    response = client.get("/critical-nodes")
    assert response.status_code == 200
    body = response.json()
    assert "report" in body
    assert "most_critical" in body


def test_network():
    response = client.get("/network")
    assert response.status_code == 200


def test_shortest_path_missing_params():
    # FastAPI's own validation should reject this with 422 before our
    # code even runs, since start/target have no defaults.
    response = client.get("/shortest-path")
    assert response.status_code == 422


def test_shortest_path_invalid_node_names():
    # This is the actual bug fix: invalid node names used to return
    # HTTP 200 with an {"error": ...} body, which a real client
    # checking response.ok would misread as success.
    response = client.get("/shortest-path", params={"start": "not-a-real-node", "target": "also-fake"})
    assert response.status_code == 404
    assert "detail" in response.json()


def test_shortest_path_valid_nodes():
    # Get real node names from the network endpoint first, rather than
    # hardcoding names that might not match the actual sample network.
    network = client.get("/network").json()
    node_names = [n["name"] for n in network["nodes"]] if "nodes" in network else []
    assert len(node_names) >= 2, "expected at least 2 nodes in the sample network"

    response = client.get("/shortest-path", params={"start": node_names[0], "target": node_names[-1]})
    assert response.status_code in (200, 404)  # 404 is valid if genuinely no path exists
