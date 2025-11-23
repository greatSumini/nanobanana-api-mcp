import { z } from "zod";
import type { ImageGenerator, AspectRatio } from "../services/image-generator.js";

/**
 * Creates the generate-image tool
 * @param generator - Image generator service
 * @param fixedModel - Optional fixed model to use for all operations
 */
export function createGenerateImageTool(generator: ImageGenerator, fixedModel?: "pro" | "normal") {
  // Build schema conditionally based on whether a fixed model is provided
  const baseSchema = {
    prompt: z.string().describe("Text description of the image to generate"),
    output_path: z
      .string()
      .optional()
      .describe("Optional ABSOLUTE path (full file system path starting from root) where the generated image will be saved. If not provided, returns base64 encoded image data instead. Example: /Users/username/images/output.png or C:\\Users\\username\\images\\output.png. Relative paths are NOT accepted."),
    reference_images_path: z
      .array(z.string())
      .optional()
      .describe("Optional array of ABSOLUTE paths (full file system paths starting from root) to reference images to guide the generation. Each path must be absolute. Example: ['/Users/username/images/ref1.png', '/Users/username/images/ref2.png']. Relative paths are NOT accepted."),
    aspect_ratio: z
      .enum(["1:1", "2:3", "3:2", "3:4", "4:3", "4:5", "5:4", "9:16", "16:9", "21:9"])
      .optional()
      .default("16:9")
      .describe("Aspect ratio for the generated image (default: 16:9)"),
  };

  // Only include model parameter if no fixed model is provided
  const inputSchema = fixedModel
    ? z.object(baseSchema)
    : z.object({
        ...baseSchema,
        model: z
          .enum(["pro", "normal"])
          .optional()
          .default("pro")
          .describe("Model to use for generation (pro: gemini-3-pro-image-preview, normal: gemini-2.5-flash-image, default: pro)"),
      });

  type InputType = z.infer<typeof inputSchema>;

  return {
    name: "generate_image",
    description:
      "Generates an image based on a text prompt using Google Gemini API. Optionally accepts reference images to guide the generation.",
    inputSchema,
    async handler(input: InputType) {
      try {
        // Use fixed model if provided, otherwise use input model or default to 'pro'
        const modelToUse = fixedModel || (input as any).model || "pro";

        const result = await generator.generateImage(
          input.prompt,
          input.output_path,
          modelToUse,
          input.reference_images_path,
          input.aspect_ratio as AspectRatio
        );

        // Check if result is a file path or base64 string
        if (input.output_path) {
          return {
            content: [
              {
                type: "text" as const,
                text: `Image successfully generated and saved to: ${result}`,
              },
            ],
          };
        } else {
          return {
            content: [
              {
                type: "text" as const,
                text: `Image successfully generated. Base64 data:\n${result}`,
              },
            ],
          };
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        return {
          content: [
            {
              type: "text" as const,
              text: `Error generating image: ${errorMessage}`,
            },
          ],
          isError: true,
        };
      }
    },
  };
}
