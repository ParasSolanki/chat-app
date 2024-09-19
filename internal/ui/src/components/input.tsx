import * as React from "react";
import { cn } from "../cn";

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:ring-ring flex h-10 w-full rounded-md border px-3 py-2 text-sm file:border-0 file:bg-transparent file:text-sm file:font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
          className,
        )}
        ref={ref}
        {...props}
      />
    );
  },
);
Input.displayName = "Input";

export interface DebouncedInputProps extends InputProps {
  debounce?: number;
  onUpdate?: (value: string | number) => void;
}

const DebouncedInput = React.forwardRef<HTMLInputElement, DebouncedInputProps>(
  (
    { type, defaultValue, debounce = 500, onChange, onUpdate, ...props },
    ref,
  ) => {
    const [value, setValue] = React.useState(defaultValue);

    React.useEffect(() => {
      setValue(defaultValue);
    }, [defaultValue]);

    React.useEffect(() => {
      const timeout = setTimeout(() => {
        if (typeof value === "string" || typeof value === "number") {
          onUpdate?.(value);
        }
      }, debounce);

      return () => {
        clearTimeout(timeout);
      };
    }, [value]);

    return (
      <Input
        ref={ref}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        {...props}
      />
    );
  },
);
DebouncedInput.displayName = "DebouncedInput";

export { Input, DebouncedInput };
