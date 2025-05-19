"use client"

import { useEffect, useState } from "react"
import { Copy } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"

export function ResultsDisplay() {
  const [extractedText, setExtractedText] = useState<string | null>(null)
  const { toast } = useToast()

  useEffect(() => {
    // Get the extracted text from localStorage
    const text = localStorage.getItem("extractedText")
    if (text) {
      setExtractedText(text)
    }

    // Listen for storage events to update the text when it changes
    const handleStorageChange = () => {
      const updatedText = localStorage.getItem("extractedText")
      if (updatedText) {
        setExtractedText(updatedText)
      }
    }

    window.addEventListener("storage", handleStorageChange)

    return () => {
      window.removeEventListener("storage", handleStorageChange)
    }
  }, [])

  const copyToClipboard = () => {
    if (extractedText) {
      navigator.clipboard.writeText(extractedText)
      toast({
        title: "已复制到剪贴板",
        description: "文本内容已成功复制到剪贴板",
      })
    }
  }

  if (!extractedText) {
    return null
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>识别结果</CardTitle>
        <Button variant="outline" size="icon" onClick={copyToClipboard}>
          <Copy className="h-4 w-4" />
          <span className="sr-only">复制文本</span>
        </Button>
      </CardHeader>
      <CardContent>
        <div className="max-h-96 overflow-y-auto rounded-md bg-muted p-4">
          <pre className="whitespace-pre-wrap break-words text-sm">{extractedText}</pre>
        </div>
      </CardContent>
    </Card>
  )
}
