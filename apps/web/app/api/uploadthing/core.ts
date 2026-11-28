import { createUploadthing, type FileRouter } from "uploadthing/next";
import { UploadThingError } from "uploadthing/server";
import { getCurrentUser } from "@/lib/session";

const f = createUploadthing();

const ADMIN_ROLES = new Set(["ADMIN", "SUPER_ADMIN"]);

// Every upload on the site comes from the admin panel — reject anyone else so the
// endpoints can't be used to push files into the UploadThing storage.
async function requireAdmin() {
  const user = await getCurrentUser();
  if (!user || !ADMIN_ROLES.has(user.role)) throw new UploadThingError("Unauthorized");
  return { userId: user.id };
}

export const ourFileRouter = {
  // product, colour, promo and product-SEO photos (ProductForm)
  productImage: f({
    image: { maxFileSize: "8MB", maxFileCount: 20 },
  })
    .middleware(requireAdmin)
    .onUploadComplete(async ({ metadata, file }) => {
      console.log("Upload complete for userId:", metadata.userId);
      console.log("file url", file.ufsUrl);

      // we wanna keep this url for creating products
      const imageUrl = file.ufsUrl;
      return { imageUrl };
    }),

  // store settings photos (logo, covers, featured, editorial, homepage sections…)
  storeImage: f({
    image: { maxFileSize: "4MB", maxFileCount: 1 },
  })
    .middleware(requireAdmin)
    .onUploadComplete(async ({ file }) => {
      return { imageUrl: file.ufsUrl };
    }),

  storeVideo: f({
    video: { maxFileSize: "64MB", maxFileCount: 1 },
  })
    .middleware(requireAdmin)
    .onUploadComplete(async ({ file }) => {
      return { videoUrl: file.ufsUrl };
    }),
} satisfies FileRouter;

export type OurFileRouter = typeof ourFileRouter;
