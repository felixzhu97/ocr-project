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

          // 设置worker路径 - 使用公共路径
          const workerSrc = "/pdf.worker.min.mjs";
          pdfjsLib.GlobalWorkerOptions.workerSrc = workerSrc;

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

  // Worker池管理
  const workerPool = useRef<{worker: any; busy: boolean}[]>([]);
  const MAX_WORKERS = 4; // 根据CPU核心数调整

  // 初始化worker池
  const initWorkerPool = async () => {
    for (let i = 0; i < MAX_WORKERS; i++) {
      const worker = await createWorker("chi_sim+eng");
      workerPool.current.push({worker, busy: false});
    }
  };

  // 获取空闲worker
  const getAvailableWorker = async () => {
    // 如果池为空，初始化
    if (workerPool.current.length === 0) {
      await initWorkerPool();
    }

    // 查找空闲worker
    const available = workerPool.current.find(w => !w.busy);
    if (available) {
      available.busy = true;
      return available.worker;
    }

    // 如果没有空闲worker，等待
    return new Promise(resolve => {
      const check = () => {
        const worker = workerPool.current.find(w => !w.busy);
        if (worker) {
          worker.busy = true;
          resolve(worker.worker);
        } else {
          setTimeout(check, 100);
        }
      };
      check();
    });
  };

  // 释放worker
  const releaseWorker = (worker: any) => {
    const poolWorker = workerPool.current.find(w => w.worker === worker);
    if (poolWorker) {
      poolWorker.busy = false;
    }
  };

  const processPdf = async (pdfFile: File): Promise<string> => {
    if (!pdfjs) {
      throw new Error("PDF.js library not loaded");
    }

    // 文件大小限制 (10MB)
    if (pdfFile.size > 10 * 1024 * 1024) {
      throw new Error("PDF文件大小超过10MB限制");
    }

    const arrayBuffer = await pdfFile.arrayBuffer();
    const pdf = await pdfjs.getDocument({ 
      data: arrayBuffer,
      disableFontFace: true, // 禁用字体加载
      disableAutoFetch: true // 禁用自动获取
    }).promise;

    // 创建多个canvas用于并行渲染
    const canvases = Array.from({length: MAX_WORKERS}, () => {
      const canvas = document.createElement("canvas");
      canvas.style.display = "none";
      document.body.appendChild(canvas);
      return canvas;
    });

    try {
      // 并行处理页面
      const pagePromises = [];
      for (let i = 1; i <= pdf.numPages; i++) {
        pagePromises.push(processPdfPage(pdf, i, canvases[(i-1) % MAX_WORKERS]));
      }

      // 更新进度
      const interval = setInterval(() => {
        const done = pagePromises.filter(p => p.status === 'fulfilled').length;
        setProgress(Math.floor((done / pdf.numPages) * 100));
      }, 500);

      const results = await Promise.all(pagePromises);
      clearInterval(interval);
      setProgress(100);

      return results.join("\n\n");
    } finally {
      // 清理canvas
      canvases.forEach(canvas => canvas.remove());
    }
  };

  const processPdfPage = async (pdf: any, pageNum: number, canvas: HTMLCanvasElement): Promise<string> => {
    const worker = await getAvailableWorker();
    try {
      const page = await pdf.getPage(pageNum);
      const viewport = page.getViewport({ scale: 1.0 }); // 降低渲染质量

      const context = canvas.getContext("2d");
      canvas.height = viewport.height;
      canvas.width = viewport.width;

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
