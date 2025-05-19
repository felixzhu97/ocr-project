"use client"

import { AlertCircle } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"

interface FallbackMessageProps {
  onContinue: () => void
}

export function FallbackMessage({ onContinue }: FallbackMessageProps) {
  return (
    <div className="space-y-4">
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>PDF处理失败</AlertTitle>
        <AlertDescription>无法加载PDF处理库。这可能是由于浏览器限制或网络问题导致的。</AlertDescription>
      </Alert>
      <div className="flex justify-end">
        <Button onClick={onContinue}>继续使用图片识别</Button>
      </div>
    </div>
  )
}
