import { z } from "zod";
import type { ImageGenerator } from "../services/image-generator.js";

/**
 * Creates the edit-image tool
 * @param generator - Image generator service
 * @param fixedModel - Optional fixed model to use for all operations
 */
export function createEditImageTool(generator: ImageGenerator, fixedModel?: "pro" | "normal") {
  // Build schema conditionally based on whether a fixed model is provided
  const baseSchema = {
    path: z.string().describe("ABSOLUTE path (full file system path starting from root) to the image to edit. Example: /Users/username/images/input.png or C:\\Users\\username\\images\\input.png. Relative paths are NOT accepted."),
    prompt: z.string().describe("Text description of the edits to make"),
    output_path: z
      .string()
      .optional()
      .describe("ABSOLUTE path (full file system path starting from root) where the edited image will be saved (defaults to the same as path). Example: /Users/username/images/output.png or C:\\Users\\username\\images\\output.png. Relative paths are NOT accepted."),
    reference_images_path: z
      .array(z.string())
      .optional()
      .describe("Optional array of ABSOLUTE paths (full file system paths starting from root) to additional reference images to guide the editing. Each path must be absolute. Example: ['/Users/username/images/ref1.png', '/Users/username/images/ref2.png']. Relative paths are NOT accepted."),
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
        // Use fixed model if provided, otherwise use input model or default to 'pro'
        const modelToUse = fixedModel || (input as any).model || "pro";

        const outputPath = await generator.editImage(
          input.path,
          input.prompt,
          input.output_path,
          modelToUse,
          input.reference_images_path
        );

        return {
          content: [
            {
              type: "text" as const,
              text: `Image successfully edited and saved to: ${outputPath}`,
            },
          ],
        };
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
