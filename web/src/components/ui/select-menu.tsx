"use client";

import {
  Children,
  isValidElement,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type FocusEventHandler,
  type ReactElement,
  type ReactNode,
} from "react";
import { Check, ChevronDown } from "lucide-react";
import { cn } from "@/lib/design/cn";
import { selectVariants } from "@/lib/design/variants";

type SelectOption = { value: string; label: string; disabled?: boolean };

function parseOptionChildren(children: ReactNode): SelectOption[] {
  const options: SelectOption[] = [];

  const walk = (nodes: ReactNode) => {
    Children.forEach(nodes, (child) => {
      if (!isValidElement(child)) return;

      if (child.type === "option") {
        const props = child.props as {
          value?: string | number;
          disabled?: boolean;
          children?: ReactNode;
        };
        const label =
          typeof props.children === "string" || typeof props.children === "number"
            ? String(props.children)
            : Children.toArray(props.children).join("");

        options.push({
          value: props.value == null ? "" : String(props.value),
          label,
          disabled: props.disabled,
        });
        return;
      }

      if (child.type === "optgroup") {
        walk((child as ReactElement<{ children?: ReactNode }>).props.children);
      }
    });
  };

  walk(children);
  return options;
}

export function SelectMenu({
  value,
  defaultValue,
  onChange,
  onBlur,
  name,
  id,
  disabled,
  required,
  className,
  tone = "default",
  "aria-label": ariaLabel,
  children,
}: {
  value?: string | number;
  defaultValue?: string | number;
  onChange?: React.ChangeEventHandler<HTMLSelectElement>;
  onBlur?: FocusEventHandler<HTMLSelectElement>;
  name?: string;
  id?: string;
  disabled?: boolean;
  required?: boolean;
  className?: string;
  tone?: "default" | "filter";
  "aria-label"?: string;
  children: ReactNode;
}) {
  const options = useMemo(() => parseOptionChildren(children), [children]);
  const [open, setOpen] = useState(false);
  const normalizedDefault = defaultValue == null ? undefined : String(defaultValue);
  const [internalValue, setInternalValue] = useState(normalizedDefault ?? options[0]?.value ?? "");
  const isControlled = value !== undefined;
  const currentValue = isControlled ? String(value) : internalValue;
  const selected = options.find((option) => option.value === currentValue) ?? options[0];

  const containerRef = useRef<HTMLDivElement>(null);
  const autoId = useId();
  const listboxId = `${autoId}-listbox`;

  const fireChange = (next: string) => {
    if (!isControlled) setInternalValue(next);
    onChange?.({
      target: { value: next, name: name ?? "" },
      currentTarget: { value: next, name: name ?? "" },
    } as React.ChangeEvent<HTMLSelectElement>);
  };

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, [open]);

  const onKeyDown = (event: React.KeyboardEvent<HTMLButtonElement>) => {
    if (disabled) return;

    if (event.key === "Escape") {
      setOpen(false);
      return;
    }

    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      setOpen((prev) => !prev);
      return;
    }

    if (!open && (event.key === "ArrowDown" || event.key === "ArrowUp")) {
      event.preventDefault();
      setOpen(true);
      return;
    }

    if (!open) return;

    const currentIndex = options.findIndex((option) => option.value === currentValue);
    if (event.key === "ArrowDown") {
      event.preventDefault();
      const next = options.slice(currentIndex + 1).find((option) => !option.disabled);
      if (next) fireChange(next.value);
    }
    if (event.key === "ArrowUp") {
      event.preventDefault();
      const prev = [...options.slice(0, currentIndex)].reverse().find((option) => !option.disabled);
      if (prev) fireChange(prev.value);
    }
  };

  return (
    <div ref={containerRef} className={cn("relative", tone === "filter" && "inline-flex")}>
      {name ? <input type="hidden" name={name} value={currentValue} required={required} /> : null}
      <button
        type="button"
        id={id}
        role="combobox"
        aria-expanded={open}
        aria-controls={listboxId}
        aria-label={ariaLabel}
        disabled={disabled}
        onClick={() => !disabled && setOpen((prev) => !prev)}
        onKeyDown={onKeyDown}
        onBlur={onBlur as unknown as FocusEventHandler<HTMLButtonElement>}
        className={cn(
          selectVariants.trigger,
          tone === "filter" && selectVariants.triggerFilter,
          open && selectVariants.triggerOpen,
          className,
        )}
      >
        <span className="truncate">{selected?.label ?? "Select…"}</span>
        <ChevronDown
          className={cn("h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200", open && "rotate-180")}
          aria-hidden
        />
      </button>

      {open ? (
        <ul id={listboxId} role="listbox" className={cn(selectVariants.menu, "scroll-premium")}>
          {options.map((option) => {
            const active = option.value === currentValue;
            return (
              <li key={`${option.value}-${option.label}`} role="presentation">
                <button
                  type="button"
                  role="option"
                  aria-selected={active}
                  disabled={option.disabled}
                  onClick={() => {
                    if (option.disabled) return;
                    fireChange(option.value);
                    setOpen(false);
                  }}
                  className={cn(selectVariants.item, active && selectVariants.itemActive)}
                >
                  <span className="truncate">{option.label}</span>
                  {active ? <Check className="h-4 w-4 shrink-0 text-primary" aria-hidden /> : null}
                </button>
              </li>
            );
          })}
        </ul>
      ) : null}
    </div>
  );
}
