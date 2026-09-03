from typing import List, Optional

from sqlalchemy.orm import Session

from backend.db_models import NetworkRecord, NodeRecord, EdgeRecord
from backend.models.node import Node
from backend.models.edge import Edge
from backend.models.graph import AttackGraph


SAMPLE_NETWORK_NAME = "Sample Network"

_SAMPLE_NODES = [
    ("Internet", "Internet", 1, 1, 1),
    ("Web Server", "Server", 8, 7, 8),
    ("Database", "Database", 8, 9, 10),
    ("Domain Controller", "Domain Controller", 7, 10, 10),
    ("VPN Gateway", "Gateway", 6, 7, 6),
]

_SAMPLE_EDGES = [
    ("Internet", "Web Server", "HTTPS", 1),
    ("Web Server", "Database", "SQL", 2),
    ("Database", "Domain Controller", "LDAP", 3),
    ("Internet", "VPN Gateway", "VPN", 2),
    ("VPN Gateway", "Domain Controller", "RDP", 2),
]


def create_network(db: Session, name: str) -> NetworkRecord:
    record = NetworkRecord(name=name)
    db.add(record)
    db.commit()
    db.refresh(record)
    return record


def list_networks(db: Session) -> List[NetworkRecord]:
    return db.query(NetworkRecord).order_by(NetworkRecord.id).all()


def get_network(db: Session, network_id: int) -> Optional[NetworkRecord]:
    return db.query(NetworkRecord).filter(NetworkRecord.id == network_id).first()


def add_node(
    db: Session, network_id: int, name: str, node_type: str,
    vulnerability_score: int, criticality_score: int, asset_value: int,
) -> NodeRecord:
    record = NodeRecord(
        network_id=network_id, name=name, type=node_type,
        vulnerability_score=vulnerability_score,
        criticality_score=criticality_score, asset_value=asset_value,
    )
    db.add(record)
    db.commit()
    db.refresh(record)
    return record


def delete_node(db: Session, network_id: int, node_id: int) -> bool:
    record = db.query(NodeRecord).filter(
        NodeRecord.id == node_id, NodeRecord.network_id == network_id
    ).first()
    if record is None:
        return False
    db.query(EdgeRecord).filter(
        EdgeRecord.network_id == network_id,
        (EdgeRecord.source_node_id == node_id) | (EdgeRecord.target_node_id == node_id),
    ).delete(synchronize_session=False)
    db.delete(record)
    db.commit()
    return True


def add_edge(
    db: Session, network_id: int, source_node_id: int, target_node_id: int,
    connection_type: str, access_level: int,
) -> Optional[EdgeRecord]:
    source_ok = db.query(NodeRecord).filter(
        NodeRecord.id == source_node_id, NodeRecord.network_id == network_id
    ).first()
    target_ok = db.query(NodeRecord).filter(
        NodeRecord.id == target_node_id, NodeRecord.network_id == network_id
    ).first()
    if not source_ok or not target_ok:
        return None

    record = EdgeRecord(
        network_id=network_id, source_node_id=source_node_id,
        target_node_id=target_node_id, connection_type=connection_type,
        access_level=access_level,
    )
    db.add(record)
    db.commit()
    db.refresh(record)
    return record


def delete_edge(db: Session, network_id: int, edge_id: int) -> bool:
    record = db.query(EdgeRecord).filter(
        EdgeRecord.id == edge_id, EdgeRecord.network_id == network_id
    ).first()
    if record is None:
        return False
    db.delete(record)
    db.commit()
    return True


def load_attack_graph(db: Session, network_id: int) -> AttackGraph:
    graph = AttackGraph()

    node_records = db.query(NodeRecord).filter(NodeRecord.network_id == network_id).all()
    nodes_by_id = {}
    for rec in node_records:
        node = Node(rec.id, rec.name, rec.type, rec.vulnerability_score, rec.criticality_score, rec.asset_value)
        nodes_by_id[rec.id] = node
        graph.add_node(node)

    edge_records = db.query(EdgeRecord).filter(EdgeRecord.network_id == network_id).all()
    for rec in edge_records:
        source = nodes_by_id[rec.source_node_id]
        target = nodes_by_id[rec.target_node_id]
        graph.add_edge(Edge(source, target, rec.connection_type, rec.access_level, id=rec.id))

    return graph


def seed_sample_network(db: Session) -> int:
    existing = db.query(NetworkRecord).filter(NetworkRecord.name == SAMPLE_NETWORK_NAME).first()
    if existing is not None:
        return existing.id

    network = create_network(db, SAMPLE_NETWORK_NAME)

    name_to_node_id = {}
    for name, node_type, vuln, crit, asset in _SAMPLE_NODES:
        rec = add_node(db, network.id, name, node_type, vuln, crit, asset)
        name_to_node_id[name] = rec.id

    for source_name, target_name, connection_type, access_level in _SAMPLE_EDGES:
        add_edge(
            db, network.id,
            name_to_node_id[source_name], name_to_node_id[target_name],
            connection_type, access_level,
        )

    return network.id


# ---------------------------------------------------------------------
# Network templates -- pre-built topologies a user can instantiate as
# a starting point instead of building a network node-by-node.
# ---------------------------------------------------------------------

TEMPLATES = {
    "small_office": {
        "name": "Small Office Network",
        "description": "Router, firewall, workstations, and a file server -- a typical small business LAN.",
        "nodes": [
            ("Internet", "Internet", 1, 1, 1),
            ("Firewall", "Firewall", 4, 8, 5),
            ("Office Router", "Router", 5, 6, 4),
            ("File Server", "Server", 6, 8, 8),
            ("Workstation 1", "Workstation", 6, 4, 4),
            ("Workstation 2", "Workstation", 6, 4, 4),
            ("Printer", "IoT", 7, 2, 2),
        ],
        "edges": [
            ("Internet", "Firewall", "WAN", 1),
            ("Firewall", "Office Router", "LAN", 2),
            ("Office Router", "File Server", "SMB", 2),
            ("Office Router", "Workstation 1", "Ethernet", 2),
            ("Office Router", "Workstation 2", "Wi-Fi", 2),
            ("Office Router", "Printer", "Wi-Fi", 1),
        ],
    },
    "cloud_vpc": {
        "name": "Cloud VPC",
        "description": "Internet-facing load balancer, web tier, app tier, and a database in a private subnet.",
        "nodes": [
            ("Internet", "Internet", 1, 1, 1),
            ("Load Balancer", "Gateway", 5, 6, 6),
            ("Web Server 1", "Server", 7, 6, 6),
            ("Web Server 2", "Server", 7, 6, 6),
            ("App Server", "Server", 6, 8, 8),
            ("Database", "Database", 5, 10, 10),
            ("Bastion Host", "Server", 4, 7, 5),
        ],
        "edges": [
            ("Internet", "Load Balancer", "HTTPS", 1),
            ("Load Balancer", "Web Server 1", "HTTP", 2),
            ("Load Balancer", "Web Server 2", "HTTP", 2),
            ("Web Server 1", "App Server", "REST", 2),
            ("Web Server 2", "App Server", "REST", 2),
            ("App Server", "Database", "SQL", 3),
            ("Internet", "Bastion Host", "SSH", 2),
            ("Bastion Host", "App Server", "SSH", 3),
        ],
    },
    "home_network": {
        "name": "Home Network",
        "description": "Router, laptop, phone, and IoT devices on a typical home Wi-Fi network.",
        "nodes": [
            ("Internet", "Internet", 1, 1, 1),
            ("Home Router", "Router", 6, 5, 4),
            ("Laptop", "Workstation", 5, 5, 6),
            ("Phone", "Workstation", 4, 4, 5),
            ("Smart TV", "IoT", 8, 2, 2),
            ("Smart Camera", "IoT", 9, 3, 3),
            ("NAS", "Server", 6, 6, 7),
        ],
        "edges": [
            ("Internet", "Home Router", "WAN", 1),
            ("Home Router", "Laptop", "Wi-Fi", 2),
            ("Home Router", "Phone", "Wi-Fi", 2),
            ("Home Router", "Smart TV", "Wi-Fi", 1),
            ("Home Router", "Smart Camera", "Wi-Fi", 1),
            ("Home Router", "NAS", "Ethernet", 2),
        ],
    },
}


def list_templates():
    return [
        {"id": key, "name": t["name"], "description": t["description"]}
        for key, t in TEMPLATES.items()
    ]


def instantiate_template(db: Session, template_id: str, network_name: str) -> Optional[int]:
    template = TEMPLATES.get(template_id)
    if template is None:
        return None

    network = create_network(db, network_name)

    name_to_node_id = {}
    for name, node_type, vuln, crit, asset in template["nodes"]:
        rec = add_node(db, network.id, name, node_type, vuln, crit, asset)
        name_to_node_id[name] = rec.id

    for source_name, target_name, connection_type, access_level in template["edges"]:
        add_edge(
            db, network.id,
            name_to_node_id[source_name], name_to_node_id[target_name],
            connection_type, access_level,
        )

    return network.id
