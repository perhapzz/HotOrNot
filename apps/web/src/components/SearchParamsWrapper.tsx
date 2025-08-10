"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";

interface SearchParamsWrapperProps {
  children: (
    searchParams: ReturnType<typeof useSearchParams>,
  ) => React.ReactNode;
}

function SearchParamsComponent({ children }: SearchParamsWrapperProps) {
  const searchParams = useSearchParams();
  return <>{children(searchParams)}</>;
}

export default function SearchParamsWrapper({
  children,
}: SearchParamsWrapperProps) {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <SearchParamsComponent>{children}</SearchParamsComponent>
    </Suspense>
  );
}
