# Represents a network asset

# Stores:
# - id
# - name
# - type
# - vulnerability_score
# - criticality_score
# - asset_value

# Example:
# Database Server
# vulnerability = 8
# criticality = 9
# asset_value = 10

class Node:
    def __init__(
        self,
        node_id,
        name,
        node_type,
        vulnerability_score,
        criticality_score,
        asset_value
    ):
        self.id = node_id
        self.name = name
        self.type = node_type
        self.vulnerability_score = vulnerability_score
        self.criticality_score = criticality_score
        self.asset_value = asset_value

    def calculate_risk(self):
        return (
            self.vulnerability_score
            * self.criticality_score
            * self.asset_value
        )

    def __str__(self):
        return f"{self.name} ({self.type})"