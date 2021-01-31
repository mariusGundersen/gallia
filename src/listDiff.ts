type Keyed = { key: string };

interface Callbacks<T extends Keyed> {
  noop(item: T): void;
  insert(newItem: T): void;
  move(oldItem: T): void;
  remove(oldItem: T): void;
}

function toEntry<T extends Keyed>(item: T, index: number) {
  return [item.key, { item, index }] as const;
}

export default function listDiff<T extends Keyed>(
  listA: T[],
  listB: T[],
  callbacks: Callbacks<T>
) {
  let a = 0;
  const la = listA.length;

  const mapA = new Map(listA.map(toEntry));
  const mapB = new Map(listB.map(toEntry));

  const valuesB = mapB.values();

  // loop through all new items
  loopB: for (const { item: itemB } of valuesB) {
    // we might need to move through only the old items
    loopA: while (true) {
      // if there are still items in the old list, we should compare them
      if (a < la) {
        const itemA = listA[a];

        // The item is in the correct locations
        // The index might have changed though
        // TODO: handle index changed
        if (itemA.key === itemB.key) {
          callbacks.noop(itemB);
          a++;
          continue loopB;
        } else {
          // The item is not in the correct location
          // There are four possible scenarios here:
          // - the item that was here has moved somewhere else and the item that is now here has moved from somewhere else
          //   -> move the item that is here now from it's previous location, deal with the item that was here later
          // - the item that was here has been removed and the item that is here now is a new item
          //   -> replace the item that was here with the new item
          // - the item that was here has been removed, the new item has moved from sowhere else
          // - the item that was here has been moved somewhere else and a new item has been inserted

          const itemAExistsInListB = mapB.get(itemA.key);
          const itemBExistsInListA = mapA.get(itemB.key);

          if (itemAExistsInListB && itemBExistsInListA) {
            // The item that was here has been moved to somewhere else
            // The item that is here has been moved from sowhere else
            if (itemBExistsInListA.index === a + 1) {
              // if the item that is here was one step ahead
              // since the item that was here has been moved, we will deal with it later
              // when we discover where it was moved.
              // Since the item that is here was one step ahead, it will move to this spot
              // when the item that was here is moved, so we don't need to do anything.
              a++;
              continue loopA;
            } else if (itemAExistsInListB.index > a) {
              // if the item that was here is somewhere further ahead
              callbacks.move(itemB);
              continue loopB;
            } else {
              callbacks.move(itemB);
              a++;
              continue loopB;
            }
          } else if (!itemAExistsInListB && !itemBExistsInListA) {
            // the item that was here has been removed
            // the item that is here has been inserted
            callbacks.remove(itemA);
            callbacks.insert(itemB);
            a++;
            continue loopB;
          } else if (!itemAExistsInListB && itemBExistsInListA) {
            // the item that was here has been removed
            // the item that is here has been moved from somewhere else
            callbacks.remove(itemA);
            if (itemBExistsInListA.index === a + 1) {
              a++;
              continue loopA;
            } else {
              callbacks.move(itemB);
              a++;
              continue loopB;
            }
          } else if (!itemBExistsInListA && itemAExistsInListB) {
            callbacks.insert(itemB);
            continue loopB;
          }
        }
      } else {
        // if there are no more items in the old list
        // then we just insert the new items
        const itemBExistsInListA = mapA.get(itemB.key);
        if (itemBExistsInListA) {
          callbacks.move(itemB);
        } else {
          callbacks.insert(itemB);
        }
        continue loopB;
      }
    }
  }

  for (; a < la; a++) {
    const itemA = listA[a];
    const itemAExistsInListB = mapB.get(itemA.key);
    if (!itemAExistsInListB) {
      callbacks.remove(itemA);
    }
  }
}
