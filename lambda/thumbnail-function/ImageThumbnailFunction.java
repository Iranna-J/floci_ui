package com.example.flociapp.serverless;

import org.springframework.stereotype.Component;

import javax.imageio.ImageIO;
import java.awt.*;
import java.awt.image.BufferedImage;
import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.util.logging.Level;
import java.util.logging.Logger;

/**
 * Pure Functional Image Resizing Logic.
 * 
 * In Step 1: Called directly by Spring Boot Service (In-App execution).
 * In Step 2: This exact same logic is executed inside Java 21 AWS Lambda Container!
 */
@Component
public class ImageThumbnailFunction {

    private static final Logger log = Logger.getLogger(ImageThumbnailFunction.class.getName());

    public record ExecutionResult(
            byte[] thumbnailBytes,
            String originalDimensions,
            String thumbnailDimensions,
            boolean success,
            String error
    ) {}

    public ExecutionResult apply(byte[] originalBytes, int maxWidth, int maxHeight) {
        if (originalBytes == null || originalBytes.length == 0) {
            return new ExecutionResult(null, "N/A", "N/A", false, "Image data is empty");
        }

        try {
            BufferedImage originalImage = ImageIO.read(new ByteArrayInputStream(originalBytes));
            if (originalImage == null) {
                return new ExecutionResult(null, "N/A", "N/A", false, "Unsupported image format or corrupt bytes");
            }

            int originalWidth = originalImage.getWidth();
            int originalHeight = originalImage.getHeight();
            String originalDimStr = originalWidth + "x" + originalHeight;

            // Maintain aspect ratio
            double ratio = (double) originalWidth / originalHeight;
            int targetWidth = maxWidth;
            int targetHeight = maxHeight;

            if (ratio > 1.0) {
                targetHeight = (int) Math.round(maxWidth / ratio);
            } else {
                targetWidth = (int) Math.round(maxHeight * ratio);
            }
            targetWidth = Math.max(1, targetWidth);
            targetHeight = Math.max(1, targetHeight);
            String targetDimStr = targetWidth + "x" + targetHeight;

            // Render scaled thumbnail
            BufferedImage thumb = new BufferedImage(targetWidth, targetHeight, BufferedImage.TYPE_INT_ARGB);
            Graphics2D g2d = thumb.createGraphics();
            try {
                g2d.setRenderingHint(RenderingHints.KEY_INTERPOLATION, RenderingHints.VALUE_INTERPOLATION_BILINEAR);
                g2d.setRenderingHint(RenderingHints.KEY_RENDERING, RenderingHints.VALUE_RENDER_QUALITY);
                g2d.setRenderingHint(RenderingHints.KEY_ANTIALIASING, RenderingHints.VALUE_ANTIALIAS_ON);
                g2d.drawImage(originalImage, 0, 0, targetWidth, targetHeight, null);
            } finally {
                g2d.dispose();
            }

            ByteArrayOutputStream baos = new ByteArrayOutputStream();
            ImageIO.write(thumb, "png", baos);
            byte[] thumbBytes = baos.toByteArray();

            log.info("Image thumbnail generated: " + originalDimStr + " -> " + targetDimStr);
            return new ExecutionResult(thumbBytes, originalDimStr, targetDimStr, true, null);

        } catch (IOException e) {
            log.log(Level.SEVERE, "Image thumbnail transformation failed: " + e.getMessage(), e);
            return new ExecutionResult(null, "N/A", "N/A", false, e.getMessage());
        }
    }
}
