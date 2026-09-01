from sqlalchemy import Column, Integer, String, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from backend.db import Base


class NetworkRecord(Base):
    __tablename__ = "networks"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    nodes = relationship("NodeRecord", back_populates="network", cascade="all, delete-orphan")
    edges = relationship("EdgeRecord", back_populates="network", cascade="all, delete-orphan")


class NodeRecord(Base):
    __tablename__ = "nodes"

    id = Column(Integer, primary_key=True, index=True)
    network_id = Column(Integer, ForeignKey("networks.id"), nullable=False)
    name = Column(String, nullable=False)
    type = Column(String, nullable=False)
    vulnerability_score = Column(Integer, nullable=False)
    criticality_score = Column(Integer, nullable=False)
    asset_value = Column(Integer, nullable=False)

    network = relationship("NetworkRecord", back_populates="nodes")


class EdgeRecord(Base):
    __tablename__ = "edges"

    id = Column(Integer, primary_key=True, index=True)
    network_id = Column(Integer, ForeignKey("networks.id"), nullable=False)
    source_node_id = Column(Integer, ForeignKey("nodes.id"), nullable=False)
    target_node_id = Column(Integer, ForeignKey("nodes.id"), nullable=False)
    connection_type = Column(String, nullable=False)
    access_level = Column(Integer, nullable=False)

    network = relationship("NetworkRecord", back_populates="edges")
