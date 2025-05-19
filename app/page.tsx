import { ImageOnlyOCR } from "@/components/image-only-ocr"
import { ResultsDisplay } from "@/components/results-display"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { FileUploader } from "@/components/file-uploader"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-6 md:p-24">
      <div className="w-full max-w-3xl mx-auto space-y-8">
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold tracking-tight">OCR 文本识别工具</h1>
          <p className="text-lg text-muted-foreground">上传图片或PDF文件，自动提取文本内容</p>
        </div>

        <Alert variant="warning" className="bg-amber-50 border-amber-200 text-amber-800">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>注意</AlertTitle>
          <AlertDescription>由于浏览器限制，PDF处理功能可能不稳定。推荐使用图片格式获得最佳效果。</AlertDescription>
        </Alert>

        <Tabs defaultValue="image" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="image">图片识别</TabsTrigger>
            <TabsTrigger value="pdf">PDF识别 (实验性)</TabsTrigger>
          </TabsList>
          <TabsContent value="image">
            <ImageOnlyOCR />
          </TabsContent>
          <TabsContent value="pdf">
            <div className="space-y-4">
              <div className="p-4 bg-amber-50 border border-amber-200 rounded-md text-amber-800 text-sm">
                <p>PDF识别功能在某些环境中可能不稳定。如果遇到问题，请将PDF转换为图片后使用图片识别功能。</p>
              </div>
              <FileUploader />
            </div>
          </TabsContent>
        </Tabs>

        <ResultsDisplay />
      </div>
    </main>
  )
}
