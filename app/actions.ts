"use server"

import { mistral } from "@ai-sdk/mistral"
import { generateText } from "ai"
import { revalidatePath } from "next/cache"

export async function extractText(fileData: string, fileType: string) {
  try {
    // Remove the data URL prefix to get the base64 data
    const base64Data = fileData.split(",")[1]

    // Create a Blob from the base64 data
    const byteCharacters = atob(base64Data)
    const byteArrays = []

    for (let offset = 0; offset < byteCharacters.length; offset += 1024) {
      const slice = byteCharacters.slice(offset, offset + 1024)

      const byteNumbers = new Array(slice.length)
      for (let i = 0; i < slice.length; i++) {
        byteNumbers[i] = slice.charCodeAt(i)
      }

      const byteArray = new Uint8Array(byteNumbers)
      byteArrays.push(byteArray)
    }

    const blob = new Blob(byteArrays, { type: fileType })

    // Create a File object from the Blob
    const file = new File([blob], "uploaded-file", { type: fileType })

    // Create a URL for the file
    const fileUrl = URL.createObjectURL(blob)

    // Use Mistral AI for OCR
    const { text } = await generateText({
      model: mistral("mistral-large-latest"),
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: "请提取这个文件中的所有文本内容，只返回提取的文本，不要添加任何解释或评论。",
            },
            {
              type: "file",
              data: new URL(fileUrl),
              mimeType: fileType,
            },
          ],
        },
      ],
      providerOptions: {
        mistral: {
          documentImageLimit: 8,
          documentPageLimit: 64,
        },
      },
    })

    // Store the extracted text in localStorage
    if (typeof window !== "undefined") {
      localStorage.setItem("extractedText", text)
    }

    revalidatePath("/")
    return { success: true, text }
  } catch (error) {
    console.error("Error in extractText:", error)
    return { success: false, error: "Failed to extract text from the file" }
  }
}
