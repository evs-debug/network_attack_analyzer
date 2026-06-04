# Network Attack Analyzer Architecture

## Node Types

- Internet
- Firewall
- Web Server
- Application Server
- Database
- Domain Controller
- Workstation

## Edge Types

- HTTP
- HTTPS
- SSH
- RDP
- SMB

## Node Attributes

- id
- name
- type
- criticality_score
- vulnerability_score

## Edge Attributes

- source
- target
- connection_type
- access_level

## Graph Type

Directed Graph

Reason:
Attack movement has direction.

Example:

Internet -> Web Server -> Database -> Domain Controller

An attacker may be able to move from A to B,
but not necessarily from B to A.

## Risk Score Formula

Risk Score =
Vulnerability Score × Criticality Score

Example:

Web Server:
Vulnerability = 8
Criticality = 5

Risk = 40

## Example Network

Internet
    |
Firewall
    |
Web Server
    |
Database
    |
Domain Controller

## Algorithms

### BFS

Used to find all reachable systems from a compromised node.

### DFS

Used to explore attack paths.

### Dijkstra

Used to find lowest-cost attack paths.

### Topological Sort

Used to analyze dependency chains.

### Critical Node Detection

Used to identify systems whose removal significantly reduces attacker reach.