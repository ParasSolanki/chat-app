import * as React from "react";
import { useDropzone } from "react-dropzone";
import type { DropzoneProps, DropzoneState } from "react-dropzone";

export type DropContextProps = DropzoneState;

export const DropContext = React.createContext<DropContextProps | undefined>(
  undefined,
);
DropContext.displayName = "DropContext";

export type DropContextProviderProps = {
  children?: React.ReactNode | ((state: DropzoneState) => React.ReactNode);
  noClick?: DropzoneProps["noClick"];
  onDrop?: DropzoneProps["onDrop"];
};

export function DropContextProvider(props: DropContextProviderProps) {
  const dropzoneState = useDropzone({
    noClick: props.noClick,
    onDrop: props.onDrop,
    accept: {
      "image/*": [".jpeg", ".jpg", ".png", ".webp"],
    },
  });

  const value = React.useMemo(() => dropzoneState, [dropzoneState]);

  return (
    <DropContext.Provider value={value}>
      {typeof props.children === "function"
        ? props.children(value)
        : props.children}
    </DropContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useDropContext() {
  const context = React.useContext(DropContext);

  if (!context) {
    throw new Error("Missing DropContextProvider");
  }

  return context;
}
