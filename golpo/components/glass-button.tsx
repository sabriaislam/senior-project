import Link from "next/link";
import type { ComponentPropsWithoutRef } from "react";

type AsButton = ComponentPropsWithoutRef<"button"> & { href?: never };
type AsLink = ComponentPropsWithoutRef<typeof Link> & { href: string };

export function GlassButton(props: AsButton | AsLink) {
  if ("href" in props && props.href !== undefined) {
    const { className = "", ...rest } = props as AsLink;
    return <Link className={`glass-btn ${className}`.trim()} {...rest} />;
  }
  const { className = "", ...rest } = props as AsButton;
  return <button className={`glass-btn ${className}`.trim()} {...rest} />;
}
