type Keyed = { key: string };

export interface Callbacks<T extends Keyed> {
  noop(item: T): void;
  insert(newItem: T): void;
  move(item: T): void;
  remove(prevItem: T): void;
}

export default function listDiff<T extends Keyed>(
  oldList: T[],
  oldMap: Map<string, number>,
  currentList: T[],
  callbacks: Callbacks<T>
) {
  let oldIndex = 0;
  const oldLength = oldList.length;
  let currentIndex = 0;
  const lengthCurrent = currentList.length;

  const currentMap = new Map<string, number>();
  for (currentIndex = 0; currentIndex < lengthCurrent; currentIndex++) {
    currentMap.set(currentList[currentIndex].key, currentIndex);
  }

  // loop through all new items
  for (oldIndex = 0, currentIndex = 0; currentIndex < lengthCurrent; ) {
    const currentItem = currentList[currentIndex];
    // if there are still items in the old list, we should compare them
    if (oldIndex < oldLength) {
      const oldItem = oldList[oldIndex];

      // The item is in the correct locations
      // The index might have changed though
      // TODO: handle index changed
      if (oldItem.key === currentItem.key) {
        callbacks.noop(currentItem);
        oldIndex++;
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

        const indexOfOldItemInCurrentList = currentMap.get(oldItem.key);
        const oldItemExistsInCurrentList =
          indexOfOldItemInCurrentList !== undefined;
        const indexOfCurrentItemInOldList = oldMap.get(currentItem.key);
        const currentItemExistsInOldList =
          indexOfCurrentItemInOldList !== undefined;

        if (oldItemExistsInCurrentList && currentItemExistsInOldList) {
          // The item that was here has been moved to somewhere else
          // The item that is here has been moved from sowhere else
          if (indexOfCurrentItemInOldList === oldIndex + 1) {
            // if the item that is here was one step ahead
            // since the item that was here has been moved, we will deal with it later
            // when we discover where it was moved.
            // Since the item that is here was one step ahead, it will move to this spot
            // when the item that was here is moved, so we don't need to do anything.
            oldIndex++;
          } else if ((indexOfOldItemInCurrentList as number) > oldIndex) {
            // if the item that was here is somewhere further ahead
            callbacks.move(currentItem);
            currentIndex++;
          } else {
            callbacks.move(currentItem);
            oldIndex++;
            currentIndex++;
          }
        } else if (!oldItemExistsInCurrentList && !currentItemExistsInOldList) {
          // the item that was here has been removed
          // the item that is here has been inserted
          callbacks.remove(oldItem);
          callbacks.insert(currentItem);
          oldIndex++;
          currentIndex++;
        } else if (!oldItemExistsInCurrentList && currentItemExistsInOldList) {
          // the item that was here has been removed
          // the item that is here has been moved from somewhere else
          callbacks.remove(oldItem);
          if (indexOfCurrentItemInOldList === oldIndex + 1) {
            oldIndex++;
          } else {
            callbacks.move(currentItem);
            oldIndex++;
            currentIndex++;
          }
        } else if (!currentItemExistsInOldList && oldItemExistsInCurrentList) {
          callbacks.insert(currentItem);
          currentIndex++;
        }
      }
    } else {
      // if there are no more items in the old list
      // then we just insert the new items
      const indexfOfCurrentItemInOldList = oldMap.get(currentItem.key);
      if (indexfOfCurrentItemInOldList !== undefined) {
        callbacks.move(currentItem);
      } else {
        callbacks.insert(currentItem);
      }
      currentIndex++;
    }
  }

  for (; oldIndex < oldLength; oldIndex++) {
    const oldItem = oldList[oldIndex];
    const currentItemExistsInOldList = currentMap.has(oldItem.key);
    if (!currentItemExistsInOldList) {
      callbacks.remove(oldItem);
    }
  }

  return currentMap;
}
