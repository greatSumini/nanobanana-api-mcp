import { GoogleGenAI } from "@google/genai";
import * as fs from "node:fs";
import * as path from "node:path";

/**
 * Supported aspect ratios for image generation
 */
export type AspectRatio = "1:1" | "2:3" | "3:2" | "3:4" | "4:3" | "4:5" | "5:4" | "9:16" | "16:9" | "21:9";

/**
 * Service for generating and editing images using Google Gemini API
 */
export class ImageGenerator {
  private ai: GoogleGenAI;

  constructor(apiKey?: string) {
    const key = apiKey || process.env.GOOGLE_API_KEY;
    if (!key) {
      throw new Error(
        "Google API key is required. Set GOOGLE_API_KEY environment variable or provide it in constructor."
      );
    }
    this.ai = new GoogleGenAI({ apiKey: key });
  }

  /**
   * Generates an image based on a text prompt
   * @param prompt - Text description of the image to generate
   * @param outputPath - Optional path where the generated image will be saved
   * @param model - Model to use ('pro' or 'normal', default: 'pro')
   * @param referenceImagesPaths - Optional array of reference image paths
   * @param aspectRatio - Optional aspect ratio for the image (default: '16:9')
   * @returns Path to the generated image or base64 string if no output path provided
   */
  async generateImage(
    prompt: string,
    outputPath: string | undefined,
    model: "pro" | "normal" = "pro",
    referenceImagesPaths?: string[],
    aspectRatio: AspectRatio = "16:9"
  ): Promise<string> {
    const modelName =
      model === "pro" ? "gemini-3-pro-image-preview" : "gemini-2.5-flash-image";

    // Build contents array
    const contents: any[] = [{ text: prompt }];

    // Add reference images if provided
    if (referenceImagesPaths && referenceImagesPaths.length > 0) {
      for (const imagePath of referenceImagesPaths) {
        const imageData = this.readImageAsBase64(imagePath);
        const mimeType = this.getMimeType(imagePath);
        contents.push({
          inlineData: {
            mimeType,
            data: imageData,
          },
        });
      }
    }

    const response = await this.ai.models.generateContent({
      model: modelName,
      contents: contents,
      config: {
        responseModalities: ["TEXT", "IMAGE"],
        imageConfig: { aspectRatio },
      },
    });

    // Extract and save the image
    if (!response.candidates || response.candidates.length === 0) {
      throw new Error("No candidates returned in the response");
    }

    const candidate = response.candidates[0];
    if (!candidate || !candidate.content || !candidate.content.parts) {
      throw new Error("Invalid response structure");
    }

    for (const part of candidate.content.parts) {
      if (part.inlineData && part.inlineData.data) {
        const imageData = part.inlineData.data;

        // If no output path provided, return base64 string
        if (!outputPath) {
          return imageData;
        }

        // Otherwise save to file
        const buffer = Buffer.from(imageData, "base64");

        // Ensure directory exists
        const dir = path.dirname(outputPath);
        if (!fs.existsSync(dir)) {
          fs.mkdirSync(dir, { recursive: true });
        }

        fs.writeFileSync(outputPath, buffer);
        return outputPath;
      }
    }

    throw new Error("No image was generated in the response");
  }

  /**
   * Edits an existing image based on a text prompt
   * @param imageInput - Path to the image or base64 string with mime type
   * @param prompt - Text description of the edits to make
   * @param outputPath - Optional path where the edited image will be saved
   * @param model - Model to use ('pro' or 'normal', default: 'pro')
   * @param referenceImagesPaths - Optional array of additional reference image paths
   * @param aspectRatio - Optional aspect ratio for the edited image (default: '16:9')
   * @returns Path to the edited image or base64 string if no output path provided
   */
  async editImage(
    imageInput: string | { base64: string; mimeType: string },
    prompt: string,
    outputPath?: string,
    model: "pro" | "normal" = "pro",
    referenceImagesPaths?: string[],
    aspectRatio: AspectRatio = "16:9"
  ): Promise<string> {
    const modelName =
      model === "pro" ? "gemini-3-pro-image-preview" : "gemini-2.5-flash-image";

    // Determine if input is path or base64
    let imageData: string;
    let mimeType: string;

    if (typeof imageInput === "string") {
      // Path input
      imageData = this.readImageAsBase64(imageInput);
      mimeType = this.getMimeType(imageInput);
    } else {
      // Base64 input
      imageData = imageInput.base64;
      mimeType = imageInput.mimeType;
    }

    // Build contents array with the image to edit
    const contents: any[] = [
      { text: prompt },
      {
        inlineData: {
          mimeType,
          data: imageData,
        },
      },
    ];

    // Add additional reference images if provided
    if (referenceImagesPaths && referenceImagesPaths.length > 0) {
      for (const refImagePath of referenceImagesPaths) {
        const imageData = this.readImageAsBase64(refImagePath);
        const mimeType = this.getMimeType(refImagePath);
        contents.push({
          inlineData: {
            mimeType,
            data: imageData,
          },
        });
      }
    }

    const response = await this.ai.models.generateContent({
      model: modelName,
      contents: contents,
      config: {
        responseModalities: ["TEXT", "IMAGE"],
        imageConfig: {
          aspectRatio,
          imageSize: "2K",
        },
      },
    });

    // Extract and save the edited image
    if (!response.candidates || response.candidates.length === 0) {
      throw new Error("No candidates returned in the response");
    }

    const candidate = response.candidates[0];
    if (!candidate || !candidate.content || !candidate.content.parts) {
      throw new Error("Invalid response structure");
    }

    for (const part of candidate.content.parts) {
      if (part.inlineData && part.inlineData.data) {
        const imageData = part.inlineData.data;

        // If no output path provided, return base64 string
        if (!outputPath) {
          return imageData;
        }

        // Otherwise save to file
        const buffer = Buffer.from(imageData, "base64");

        // Ensure directory exists
        const dir = path.dirname(outputPath);
        if (!fs.existsSync(dir)) {
          fs.mkdirSync(dir, { recursive: true });
        }

        fs.writeFileSync(outputPath, buffer);
        return outputPath;
      }
    }

    throw new Error("No image was generated in the response");
  }

  /**
   * Reads an image file and converts it to base64
   * @param imagePath - Path to the image file
   * @returns Base64 encoded string
   */
  private readImageAsBase64(imagePath: string): string {
    if (!fs.existsSync(imagePath)) {
      throw new Error(`Image file not found: ${imagePath}`);
    }
    const imageBuffer = fs.readFileSync(imagePath);
    return imageBuffer.toString("base64");
  }

  /**
   * Determines MIME type based on file extension
   * @param filePath - Path to the file
   * @returns MIME type string
   */
  private getMimeType(filePath: string): string {
    const ext = path.extname(filePath).toLowerCase();
    const mimeTypes: Record<string, string> = {
      ".jpg": "image/jpeg",
      ".jpeg": "image/jpeg",
      ".png": "image/png",
      ".gif": "image/gif",
      ".webp": "image/webp",
    };
    return mimeTypes[ext] || "image/jpeg";
  }
}
