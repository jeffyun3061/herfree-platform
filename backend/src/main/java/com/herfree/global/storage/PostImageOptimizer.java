package com.herfree.global.storage;

import java.awt.Color;
import java.awt.Graphics2D;
import java.awt.RenderingHints;
import java.awt.image.BufferedImage;
import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.util.Iterator;
import javax.imageio.IIOImage;
import javax.imageio.ImageIO;
import javax.imageio.ImageWriteParam;
import javax.imageio.ImageWriter;
import javax.imageio.stream.ImageOutputStream;
import org.springframework.stereotype.Component;

/**
 * 게시글 첨부 이미지 서버 측 최종 최적화.
 * 브라우저 전처리와 별개로, API 업로드 경로에서 긴 변·JPEG 재인코딩을 강제한다.
 */
@Component
public class PostImageOptimizer {

    public static final int MAX_LONG_EDGE = 1600;
    public static final float JPEG_QUALITY = 0.82f;
    public static final String OUTPUT_CONTENT_TYPE = "image/jpeg";
    public static final String OUTPUT_EXTENSION = "jpg";

    public record OptimizedImage(byte[] data, String contentType, String extension) {}

    /**
     * 디코딩 가능한 이미지는 JPEG로 재인코딩한다.
     * WebP 등 ImageIO가 읽지 못하면 null을 반환하고 호출측이 원본을 유지한다.
     */
    public OptimizedImage optimizeOrNull(byte[] data) {
        if (data == null || data.length == 0) {
            return null;
        }

        BufferedImage source;
        try {
            source = ImageIO.read(new ByteArrayInputStream(data));
        } catch (IOException ex) {
            return null;
        }
        if (source == null) {
            return null;
        }

        try {
            int srcWidth = source.getWidth();
            int srcHeight = source.getHeight();
            if (srcWidth <= 0 || srcHeight <= 0) {
                return null;
            }

            int[] fitted = fit(srcWidth, srcHeight, MAX_LONG_EDGE);
            BufferedImage rgb = toRgb(source, fitted[0], fitted[1]);
            byte[] jpeg = writeJpeg(rgb, JPEG_QUALITY);
            if (jpeg.length == 0) {
                return null;
            }
            return new OptimizedImage(jpeg, OUTPUT_CONTENT_TYPE, OUTPUT_EXTENSION);
        } catch (IOException ex) {
            return null;
        }
    }

    static int[] fit(int width, int height, int maxLongEdge) {
        int longEdge = Math.max(width, height);
        if (longEdge <= maxLongEdge) {
            return new int[] {width, height};
        }
        double scale = (double) maxLongEdge / longEdge;
        return new int[] {
            Math.max(1, (int) Math.round(width * scale)),
            Math.max(1, (int) Math.round(height * scale))
        };
    }

    private static BufferedImage toRgb(BufferedImage source, int width, int height) {
        BufferedImage rgb = new BufferedImage(width, height, BufferedImage.TYPE_INT_RGB);
        Graphics2D graphics = rgb.createGraphics();
        try {
            graphics.setRenderingHint(
                    RenderingHints.KEY_INTERPOLATION, RenderingHints.VALUE_INTERPOLATION_BILINEAR);
            graphics.setRenderingHint(
                    RenderingHints.KEY_RENDERING, RenderingHints.VALUE_RENDER_QUALITY);
            graphics.setColor(Color.WHITE);
            graphics.fillRect(0, 0, width, height);
            graphics.drawImage(source, 0, 0, width, height, null);
        } finally {
            graphics.dispose();
        }
        return rgb;
    }

    private static byte[] writeJpeg(BufferedImage image, float quality) throws IOException {
        Iterator<ImageWriter> writers = ImageIO.getImageWritersByFormatName("jpg");
        if (!writers.hasNext()) {
            throw new IOException("JPEG ImageWriter unavailable");
        }
        ImageWriter writer = writers.next();
        ByteArrayOutputStream output = new ByteArrayOutputStream();
        try (ImageOutputStream imageOutput = ImageIO.createImageOutputStream(output)) {
            writer.setOutput(imageOutput);
            ImageWriteParam param = writer.getDefaultWriteParam();
            if (param.canWriteCompressed()) {
                param.setCompressionMode(ImageWriteParam.MODE_EXPLICIT);
                param.setCompressionQuality(quality);
            }
            writer.write(null, new IIOImage(image, null, null), param);
        } finally {
            writer.dispose();
        }
        return output.toByteArray();
    }
}
