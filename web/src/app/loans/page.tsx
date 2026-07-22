"use client";

import { LoanList } from "@/components/loans/loan-list";

export default function LoansPage() {
  return <LoanList direction="lent_by_me" />;
}
