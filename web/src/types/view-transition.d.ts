import "react";

declare module "react" {
  export interface ViewTransitionClass {
    [type: string]: string;
  }

  export interface ViewTransitionProps {
    children?: React.ReactNode;
    name?: string;
    default?: "none" | "auto" | string | ViewTransitionClass;
    enter?: "none" | "auto" | string | ViewTransitionClass;
    exit?: "none" | "auto" | string | ViewTransitionClass;
    share?: "none" | "auto" | string | ViewTransitionClass;
    update?: "none" | "auto" | string | ViewTransitionClass;
  }

  export const ViewTransition: React.FC<ViewTransitionProps>;
  export function addTransitionType(type: string): void;
}
