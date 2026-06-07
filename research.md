# Network Attack Analyzer — Research Document

## 1. Attack Path Analysis Overview

An **attack path** is the sequence of systems an attacker moves through after compromising an initial system to reach more valuable or critical assets.

### Example

**Internet → Web Server → Database → Domain Controller**

Attackers rarely stop at the first system. Instead, they move deeper into the network.

### Why Attackers Move Between Systems

* The first system may not contain valuable data
* They want higher privileges
* They want sensitive information
* They want control of critical systems

### Lateral Movement

**Lateral movement** is moving between systems inside a network after the initial compromise.

### Example

**Employee Laptop → File Server → Database**

### Why Attack Paths Are Dangerous

* Small breaches can lead to full network compromise
* Attackers can reach high-value systems
* Attackers may gain administrator-level access
* Detection becomes harder once inside the network

---

## 2. High-Risk Assets

Risk depends on:

* **Vulnerability**
* **Criticality**
* **Asset Value**

### Vulnerability

How easy a system is to compromise.

**Examples:**

* Weak passwords
* Outdated software
* Misconfigurations

### Criticality

How important a system is to operations.

**Examples:**

* Domain Controllers
* Authentication systems
* Payment systems

### Asset Value

The value of the data or resources inside a system.

**Examples:**

* Customer databases
* Financial data
* HR records

### Key Difference

* **Criticality** = importance to operations
* **Asset Value** = importance of data

### Why Databases and Domain Controllers Are High Risk

* **Databases** contain valuable data
* **Domain Controllers** manage authentication across the network

---

## 3. CVSS Summary

**CVSS (Common Vulnerability Scoring System)** is a standard used to measure vulnerability severity.

### Scale

**0.0 → 10.0**

### Severity Levels

* **0.0** = None
* **0.1–3.9** = Low
* **4.0–6.9** = Medium
* **7.0–8.9** = High
* **9.0–10.0** = Critical

### Why CVSS Is Used

* Prioritize vulnerabilities
* Manage security risk
* Allocate resources
* Standardize severity ratings

### Key Factors in CVSS

* Exploitability (how easy it is to attack)
* Impact (damage caused)
* Access requirements

### Example Scores

* **4.2** → Medium severity
* **9.8** → Critical severity

### Important Distinction

* **CVSS** = vulnerability severity
* **Criticality** = system importance
* **Asset Value** = data value

---

## 4. Existing Attack Path Tools

Most attack path tools use **graph-based models (nodes and edges)** to represent attack paths.

### Microsoft Defender Attack Path Analysis

* Visualizes attack paths in enterprise networks
* Identifies risky routes to critical assets
* Highlights weak entry points

### BloodHound

* Maps users, computers, and permissions
* Shows Active Directory attack paths
* Highlights privilege escalation paths

**Key Idea:** Shows how users can become administrators.

### Wiz (Cloud Security)

* Analyzes cloud environments (AWS, Azure, GCP)
* Detects misconfigurations and exposed resources
* Maps cloud attack paths

### Common Features Across These Tools

* Everything is modeled as a graph
* Attack paths are visualized
* Critical assets are highlighted
* Risk is prioritized

---

## 5. Risk Scoring Ideas

**Risk scoring** measures how dangerous a system or attack path is.

### Basic Formula

**Risk = CVSS × Criticality × Asset Value**

### Improved Formula Ideas

#### 1. Basic Risk

**Risk = CVSS × Criticality × Asset Value**

#### 2. Attack Path Risk

**Risk = CVSS × Criticality × Asset Value × Reachability**

#### 3. Exposure Risk

**Risk = CVSS × Criticality × Asset Value × Exposure**

### Other Factors Affecting Risk

* Path length
* Number of reachable systems
* Privilege level
* Exposure (internet-facing vs internal)

### Key Idea

Risk depends not only on vulnerability but also on system importance, data value, and network connectivity.

---

## 6. Review & Conclusion

This research explains how attackers move through networks using attack paths and graph models. It also explores how systems can be ranked using risk scoring based on vulnerability, criticality, and asset value.

These concepts form the foundation of a **Network Attack Analyzer**, which identifies, visualizes, and prioritizes high-risk systems in a network.

# 7. References

Microsoft. (n.d.). *Microsoft Defender for Cloud documentation*. Retrieved June 8, 2026, from https://learn.microsoft.com/

BloodHound Enterprise. (n.d.). *BloodHound documentation*. Retrieved June 8, 2026, from https://bloodhound.specterops.io/

Wiz. (n.d.). *Wiz documentation*. Retrieved June 8, 2026, from https://www.wiz.io/

FIRST.org. (n.d.). *Common Vulnerability Scoring System (CVSS)*. Retrieved June 8, 2026, from https://www.first.org/cvss/

Microsoft. (n.d.). *What is lateral movement?* Retrieved June 8, 2026, from https://learn.microsoft.com/

IBM. (n.d.). *What is an attack path?* Retrieved June 8, 2026, from https://www.ibm.com/topics/
