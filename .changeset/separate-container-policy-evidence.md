---
"@vigilioyonatan/devsecops-governance": patch
---

Separate the blocking HIGH/CRITICAL Trivy container policy from the complete SARIF evidence scan so lower-severity findings remain auditable without incorrectly failing a compliant image.
