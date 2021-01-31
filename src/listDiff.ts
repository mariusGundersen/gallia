type Keyed = { key: string };

export interface Callbacks<T extends Keyed> {
  noop(item: T): void;
  insert(newItem: T): void;
  move(item: T): void;
  remove(prevItem: T): void;
}

export default function listDiff<T extends Keyed>(
  listPrev: T[],
  mapPrev: Map<string, number>,
  listCurrent: T[],
  callbacks: Callbacks<T>
) {
  let prevIndex = 0;
  const lengthPrev = listPrev.length;
  let currentIndex = 0;
  const lengthCurrent = listCurrent.length;

  const mapCurrent = new Map<string, number>();
  for (currentIndex = 0; currentIndex < lengthCurrent; currentIndex++) {
    mapCurrent.set(listCurrent[currentIndex].key, currentIndex);
  }

  // loop through all new items
  for (prevIndex = 0, currentIndex = 0; currentIndex < lengthCurrent; ) {
    const itemCurrent = listCurrent[currentIndex];
    // if there are still items in the old list, we should compare them
    if (prevIndex < lengthPrev) {
      const itemPrev = listPrev[prevIndex];

      // The item is in the correct locations
      // The index might have changed though
      // TODO: handle index changed
      if (itemPrev.key === itemCurrent.key) {
        callbacks.noop(itemCurrent);
        prevIndex++;
        currentIndex++;
      } else {
        // The item is not in the correct location
        // There are four possible scenarios here:
        // - the item that was here has moved somewhere else and the item that is now here has moved from somewhere else
        //   -> move the item that is here now from it's previous location, deal with the item that was here later
        // - the item that was here has been removed and the item that is here now is a new item
        //   -> replace the item that was here with the new item
        // - the item that was here has been removed, the new item has moved from sowhere else
        // - the item that was here has been moved somewhere else and a new item has been inserted

        const itemAIndexInListB = mapCurrent.get(itemPrev.key);
        const itemAExistsInListB = itemAIndexInListB !== undefined;
        const itemBIndexInListA = mapPrev.get(itemCurrent.key);
        const itemBExistsInListA = itemBIndexInListA !== undefined;

        if (itemAExistsInListB && itemBExistsInListA) {
          // The item that was here has been moved to somewhere else
          // The item that is here has been moved from sowhere else
          if (itemBIndexInListA === prevIndex + 1) {
            // if the item that is here was one step ahead
            // since the item that was here has been moved, we will deal with it later
            // when we discover where it was moved.
            // Since the item that is here was one step ahead, it will move to this spot
            // when the item that was here is moved, so we don't need to do anything.
            prevIndex++;
          } else if ((itemAIndexInListB as number) > prevIndex) {
            // if the item that was here is somewhere further ahead
            callbacks.move(itemCurrent);
            currentIndex++;
          } else {
            callbacks.move(itemCurrent);
            prevIndex++;
            currentIndex++;
          }
        } else if (!itemAExistsInListB && !itemBExistsInListA) {
          // the item that was here has been removed
          // the item that is here has been inserted
          callbacks.remove(itemPrev);
          callbacks.insert(itemCurrent);
          prevIndex++;
          currentIndex++;
        } else if (!itemAExistsInListB && itemBExistsInListA) {
          // the item that was here has been removed
          // the item that is here has been moved from somewhere else
          callbacks.remove(itemPrev);
          if (itemBIndexInListA === prevIndex + 1) {
            prevIndex++;
          } else {
            callbacks.move(itemCurrent);
            prevIndex++;
            currentIndex++;
          }
        } else if (!itemBExistsInListA && itemAExistsInListB) {
          callbacks.insert(itemCurrent);
          currentIndex++;
        }
      }
    } else {
      // if there are no more items in the old list
      // then we just insert the new items
      const itemBExistsInListA = mapPrev.has(itemCurrent.key);
      if (itemBExistsInListA) {
        callbacks.move(itemCurrent);
      } else {
        callbacks.insert(itemCurrent);
      }
      currentIndex++;
    }
  }

  for (; prevIndex < lengthPrev; prevIndex++) {
    const itemA = listPrev[prevIndex];
    const itemAExistsInListB = mapCurrent.has(itemA.key);
    if (!itemAExistsInListB) {
      callbacks.remove(itemA);
    }
  }

  return mapCurrent;
}
