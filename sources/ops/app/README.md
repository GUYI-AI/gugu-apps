# Operations ledger

A group's production prerequisites, evidence and release tickets, in one shared hidden `运维台账.ops.json` file.
Uses the same gugu.files live JSON and save acknowledgement as Teamboard. No backend migration, local database,
polling, private endpoint or automatic agent spawning.

`ops__board` reads; `ops__set` changes an item; `ops__ticket` prepares an independent sweep and requests a ticket.
The tool returns exact `widget_send` arguments. The requesting agent posts that card next. App programs currently
cannot send widgets themselves. The ticket and its audit record are valid even if the card was never posted.

Before items block tickets until completed with readings and evidence links, or dropped with a reason. An unanswered
human question blocks completion. Each subject gets an independent sweep, assigned to a different group agent;
the ticket requester cannot complete or waive it. Item ids use random suffixes so concurrent additions do not need
a shared sequence counter. Historical ids can be preserved on import. Shared fields follow gugu.files merge semantics.

On ticket issuance, open after items get a 24-hour deadline. Later tickets cannot extend that deadline. Overdue
follow-ups block another ticket until completed or explicitly dropped. Unbound items (`when: null`) remain visible
without becoming prerequisites for every release. No wakeups, general evidence reviews or other lists in v1.

Ticket wire format: `ops1.<base64url UTF-8 JSON>`, without a signature member. Payload: version, id, chat, list,
subject `{repo,sha}`, issuedAt, expiresAt, requestedBy (host identity), board `{file}`, open, done, dropped, after,
and sweep. Valid for 30 minutes. Evidence bodies never leave the chat in a ticket. Unsigned tickets prevent accidental
omissions; they do not authenticate against a malicious dispatcher. Group members can also edit the source file.

Caller agent, session, model and name come from the host, never tool arguments. Human file presence comes from the
host. Known boundary in v1: the host does not expose the calling agent's human owner in tool metadata.
That owner is omitted rather than inferred; other missing metadata is also never guessed. Document history and file writes
retain gugu's own attribution. Regular item changes do not send group messages.

The human page uses native gugu styles and file APIs. A question's answer is recorded, then whispered to the asker;
delivery failures are shown while retaining the answer. Human decisions still need evidence to complete the item.
