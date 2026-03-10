import React from "react";
import { Input } from "@/components/ui/input";
import { sanitizeInput } from "@/components/contentFilter";
import { cn } from "@/lib/utils";

const FilteredInput = React.forwardRef(({ onChange, value, ...props }, ref) => {
  const handleChange = (e) => {
    const sanitized = sanitizeInput(e.target.value);
    e.target.value = sanitized;
    onChange?.(e);
  };

  return (
    <Input
      ref={ref}
      value={value}
      onChange={handleChange}
      {...props}
    />
  );
});

FilteredInput.displayName = "FilteredInput";

export default FilteredInput;