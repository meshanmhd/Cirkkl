"use client";

import React, { useState, useMemo, useEffect } from "react";
import { cn } from "@/lib/utils";
import { ChevronDown, Check } from "lucide-react";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { searchColleges } from "@/app/actions/college";

interface CollegeDropdownProps {
  value: string;
  onChange: (value: string) => void;
  className?: string;
  disabled?: boolean;
  required?: boolean;
}

export function CollegeDropdown({ value, onChange, className, disabled, required }: CollegeDropdownProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [results, setResults] = useState<any[]>([]);

  useEffect(() => {
    if (!search || search.length < 2) {
      setResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      const res = await searchColleges(search);
      setResults(res);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  return (
    <div className="flex flex-col gap-2">
      <label className="text-sm font-medium text-[#111111]">College / University Name {required && <span className="text-red-500">*</span>}</label>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger
          disabled={disabled}
          className={cn(
            "flex w-full items-center justify-between h-12 px-4 rounded-xl border border-[#E5E5EA] bg-white text-sm text-[#111111] focus:outline-none focus:border-[#9E9EA7] transition-colors disabled:opacity-50",
            className
          )}
        >
          <span className="truncate">
            {value ? value : <span className="text-[#9E9EA7]">e.g. IIT Bombay</span>}
          </span>
          <ChevronDown className="h-4 w-4 shrink-0 text-[#6E6E73] opacity-50" />
        </PopoverTrigger>
        <PopoverContent className="w-[450px] max-w-[90vw] p-0" align="start">
          <Command shouldFilter={false}>
            <CommandInput 
              placeholder="Search your college..." 
              value={search}
              onValueChange={setSearch}
            />
            <CommandList className="max-h-[250px] scrollbar-thin scrollbar-thumb-[#E5E5EA]">
              <CommandEmpty>
                {search.length < 2 
                  ? "Type at least 2 characters to search..." 
                  : "No college found. You can type and select your custom name."}
              </CommandEmpty>
              
              <CommandGroup>
                {results.map((inst: any) => (
                  <CommandItem
                    key={inst.aishe_code || inst.name}
                    value={inst.name}
                    onSelect={() => {
                      onChange(inst.name);
                      setOpen(false);
                    }}
                    className="flex items-center gap-2 cursor-pointer py-1 px-2 min-h-0"
                  >
                    <span className="truncate font-medium flex-1">{inst.name}</span>
                    {value === inst.name && (
                      <Check className="h-4 w-4 text-[#111111] shrink-0" />
                    )}
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
}
