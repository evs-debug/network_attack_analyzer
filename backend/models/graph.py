class AttackGraph:
    def __init__(self):
        self.nodes = []
        self.edges = []
        self.adjacency_list = {}

    def add_node(self, node):
        self.nodes.append(node)
        self.adjacency_list[node] = []

    def add_edge(self, edge):
        self.edges.append(edge)
        self.adjacency_list[edge.source].append(edge.target)

    def display_network(self):
        print("\nNodes:")
        for node in self.nodes:
            print(node)

        print("\nEdges:")
        for edge in self.edges:
            print(edge)

    def bfs(self, start_node):
        visited = set()
        queue = [start_node]

        visited.add(start_node)

        print("\nReachable Systems:")

        while queue:
            current_node = queue.pop(0)

            print(current_node)

            for neighbor in self.adjacency_list[current_node]:
                if neighbor not in visited:
                    visited.add(neighbor)
                    queue.append(neighbor)