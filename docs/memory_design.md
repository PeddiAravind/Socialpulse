# Memory design

SocialPulse memory is experience-oriented:

**what we tried -> what happened -> what evidence supports the observation -> when it may not apply -> how future strategy should change**

Memory categories:
- Brand facts
- Explicit owner preferences
- Performance observations
- Strategy lessons

Hindsight is the persistent layer. Each brand receives an isolated memory bank. The current implementation uses the official `hindsight-client` operations: create bank, retain, recall, and list memories.

The MVP deliberately keeps the recommendation policy deterministic and explainable. A configurable LLM can be inserted later after evidence + memory retrieval.
