"use client";

import { LoanList } from "@/components/loans/loan-list";

export default function BorrowedMoneyPage() {
  return <LoanList direction="borrowed_by_me" />;
}
