"use client"

import type React from "react"

import { useState } from "react"
import { ImageIcon, Loader2, UploadIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import { createWorker } from "tesseract.js"

export function ImageOnlyOCR() {
  const [file, setFile] = useState<File | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const { toast } = useToast()

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0]

      // Check if file is an image
      if (selectedFile.type.startsWith("image/")) {
        setFile(selectedFile)
      } else {
        toast({
          title: "不支持的文件类型",
          description: "请上传图片文件 (JPG, PNG等)",
          variant: "destructive",
        })
      }
    }
  }

  const processImage = async (imageFile: File): Promise<string> => {
    const worker = await createWorker("chi_sim+eng")
    const { data } = await worker.recognize(imageFile)
    await worker.terminate()
    return data.text
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!file) {
      toast({
        title: "请选择文件",
        description: "请上传图片文件进行文本识别",
        variant: "destructive",
      })
      return
    }

    try {
      setIsProcessing(true)

      const extractedText = await processImage(file)

      // Store the extracted text in localStorage
      localStorage.setItem("extractedText", extractedText)

      // Force a re-render of the results component
      window.dispatchEvent(new Event("storage"))

      toast({
        title: "处理完成",
        description: "文本识别已完成",
      })
    } catch (error) {
      console.error("Error processing file:", error)
      toast({
        title: "处理失败",
        description: "文件处理过程中出现错误，请重试",
        variant: "destructive",
      })
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <Card className="border-dashed">
        <CardContent className="pt-6">
          <div className="flex flex-col items-center justify-center space-y-4">
            <div className="flex h-40 w-full cursor-pointer flex-col items-center justify-center rounded-md border border-dashed border-muted-foreground/25 px-4 py-5 text-center">
              <input
                id="image-upload"
                name="image-upload"
                type="file"
                className="sr-only"
                onChange={handleFileChange}
                accept="image/*"
              />
              <label
                htmlFor="image-upload"
                className="w-full h-full flex flex-col items-center justify-center cursor-pointer"
              >
                {file ? (
                  <>
                    <ImageIcon className="h-10 w-10 text-muted-foreground" />
                    <p className="mt-2 text-base font-medium text-muted-foreground">{file.name}</p>
                    <p className="text-sm text-muted-foreground">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                  </>
                ) : (
                  <>
                    <UploadIcon className="h-10 w-10 text-muted-foreground" />
                    <p className="mt-2 text-base font-medium">点击或拖拽图片到此处上传</p>
                    <p className="text-sm text-muted-foreground">支持PNG, JPG等图片格式</p>
                  </>
                )}
              </label>
            </div>

            <Button type="submit" className="w-full" disabled={!file || isProcessing}>
              {isProcessing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  处理中...
                </>
              ) : (
                "开始识别"
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </form>
  )
}
