"use client";

import type React from "react";

import { useState, useRef, useEffect } from "react";
import { FileIcon, ImageIcon, Loader2, UploadIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { createWorker } from "tesseract.js";
import { FallbackMessage } from "@/components/fallback-message";

export function FileUploader() {
  const [file, setFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const { toast } = useToast();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [pdfjs, setPdfjs] = useState<any>(null);
  const [pdfLoadError, setPdfLoadError] = useState<boolean>(false);

  // Load PDF.js only on client side
  useEffect(() => {
    const loadPdfjs = async () => {
      if (typeof window !== "undefined") {
        try {
          // 从本地node_modules加载
          const pdfjsLib = await import("pdfjs-dist");

          // 设置worker路径
          pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
            "pdfjs-dist/build/pdf.worker.min.js",
            import.meta.url
          ).toString();

          setPdfjs(pdfjsLib);
        } catch (error) {
          console.error("Failed to load PDF.js:", error);
          setPdfLoadError(true);
        }
      }
    };

    loadPdfjs();
  }, []);

  const handleContinueWithoutPdf = () => {
    setPdfLoadError(false);
    // Switch to image tab
    const imageTab = document.querySelector(
      'button[value="image"]'
    ) as HTMLButtonElement;
    if (imageTab) {
      imageTab.click();
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];

      // Check if file is an image or PDF
      if (
        selectedFile.type.startsWith("image/") ||
        selectedFile.type === "application/pdf"
      ) {
        setFile(selectedFile);
      } else {
        toast({
          title: "不支持的文件类型",
          description: "请上传图片或PDF文件",
          variant: "destructive",
        });
      }
    }
  };

  const processPdf = async (pdfFile: File): Promise<string> => {
    if (!pdfjs) {
      throw new Error("PDF.js library not loaded");
    }

    const arrayBuffer = await pdfFile.arrayBuffer();
    const pdf = await pdfjs.getDocument({ data: arrayBuffer }).promise;
    let fullText = "";

    // Create a canvas element if it doesn't exist
    if (!canvasRef.current) {
      const canvas = document.createElement("canvas");
      canvas.style.display = "none";
      document.body.appendChild(canvas);
      canvasRef.current = canvas;
    }

    const worker = await createWorker("chi_sim+eng");

    for (let i = 1; i <= pdf.numPages; i++) {
      // Update progress
      setProgress(Math.floor((i / pdf.numPages) * 100));

      // Get the page
      const page = await pdf.getPage(i);
      const viewport = page.getViewport({ scale: 1.5 });

      // Prepare canvas for rendering
      const canvas = canvasRef.current;
      const context = canvas.getContext("2d");
      canvas.height = viewport.height;
      canvas.width = viewport.width;

      // Render PDF page to canvas
      await page.render({
        canvasContext: context!,
        viewport: viewport,
      }).promise;

      // Convert canvas to image data
      const imageData = canvas.toDataURL("image/png");

      // Recognize text from the image
      const { data } = await worker.recognize(imageData);
      fullText += data.text + "\n\n";
    }

    await worker.terminate();
    return fullText;
  };

  const processImage = async (imageFile: File): Promise<string> => {
    const worker = await createWorker("chi_sim+eng");
    const { data } = await worker.recognize(imageFile);
    await worker.terminate();
    return data.text;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!file) {
      toast({
        title: "请选择文件",
        description: "请上传图片或PDF文件进行文本识别",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsProcessing(true);
      setProgress(0);

      let extractedText = "";

      if (file.type === "application/pdf") {
        if (!pdfjs) {
          throw new Error(
            "PDF.js library not loaded. Please try again or use an image file instead."
          );
        }
        extractedText = await processPdf(file);
      } else if (file.type.startsWith("image/")) {
        extractedText = await processImage(file);
      }

      // Store the extracted text in localStorage
      localStorage.setItem("extractedText", extractedText);

      // Force a re-render of the results component
      window.dispatchEvent(new Event("storage"));

      toast({
        title: "处理完成",
        description: "文本识别已完成",
      });
    } catch (error) {
      console.error("Error processing file:", error);
      toast({
        title: "处理失败",
        description:
          error instanceof Error
            ? error.message
            : "文件处理过程中出现错误，请重试",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
      setProgress(0);
    }
  };

  if (pdfLoadError) {
    return <FallbackMessage onContinue={handleContinueWithoutPdf} />;
  }

  return (
    <form onSubmit={handleSubmit}>
      <Card className="border-dashed">
        <CardContent className="pt-6">
          <div className="flex flex-col items-center justify-center space-y-4">
            <div className="flex h-40 w-full cursor-pointer flex-col items-center justify-center rounded-md border border-dashed border-muted-foreground/25 px-4 py-5 text-center">
              <input
                id="file-upload"
                name="file-upload"
                type="file"
                className="sr-only"
                onChange={handleFileChange}
                accept="image/*,.pdf"
              />
              <label
                htmlFor="file-upload"
                className="w-full h-full flex flex-col items-center justify-center cursor-pointer"
              >
                {file ? (
                  <>
                    {file.type.startsWith("image/") ? (
                      <ImageIcon className="h-10 w-10 text-muted-foreground" />
                    ) : (
                      <FileIcon className="h-10 w-10 text-muted-foreground" />
                    )}
                    <p className="mt-2 text-base font-medium text-muted-foreground">
                      {file.name}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {(file.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </>
                ) : (
                  <>
                    <UploadIcon className="h-10 w-10 text-muted-foreground" />
                    <p className="mt-2 text-base font-medium">
                      点击或拖拽文件到此处上传
                    </p>
                    <p className="text-sm text-muted-foreground">
                      支持PNG, JPG, PDF等格式
                    </p>
                  </>
                )}
              </label>
            </div>

            {isProcessing && progress > 0 && (
              <div className="w-full">
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary transition-all duration-300 ease-in-out"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <p className="text-xs text-center mt-1 text-muted-foreground">
                  {progress}%
                </p>
              </div>
            )}

            <Button
              type="submit"
              className="w-full"
              disabled={!file || isProcessing}
            >
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
  );
}
