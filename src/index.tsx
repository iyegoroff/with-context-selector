/* eslint-disable @typescript-eslint/prefer-nullish-coalescing */
import React from 'react'
import { DeepReadonly } from 'ts-deep-readonly'
import { isDefined } from 'ts-is-defined'
import { memo } from 'ts-react-memo'

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
export function withContextSelector<
  Context extends ContextLike,
  SelectedProps extends Record<string, unknown>,
  ExtraProps extends Record<string, unknown>,
  ComponentProps extends SelectedProps
>(
  context: Context,
  selector: (
    extra: ExtraProps
  ) => (
    contextValue: DeepReadonly<Context extends React.Context<infer First> ? First : never>
  ) => SelectedProps,
  Component: React.ComponentType<ComponentProps>
): (props: ExtraProps & Omit<ComponentProps, keyof SelectedProps>) => JSX.Element

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
export function withContextSelector<
  Contexts extends readonly ContextLike[],
  SelectedProps extends Record<string, unknown>,
  ExtraProps extends Record<string, unknown>,
  ComponentProps extends SelectedProps
>(
  contexts: Narrow<Contexts>,
  selector: (
    extra: ExtraProps
  ) => (...contextValues: DeepReadonly<ContextValues<Contexts>>) => SelectedProps,
  Component: React.ComponentType<ComponentProps>
): (props: ExtraProps & Omit<ComponentProps, keyof SelectedProps>) => JSX.Element

export function withContextSelector<
  ContextValue,
  SelectedProps extends Record<string, unknown>,
  ExtraProps extends Record<string, unknown>,
  ComponentProps extends SelectedProps
>(
  context: readonly React.Context<ContextValue>[],
  selector: (extra: ExtraProps) => (...contextValues: ContextValue[]) => SelectedProps,
  Component: React.ComponentType<ComponentProps>
) {
  const Wrapped = memo(Component)
  const contexts = [context].flat()

  function WithContextSelector<
    RestProps extends ExtraProps & Omit<ComponentProps, keyof SelectedProps>
  >(props: RestProps): JSX.Element

  function WithContextSelector(props: ComponentProps & ExtraProps) {
    return (
      <Wrapped {...{ ...props, ...selector(props)(...contexts.map(React.useContext)) }} />
    )
  }

  WithContextSelector.displayName = `WithContextSelector([${contexts
    .map(({ displayName }) => displayName || 'Context')
    .join()}], ${Component.displayName || Component.name || 'Component'})`

  return WithContextSelector
}

/**
 * Creates singular context selector.
 * Throws UndefinedContextError if context value is null or undefined
 *
 * @param context React context
 * @param selector A function to convert context value into selected props object
 * @param Component React component that receives selected props
 *
 * @returns A new React component that receives the same props as the original component,
 * except the props returned by the selector argument.
 */
export function withDefinedContextSelector<
  Context extends ContextLike,
  SelectedProps extends Record<string, unknown>,
  ExtraProps extends Record<string, unknown>,
  ComponentProps extends SelectedProps
>(
  context: Context,
  selector: (
    extra: ExtraProps
  ) => (
    contextValue: DeepReadonly<
      Context extends React.Context<infer First> ? NonNullable<First> : never
    >
  ) => SelectedProps,
  Component: React.ComponentType<ComponentProps>
): (props: ExtraProps & Omit<ComponentProps, keyof SelectedProps>) => JSX.Element

/**
 * Creates multiple context selector.
 * Throws UndefinedContextError if one of context values is null or undefined
 *
 * @param contexts An array of React contexts
 * @param selector A function to convert context values into selected props object
 * @param Component React component that receives selected props
 *
 * @returns A new React component that receives the same props as the original component,
 * except the props returned by the selector argument.
 */
export function withDefinedContextSelector<
  Contexts extends readonly ContextLike[],
  SelectedProps extends Record<string, unknown>,
  ExtraProps extends Record<string, unknown>,
  ComponentProps extends SelectedProps
>(
  contexts: Narrow<Contexts>,
  selector: (
    extra: ExtraProps
  ) => (
    ...contextValues: NonNullables<DeepReadonly<ContextValues<Contexts>>>
  ) => SelectedProps,
  Component: React.ComponentType<ComponentProps>
): (props: ExtraProps & Omit<ComponentProps, keyof SelectedProps>) => JSX.Element

export function withDefinedContextSelector<
  ContextValue,
  SelectedProps extends Record<string, unknown>,
  ExtraProps extends Record<string, unknown>,
  ComponentProps extends SelectedProps
>(
  context: readonly React.Context<ContextValue>[],
  selector: (
    extra: ExtraProps
  ) => (...contextValues: NonNullable<ContextValue>[]) => SelectedProps,
  Component: React.ComponentType<ComponentProps>
) {
  return withContextSelector<
    readonly React.Context<ContextValue>[],
    SelectedProps,
    ExtraProps,
    ComponentProps
  >(
    context,
    (extra) =>
      (...contextValues) =>
        selector(extra)(
          ...contextValues.map((val, idx) =>
            isDefined(val)
              ? val
              : (() => {
                  throw new UndefinedContextError(
                    `Undefined context: ${[context].flat()[idx]?.displayName}`
                  )
                })()
          )
        ),
    Component
  )
}

export class UndefinedContextError extends Error {}

type ContextValues<T> = T extends readonly [React.Context<infer First>, ...infer Rest]
  ? [First, ...ContextValues<Rest>]
  : []

type NonNullables<T extends readonly unknown[]> = {
  [Index in keyof T]: NonNullable<T[Index]>
}

// source: https://github.com/microsoft/TypeScript/issues/48052#issuecomment-1060031917
type Cast<A, B> = A extends B ? A : B
type Narrowable = string | number | bigint | boolean
type _Narrow<A> =
  | []
  | (A extends Narrowable ? A : never)
  | { [K in keyof A]: _Narrow<A[K]> }
type Narrow<A> = Cast<A, _Narrow<A>>
