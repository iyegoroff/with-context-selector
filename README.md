# with-context-selector

[![npm](https://img.shields.io/npm/v/with-context-selector)](https://npm.im/with-context-selector)
[![build](https://github.com/iyegoroff/with-context-selector/workflows/build/badge.svg)](https://github.com/iyegoroff/with-context-selector/actions/workflows/build.yml)
[![publish](https://github.com/iyegoroff/with-context-selector/workflows/publish/badge.svg)](https://github.com/iyegoroff/with-context-selector/actions/workflows/publish.yml)
[![codecov](https://codecov.io/gh/iyegoroff/with-context-selector/branch/main/graph/badge.svg?token=YC314L3ZF7)](https://codecov.io/gh/iyegoroff/with-context-selector)
[![Type Coverage](https://img.shields.io/badge/dynamic/json.svg?label=type-coverage&prefix=%E2%89%A5&suffix=%&query=$.typeCoverage.atLeast&uri=https%3A%2F%2Fraw.githubusercontent.com%2Fiyegoroff%2Fwith-context-selector%2Fmain%2Fpackage.json)](https://github.com/plantain-00/type-coverage)
![Libraries.io dependency status for latest release](https://img.shields.io/librariesio/release/npm/with-context-selector)
[![Bundlephobia](https://img.shields.io/bundlephobia/minzip/with-context-selector?label=min+gzip)](https://bundlephobia.com/package/with-context-selector)
[![npm](https://img.shields.io/npm/l/with-context-selector.svg?t=1495378566926)](https://www.npmjs.com/package/with-context-selector)

Generic React context selector HOC

## Getting started

```
npm i with-context-selector
```

## Usage

Singular context selector:

```ts
import { withContext } from 'with-context-selector'

const foo = { x: 1, y: 2 }
const FooContext = React.createContext(foo)

// context can have a displayName
FooContext.displayName = 'FooContext'

// ConnectedFoo rerenders only when x prop changes
const ConnectedFoo = withContext(
  FooContext,
  ({ x, y }) => ({ x }),
  function Foo({ x, z }: { x: number, z: number }) {
    return <div>{x + z}</div>
  }
)

// ConnectedFoo requires only z prop, x prop is provided by context
const App = (
  <FooContext.Provider value={foo}>
    <ConnectedFoo z={3} />
  </FooContext.Provider>
)
```

Multiple context selector:

```ts
import { withContext } from 'with-context-selector'

const foo = { x: 1, y: 2 }
const bar = 'bar'
const FooContext = React.createContext(foo)
const BarContext = React.createContext(bar)

const ConnectedFooBar = withContext(
  [FooContext, BarContext],
  (foo, bar) => ({ foo: foo.x, bar }),
  function FooBar({ foo, bar }: { foo: number, bar: string }) {
    return <div>{String(foo) + bar}</div>
  }
)

const App = (
  <FooContext.Provider value={foo}>
    <BarContnext.Provider value={bar}>
      <ConnectedFooBar />
    </BarContnext.Provider
  </FooContext.Provider>
)
```
