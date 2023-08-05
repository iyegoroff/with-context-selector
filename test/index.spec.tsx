import React, { useEffect, useState, createContext } from 'react'
import { render, cleanup, waitFor } from '@testing-library/react'
import { assertDefined, isDefined } from 'ts-is-defined'
import { withContextSelector, withDefinedContextSelector } from '../src'

function id<T>(x: T) {
  return x
}

const BarContext = createContext<number | undefined>(undefined)

const BarProvider = ({ children }: React.PropsWithChildren) => (
  <BarContext.Provider value={10}>{children}</BarContext.Provider>
)

type Foo = {
  readonly x: number
  readonly y: number
  readonly z: number
}

const initialFoo = Object.freeze<Foo>({ x: 1, y: 2, z: 3 })
const FooContext = createContext<Foo | undefined>(undefined)

FooContext.displayName = 'FooContext'

const FooProvider = ({
  children,
  updateFoo
}: React.PropsWithChildren<{ updateFoo: (foo: Foo) => Foo }>) => {
  const [foo, setFoo] = useState(initialFoo)

  useEffect(() => {
    setTimeout(() => {
      setFoo(updateFoo)
    }, 500)
  }, [updateFoo])

  return <FooContext.Provider value={foo}>{children}</FooContext.Provider>
}

type FooProps = { x: number; name: string }

const createFooView = (
  injectSelector: (value: Foo) => void,
  injectRender: (props: FooProps) => void
) => {
  function FooView(props: FooProps) {
    injectRender(props)

    return (
      <>
        <div data-testid='name'>{props.name}</div>
        <div data-testid='x'>{props.x}</div>
      </>
    )
  }

  return {
    FooView: withContextSelector(
      FooContext,
      (value) => {
        assertDefined(value, 'Foo is outside FooProvider!')

        injectSelector(value)

        return { x: value.x }
      },
      FooView
    ),
    DefinedFooView: withDefinedContextSelector(
      FooContext,
      (value) => {
        injectSelector(value)

        return { x: value.x }
      },
      FooView
    )
  }
}

const incX = ({ x, ...rest }: Foo) => ({ ...rest, x: x + 1 })
const incY = ({ y, ...rest }: Foo) => ({ ...rest, y: y + 1 })

class ErrorBoundary extends React.Component<React.PropsWithChildren> {
  state: { error?: string } = { error: undefined }

  static getDerivedStateFromError(error: unknown) {
    return { error: error instanceof Error ? error.message : String(error) }
  }

  render() {
    const { error } = this.state

    return isDefined(error) ? (
      <div data-testid={'error'}>{error}</div>
    ) : (
      this.props.children
    )
  }
}

describe('withContextSelector', () => {
  afterEach(cleanup)

  test('should avoid rerender when updating unselected prop', async () => {
    const propsDump: FooProps[] = []
    const selectorsDump: Foo[] = []

    const { FooView } = createFooView(
      (value) => selectorsDump.push(value),
      (props) => propsDump.push(props)
    )

    const App = () => (
      <FooProvider updateFoo={incY}>
        <FooView name={'first'} />
      </FooProvider>
    )

    const { getByTestId } = render(<App />)

    const name = getByTestId('name')
    const x = getByTestId('x')

    await waitFor(() => {
      expect(name.textContent).toEqual('first')
      expect(x.textContent).toEqual('1')
      expect(propsDump).toEqual<typeof propsDump>([{ name: 'first', x: 1 }])
      expect(selectorsDump).toEqual<typeof selectorsDump>([
        initialFoo,
        { ...initialFoo, y: 3 }
      ])
    })
  })

  test('should rerender when updating selected prop', async () => {
    const propsDump: FooProps[] = []
    const selectorsDump: (Foo | undefined)[] = []

    const { FooView } = createFooView(
      (value) => selectorsDump.push(value),
      (props) => propsDump.push(props)
    )

    const App = () => (
      <FooProvider updateFoo={incX}>
        <FooView name={'second'} />
      </FooProvider>
    )

    const { getByTestId } = render(<App />)

    const name = getByTestId('name')
    const x = getByTestId('x')

    await waitFor(() => {
      expect(name.textContent).toEqual('second')
      expect(x.textContent).toEqual('2')
      expect(propsDump).toEqual<typeof propsDump>([
        { name: 'second', x: 1 },
        { name: 'second', x: 2 }
      ])
      expect(selectorsDump).toEqual<typeof selectorsDump>([
        initialFoo,
        { ...initialFoo, x: 2 }
      ])
    })
  })

  test('should handle array of contexts', async () => {
    const View = withContextSelector(
      [FooContext, BarContext],
      (fooValue, barValue) => {
        assertDefined(fooValue, 'Foo is outside FooProvider!')
        assertDefined(barValue, 'Bar is outside BarProvider!')

        return { foo: fooValue.x, bar: barValue }
      },
      ({ foo, bar }: { foo: number; bar: number }) => (
        <>
          <div data-testid='foo'>{foo}</div>
          <div data-testid='bar'>{bar}</div>
        </>
      )
    )

    const App = () => (
      <FooProvider updateFoo={id}>
        <BarProvider>
          <View />
        </BarProvider>
      </FooProvider>
    )

    const { getByTestId } = render(<App />)

    const foo = getByTestId('foo')
    const bar = getByTestId('bar')

    await waitFor(() => {
      expect(foo.textContent).toEqual('1')
      expect(bar.textContent).toEqual('10')
    })
  })

  test('should avoid rendering when error is thrown from selector', async () => {
    const propsDump: FooProps[] = []
    const selectorsDump: (Foo | undefined)[] = []

    const { FooView } = createFooView(
      (value) => selectorsDump.push(value),
      (props) => propsDump.push(props)
    )

    const App = () => (
      <ErrorBoundary>
        <FooView name={'third'} />
      </ErrorBoundary>
    )

    const { getByTestId, queryByTestId } = render(<App />)

    const error = getByTestId('error')
    const name = queryByTestId('name')

    await waitFor(() => {
      expect(error.textContent).toEqual('Invariant failed: Foo is outside FooProvider!')
      // eslint-disable-next-line no-restricted-syntax
      expect(name).toEqual(null)
      expect(propsDump).toEqual<typeof propsDump>([])
      expect(selectorsDump).toEqual<typeof selectorsDump>([])
    })
  })

  test('displayName should be WithContextSelector([FooContext], FooView)', () => {
    const FooView = { displayName: undefined, ...createFooView(id, id).FooView }

    expect(FooView.displayName).toEqual('WithContextSelector([FooContext], FooView)')
  })
})

describe('withDefinedContextSelector', () => {
  afterEach(cleanup)

  test('should avoid rendering when error is thrown from selector', async () => {
    const propsDump: FooProps[] = []
    const selectorsDump: (Foo | undefined)[] = []

    const { DefinedFooView } = createFooView(
      (value) => selectorsDump.push(value),
      (props) => propsDump.push(props)
    )

    const App = () => (
      <ErrorBoundary>
        <DefinedFooView name={'third'} />
      </ErrorBoundary>
    )

    const { getByTestId, queryByTestId } = render(<App />)

    const error = getByTestId('error')
    const name = queryByTestId('name')

    await waitFor(() => {
      expect(error.textContent).toEqual('Undefined context: FooContext')
      // eslint-disable-next-line no-restricted-syntax
      expect(name).toEqual(null)
      expect(propsDump).toEqual<typeof propsDump>([])
      expect(selectorsDump).toEqual<typeof selectorsDump>([])
    })
  })

  test('should handle array of contexts', async () => {
    const View = withDefinedContextSelector(
      [FooContext, BarContext],
      (fooValue, barValue) => ({ foo: fooValue.x, bar: barValue }),
      ({ foo, bar }: { foo: number; bar: number }) => (
        <>
          <div data-testid='foo'>{foo}</div>
          <div data-testid='bar'>{bar}</div>
        </>
      )
    )

    const App = () => (
      <FooProvider updateFoo={id}>
        <BarProvider>
          <View />
        </BarProvider>
      </FooProvider>
    )

    const { getByTestId } = render(<App />)

    const foo = getByTestId('foo')
    const bar = getByTestId('bar')

    await waitFor(() => {
      expect(foo.textContent).toEqual('1')
      expect(bar.textContent).toEqual('10')
    })
  })
})
