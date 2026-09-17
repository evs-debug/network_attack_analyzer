from fastapi.testclient import TestClient

from backend.api.main import app

client = TestClient(app)


def _create_network(name="Test Network"):
    response = client.post("/networks", json={"name": name})
    assert response.status_code == 200
    return response.json()["id"]


def test_create_and_list_network():
    network_id = _create_network("List Test Network")
    response = client.get("/networks")
    assert response.status_code == 200
    ids = [n["id"] for n in response.json()]
    assert network_id in ids


def test_get_network_starts_empty():
    network_id = _create_network("Empty Network")
    response = client.get(f"/networks/{network_id}")
    assert response.status_code == 200
    body = response.json()
    assert body["nodes"] == []
    assert body["edges"] == []


def test_get_nonexistent_network_404():
    response = client.get("/networks/999999")
    assert response.status_code == 404


def test_add_node():
    network_id = _create_network("Node Test Network")
    response = client.post(
        f"/networks/{network_id}/nodes",
        json={"name": "Test Server", "type": "Server", "vulnerability_score": 5, "criticality_score": 5, "asset_value": 5},
    )
    assert response.status_code == 200
    nodes = response.json()["nodes"]
    assert len(nodes) == 1
    assert nodes[0]["name"] == "Test Server"
    assert nodes[0]["risk_score"] == 125  # 5 * 5 * 5


def test_add_node_to_nonexistent_network_404():
    response = client.post(
        "/networks/999999/nodes",
        json={"name": "X", "type": "Server", "vulnerability_score": 1, "criticality_score": 1, "asset_value": 1},
    )
    assert response.status_code == 404


def test_delete_node_removes_its_edges_too():
    network_id = _create_network("Cascade Test Network")
    n1 = client.post(f"/networks/{network_id}/nodes", json={"name": "A", "type": "Server", "vulnerability_score": 3, "criticality_score": 3, "asset_value": 3}).json()["nodes"][0]["id"]
    n2_response = client.post(f"/networks/{network_id}/nodes", json={"name": "B", "type": "Server", "vulnerability_score": 3, "criticality_score": 3, "asset_value": 3})
    n2 = [n for n in n2_response.json()["nodes"] if n["name"] == "B"][0]["id"]

    edge_response = client.post(
        f"/networks/{network_id}/edges",
        json={"source_node_id": n1, "target_node_id": n2, "connection_type": "HTTPS", "access_level": 1},
    )
    assert edge_response.status_code == 200
    assert len(edge_response.json()["edges"]) == 1

    delete_response = client.delete(f"/networks/{network_id}/nodes/{n1}")
    assert delete_response.status_code == 200
    body = delete_response.json()
    assert len(body["nodes"]) == 1
    assert len(body["edges"]) == 0


def test_add_edge_with_invalid_node_id_404():
    network_id = _create_network("Bad Edge Test Network")
    response = client.post(
        f"/networks/{network_id}/edges",
        json={"source_node_id": 999999, "target_node_id": 999998, "connection_type": "HTTPS", "access_level": 1},
    )
    assert response.status_code == 404


def test_delete_edge():
    network_id = _create_network("Delete Edge Test Network")
    nodes = client.post(f"/networks/{network_id}/nodes", json={"name": "A", "type": "Server", "vulnerability_score": 3, "criticality_score": 3, "asset_value": 3}).json()["nodes"]
    n1 = nodes[0]["id"]
    n2 = client.post(f"/networks/{network_id}/nodes", json={"name": "B", "type": "Server", "vulnerability_score": 3, "criticality_score": 3, "asset_value": 3}).json()["nodes"][-1]["id"]
    edge = client.post(f"/networks/{network_id}/edges", json={"source_node_id": n1, "target_node_id": n2, "connection_type": "HTTPS", "access_level": 1}).json()["edges"][0]

    response = client.delete(f"/networks/{network_id}/edges/{edge['id']}")
    assert response.status_code == 200
    assert response.json()["edges"] == []


def test_delete_network():
    network_id = _create_network("To Be Deleted")
    response = client.delete(f"/networks/{network_id}")
    assert response.status_code == 200
    ids = [n["id"] for n in response.json()]
    assert network_id not in ids


def test_delete_nonexistent_network_404():
    response = client.delete("/networks/999999")
    assert response.status_code == 404


def test_list_templates():
    response = client.get("/templates")
    assert response.status_code == 200
    ids = [t["id"] for t in response.json()]
    assert "small_office" in ids
    assert "cloud_vpc" in ids
    assert "home_network" in ids


def test_instantiate_template():
    response = client.post("/networks/from-template", json={"template_id": "cloud_vpc", "name": "From Template Test"})
    assert response.status_code == 200
    network_id = response.json()["id"]

    network = client.get(f"/networks/{network_id}").json()
    assert len(network["nodes"]) == 7
    assert len(network["edges"]) == 8


def test_instantiate_invalid_template_404():
    response = client.post("/networks/from-template", json={"template_id": "not_a_real_template", "name": "X"})
    assert response.status_code == 404
