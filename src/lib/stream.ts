export interface Stream<T> {
  toArray: () => T[]
}

export function intRange (
  start: number,
  hasNext: (x: number) => boolean,
  next: (x: number) => number = (x) => x + 1
): Stream<number> {
  function* generate (): Iterator<number> {
    let x: number = start

    while (hasNext(x)) {
      yield x
      x = next(x)
    }
  }

  return new IterableStream(generate)
}

export function fromArray<T> (items: T[]): Stream<T> {
  function* generate (): Iterator<T> {
    for (const item of items) {
      yield item
    }
  }

  return new IterableStream(generate)
}

class IterableStream<T> implements Stream<T> {
  constructor (private readonly iteratorFn: () => Iterator<T>) {
  }

  toArray (): T[] {
    let items: T[] = []
    const iterator = this.iteratorFn()
    let next = iterator.next()

    while (next !== undefined && next.done === false) {
      items = [...items, next.value]
      next = iterator.next()
    }

    return items
  }
}
