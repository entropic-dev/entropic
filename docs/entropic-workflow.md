# A workflow for Entropic

This project has to this point been a close collaboration between two people who worked together for several years, and have an established workflow. If we want to succeed with this project, we'll need a successful workflow for collaborating asynchronously with people who don't know each other as well. I have some suggestions based on both things  I've done with teams and the past and descriptions of other successful processes.

In this one-pager I propose a workflow and discuss some of the tradeoffs.

## tl;dr

There is no process that will replace talking to people. Write a problem statement and proposed solution. Share it privately with one or more contributors and ask for feedback ahead of starting a public discussion. Be most formal when the problem is especially tricky or contentious.

## A workflow


- Start a discussion about a problem you think needs to be solved. This might be a missing feature, or a an API that needs to be designed, or some other thing you think the project would benefit from.
- This initial discussion should focus on *developing a clear problem statement* and *gathering information about the problem.* We can also discuss possible solutions & their tradeoffs.
- Larger or more contentious discussions should have a moderator gently keeping people on track. If you're the proposer, you shouldn't moderate the discussion. This will free you to have opinions.
- When the discussion reaches a conclusion, close it.
- Write a one-pager summarizing the discussion and the conclusions reached. If it's appropriate, this document should be a concrete proposal for actiing on the conclusions. This might be a spec for implementing a new feature, a plan of action for doing something, or documentation.
- We then engage in a new discussion, moderated by somebody who isn't the document author, improving the proposal. This discussion shouldn't relitigate the problem statement unless new information makes us do so. Our goal should be *constructive comment*  making the proposal the best it can possibly be.
- Redraft as necessary.
- Act.

Following the steps above dogmatically should *not* be a goal. Instead we should follow the spirit of the workflow: discuss to understand the problem; be thoughtful & propose action; make the proposal better; act. The bigger the problem is, or the more people are involved in the discussion, the more formal our process should be.

For example, discussing how to fix a small bug might take only a few commments in a Github issue. Discussing how to fingerprint Entropic instances to establish a trust network might require the full process, because it's important and we need to think carefully about security issues. (I expect to do the same with package signing!)

If a consensus doesn't emerge, @chrisdickinson and @ceejbot will make final decisions. This isn't ideal, but I think until the projects design values & technical goals are widely shared, we'll have to fall back to this to break stalemates & values conflicts. Also, Chris & Ceej bear the final responsibility so it's fair to make them do the hard work.

## Tradeoffs

This process is going to be hard on people who aren't fluent in English. I'm not sure how to address this.

This process can be slow.

Sometimes reaching a decision doesn't mean everybody agrees with the decision. People acting in good faith who share the same information and goals will generally reach a conesnsus, however.
