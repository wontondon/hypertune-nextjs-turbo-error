/* eslint-disable */

"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import * as hypertune from "./hypertune";
import * as sdk from "hypertune";

// Hypertune

export function HypertuneProvider({
  createSourceOptions,
  dehydratedState,
  rootArgs,
  children,
}: {
  createSourceOptions: hypertune.CreateSourceOptions;
  dehydratedState?: hypertune.DehydratedState | null;
  rootArgs: hypertune.RootArgs;
  children: React.ReactNode;
}): React.ReactElement {
  return (
    <HypertuneSourceProvider createSourceOptions={createSourceOptions}>
      <HypertuneHydrator dehydratedState={dehydratedState}>
        <HypertuneRootProvider rootArgs={rootArgs}>
          {children}
        </HypertuneRootProvider>
      </HypertuneHydrator>
    </HypertuneSourceProvider>
  );
}

// Hypertune Source

const HypertuneSourceContext = React.createContext<{
  hypertuneSource: hypertune.SourceNode;
  stateHash: string | null;
}>({ hypertuneSource: hypertune.emptySource, stateHash: null });

export function HypertuneSourceProvider({
  createSourceOptions,
  children,
}: {
  createSourceOptions: hypertune.CreateSourceOptions;
  children: React.ReactNode;
}): React.ReactElement {
  const hypertuneSource = React.useMemo(
    () =>
      hypertune.createSource({
        initDataProvider: typeof window === "undefined" ? null : undefined,
        remoteLogging: {
          mode: typeof window === "undefined" ? "off" : undefined
        },
        ...createSourceOptions,
      }),
    // Don't recreate the source even if createSourceOptions changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  const [stateHash, setStateHash] = React.useState(
    hypertuneSource.getStateHash()
  );
  const router = useRouter();
  React.useEffect(() => {
    const updateListener: sdk.UpdateListener = (newStateHash, metadata) => {
      if (metadata.updateTrigger !== "initDataProvider") {
        return;
      }
      setStateHash(newStateHash); // Re-render

      if (!metadata.becameReady) {
        // Only refresh the page if the sdk was ready before this update
        router.refresh();
      }
    }
    hypertuneSource.addUpdateListener(updateListener);
    return () => {
      hypertuneSource.removeUpdateListener(updateListener);
    };
  }, [hypertuneSource, router]);

  const value = React.useMemo(
    () => ({ hypertuneSource, stateHash }),
    [hypertuneSource, stateHash]
  );

  return (
    <HypertuneSourceContext.Provider value={value}>
      {children}
    </HypertuneSourceContext.Provider>
  );
}

export function useHypertuneSource(): hypertune.SourceNode {
  const { hypertuneSource } = React.useContext(HypertuneSourceContext);
  return hypertuneSource;
}

// Hypertune Root

const HypertuneRootContext = React.createContext(
  new hypertune.RootNode({
    context: null,
    logger: null,
    parent: null,
    step: null,
    expression: null,
  })
);

export function HypertuneRootProvider({
  rootArgs,
  children,
}: {
  rootArgs: hypertune.RootArgs;
  children: React.ReactNode;
}): React.ReactElement {
  const hypertuneSource = useHypertuneSource();

  const hypertuneRoot = hypertuneSource.root({ args: rootArgs });

  return (
    <HypertuneRootContext.Provider value={hypertuneRoot}>
      {children}
    </HypertuneRootContext.Provider>
  );
}

export function useHypertune(): hypertune.RootNode {
  return React.useContext(HypertuneRootContext);
}

export function HypertuneHydrator({
  dehydratedState,
  children,
}: {
  dehydratedState?: hypertune.DehydratedState | null;
  children: React.ReactElement | null;
}): React.ReactElement | null {
  const hypertuneSource = useHypertuneSource();

  if (dehydratedState) {
    hypertuneSource.hydrate(dehydratedState);
  }

  return children;
}
