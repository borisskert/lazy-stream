export interface Stream<T> {
  toArray: () => T[]
  toSet: () => Set<T>
  filter: (predicate: (value: T, index: number) => boolean) => Stream<T>
  map: <U>(mapperFn: (value: T, index: number) => U) => Stream<U>
  flatMap: <U>(mapperFn: (value: T, index: number) => U[]) => Stream<U>
  sorted: (compareFn?: (a: T, b: T) => number) => Stream<T>
  isEmpty: () => boolean
  head: () => T | undefined
  last: () => T | undefined
  init: () => Stream<T>
  tail: () => Stream<T>
  concat: (other: Stream<T>) => Stream<T>
  append: (item: T) => Stream<T>
  inits: () => Stream<Stream<T>>
  tails: () => Stream<Stream<T>>
  reduce: <U>(reducerfn: (previousValue: U, currentValue: T, currentIndex: number) => U, initialValue?: U) => U
  take: (n: number) => Stream<T>
  takeWhile: (predicate: (x: T) => boolean) => Stream<T>
  takeUntil: (predicate: (x: T) => boolean) => Stream<T>
  drop: (n: number) => Stream<T>
  dropWhile: (predicate: (x: T) => boolean) => Stream<T>
  dropUntil: (predicate: (x: T) => boolean) => Stream<T>
  partition: (predicate: (x: T) => boolean) => Array<Stream<T>>
  distinct: (hashcode?: (x: T) => string | number | boolean) => Stream<T>
  group: (equalFn?: (a: T, b: T) => boolean) => Stream<Stream<T>>
  replicate: (n: number) => Stream<T>
  size: () => number
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

  size (): number {
    let size = 0
    const iterator = this.iteratorFn()
    let next = iterator.next()

    while (next !== undefined && next.done === false) {
      size += 1
      next = iterator.next()
    }

    return size
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

  init (): Stream<T> {
    const iteratorFn = this.iteratorFn

    function* generator (): Iterator<T> {
      const iterator = iteratorFn()
      let next = iterator.next()

      while (next !== undefined && next.done === false) {
        const value = next.value

        next = iterator.next()
        if (next.done === false) {
          yield value
        }
      }
    }

    return new IterableStream(generator)
  }

  tail (): Stream<T> {
    const iteratorFn = this.iteratorFn

    function* generator (): Iterator<T> {
      const iterator = iteratorFn()
      let next = iterator.next()

      if (next !== undefined && next.done === false) {
        next = iterator.next()
      }

      while (next !== undefined && next.done === false) {
        const value = next.value

        next = iterator.next()
        yield value
      }
    }

    return new IterableStream(generator)
  }

  concat (other: Stream<T>): Stream<T> {
    const iteratorFnOne = this.iteratorFn
    const iteratorFnTwo = (other as IterableStream<T>).iteratorFn

    function* generate (): Iterator<T> {
      let iterator = iteratorFnOne()
      let next = iterator.next()

      while (next !== undefined && next.done === false) {
        const value = next.value

        yield value

        next = iterator.next()
      }

      iterator = iteratorFnTwo()
      next = iterator.next()

      while (next !== undefined && next.done === false) {
        const value = next.value

        yield value

        next = iterator.next()
      }
    }

    return new IterableStream(generate)
  }

  append (item: T): Stream<T> {
    const iteratorFn = this.iteratorFn

    function* generate (): Iterator<T> {
      const iterator = iteratorFn()
      let next = iterator.next()

      while (next !== undefined && next.done === false) {
        const value = next.value

        yield value

        next = iterator.next()
      }

      yield item
    }

    return new IterableStream(generate)
  }

  inits (): Stream<Stream<T>> {
    const iteratorFn = this.iteratorFn

    function* generate (): Iterator<Stream<T>> {
      const iterator = iteratorFn()
      let stream: Stream<T> = empty()
      let next = iterator.next()

      while (next !== undefined && next.done === false) {
        const value = next.value

        yield stream

        next = iterator.next()
        stream = stream.append(value)
      }

      yield stream
    }

    return new IterableStream(generate)
  }

  tails (): Stream<Stream<T>> {
    const iteratorFn = this.iteratorFn

    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const self = this

    function* generate (): Iterator<Stream<T>> {
      const iterator = iteratorFn()
      let stream: Stream<T> = self
      let next = iterator.next()

      yield stream

      while (next !== undefined && next.done === false) {
        next = iterator.next()
        stream = stream.tail()

        yield stream
      }
    }

    return new IterableStream(generate)
  }

  reduce<U> (reducerfn: (previousValue: U, currentValue: T, currentIndex: number) => U, initialValue?: U): U {
    const iterator = this.iteratorFn()
    let next = iterator.next()
    let reduced: U | undefined = initialValue
    let index: number = 0

    while (next !== undefined && next.done === false) {
      const value = next.value

      if (reduced === undefined) {
        // @ts-expect-error
        reduced = value
      } else {
        reduced = reducerfn(reduced, value, index)
      }

      next = iterator.next()
      index += 1
    }

    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    return reduced!
  }

  take (n: number): Stream<T> {
    const iteratorFn = this.iteratorFn

    function* generator (): Iterator<T> {
      const iterator = iteratorFn()
      let next = iterator.next()
      let count: number = 0

      while (next !== undefined && next.done === false) {
        const value = next.value

        next = iterator.next()
        if (next.done === false && count < n) {
          yield value
          count += 1
        }
      }
    }

    return new IterableStream(generator)
  }

  takeWhile (predicate: (x: T) => boolean): Stream<T> {
    const iteratorFn = this.iteratorFn

    function* generator (): Iterator<T> {
      const iterator = iteratorFn()
      let next = iterator.next()

      while (next !== undefined && next.done === false) {
        const value = next.value

        next = iterator.next()
        if (next.done === false && predicate(value)) {
          yield value
        } else {
          break
        }
      }
    }

    return new IterableStream(generator)
  }

  takeUntil (predicate: (x: T) => boolean): Stream<T> {
    const iteratorFn = this.iteratorFn

    function* generator (): Iterator<T> {
      const iterator = iteratorFn()
      let next = iterator.next()

      while (next !== undefined && next.done === false) {
        const value = next.value

        next = iterator.next()
        if (next.done === false && !predicate(value)) {
          yield value
        } else {
          break
        }
      }
    }

    return new IterableStream(generator)
  }

  drop (n: number): Stream<T> {
    const iteratorFn = this.iteratorFn

    function* generator (): Iterator<T> {
      const iterator = iteratorFn()
      let next = iterator.next()
      let count: number = 0

      while (next !== undefined && next.done === false) {
        const value = next.value

        next = iterator.next()
        if (count >= n) {
          yield value
        }

        count += 1
      }
    }

    return new IterableStream(generator)
  }

  dropWhile (predicate: (x: T) => boolean): Stream<T> {
    const iteratorFn = this.iteratorFn

    function* generator (): Iterator<T> {
      const iterator = iteratorFn()
      let next = iterator.next()
      let take: boolean = false

      while (next !== undefined && next.done === false) {
        const value = next.value

        if (!take && !predicate(value)) {
          take = true
        }

        if (take) {
          yield value
        }

        next = iterator.next()
      }
    }

    return new IterableStream(generator)
  }

  dropUntil (predicate: (x: T) => boolean): Stream<T> {
    const iteratorFn = this.iteratorFn

    function* generator (): Iterator<T> {
      const iterator = iteratorFn()
      let next = iterator.next()
      let take: boolean = false

      while (next !== undefined && next.done === false) {
        const value = next.value

        if (!take && predicate(value)) {
          take = true
        }

        if (take) {
          yield value
        }

        next = iterator.next()
      }
    }

    return new IterableStream(generator)
  }

  partition (predicate: (x: T) => boolean): Array<Stream<T>> {
    const accepted = new Filtering(predicate, this).toStream()
    const declined = new Filtering((x) => !(predicate(x)), this).toStream()

    return [accepted, declined]
  }

  distinct (hashcode?: (x: T) => string | number | boolean): Stream<T> {
    const distinctItems = new Set()

    if (hashcode !== undefined) {
      return new Filtering((x: T) => {
        const code = hashcode(x)

        if (!distinctItems.has(code)) {
          distinctItems.add(code)
          return true
        }

        return false
      }, this).toStream()
    }

    return new Filtering((x: T) => {
      if (!distinctItems.has(x)) {
        distinctItems.add(x)
        return true
      }

      return false
    }, this).toStream()
  }

  group (equalFn: (a: T, b: T) => boolean = (a, b) => a === b): Stream<Stream<T>> {
    const iteratorFn = this.iteratorFn

    function* generate (): Iterator<Stream<T>> {
      const iterator = iteratorFn()
      let next = iterator.next()
      let old: T | undefined
      let current: T | undefined

      while (next !== undefined && next.done === false) {
        // @ts-expect-error
        function* generateGroup (): Iterator<T> {
          while (next !== undefined && next.done === false) {
            if (current === undefined && old === undefined) {
              current = next.value
              old = current
              yield current
              // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            } else if (equalFn(old!, current!)) {
              // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
              yield current!
            } else {
              current = undefined
              old = undefined
              break
            }

            next = iterator.next()
            current = next.value
          }
        }

        yield new IterableStream(generateGroup)
      }
    }

    return new IterableStream(generate)
  }

  toSet (): Set<T> {
    const items: Set<T> = new Set<T>()
    const iterator = this.iteratorFn()
    let next = iterator.next()

    while (next !== undefined && next.done === false) {
      items.add(next.value)
      next = iterator.next()
    }

    return items
  }

  replicate (n: number): Stream<T> {
    const iteratorFn = this.iteratorFn

    function* generator (): Iterator<T> {
      for (let counter: number = 0; counter < n; counter += 1) {
        const iterator = iteratorFn()
        let next = iterator.next()

        while (next !== undefined && next.done === false) {
          const value = next.value

          yield value

          next = iterator.next()
        }
      }
    }

    return new IterableStream(generator)
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
