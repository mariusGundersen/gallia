type Change = "INSERT" | "UPDATE" | "DELETE";

type Keyed = { key: string };

interface Callbacks<T extends Keyed> {
  insert(item: T): void;
  move(item: T): void;
  noop(): void;
  remove(item: T): void;
}

export default function listDiff<T extends Keyed>(
  listA: T[],
  listB: T[],
  callbacks: Callbacks<T>
) {
  let a = 0;
  const la = listA.length;

  const mapA = new Map(listA.map((item) => [item.key, item]));
  const mapB = new Map(listB.map((item) => [item.key, item]));

  const valuesB = mapB.values();

  // loop through all new items
  loopB: for (const itemB of valuesB) {
    // we might need to move through only the old items
    loopA: while (true) {
      // if there are still items in the old list, we should compare them
      if (a < la) {
        const itemA = listA[a];

        if (itemA.key === itemB.key) {
          // the item is in the correct locations
          // the index might have changed though
          // todo: handle index changed
          callbacks.noop();
          a++;
          continue loopB;
        } else {
          // the item is not in the correct location
          const itemAExistsInListB = mapB.has(itemA.key);
          const itemBExistsInListA = mapA.has(itemB.key);

          if (itemAExistsInListB == itemBExistsInListA) {
            callbacks.move(itemB);
            a++;
            continue loopB;
          } else if (!itemAExistsInListB) {
            callbacks.remove(itemA);
            a++;
            continue loopA;
          } else if (!itemBExistsInListA) {
            callbacks.insert(itemB);
            continue loopB;
          }
        }
      } else {
        // if there are no more items in the old list
        // then we just insert the new items
        callbacks.insert(itemB);
        continue loopB;
      }
    }
  }

  for (; a < la; a++) {
    callbacks.remove(listA[a]);
  }
}
