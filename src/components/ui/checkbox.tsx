"use client"

import * as React from "react"
import * as CheckboxPrimitive from "@radix-ui/react-checkbox"
import { CheckIcon } from "lucide-react"

import { cn } from "@/lib/utils"

function Checkbox({
  className,
  ...props
}: React.ComponentProps<typeof CheckboxPrimitive.Root>) {
  return (
    <CheckboxPrimitive.Root
      data-slot="checkbox"
      className={cn(
        "peer size-4 shrink-0 rounded-[4px] border transition-shadow outline-none",
        "border-[#D0D0D8]",                            
        "data-[state=checked]:bg-[#E76C82]",          
        "data-[state=checked]:border-[#E76C82]",                 
        "focus-visible:ring-[3px] focus-visible:ring-[#E76C82]/30", 
        "disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      {...props}
    >
    <CheckboxPrimitive.Indicator className="grid place-content-center" >
        <CheckIcon className="size-3.5 text-white" /> 
    </CheckboxPrimitive.Indicator>
    </CheckboxPrimitive.Root>
  );
}

export { Checkbox }
