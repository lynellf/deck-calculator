const pipe = (input, ...fns) => fns.reduce((output, fn) => fn(output), input)
const multiply = (x, y) => x * y
const multiplyAll = (x) => (x.length > 0 ? x.reduce(multiply) : 0)
export const range = (x = 0) =>
  x === 0 || isNaN(x) ? [] : [...Array(x)].map((_, index) => index + 1)
const slice = (start, end) => (x) => x.slice(start, end)
const reverse = (x) => x.reverse()
const factorial = (x) => pipe(x, range, reverse, multiplyAll)
export const sum = (...nums) => nums.reduce((out, input) => out + input, 0)

const permutation = (population, select) => {
  const sample = pipe(population, range, reverse, slice(0, select), multiplyAll)
  const selection = factorial(select)
  return sample / selection
}

const combination = (population, select) => {
  const isZero = select === 0
  if (isZero) return 1
  const sample = pipe(population, range, reverse, slice(0, select), multiplyAll)
  const selection = factorial(select)
  return sample / selection
}

export const hypogeometricDist =
  (deckSize) => (handSize) => (totalCopies, copiesDrawn) => {
    const K = totalCopies
    const k = copiesDrawn
    const N = deckSize
    const n = handSize

    const numerator = combination(K, k) * combination(N - K, n - k)
    const denominator = combination(N, n)
    const output = numerator / denominator
    const isValid = !isNaN(output)
    return isValid ? numerator / denominator : 0
  }

export const calculateHand = (deckSize) => (handSize) => (copies) => {
  const numerator = permutation(deckSize - copies, handSize)
  const denominator = permutation(deckSize, handSize)
  return 1 - numerator / denominator
}
