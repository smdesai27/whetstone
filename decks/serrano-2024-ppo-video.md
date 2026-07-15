---
title: "Serrano 2024: PPO for Training LLMs"
source: "https://www.youtube.com/watch?v=..."
created: 2026-07-12
tags: [rl, ppo, rlhf]
---

Serrano's PPO walkthrough. Ingested 2026-07-12; first-session weak spots — confused the
probability ratio with momentum, confused the *value* of the clipped objective with its
*gradient*, and said the RLHF reward is direct human approval (it's a learned reward model).
The seven original recall items were re-targeted to five load-bearing concepts.

### C1  The probability ratio is an importance-sampling correction
- tier: core
- anchor: "the ratio corrects for the fact the data was collected by the old policy"
- model: The surrogate objective multiplies the advantage by the ratio pi_new(a|s)/pi_old(a|s). That ratio is an importance-sampling correction — it reweights returns collected under the old policy so the gradient estimates the NEW policy's expected return, which is what lets PPO reuse a batch for several epochs. It is not a momentum or velocity term; it's a distribution-mismatch fix.
- probes: derive-why-a-ratio | why-not-a-raw-logprob-difference | what-breaks-without-it | contrast:momentum | connect:your-RLHF-work
- weak-on: 2026-07-12 confused the ratio with momentum
- stage: 0
- due: 2026-07-16
- history: 2026-07-12 fail
- status: active

### C2  Clipping kills the gradient — it doesn't cap a value
- tier: core
- anchor: "once the ratio leaves [1−eps, 1+eps] the objective goes flat"
- model: When advantage>0 and the ratio exceeds 1+eps (or advantage<0 and it drops below 1−eps), the clipped objective becomes FLAT in the policy parameters, so its gradient is zero — the sample stops contributing and there's no incentive to push that action further. The trap is picturing clipping as capping a number; what matters is flat objective ⇒ zero gradient ⇒ per-sample switch-off.
- probes: value-vs-gradient | what-is-the-derivative-doing-here | which-side-clips-when-advantage-is-negative | what-if-you-optimized-the-unclipped-ratio-for-many-epochs
- weak-on: 2026-07-12 confused the objective's value with its gradient
- stage: 0
- due: 2026-07-16
- history: 2026-07-12 partial
- status: active

### C3  Advantage: train on the gain, not raw returns
- tier: core
- anchor: "advantage = how much better than expected this action turned out"
- model: The advantage (gain) is the return minus a baseline — the value function's estimate for that state: how much better an action did than expected. Training the policy on advantage instead of raw returns subtracts that state-value baseline, which cuts gradient variance without biasing the direction: you reinforce actions that beat expectation, not actions that merely happened to occur in already-high-value states.
- probes: what-is-advantage | why-subtract-a-baseline | why-not-raw-returns | connect:variance-in-your-training
- weak-on:
- stage: 0
- due: 2026-07-16
- history: 2026-07-12 partial
- status: active

### C4  The RLHF mapping — and the reward is a learned model
- tier: core
- anchor: "the reward comes from a reward model trained on human preferences, not from a human in the loop"
- model: In RLHF-as-PPO: state = the prompt plus tokens generated so far, action = the next token, policy = the LLM. The reward is NOT direct human approval — it's a scalar from a separate reward model trained on human preference comparisons, typically applied at sequence end, often with a per-token KL penalty against a frozen reference model. Human feedback trains the reward model; PPO then optimizes the policy against that model.
- probes: map-state-action-reward | what-actually-produces-the-reward-signal | why-a-reward-model-instead-of-humans | role-of-the-KL-penalty
- weak-on: 2026-07-12 said the reward is direct human approval
- stage: 0
- due: 2026-07-16
- history: 2026-07-12 fail
- status: active

### C5  "On-policy," yet it reuses a batch — reconcile that
- tier: gist
- anchor: "the clipped ratio keeps the update near the old policy, so the batch stays usable"
- model: PPO is on-policy in that its objective is only valid while the new policy stays close to the old one that collected the data. The ratio plus clipping enforce that closeness, so you can safely reuse the same batch for a few epochs before the approximation degrades and you must resample. The reuse is bounded proximity, not true off-policy learning.
- probes: reconcile-onpolicy-with-batch-reuse | when-does-reuse-break-down | how-does-clipping-enforce-closeness
- weak-on:
- stage: 0
- due: 2026-07-16
- history: 2026-07-12 partial
- status: active
