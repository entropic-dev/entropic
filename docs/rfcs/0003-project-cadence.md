# Project Cadence

A proposal for setting project work cadence

- Version: DRAFT
- Date: 06/17/2019
- Authors
  - Chris Dickinson <chris@neversaw.us>

## problem statement

Entropic is getting a lot of attention. This is **great**! However, because of
the excitement, it means we have more issues and PRs to keep up with. We're
attempting to interleave multiple different tasks: keeping up with ongoing
conversations, moderation, code review, cross-maintainer coordination, and,
well, our day jobs.

We've also implicitly valued reaching "issue count 0" because we want
collaborators to feel welcomed to the project. In order to reach that goal
we've had to move quickly. As a result of moving quickly:

- We're making mistakes,
- Coordination suffers because we're _reacting_ to PRs instead of prioritizing
  and discussing problems up front,
- Quality of code review and moderation suffers because of context switching
  across tasks.
- We're not left with enough attention to spread across $dayjob, entropic, and
  our personal lives.

**So, let us take a step back and state the problem:**

We wish to produce a healthy project that is capable of maintaining a federated
package ecosystem over the long run.

GitHub is a useful platform but it is incentivized to make people believe that
project health is directly correlated to issue & PR count. **It's not.** GitHub is
encouraging us to move fast at the expense of coordination.

Context switching and lack of coordination are increasing friction, and the
more the friction increases the faster we have to move to stay in the same
place, making coordination worse. We are working in a reactive mode, and that
is unlikely to produce a healthy project. We should do something about this!

* * *

## Antigoals

We want to specifically avoid:

- Slowing down too much and killing project momentum.
- Overspecifying process. **Process is a system, and as a system it is subject to
  Gall's law.** We must start by describing a working process, and then suggest
  course corrections that we believe will lead to better outcomes.
- If we are struggling with coordination with two maintainers, adding another
  maintainer will not speed us up. We must figure out coordination first.

* * *

## Proposed Solution

There are two main obstacles that our reactive mode presents: coordination and
context switching.

We must move out of a reactive mode of work and towards proactive planning and
paced execution. How?

**We set healthy boundaries.**

We reduce context switching by dividing work. There are four tasks:

1. **Moderation.** The closest thing we have to on-call today. We owe
   moderation to participants in our community, and moderation is a constant
   duty.
2. **Coordination.** What are the most important problems we want to solve in
   the next 1-2 weeks? Who will work on them? What do we need to investigate?
3. **Execution.** Acting on our coordinated plans. Research, guided discussion,
   writing code, etc.
4. **Discussion and code review.** These are interrupting tasks in that they
   pop up on the fly.

### 1st step: onboard moderators

We onboard new moderators, define moderation policies, and divide the work of
moderation across multiple days. Moderators should be responsible for
moderation 1-2 days a week. This involves keeping up to date with the issue
tracker, PR reviews, and discourse instance. Ongoing incidents or problems to
watch should be tracked in private topics on discourse to faciliate handoff.

On this note: say "hello!" to [our new moderators](/README.md#moderators)! :tada:

### 2nd step: "what's next?"

We move back to a "what's next?" model for coordination and execution. This is
modeled after how the project was developed before launch. 1-2 times a week --
as we got tasks done or started to need to make decisions -- ceej and I would
meet in person and go through an informal agenda of decisions that needed to be
made and end with "what's next?" As in: what are the next most important tasks,
and how will we divide the work?

Now: these days we have more people involved (thank you!) so we should tweak
this. I propose we meet once a week with a prepared agenda, walk through the
items, and seek to produce a list of "what's next" with who will own the task.
If we don't know who will own the task, we open an issue and defer the work to
next week. I am not picky about where we meet, except that the agenda and end
product should be accessible to anyone interested in the project. This means we
could televise a google hangout on youtube, or meet via chat & make sure to
post transcripts, or in a discourse topic. We should feel this out. The goal is
decide proactively what the project should focus on next, and communicate those
decisions out.

Note: this **specifically limits** the number of decisions we can make on a
week-by-week basis. I feel this is important: we have a _ton_ of decisions to
make about syncing, package run-scripts, windows support, etc. This is not to
say folks should stop talking about them! However, folks shouldn't expect a
final decision on them until they come up on a "what's next" agenda. We'll form
these agendas by looking at what's most pressing to the project, including
looking at issues & discourse. Put another way: the discussions you are having
up-front are important research: please keep having them!

As we include more maintainers, we can make more decisions per cycle & keep
in-sync through this format.

### 3rd step: set boundaries

We set the standard of "no decisions on weekends." Folks can hack over a
weekend, you can provide preliminary code review over a weekend, but no final
decisions will be made. You should not feel the need to keep updated on the
issue tracker unless you happen to be moderating that day. Go recreate.
