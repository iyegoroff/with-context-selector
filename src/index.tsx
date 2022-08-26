/* eslint-disable @typescript-eslint/prefer-nullish-coalescing */
import React from 'react'

type ContextLike = Omit<React.Context<unknown>, 'Provider'> & { Provider: unknown }

/**
 * Creates singular context selector.
 *
 * @param context React context
 * @param selector A function to convert context value into selected props object
 * @param Component React component that receives selected props
 *
 * @returns A new React component that receives the same props as the original component,
 * except the props returned by the selector argument.
 */
export function withContext<
  Context extends ContextLike,
  SelectedProps extends Record<string, unknown>,
  ComponentProps extends SelectedProps
>(
  context: Context,
  selector: (
    contextValue: DeepReadonly<Context extends React.Context<infer First> ? First : never>
  ) => SelectedProps,
  Component: React.ComponentType<ComponentProps>
): <RestProps extends Omit<ComponentProps, keyof SelectedProps>>(
  props: Exact<RestProps, Omit<ComponentProps, keyof SelectedProps>>
) => JSX.Element

/**
 * Creates multiple context selector.
 *
 * @param contexts An array of React contexts
 * @param selector A function to convert context values into selected props object
 * @param Component React component that receives selected props
 *
 * @returns A new React component that receives the same props as the original component,
 * except the props returned by the selector argument.
 */
export function withContext<
  Contexts extends readonly ContextLike[],
  SelectedProps extends Record<string, unknown>,
  ComponentProps extends SelectedProps
>(
  contexts: Narrow<Contexts>,
  selector: (...contextValues: DeepReadonly<ContextValues<Contexts>>) => SelectedProps,
  Component: React.ComponentType<ComponentProps>
): <RestProps extends Omit<ComponentProps, keyof SelectedProps>>(
  props: Exact<RestProps, Omit<ComponentProps, keyof SelectedProps>>
) => JSX.Element

export function withContext<
  ContextValue,
  SelectedProps extends Record<string, unknown>,
  ComponentProps extends SelectedProps
>(
  context: readonly React.Context<ContextValue>[],
  selector: (...contextValues: ContextValue[]) => SelectedProps,
  Component: React.ComponentType<ComponentProps>
) {
  const Wrapped = memo(Component)
  const contexts = [context].flat()

  function WithContext<RestProps extends Omit<ComponentProps, keyof SelectedProps>>(
    props: Exact<RestProps, Omit<ComponentProps, keyof SelectedProps>>
  ): JSX.Element

  function WithContext(props: ComponentProps) {
    return <Wrapped {...{ ...selector(...contexts.map(React.useContext)), ...props }} />
  }

  WithContext.displayName = `WithContext([${contexts
    .map(({ displayName }) => displayName || 'Context')
    .join()}], ${Component.displayName || Component.name || 'Component'})`

  return WithContext
}

const memo: <T>(c: T) => T = React.memo

type Exact<T, I> = T extends I ? (Exclude<keyof T, keyof I> extends never ? T : never) : never

type ContextValues<T> = T extends readonly [React.Context<infer First>, ...infer Rest]
  ? [First, ...ContextValues<Rest>]
  : []

// source: https://github.com/microsoft/TypeScript/issues/48052#issuecomment-1060031917
type Cast<A, B> = A extends B ? A : B
type Narrowable = string | number | bigint | boolean
type _Narrow<A> = [] | (A extends Narrowable ? A : never) | { [K in keyof A]: _Narrow<A[K]> }
type Narrow<A> = Cast<A, _Narrow<A>>

type DeepReadonly<T> = T extends (...args: never[]) => unknown
  ? T
  : T extends Map<infer K, infer V>
  ? ReadonlyMap<DeepReadonly<K>, DeepReadonly<V>>
  : T extends Set<infer V>
  ? ReadonlySet<DeepReadonly<V>>
  : {
      readonly [P in keyof T]: DeepReadonly<T[P]> extends ReadonlyMap<infer K, infer V>
        ? ReadonlyMap<K, V>
        : DeepReadonly<T[P]> extends ReadonlySet<infer V>
        ? ReadonlySet<V>
        : DeepReadonly<T[P]>
    }
