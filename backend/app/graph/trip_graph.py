"""NetworkX wrapper over a trip's nodes/edges.

Kept in-process per request: rehydrate() builds a fresh graph from the rows
already fetched from Postgres (via app/db), mutate it in memory, then
persist() writes only the changed nodes back. No graph DB — at hackathon
scale a rehydrate-per-request DiGraph is plenty fast (roadmap Section 2).
"""

from __future__ import annotations

from typing import Any, Literal

import networkx as nx

NodeStatus = Literal["planned", "confirmed", "at_risk", "broken"]
NodeType = Literal["transport", "stay", "activity", "meal"]


class TripGraph:
    def __init__(self, trip_id: str):
        self.trip_id = trip_id
        self.graph = nx.DiGraph()

    @classmethod
    def rehydrate(cls, trip_id: str, nodes: list[dict[str, Any]], edges: list[dict[str, Any]]) -> "TripGraph":
        """Build an in-memory graph from Postgres rows already fetched by the caller.

        Postgres's `nodes.type` column (a sensible SQL name, constrained by a
        CHECK) becomes `category` on the graph node — every consumer of a
        graph node (ripple_engine, recovery_ranker) reads `category`, matching
        the seed JSON's field name. Without this normalization, a persisted
        trip's category always reads as None: confirmed by testing against a
        real row, not assumed — recovery_ranker silently returned zero plans.
        """
        tg = cls(trip_id)
        for node in nodes:
            attrs = dict(node)
            attrs.setdefault("category", attrs.get("type"))
            tg.graph.add_node(node["id"], **attrs)
        for edge in edges:
            tg.graph.add_edge(
                edge["from_node_id"],
                edge["to_node_id"],
                dependency_type=edge.get("dependency_type", "temporal"),
                buffer_minutes=edge.get("buffer_minutes", 0),
            )
        return tg

    def add_node(self, node_id: str, **attrs: Any) -> None:
        self.graph.add_node(node_id, **attrs)

    def add_edge(self, from_id: str, to_id: str, dependency_type: str = "temporal", buffer_minutes: int = 0) -> None:
        self.graph.add_edge(from_id, to_id, dependency_type=dependency_type, buffer_minutes=buffer_minutes)

    def set_status(self, node_id: str, status: NodeStatus) -> None:
        self.graph.nodes[node_id]["status"] = status

    def descendants(self, node_id: str) -> list[str]:
        """Every node downstream of node_id — what the Ripple Engine marks at_risk."""
        return list(nx.descendants(self.graph, node_id))

    def ordered_nodes(self) -> list[dict[str, Any]]:
        """Nodes in a valid dependency order (topological), for rendering the itinerary."""
        return [self.graph.nodes[n] for n in nx.topological_sort(self.graph)]

    def to_dict(self) -> dict[str, Any]:
        return {
            "trip_id": self.trip_id,
            "nodes": [self.graph.nodes[n] for n in self.graph.nodes],
            "edges": [
                {"from_node_id": u, "to_node_id": v, **d}
                for u, v, d in self.graph.edges(data=True)
            ],
        }
