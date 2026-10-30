import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

export async function uploadImageToCloudinary(
  fileBase64OrUrl: string,
  folder: string = "repeatless"
): Promise<{ secure_url: string; public_id: string } | null> {
  if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY) {
    console.warn("⚠️ Cloudinary is not configured. Returning original image URL/Base64.");
    return { secure_url: fileBase64OrUrl, public_id: "local" };
  }

  try {
    const result = await cloudinary.uploader.upload(fileBase64OrUrl, {
      folder,
      resource_type: "image",
    });
    return {
      secure_url: result.secure_url,
      public_id: result.public_id,
    };
  } catch (error) {
    console.error("Cloudinary upload failed:", error);
    return null;
  }
}
