import React from 'react';

export function Logo(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="10" />
      <circle cx="12" cy="12" r="3" fill="currentColor" />
      <path d="M12 2v3" />
      <path d="M12 19v3" />
      <path d="M5 7l2 2" />
      <path d="M17 15l2 2" />
      <path d="m19 7-2 2" />
      <path d="m7 15-2 2" />
    </svg>
  );
}
