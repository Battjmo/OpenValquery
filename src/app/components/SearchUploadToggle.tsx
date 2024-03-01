"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const SearchUploadToggle = () => {
  const pathname = usePathname();
  const linkText = pathname === "/" ? "Upload" : "Search";
  return <Link href={pathname === "/" ? "/upload" : "/"}>{linkText}</Link>;
};

export default SearchUploadToggle;
