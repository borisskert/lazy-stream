import { assert } from 'chai'
import { fromArray, intRange, Stream } from './stream'

describe('Stream tests', function () {
  let numberStream: Stream<number>
  let charStream: Stream<string>

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
})
