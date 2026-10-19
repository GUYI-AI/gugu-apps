/** Subscribe before the first read: a retained page can be bound after that
 * read's deadline. The later authoritative context must still start the page. */
export async function startPageContext({ read, subscribe, accept, reject }) {
  let changed = false;
  subscribe((next) => {
    changed = true;
    accept(next);
  });
  try {
    const initial = await read();
    // A newer context event can overtake the initial asynchronous read.
    if (!changed) accept(initial);
  } catch (error) {
    if (!changed) reject(error);
  }
}
