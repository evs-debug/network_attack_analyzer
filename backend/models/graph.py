import heapq
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


    def dfs(self, start_node):
        visited = set()

        print("\nAttack Paths (DFS):")

        self._dfs_recursive(start_node, visited)


    def _dfs_recursive(self, node, visited):
        visited.add(node)

        print(node)
    
        for neighbor in self.adjacency_list[node]:
            if neighbor not in visited:
                self._dfs_recursive(neighbor, visited)

    def dijkstra(self, start_node, target_node):
        distances = {}
        previous = {}

        for node in self.nodes:
            distances[node] = float("inf")

        distances[start_node] = 0

        priority_queue = [
            (0, start_node)
        ]

        while priority_queue:
            current_distance, current_node = heapq.heappop(
                priority_queue
            )
            if current_distance > distances[current_node]:
                continue
            print(
                current_node,
                "cost:",
                current_distance
            )
            for edge in self.edges:
                if edge.source == current_node:

                    neighbor = edge.target

                    new_distance = (
                        current_distance
                        + edge.access_level
                    )

                    if new_distance < distances[neighbor]:

                        distances[neighbor] = new_distance

                        previous[neighbor] = current_node

                        heapq.heappush(
                            priority_queue,
                            (
                                new_distance,
                                neighbor
                            )
                        )
            

       
        if target_node not in previous and target_node != start_node:
            print("\nNo attack path found.")
            return
        path = []

        current = target_node

        while current != start_node:
            path.append(current)
            current = previous[current]

        path.append(start_node)

        path.reverse()

        print("\nShortest Attack Path:")
        

        for node in path:
            print(node)
         
        print("\nShortest Costs:")

        for node, cost in distances.items():
            print(node, "=", cost)

        