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

  it('should provide tails', function () {
    assert.deepEqual(
      numberStream.tails().map(s => s.toArray()).toArray(),
      [[1, 2, 3, 4, 5], [2, 3, 4, 5], [3, 4, 5], [4, 5], [5], []]
    )

    assert.deepEqual(
      charStream.tails().map(s => s.toArray()).toArray(),
      [['C', 'B', 'Z', 'R', 'A', 'G'], ['B', 'Z', 'R', 'A', 'G'], ['Z', 'R', 'A', 'G'], ['R', 'A', 'G'], ['A', 'G'], ['G'], []]
    )

    assert.deepEqual(
      emptyStream.tails().map(s => s.toArray()).toArray(),
      [[]]
    )
  })

  it('should reduce items', function () {
    assert.deepEqual(numberStream.reduce<number>((a, b) => a + b), 15)
    assert.deepEqual(charStream.reduce<string>((a, b) => a + b), 'CBZRAG')
    assert.isUndefined(emptyStream.reduce<number>((a, b) => a + b))
  })

  it('should reduce items with starting value', function () {
    assert.deepEqual(numberStream.reduce((a, b) => a + b, 15), 30)
    assert.deepEqual(charStream.reduce((a, b) => a + b, 'ABC'), 'ABCCBZRAG')
    assert.deepEqual(emptyStream.reduce((a, b) => a + b, 15), 15)
  })

  it('should reduce items with starting value of another type', function () {
    assert.deepEqual(numberStream.reduce(({ result: a }, b) => ({ result: a + b }), { result: 15 }), { result: 30 })
    assert.deepEqual(charStream.reduce((a, b) => [...a, b], ['ABC']), ['ABC', 'C', 'B', 'Z', 'R', 'A', 'G'])
    assert.deepEqual(emptyStream.reduce((a, b) => [...a, b], [15]), [15])
  })

  it('should take items', function () {
    assert.deepEqual(numberStream.take(3).toArray(), [1, 2, 3])
    assert.deepEqual(charStream.take(4).toArray(), ['C', 'B', 'Z', 'R'])
    assert.deepEqual(emptyStream.take(6).toArray(), [])
  })

  it('should take items while condition', function () {
    assert.deepEqual(numberStream.takeWhile((x) => x < 3).toArray(), [1, 2])
    assert.deepEqual(charStream.takeWhile((x) => x < 'Z').toArray(), ['C', 'B'])
    assert.deepEqual(emptyStream.takeWhile((x) => x > 0).toArray(), [])
  })

  it('should take items until condition', function () {
    assert.deepEqual(numberStream.takeUntil((x) => x === 4).toArray(), [1, 2, 3])
    assert.deepEqual(charStream.takeUntil((x) => x === 'A').toArray(), ['C', 'B', 'Z', 'R'])
    assert.deepEqual(emptyStream.takeUntil((x) => x <= 0).toArray(), [])
  })

  it('should drop items', function () {
    assert.deepEqual(numberStream.drop(3).toArray(), [4, 5])
    assert.deepEqual(charStream.drop(4).toArray(), ['A', 'G'])
    assert.deepEqual(emptyStream.drop(6).toArray(), [])
  })

  it('should drop items while condition', function () {
    assert.deepEqual(numberStream.dropWhile((x) => x < 3).toArray(), [3, 4, 5])
    assert.deepEqual(charStream.dropWhile((x) => x < 'Z').toArray(), ['Z', 'R', 'A', 'G'])
    assert.deepEqual(emptyStream.dropWhile((x) => x > 0).toArray(), [])
  })

  it('should drop items until condition', function () {
    assert.deepEqual(numberStream.dropUntil((x) => x > 3).toArray(), [4, 5])
    assert.deepEqual(charStream.dropUntil((x) => x >= 'Z').toArray(), ['Z', 'R', 'A', 'G'])
    assert.deepEqual(emptyStream.dropUntil((x) => x > 0).toArray(), [])
  })

  it('should partition by condition', function () {
    assert.deepEqual(numberStream.partition((x) => x > 3).map(s => s.toArray()), [[4, 5], [1, 2, 3]])
    assert.deepEqual(charStream.partition((x) => x < 'R').map(s => s.toArray()), [['C', 'B', 'A', 'G'], ['Z', 'R']])
    assert.deepEqual(emptyStream.partition((x) => x > 3).map(s => s.toArray()), [[], []])
  })

  it('should provide distinct items', function () {
    assert.deepEqual(fromArray([1, 4, 5, 3, 2, 4, 3, 2, 1, 5, 3, 4, 5, 1]).distinct().toArray(), [1, 4, 5, 3, 2])
    assert.deepEqual(fromArray(['CD', 'AB', 'CD', 'BC', 'AB', 'ABC', 'CD']).distinct().toArray(), ['CD', 'AB', 'BC', 'ABC'])
    assert.deepEqual(emptyStream.distinct().toArray(), [])
  })
})
