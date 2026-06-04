# Represents the entire network

# Stores:
# - nodes
# - edges

# Responsible for:
# - BFS
# - DFS
# - Dijkstra
# - Topological Sort
# - Critical Node Detection
class AttackGraph:
    def __init__(self):
        self.nodes = []
        self.edges = []

    def add_node(self, node):
        self.nodes.append(node)

    def add_edge(self, edge):
        self.edges.append(edge)

    def display_network(self):
        print("\nNodes:")
        for node in self.nodes:
            print(node)

        print("\nEdges:")
        for edge in self.edges:
            print(edge)