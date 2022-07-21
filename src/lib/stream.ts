export interface Stream<T> {
  toArray: () => T[]
  filter: (predicate: (value: T, index: number) => boolean) => Stream<T>
  map: <U>(mapperFn: (value: T, index: number) => U) => Stream<U>
  flatMap: <U>(mapperFn: (value: T, index: number) => U[]) => Stream<U>
  sorted: (compareFn?: (a: T, b: T) => number) => Stream<T>
  isEmpty: () => boolean
  head: () => T | undefined
  last: () => T | undefined
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

export function empty<T> (): Stream<T> {
  return fromArray<T>([])
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

  filter (predicate: (value: T, index: number) => boolean): Stream<T> {
    return new Filtering(predicate, this).toStream()
  }

  map<U> (mapperFn: (value: T, index: number) => U): Stream<U> {
    return new Mapping(mapperFn, this).toStream()
  }

  flatMap<U> (mapperFn: (value: T, index: number) => U[]): Stream<U> {
    const mapped = new Mapping(mapperFn, this).toStream() as IterableStream<U[]>
    return new Flattening(mapped).toStream()
  }

  * asIterator (): Iterator<T> {
    const iterator = this.iteratorFn()
    let next = iterator.next()

    while (next !== undefined && next.done === false) {
      const value = next.value

      yield value

      next = iterator.next()
    }
  }

  sorted (compareFn: ((a: T, b: T) => number) | undefined): Stream<T> {
    return new Sorting(compareFn, this).toStream()
  }

  isEmpty (): boolean {
    const iterator = this.iteratorFn()
    const next = iterator.next()

    return !(next !== undefined && next.done === false)
  }

  head (): T | undefined {
    const iterator = this.iteratorFn()
    const next = iterator.next()

    if (next !== undefined && next.done === false) {
      return next.value
    }

    return undefined
  }

  last (): T | undefined {
    const iterator = this.iteratorFn()
    let next = iterator.next()
    let value: T | undefined

    while (next !== undefined && next.done === false) {
      value = next.value
      next = iterator.next()
    }

    return value
  }
}

class Filtering<T> {
  constructor (
    private readonly predicate: (value: T, index: number) => boolean,
    private readonly stream: IterableStream<T>
  ) {
  }

  private* asIterator (): Iterator<T> {
    let index = 0

    const iterator = this.stream.asIterator()
    let next = iterator.next()

    while (next !== undefined && next.done === false) {
      const value = next.value

      if (this.predicate(value, index)) {
        yield value
      }

      index += 1
      next = iterator.next()
    }
  }

  public toStream (): Stream<T> {
    return new IterableStream(() => this.asIterator())
  }
}

class Mapping<T, U> {
  constructor (
    private readonly mapperFn: (value: T, index: number) => U,
    private readonly stream: IterableStream<T>
  ) {
  }

  private* asIterator (): Iterator<U> {
    let index = 0

    const iterator = this.stream.asIterator()
    let next = iterator.next()

    while (next !== undefined && next.done === false) {
      const value = next.value

      yield this.mapperFn(value, index)

      index += 1
      next = iterator.next()
    }
  }

  public toStream (): Stream<U> {
    return new IterableStream(() => this.asIterator())
  }
}

class Flattening<T> {
  constructor (
    private readonly stream: IterableStream<T[]>
  ) {
  }

  private* flatten (): Iterator<T> {
    const iterator = this.stream.asIterator()
    let next = iterator.next()

    while (next !== undefined && next.done === false) {
      const value = next.value

      yield* value

      next = iterator.next()
    }
  }

  public toStream (): Stream<T> {
    return new IterableStream(() => this.flatten())
  }
}

class Sorting<T> {
  constructor (
    private readonly compareFn: ((a: T, b: T) => number) | undefined,
    private readonly stream: Stream<T>,
  ) {
  }

  private sorted (): T[] {
    const items: T[] = this.stream.toArray()
    return items.sort(this.compareFn)
  }

  public toStream (): Stream<T> {
    const sortedItems = this.sorted()
    return fromArray(sortedItems)
  }
}
