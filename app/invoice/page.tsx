import type { Metadata } from "next"
import { InvoiceGuide } from "@/components/invoice-guide/invoice-guide"

export const metadata: Metadata = {
  title: "中油PAY 現場代購發票指引",
  description: "現場協助顧客代購時的統編與雲端載具操作指引",
}

export default function InvoicePage() {
  return <InvoiceGuide />
}
