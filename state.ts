/**
 * @license MIT
 * @author Paul Henschel
 * @see https://github.com/pmndrs/zustand
 */

import {
    useSyncExternalStoreWithSelector,
  } from 'use-sync-external-store/shim/with-selector';
  import { produce } from 'immer';
  import type { Draft } from 'immer';
  
  // Vanilla
  type SetStateInternal<T> = {
    _(
      partial: T | Partial<T> | { _(state: T): T | Partial<T> }['_'],
      replace?: boolean,
    ): void;
  }['_'];
  
  export interface StoreApi<T> {
    setState: SetStateInternal<T>;
    getState: () => T;
    getInitialState: () => T;
    subscribe: (listener: (state: T, prevState: T) => void) => () => void;
  }
  
  export type ExtractState<S> = S extends { getState: () => infer T } ? T : never;
  
  type Get<T, K, F> = K extends keyof T ? T[K] : F;
  
  export type Mutate<S, Ms> = number extends Ms['length' & keyof Ms]
    ? S
    : Ms extends []
    ? S
    : Ms extends [[infer Mi, infer Ma], ...infer Mrs]
    ? Mutate<StoreMutators<S, Ma>[Mi & StoreMutatorIdentifier], Mrs>
    : never;
  
  export type StateCreator<
    T,
    Mis extends [StoreMutatorIdentifier, unknown][] = [],
    Mos extends [StoreMutatorIdentifier, unknown][] = [],
    U = T
  > = ((
    setState: Get<Mutate<StoreApi<T>, Mis>, 'setState', never>,
    getState: Get<Mutate<StoreApi<T>, Mis>, 'getState', never>,
    store: Mutate<StoreApi<T>, Mis>
  ) => U) & { $$storeMutators?: Mos };
  
  export interface StoreMutators<S, A> {}
  export type StoreMutatorIdentifier = keyof StoreMutators<unknown, unknown>;
  
  type CreateStore = {
    <T, Mos extends [StoreMutatorIdentifier, unknown][] = []>(
      initializer: StateCreator<T, [], Mos>
    ): Mutate<StoreApi<T>, Mos>;
    <T>(): <Mos extends [StoreMutatorIdentifier, unknown][] = []>(
      initializer: StateCreator<T, [], Mos>
    ) => Mutate<StoreApi<T>, Mos>;
  };
  
  type CreateStoreImpl = <
    T,
    Mos extends [StoreMutatorIdentifier, unknown][] = []
  >(
    initializer: StateCreator<T, [], Mos>
  ) => Mutate<StoreApi<T>, Mos>;
  
  const createStoreImpl: CreateStoreImpl = (createState) => {
    type TState = ReturnType<typeof createState>;
    type Listener = (state: TState, prevState: TState) => void;
    let state: TState;
    const listeners: Set<Listener> = new Set();
  
    const setState: StoreApi<TState>['setState'] = (partial, replace) => {
      const nextState =
        typeof partial === 'function'
          ? (partial as (state: TState) => TState)(state)
          : partial;
      if (!Object.is(nextState, state)) {
        const previousState = state;
        state =
          replace ?? (typeof nextState !== 'object' || nextState === null)
            ? (nextState as TState)
            : Object.assign({}, state, nextState);
        listeners.forEach((listener) => listener(state, previousState));
      }
    };
  
    const getState: StoreApi<TState>['getState'] = () => state;
  
    const getInitialState: StoreApi<TState>['getInitialState'] = () =>
      initialState;
  
    const subscribe: StoreApi<TState>['subscribe'] = (listener) => {
      listeners.add(listener);
      // Unsubscribe
      return () => listeners.delete(listener);
    };
  
    const api = { setState, getState, getInitialState, subscribe };
    const initialState = (state = createState(setState, getState, api));
    return api as any;
  };
  
  export const createStore = ((createState) =>
    createState ? createStoreImpl(createState) : createStoreImpl) as CreateStore;
  
  // React
  const identity = <T>(arg: T): T => arg;
  
  export function useStore<S extends StoreApi<unknown>>(api: S): ExtractState<S>;
  export function useStore<S extends StoreApi<unknown>, U>(
    api: S,
    selector: (state: ExtractState<S>) => U
  ): U;
  export function useStore<TState, StateSlice>(
    api: StoreApi<TState>,
    selector: (state: TState) => StateSlice = identity as any
  ) {
    const slice = useSyncExternalStoreWithSelector(
      api.subscribe,
      api.getState,
      api.getInitialState,
      selector,
      Object.is
    );
    return slice;
  }
  
  export type UseBoundStore<S extends StoreApi<unknown>> = {
    (): ExtractState<S>;
    <U>(selector: (state: ExtractState<S>) => U): U;
  } & S;
  
  type Create = {
    <T, Mos extends [StoreMutatorIdentifier, unknown][] = []>(
      initializer: StateCreator<T, [], Mos>
    ): UseBoundStore<Mutate<StoreApi<T>, Mos>>;
    <T>(): <Mos extends [StoreMutatorIdentifier, unknown][] = []>(
      initializer: StateCreator<T, [], Mos>
    ) => UseBoundStore<Mutate<StoreApi<T>, Mos>>;
  };
  
  const createImplReact = <T>(createState: StateCreator<T, [], []>) => {
    const api = createStore(createState);
  
    const useBoundStore: any = (selector?: any) => useStore(api, selector);
  
    Object.assign(useBoundStore, api);
  
    return useBoundStore;
  };
  
  export const create = (<T>(
    createState: StateCreator<T, [], []> | undefined
  ) =>
    createState ? createImplReact(createState) : createImplReact) as Create;
  
  // Shallow
  const isIterable = (obj: object): obj is Iterable<unknown> =>
    Symbol.iterator in obj;
  
  const hasIterableEntries = (
    value: Iterable<unknown>
  ): value is Iterable<unknown> & {
    entries(): Iterable<[unknown, unknown]>;
  } => 'entries' in value;
  
  const compareEntries = (
    valueA: { entries(): Iterable<[unknown, unknown]> },
    valueB: { entries(): Iterable<[unknown, unknown]> }
  ) => {
    const mapA = valueA instanceof Map ? valueA : new Map(valueA.entries());
    const mapB = valueB instanceof Map ? valueB : new Map(valueB.entries());
    if (mapA.size !== mapB.size) {
      return false;
    }
    for (const [key, value] of mapA) {
      if (!Object.is(value, mapB.get(key))) {
        return false;
      }
    }
    return true;
  };
  
  const compareIterables = (
    valueA: Iterable<unknown>,
    valueB: Iterable<unknown>
  ) => {
    const iteratorA = valueA[Symbol.iterator]();
    const iteratorB = valueB[Symbol.iterator]();
    let nextA = iteratorA.next();
    let nextB = iteratorB.next();
    while (!nextA.done && !nextB.done) {
      if (!Object.is(nextA.value, nextB.value)) {
        return false;
      }
      nextA = iteratorA.next();
      nextB = iteratorB.next();
    }
    return !!nextA.done && !!nextB.done;
  };
  
  export function shallow<T>(valueA: T, valueB: T): boolean {
    if (Object.is(valueA, valueB)) {
      return true;
    }
    if (
      typeof valueA !== 'object' ||
      valueA === null ||
      typeof valueB !== 'object' ||
      valueB === null
    ) {
      return false;
    }
    if (Object.getPrototypeOf(valueA) !== Object.getPrototypeOf(valueB)) {
      return false;
    }
    if (isIterable(valueA) && isIterable(valueB)) {
      if (hasIterableEntries(valueA) && hasIterableEntries(valueB)) {
        return compareEntries(valueA, valueB);
      }
      return compareIterables(valueA, valueB);
    }
    return compareEntries(
      { entries: () => Object.entries(valueA) },
      { entries: () => Object.entries(valueB) }
    );
  }
  
  // Middleware
  type Write<T, U> = Omit<T, keyof U> & U;
  
  export function combine<
    T extends object,
    U extends object,
    Mps extends [StoreMutatorIdentifier, unknown][] = [],
    Mcs extends [StoreMutatorIdentifier, unknown][] = []
  >(
    initialState: T,
    create: StateCreator<T, Mps, Mcs, U>
  ): StateCreator<Write<T, U>, Mps, Mcs> {
    return (...args) => Object.assign({}, initialState, (create as any)(...args));
  }
  
  type Immer = <
    T,
    Mps extends [StoreMutatorIdentifier, unknown][] = [],
    Mcs extends [StoreMutatorIdentifier, unknown][] = []
  >(
    initializer: StateCreator<T, [...Mps, ['zustand/immer', never]], Mcs>
  ) => StateCreator<T, Mps, [['zustand/immer', never], ...Mcs]>;
  
  declare module './vanilla' {
    interface StoreMutators<S, A> {
      ['zustand/immer']: WithImmer<S>;
    }
  }
  
  type SkipTwo<T> = T extends { length: 0 }
    ? []
    : T extends { length: 1 }
    ? []
    : T extends { length: 0 | 1 }
    ? []
    : T extends [unknown, unknown, ...infer A]
    ? A
    : T extends [unknown, unknown?, ...infer A]
    ? A
    : T extends [unknown?, unknown?, ...infer A]
    ? A
    : never;
  
  type SetStateType<T extends unknown[]> = Exclude<
    T[0],
    (...args: any[]) => any
  >;
  
  type WithImmer<S> = Write<S, StoreImmer<S>>;
  
  type StoreImmer<S> = S extends {
    setState: infer SetState;
  }
    ? SetState extends {
        (...args: infer A1): infer Sr1;
        (...args: infer A2): infer Sr2;
      }
      ? {
          setState(
            nextStateOrUpdater:
              | SetStateType<A2>
              | Partial<SetStateType<A2>>
              | ((state: Draft<SetStateType<A2>>) => void),
            shouldReplace?: false,
            ...args: SkipTwo<A1>
          ): Sr1;
          setState(
            nextStateOrUpdater:
              | SetStateType<A2>
              | ((state: Draft<SetStateType<A2>>) => void),
            shouldReplace: true,
            ...args: SkipTwo<A2>
          ): Sr2;
        }
      : never
    : never;
  
  type ImmerImpl = <T>(
    storeInitializer: StateCreator<T, [], []>
  ) => StateCreator<T, [], []>;
  
  const immerImpl: ImmerImpl = (initializer) => (set, get, store) => {
    type T = ReturnType<typeof initializer>;
  
    store.setState = (updater, replace, ...args) => {
      const nextState = (
        typeof updater === 'function' ? produce(updater as any) : updater
      ) as ((s: T) => T) | T | Partial<T>;
  
      return set(nextState, replace as any, ...args);
    };
  
    return initializer(store.setState, get, store);
  };
  
  export const immer = immerImpl as unknown as Immer;
  
  export interface StateStorage {
    getItem: (name: string) => string | null | Promise<string | null>;
    setItem: (name: string, value: string) => unknown | Promise<unknown>;
    removeItem: (name: string) => unknown | Promise<unknown>;
  }
  
  export type StorageValue<S> = {
    state: S;
    version?: number;
  };
  
  export interface PersistStorage<S> {
    getItem: (
      name: string
    ) => StorageValue<S> | null | Promise<StorageValue<S> | null>;
    setItem: (name: string, value: StorageValue<S>) => unknown | Promise<unknown>;
    removeItem: (name: string) => unknown | Promise<unknown>;
  }
  
  type JsonStorageOptions = {
    reviver?: (key: string, value: unknown) => unknown;
    replacer?: (key: string, value: unknown) => unknown;
  };
  
  export function createJSONStorage<S>(
    getStorage: () => StateStorage,
    options?: JsonStorageOptions
  ): PersistStorage<S> | undefined {
    let storage: StateStorage | undefined;
    try {
      storage = getStorage();
    } catch {
      return;
    }
    const persistStorage: PersistStorage<S> = {
      getItem: (name) => {
        const parse = (str: string | null) => {
          if (str === null) {
            return null;
          }
          return JSON.parse(str, options?.reviver) as StorageValue<S>;
        };
        const str = storage.getItem(name) ?? null;
        if (str instanceof Promise) {
          return str.then(parse);
        }
        return parse(str);
      },
      setItem: (name, newValue) =>
        storage.setItem(name, JSON.stringify(newValue, options?.replacer)),
      removeItem: (name) => storage.removeItem(name),
    };
    return persistStorage;
  }
  
  export interface PersistOptions<S, PersistedState = S> {
    name: string;
    storage?: PersistStorage<PersistedState> | undefined;
    partialize?: (state: S) => PersistedState;
    onRehydrateStorage?: (
      state: S
    ) => ((state?: S, error?: unknown) => void) | void;
    version?: number;
    migrate?: (
      persistedState: unknown,
      version: number
    ) => PersistedState | Promise<PersistedState>;
    merge?: (persistedState: unknown, currentState: S) => S;
    skipHydration?: boolean;
  }
  
  type PersistListener<S> = (state: S) => void;
  
  type StorePersist<S, Ps> = {
    persist: {
      setOptions: (options: Partial<PersistOptions<S, Ps>>) => void;
      clearStorage: () => void;
      rehydrate: () => Promise<void> | void;
      hasHydrated: () => boolean;
      onHydrate: (fn: PersistListener<S>) => () => void;
      onFinishHydration: (fn: PersistListener<S>) => () => void;
      getOptions: () => Partial<PersistOptions<S, Ps>>;
    };
  };
  
  type Thenable<Value> = {
    then<V>(
      onFulfilled: (value: Value) => V | Promise<V> | Thenable<V>
    ): Thenable<V>;
    catch<V>(
      onRejected: (reason: Error) => V | Promise<V> | Thenable<V>
    ): Thenable<V>;
  };
  
  const toThenable = <Result, Input>(
    fn: (input: Input) => Result | Promise<Result> | Thenable<Result>
  ) => (input: Input): Thenable<Result> => {
    try {
      const result = fn(input);
      if (result instanceof Promise) {
        return result as Thenable<Result>;
      }
      return {
        then(onFulfilled) {
          return toThenable(onFulfilled)(result as Result);
        },
        catch(_onRejected) {
          return this as Thenable<any>;
        },
      };
    } catch (e: any) {
      return {
        then(_onFulfilled) {
          return this as Thenable<any>;
        },
        catch(onRejected) {
          return toThenable(onRejected)(e);
        },
      };
    }
  };
  
  type PersistImpl = <T>(
    storeInitializer: StateCreator<T, [], []>,
    options: PersistOptions<T, T>
  ) => StateCreator<T, [], []>;
  
  const persistImpl: PersistImpl = (config, baseOptions) => (set, get, api) => {
    type S = ReturnType<typeof config>;
    let options = {
      storage: createJSONStorage<S>(() => localStorage),
      partialize: (state: S) => state,
      version: 0,
      merge: (persistedState: unknown, currentState: S) => ({
        ...currentState,
        ...(persistedState as object),
      }),
      ...baseOptions,
    };
  
    let hasHydrated = false;
    const hydrationListeners = new Set<PersistListener<S>>();
    const finishHydrationListeners = new Set<PersistListener<S>>();
    let storage = options.storage;
  
    if (!storage) {
      return config(
        (...args) => {
          console.warn(
            `[zustand persist middleware] Unable to update item '${options.name}', the given storage is currently unavailable.`
          );
          set(...(args as Parameters<typeof set>));
        },
        get,
        api
      );
    }
  
    const setItem = () => {
      const state = options.partialize({ ...get() });
      return (storage as PersistStorage<S>).setItem(options.name, {
        state,
        version: options.version,
      });
    };
  
    const savedSetState = api.setState;
  
    api.setState = (state, replace) => {
      savedSetState(state, replace as any);
      void setItem();
    };
  
    const configResult = config(
      (...args) => {
        set(...(args as Parameters<typeof set>));
        void setItem();
      },
      get,
      api
    );
  
    api.getInitialState = () => configResult;
  
    let stateFromStorage: S | undefined;
  
    const hydrate = () => {
      if (!storage) return;
  
      hasHydrated = false;
      hydrationListeners.forEach((cb) => cb(get() ?? configResult));
  
      const postRehydrationCallback =
        options.onRehydrateStorage?.(get() ?? configResult) || undefined;
  
      return toThenable(storage.getItem.bind(storage))(options.name)
        .then((deserializedStorageValue) => {
          if (deserializedStorageValue) {
            if (
              typeof deserializedStorageValue.version === 'number' &&
              deserializedStorageValue.version !== options.version
            ) {
              if (options.migrate) {
                const migration = options.migrate(
                  deserializedStorageValue.state,
                  deserializedStorageValue.version
                );
                if (migration instanceof Promise) {
                  return migration.then((result) => [true, result] as const);
                }
                return [true, migration] as const;
              }
              console.error(
                `State loaded from storage couldn't be migrated since no migrate function was provided`
              );
            } else {
              return [false, deserializedStorageValue.state] as const;
            }
          }
          return [false, undefined] as const;
        })
        .then((migrationResult) => {
          const [migrated, migratedState] = migrationResult;
          stateFromStorage = options.merge(
            migratedState as S,
            get() ?? configResult
          );
  
          set(stateFromStorage as S, true);
          if (migrated) {
            return setItem();
          }
        })
        .then(() => {
          postRehydrationCallback?.(stateFromStorage, undefined);
          stateFromStorage = get();
          hasHydrated = true;
          finishHydrationListeners.forEach((cb) => cb(stateFromStorage as S));
        })
        .catch((e: Error) => {
          postRehydrationCallback?.(undefined, e);
        });
    };
  
    (api as StoreApi<S> & StorePersist<S, S>).persist = {
      setOptions: (newOptions) => {
        options = {
          ...options,
          ...newOptions,
        };
  
        if (newOptions.storage) {
          storage = newOptions.storage;
        }
      },
      clearStorage: () => {
        storage?.removeItem(options.name);
      },
      getOptions: () => options,
      rehydrate: () => hydrate() as Promise<void>,
      hasHydrated: () => hasHydrated,
      onHydrate: (cb) => {
        hydrationListeners.add(cb);
        return () => {
          hydrationListeners.delete(cb);
        };
      },
      onFinishHydration: (cb) => {
        finishHydrationListeners.add(cb);
        return () => {
          finishHydrationListeners.delete(cb);
        };
      },
    };
  
    if (!options.skipHydration) {
      hydrate();
    }
  
    return stateFromStorage || configResult;
  };
  
  type Persist = <
    T,
    Mps extends [StoreMutatorIdentifier, unknown][] = [],
    Mcs extends [StoreMutatorIdentifier, unknown][] = [],
    U = T
  >(
    initializer: StateCreator<T, [...Mps, ['zustand/persist', unknown]], Mcs>,
    options: PersistOptions<T, U>
  ) => StateCreator<T, Mps, [['zustand/persist', U], ...Mcs]>;
  
  declare module './vanilla' {
    interface StoreMutators<S, A> {
      'zustand/persist': WithPersist<S, A>;
    }
  }
  
  type WithPersist<S, A> = S extends { getState: () => infer T }
    ? Write<S, StorePersist<T, A>>
    : never;
  
  export const persist = persistImpl as unknown as Persist;
  
  type Action = { type: string };
  
  type StoreRedux<A> = {
    dispatch: (a: A) => A;
    dispatchFromDevtools: true;
  };
  
  type ReduxState<A> = {
    dispatch: StoreRedux<A>['dispatch'];
  };
  
  type WithRedux<S, A> = Write<S, StoreRedux<A>>;
  
  type Redux = <
    T,
    A extends Action,
    Cms extends [StoreMutatorIdentifier, unknown][] = []
  >(
    reducer: (state: T, action: A) => T,
    initialState: T
  ) => StateCreator<Write<T, ReduxState<A>>, Cms, [['zustand/redux', A]]>;
  
  declare module './vanilla' {
    interface StoreMutators<S, A> {
      'zustand/redux': WithRedux<S, A>;
    }
  }
  
  type ReduxImpl = <T, A extends Action>(
    reducer: (state: T, action: A) => T,
    initialState: T
  ) => StateCreator<T & ReduxState<A>, [], []>;
  
  const reduxImpl: ReduxImpl = (reducer, initial) => (set, _get, api) => {
    type S = typeof initial;
    type A = Parameters<typeof reducer>[1];
    (api as any).dispatch = (action: A) => {
      set((state: S) => reducer(state, action), false);
      return action;
    };
    (api as any).dispatchFromDevtools = true;
  
    return { dispatch: (...args) => (api as any).dispatch(...args), ...initial };
  };
  
  export const redux = reduxImpl as unknown as Redux;
  
  type SubscribeWithSelector = <
    T,
    Mps extends [StoreMutatorIdentifier, unknown][] = [],
    Mcs extends [StoreMutatorIdentifier, unknown][] = []
  >(
    initializer: StateCreator<
      T,
      [...Mps, ['zustand/subscribeWithSelector', never]],
      Mcs
    >
  ) => StateCreator<
    T,
    Mps,
    [['zustand/subscribeWithSelector', never], ...Mcs]
  >;
  
  type WithSelectorSubscribe<S> = S extends { getState: () => infer T }
    ? Write<S, StoreSubscribeWithSelector<T>>
    : never;
  
  declare module './vanilla' {
    interface StoreMutators<S, A> {
      ['zustand/subscribeWithSelector']: WithSelectorSubscribe<S>;
    }
  }
  
  type StoreSubscribeWithSelector<T> = {
    subscribe: {
      (listener: (selectedState: T, previousSelectedState: T) => void): () => void;
      <U>(
        selector: (state: T) => U,
        listener: (selectedState: U, previousSelectedState: U) => void,
        options?: {
          equalityFn?: (a: U, b: U) => boolean;
          fireImmediately?: boolean;
        }
      ): () => void;
    };
  };
  
  type SubscribeWithSelectorImpl = <T extends object>(
    storeInitializer: StateCreator<T, [], []>
  ) => StateCreator<T, [], []>;
  
  const subscribeWithSelectorImpl: SubscribeWithSelectorImpl = (fn) => (
    set,
    get,
    api
  ) => {
    type S = ReturnType<typeof fn>;
    type Listener = (state: S, previousState: S) => void;
    const origSubscribe = api.subscribe as (listener: Listener) => () => void;
    api.subscribe = ((selector: any, optListener: any, options: any) => {
      let listener: Listener = selector;
      if (optListener) {
        const equalityFn = options?.equalityFn || Object.is;
        let currentSlice = selector(api.getState());
        listener = (state) => {
          const nextSlice = selector(state);
          if (!equalityFn(currentSlice, nextSlice)) {
            const previousSlice = currentSlice;
            optListener((currentSlice = nextSlice), previousSlice);
          }
        };
        if (options?.fireImmediately) {
          optListener(currentSlice, currentSlice);
        }
      }
      return origSubscribe(listener);
    }) as any;
    const initialState = fn(set, get, api);
    return initialState;
  };
  export const subscribeWithSelector =
    subscribeWithSelectorImpl as unknown as SubscribeWithSelector;
