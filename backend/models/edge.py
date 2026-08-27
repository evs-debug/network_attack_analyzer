class Edge:
    def __init__(
        self,
        source,
        target,
        connection_type,
        access_level
    ):
        self.source = source
        self.target = target
        self.connection_type = connection_type
        self.access_level = access_level

    def __str__(self):
        return (
            f"{self.source.name}"
            f" -> "
            f"{self.target.name}"
        )