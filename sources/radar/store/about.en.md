Lets an agent watch other agents. When the watched one gets into trouble, Radar sends a message to whoever should hear about it. A watch has three levels, each including the one before:

| Level | When it alerts |
|---|---|
| Trouble (default) | It stopped with an error; it is gone (its engine quit unexpectedly, or the task was archived or deleted); it seems stuck: still working, but no new action for 30 minutes (adjustable). Stuck is judged only for open panel agents; terminal agents and panel agents not open show no last action |
| Needs you | All of the above, plus waiting for a person to approve an action, answer a question, review a plan or handle a dialog |
| Everything | All of the above, plus every finished turn, with the last thing it said (up to 1,500 characters) |

One event alerts once; the next alert waits until the watched agent starts working again. Messages are marked "from Radar" and need no reply. They are written in Gugu's interface language at the time (Chinese or English).

When the watched task or the one receiving alerts is gone (archived or deleted), the watch ends and is removed; how many alerts went along that path is kept, and a later watch between the same pair counts on.

## How to use it

In a task, tell the agent "keep an eye on that task and tell me if it breaks" or "call me when it's done", and it sets up a watch for you; you can say the level and who receives the alerts. Watching the same agent again for the same person changes the existing watch. To stop, tell the agent, or press Stop in the tab's Watching list.

## Limits

- "Finished" forwards the watched agent's last words (up to 1,500 characters) as they are to the receiver, which may be a third agent. Think about who should see them before you subscribe.
- While the background page is not running (Gugu closed, Radar just installed or restarted), events are missed: after it starts it records the state it sees then, without comparing to before, so nothing is reported late.
- You can watch agents on any of your account's computers, and send alerts to an agent on another computer. Other computers are read every 30 seconds; alerts name the computer and when it was read. While that computer is offline the watch stays and is not treated as the task being gone.
- It also runs on a Gugu server without a window, which needs Chrome or Chromium installed.
- An agent on another computer cannot have its last words read yet; a cross-computer "finished" alert says so.
- When someone stops a running task on purpose, Radar treats it neither as an error nor as finished.

## The tab

The top bar shows the graph's counts by state and the background heartbeat; alerts are grouped by day and can be filtered to trouble, waiting or finished, with the reason when one was not delivered. The Watching list shows each target, level and count, and can stop a watch. Click a node for its state and watches, a line for the path of its alerts. In a narrow panel the graph is above and alerts and watches below.

Opened in a task it is a local graph centred on that task's agent (1–3 hops); elsewhere it is the whole graph. A dot is an agent, coloured by its state now; a line is the path an alert takes, from the watched agent to the receiver, with the number of alerts delivered along it (none: no number). When an alert is sent a light runs along the line and the number goes up with a little jump; one not delivered breaks halfway and the line turns red. States move too: working dots breathe, dots waiting for approval pulse slowly, troubled dots turn red and shake, idle dots fade, gone dots are translucent with a dashed outline. Hover to keep a dot and its neighbours lit; hover or click for one sentence saying who alerts whom, since when and how often. Drag nodes, scroll to zoom, drag the background to pan. With Reduce Motion on, none of this moves and the graph is laid out once. "Open this task" on a node goes to that task.
