import React from "react";

export function SkipLink({ target = "#main-content" }: { target?: string }) {
  return (
    <a href={target} className="skip-link">
      Skip to main content
    </a>
  );
}
