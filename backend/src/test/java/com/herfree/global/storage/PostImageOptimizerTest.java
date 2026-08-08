package com.herfree.global.storage;

import static org.assertj.core.api.Assertions.assertThat;

import java.awt.Color;
import java.awt.Graphics2D;
import java.awt.image.BufferedImage;
import java.io.ByteArrayOutputStream;
import javax.imageio.ImageIO;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

class PostImageOptimizerTest {

    private final PostImageOptimizer optimizer = new PostImageOptimizer();

    @Test
    @DisplayName("큰 PNG는 긴 변 1600 이하 JPEG로 재인코딩한다")
    void optimize_largePng_resizesToJpeg() throws Exception {
        byte[] png = createPng(3200, 2400, Color.BLUE);

        PostImageOptimizer.OptimizedImage optimized = optimizer.optimizeOrNull(png);

        assertThat(optimized).isNotNull();
        assertThat(optimized.contentType()).isEqualTo("image/jpeg");
        assertThat(optimized.extension()).isEqualTo("jpg");
        assertThat(optimized.data().length).isPositive();

        BufferedImage result = ImageIO.read(new java.io.ByteArrayInputStream(optimized.data()));
        assertThat(result).isNotNull();
        assertThat(result.getWidth()).isEqualTo(1600);
        assertThat(result.getHeight()).isEqualTo(1200);
        assertThat(Math.max(result.getWidth(), result.getHeight()))
                .isLessThanOrEqualTo(PostImageOptimizer.MAX_LONG_EDGE);
    }

    @Test
    @DisplayName("디코딩 불가 바이트는 null을 반환한다")
    void optimize_invalidBytes_returnsNull() {
        assertThat(optimizer.optimizeOrNull(new byte[] {1, 2, 3, 4})).isNull();
    }

    @Test
    @DisplayName("fit은 긴 변 기준으로만 축소한다")
    void fit_scalesByLongEdge() {
        assertThat(PostImageOptimizer.fit(4000, 3000, 1600)).containsExactly(1600, 1200);
        assertThat(PostImageOptimizer.fit(800, 600, 1600)).containsExactly(800, 600);
    }

    private static byte[] createPng(int width, int height, Color color) throws Exception {
        BufferedImage image = new BufferedImage(width, height, BufferedImage.TYPE_INT_RGB);
        Graphics2D graphics = image.createGraphics();
        try {
            graphics.setColor(color);
            graphics.fillRect(0, 0, width, height);
        } finally {
            graphics.dispose();
        }
        ByteArrayOutputStream output = new ByteArrayOutputStream();
        ImageIO.write(image, "png", output);
        return output.toByteArray();
    }
}
