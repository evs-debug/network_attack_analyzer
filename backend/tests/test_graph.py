from backend.models.node import Node

from backend.models.edge import Edge

from backend.models.graph import AttackGraph

from backend.sample_networks.sample_network import (

    create_sample_network

)



(

    graph,

    internet,

    web_server,

    database,
    domain_controller,

    vpn_gateway

) = create_sample_network()

graph.display_network()

graph.bfs(internet)

graph.dfs(internet)


print("\nDijkstra Traversal:")

graph.dijkstra(
    internet,
    domain_controller
)
print("\nSecurity Analysis")

risk_report = graph.risk_report()

print("\nRisk Report:")

for asset in risk_report:
    print(
        asset["name"],
        "- Risk Score:",
        asset["risk_score"]
    )

graph.highest_risk_asset()

graph.critical_node_report()

graph.most_critical_node()