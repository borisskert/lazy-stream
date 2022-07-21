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
})
