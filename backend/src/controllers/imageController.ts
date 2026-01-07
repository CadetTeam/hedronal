import { Request, Response } from 'express';
import { supabase } from '../config/supabase';
import { AuthenticatedRequest } from '../middleware/clerkAuth';
import { z } from 'zod';

const uploadImageSchema = z.object({
  imageData: z.string(), // base64 encoded image
  bucket: z.enum(['avatars', 'banners', 'post-images']),
  fileName: z.string().optional(),
  contentType: z.string().optional(),
});

export const imageController = {
  /**
   * Upload an image to Supabase storage via backend
   * POST /api/images/upload
   */
  upload: async (req: AuthenticatedRequest, res: Response) => {
    try {
      if (!req.userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const validatedData = uploadImageSchema.parse(req.body);

      console.log('[imageController] Uploading image to bucket:', validatedData.bucket);

      // Decode base64 to buffer
      const base64Data = validatedData.imageData.replace(/^data:image\/\w+;base64,/, '');
      const buffer = Buffer.from(base64Data, 'base64');

      // Generate file name if not provided
      const fileExtension = validatedData.contentType?.split('/')[1] || 'jpg';
      const timestamp = Date.now();
      const random = Math.random().toString(36).substring(7);
      const fileName = validatedData.fileName || `${req.userId}-${timestamp}-${random}.${fileExtension}`;

      // Upload to Supabase storage
      const { data, error } = await supabase.storage
        .from(validatedData.bucket)
        .upload(fileName, buffer, {
          contentType: validatedData.contentType || 'image/jpeg',
          upsert: false,
        });

      if (error) {
        console.error('[imageController] Upload error:', error);
        return res.status(400).json({ error: `Failed to upload image: ${error.message}` });
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from(validatedData.bucket)
        .getPublicUrl(data.path);

      console.log('[imageController] Image uploaded successfully:', urlData.publicUrl);

      return res.status(200).json({
        success: true,
        url: urlData.publicUrl,
        path: data.path,
      });
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors[0].message });
      }
      console.error('[imageController] Upload error:', error);
      return res.status(500).json({ error: error.message || 'Failed to upload image' });
    }
  },

  /**
   * Delete an image from Supabase storage
   * DELETE /api/images/delete
   */
  delete: async (req: AuthenticatedRequest, res: Response) => {
    try {
      if (!req.userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const { bucket, path } = req.body;

      if (!bucket || !path) {
        return res.status(400).json({ error: 'Bucket and path are required' });
      }

      const { error } = await supabase.storage.from(bucket).remove([path]);

      if (error) {
        console.error('[imageController] Delete error:', error);
        return res.status(400).json({ error: `Failed to delete image: ${error.message}` });
      }

      console.log('[imageController] Image deleted successfully:', path);

      return res.status(200).json({ success: true });
    } catch (error: any) {
      console.error('[imageController] Delete error:', error);
      return res.status(500).json({ error: error.message || 'Failed to delete image' });
    }
  },
};

