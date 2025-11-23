import { z } from "zod";
import type { ImageGenerator, AspectRatio } from "../services/image-generator.js";

/**
 * Creates the edit-image tool
 * @param generator - Image generator service
 * @param fixedModel - Optional fixed model to use for all operations
 */
export function createEditImageTool(generator: ImageGenerator, fixedModel?: "pro" | "normal") {
  // Build schema conditionally based on whether a fixed model is provided
  const baseSchema = {
    path: z
      .string()
      .optional()
      .describe("ABSOLUTE path (full file system path starting from root) to the image to edit. Example: /Users/username/images/input.png or C:\\Users\\username\\images\\input.png. Relative paths are NOT accepted. Either 'path' or 'image_base64' must be provided."),
    image_base64: z
      .string()
      .optional()
      .describe("Base64 encoded image data to edit. Either 'path' or 'image_base64' must be provided."),
    mime_type: z
      .string()
      .optional()
      .describe("MIME type of the base64 image (e.g., 'image/png', 'image/jpeg'). Required when using 'image_base64'."),
    prompt: z.string().describe("Text description of the edits to make"),
    output_path: z
      .string()
      .optional()
      .describe("Optional ABSOLUTE path (full file system path starting from root) where the edited image will be saved. If not provided: (1) when 'path' is used, defaults to overwriting the input file, (2) when 'image_base64' is used, returns base64 data instead. Example: /Users/username/images/output.png or C:\\Users\\username\\images\\output.png. Relative paths are NOT accepted."),
    reference_images_path: z
      .array(z.string())
      .optional()
      .describe("Optional array of ABSOLUTE paths (full file system paths starting from root) to additional reference images to guide the editing. Each path must be absolute. Example: ['/Users/username/images/ref1.png', '/Users/username/images/ref2.png']. Relative paths are NOT accepted."),
    aspect_ratio: z
      .enum(["1:1", "2:3", "3:2", "3:4", "4:3", "4:5", "5:4", "9:16", "16:9", "21:9"])
      .optional()
      .default("16:9")
      .describe("Aspect ratio for the edited image (default: 16:9)"),
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
          .describe("Model to use for editing (pro: gemini-3-pro-image-preview, normal: gemini-2.5-flash-image, default: pro)"),
      });

  type InputType = z.infer<typeof inputSchema>;

  return {
    name: "edit_image",
    description:
      "Edits an existing image based on a text prompt using Google Gemini API. Optionally accepts additional reference images to guide the editing.",
    inputSchema,
    async handler(input: InputType) {
      try {
        // Validate input: either path or image_base64 must be provided
        if (!input.path && !input.image_base64) {
          throw new Error("Either 'path' or 'image_base64' must be provided");
        }

        if (input.path && input.image_base64) {
          throw new Error("Cannot provide both 'path' and 'image_base64'. Choose one.");
        }

        if (input.image_base64 && !input.mime_type) {
          throw new Error("'mime_type' is required when using 'image_base64'");
        }

        // Use fixed model if provided, otherwise use input model or default to 'pro'
        const modelToUse = fixedModel || (input as any).model || "pro";

        // Prepare image input
        let imageInput: string | { base64: string; mimeType: string };
        let defaultOutputPath: string | undefined;

        if (input.path) {
          // Path-based input
          imageInput = input.path;
          defaultOutputPath = input.output_path || input.path; // Default to overwriting
        } else {
          // Base64 input
          imageInput = {
            base64: input.image_base64!,
            mimeType: input.mime_type!,
          };
          defaultOutputPath = input.output_path; // undefined if not provided
        }

        const result = await generator.editImage(
          imageInput,
          input.prompt,
          defaultOutputPath,
          modelToUse,
          input.reference_images_path,
          input.aspect_ratio as AspectRatio
        );

        // Check if result is a file path or base64 string
        if (defaultOutputPath) {
          return {
            content: [
              {
                type: "text" as const,
                text: `Image successfully edited and saved to: ${result}`,
              },
            ],
          };
        } else {
          return {
            content: [
              {
                type: "text" as const,
                text: `Image successfully edited. Base64 data:\n${result}`,
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
              text: `Error editing image: ${errorMessage}`,
            },
          ],
          isError: true,
        };
      }
    },
  };
}
