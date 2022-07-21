export interface Stream<T> {
  toArray: () => T[]
  filter: (predicate: (value: T, index: number) => boolean) => Stream<T>
  map: <U>(mapperFn: (value: T, index: number) => U) => Stream<U>
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

  filter (predicate: (value: T, index: number) => boolean): Stream<T> {
    return new Filtering(predicate, this).toStream()
  }

  map<U> (mapperFn: (value: T, index: number) => U): Stream<U> {
    return new Mapping(mapperFn, this).toStream()
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
