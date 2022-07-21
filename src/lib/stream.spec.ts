import { assert } from 'chai'
import { empty, fromArray, intRange, Stream } from './stream'

function descendingNumbers (a: number, b: number): number {
  return b - a
}

function ascendingStrings (a: string, b: string): number {
  if (a < b) {
    return -1
  }

  if (a > b) {
    return 1
  }

  return 0
}

describe('Stream tests', function () {
  let numberStream: Stream<number>
  let charStream: Stream<string>
  const emptyStream: Stream<number> = empty()

  // not using beforeEach to test immutability
  before(() => {
    numberStream = intRange(1, (x) => x <= 5)
    charStream = fromArray(['C', 'B', 'Z', 'R', 'A', 'G'])
  })

  it('should provide items as array', function () {
    assert.deepEqual(numberStream.toArray(), [1, 2, 3, 4, 5])
    assert.deepEqual(charStream.toArray(), ['C', 'B', 'Z', 'R', 'A', 'G'])
  })

  it('should filter elements', function () {
    assert.deepEqual(numberStream.filter((x: number) => x % 2 === 0).toArray(), [2, 4])
    assert.deepEqual(charStream.filter((c: string) => c <= 'C').toArray(), ['C', 'B', 'A'])
  })

  it('should map elements', function () {
    assert.deepEqual(numberStream.map((x: number) => x * 2).toArray(), [2, 4, 6, 8, 10])
    assert.deepEqual(charStream.map((c: string) => c + c).toArray(), ['CC', 'BB', 'ZZ', 'RR', 'AA', 'GG'])
  })

  it('should flatmap a stream', function () {
    assert.deepEqual(
      numberStream.flatMap((x) => [x, x]).toArray(),
      [1, 1, 2, 2, 3, 3, 4, 4, 5, 5]
    )

    assert.deepEqual(
      charStream.flatMap((c) => [c, c]).toArray(),
      ['C', 'C', 'B', 'B', 'Z', 'Z', 'R', 'R', 'A', 'A', 'G', 'G']
    )
  })

  it('should sort elements', function () {
    assert.deepEqual(numberStream.sorted(descendingNumbers).toArray(), [5, 4, 3, 2, 1])
    assert.deepEqual(charStream.sorted((a, b) => ascendingStrings(a, b) * -1).toArray(), ['Z', 'R', 'G', 'C', 'B', 'A'])
  })

  it('should determine if a stream is empty', function () {
    assert.deepEqual(numberStream.isEmpty(), false)
    assert.deepEqual(charStream.isEmpty(), false)
    assert.deepEqual(emptyStream.isEmpty(), true)
  })

  it('should provide head', function () {
    assert.deepEqual(numberStream.head(), 1)
    assert.deepEqual(charStream.head(), 'C')
    assert.isUndefined(emptyStream.head())
  })

  it('should provide last', function () {
    assert.deepEqual(numberStream.last(), 5)
    assert.deepEqual(charStream.last(), 'G')
    assert.isUndefined(emptyStream.last())
  })

  it('should provide init elements', function () {
    assert.deepEqual(numberStream.init().toArray(), [1, 2, 3, 4])
    assert.deepEqual(charStream.init().toArray(), ['C', 'B', 'Z', 'R', 'A'])
    assert.deepEqual(emptyStream.init().toArray(), [])
  })

  it('should provide tail elements', function () {
    assert.deepEqual(numberStream.tail().toArray(), [2, 3, 4, 5])
    assert.deepEqual(charStream.tail().toArray(), ['B', 'Z', 'R', 'A', 'G'])
    assert.deepEqual(emptyStream.tail().toArray(), [])
  })

  it('should concat two streams', function () {
    assert.deepEqual(
      numberStream.concat(intRange(6, (x) => x <= 10)).toArray(),
      [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
    )

    assert.deepEqual(
      charStream.concat(fromArray(['K', 'J', 'M', 'L'])).toArray(),
      ['C', 'B', 'Z', 'R', 'A', 'G', 'K', 'J', 'M', 'L']
    )

    assert.deepEqual(
      emptyStream.concat(emptyStream).toArray(),
      []
    )
  })

  it('should append item', function () {
    assert.deepEqual(numberStream.append(6).toArray(), [1, 2, 3, 4, 5, 6])
    assert.deepEqual(charStream.append('M').toArray(), ['C', 'B', 'Z', 'R', 'A', 'G', 'M'])
    assert.deepEqual(emptyStream.append(10).toArray(), [10])
  })

  it('should provide inits', function () {
    assert.deepEqual(
      numberStream.inits().map(s => s.toArray()).toArray(),
      [[], [1], [1, 2], [1, 2, 3], [1, 2, 3, 4], [1, 2, 3, 4, 5]]
    )

    assert.deepEqual(
      charStream.inits().map(s => s.toArray()).toArray(),
      [[], ['C'], ['C', 'B'], ['C', 'B', 'Z'], ['C', 'B', 'Z', 'R'], ['C', 'B', 'Z', 'R', 'A'], ['C', 'B', 'Z', 'R', 'A', 'G']]
    )

    assert.deepEqual(
      emptyStream.inits().map(s => s.toArray()).toArray(),
      [[]]
    )
  })
})
