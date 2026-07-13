package com.herfree.global.util;

import com.herfree.global.config.ForwardedHeaderProperties;
import jakarta.servlet.http.HttpServletRequest;
import java.math.BigInteger;
import java.net.InetAddress;
import java.util.Arrays;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

@Component
@RequiredArgsConstructor
public class ClientIpExtractor {

    private final ForwardedHeaderProperties properties;

    public String extract(HttpServletRequest request) {
        if (request == null) {
            return null;
        }
        String remoteAddr = request.getRemoteAddr();
        String forwardedFor = request.getHeader("X-Forwarded-For");
        if (StringUtils.hasText(forwardedFor) && isTrustedProxy(remoteAddr)) {
            String clientIp = firstValidForwardedIp(forwardedFor);
            if (StringUtils.hasText(clientIp)) {
                return clientIp;
            }
        }
        return remoteAddr;
    }

    private String firstValidForwardedIp(String forwardedFor) {
        return Arrays.stream(forwardedFor.split(","))
                .map(String::trim)
                .filter(this::isValidIpLiteral)
                .findFirst()
                .orElse(null);
    }

    private boolean isTrustedProxy(String remoteAddr) {
        if (!StringUtils.hasText(remoteAddr) || !StringUtils.hasText(properties.trustedProxyCidrs())) {
            return false;
        }
        List<String> ranges = Arrays.stream(properties.trustedProxyCidrs().split(","))
                .map(String::trim)
                .filter(StringUtils::hasText)
                .toList();
        return ranges.stream().anyMatch(range -> ipMatchesRange(remoteAddr, range));
    }

    private boolean ipMatchesRange(String ip, String range) {
        try {
            InetAddress address = InetAddress.getByName(ip);
            if (!range.contains("/")) {
                return address.equals(InetAddress.getByName(range));
            }

            String[] parts = range.split("/", 2);
            InetAddress network = InetAddress.getByName(parts[0].trim());
            int prefixLength = Integer.parseInt(parts[1].trim());
            byte[] addressBytes = address.getAddress();
            byte[] networkBytes = network.getAddress();
            if (addressBytes.length != networkBytes.length || prefixLength < 0 || prefixLength > addressBytes.length * 8) {
                return false;
            }

            BigInteger addressValue = new BigInteger(1, addressBytes);
            BigInteger networkValue = new BigInteger(1, networkBytes);
            int totalBits = addressBytes.length * 8;
            BigInteger mask = BigInteger.ONE.shiftLeft(totalBits).subtract(BigInteger.ONE)
                    .shiftRight(prefixLength)
                    .xor(BigInteger.ONE.shiftLeft(totalBits).subtract(BigInteger.ONE));
            return addressValue.and(mask).equals(networkValue.and(mask));
        } catch (Exception ignored) {
            return false;
        }
    }

    private boolean isValidIpLiteral(String value) {
        try {
            InetAddress.getByName(value);
            return true;
        } catch (Exception ignored) {
            return false;
        }
    }
}
