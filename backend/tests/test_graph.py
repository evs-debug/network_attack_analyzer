from backend.models.node import Node
from backend.models.edge import Edge
from backend.models.graph import AttackGraph


graph = AttackGraph()

internet = Node(
    1,
    "Internet",
    "Internet",
    1,
    1,
    1
)

web_server = Node(
    2,
    "Web Server",
    "Server",
    8,
    7,
    8
)

database = Node(
    3,
    "Database",
    "Database",
    8,
    9,
    10
)

graph.add_node(internet)
graph.add_node(web_server)
graph.add_node(database)

graph.add_edge(
    Edge(
        internet,
        web_server,
        "HTTPS",
        1
    )
)

graph.add_edge(
    Edge(
        web_server,
        database,
        "SQL",
        2
    )
)

graph.display_network()