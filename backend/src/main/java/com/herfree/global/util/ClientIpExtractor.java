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

    /** Returns true only when an already-extracted literal IP belongs to one of the configured CIDRs. */
    public boolean matchesAnyCidr(String ip, String cidrs) {
        if (!isValidIpLiteral(ip) || !isRestrictedCidrList(cidrs)) {
            return false;
        }
        return Arrays.stream(cidrs.split(","))
                .map(String::trim)
                .filter(StringUtils::hasText)
                .anyMatch(range -> ipMatchesRange(ip, range));
    }

    /** Validates a configured admin/proxy CIDR list without resolving hostnames. */
    public static boolean isRestrictedCidrList(String cidrs) {
        if (!StringUtils.hasText(cidrs)) {
            return false;
        }
        return Arrays.stream(cidrs.split(","))
                .map(String::trim)
                .filter(StringUtils::hasText)
                .allMatch(ClientIpExtractor::isRestrictedRange);
    }

    private static boolean isRestrictedRange(String range) {
        if (!StringUtils.hasText(range)) {
            return false;
        }
        if (!range.contains("/")) {
            return isValidIpLiteral(range.trim());
        }
        String[] parts = range.split("/", 2);
        if (!isValidIpLiteral(parts[0].trim())) {
            return false;
        }
        try {
            int prefixLength = Integer.parseInt(parts[1].trim());
            int maxPrefix = parts[0].contains(":") ? 128 : 32;
            return prefixLength > 0 && prefixLength <= maxPrefix;
        } catch (NumberFormatException ignored) {
            return false;
        }
    }

    private String firstValidForwardedIp(String forwardedFor) {
        return Arrays.stream(forwardedFor.split(","))
                .map(String::trim)
                .filter(ClientIpExtractor::isValidIpLiteral)
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
            if (!isValidIpLiteral(ip) || !isRestrictedRange(range.trim())) {
                return false;
            }
            InetAddress address = InetAddress.getByName(ip);
            if (!range.contains("/")) {
                if (!isValidIpLiteral(range.trim())) {
                    return false;
                }
                return address.equals(InetAddress.getByName(range));
            }

            String[] parts = range.split("/", 2);
            if (!isValidIpLiteral(parts[0].trim())) {
                return false;
            }
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

    private static boolean isValidIpLiteral(String value) {
        if (!StringUtils.hasText(value)) {
            return false;
        }
        String candidate = value.trim();
        if (candidate.matches("\\d{1,3}(\\.\\d{1,3}){3}")) {
            for (String octet : candidate.split("\\.")) {
                if (Integer.parseInt(octet) > 255) {
                    return false;
                }
            }
            return true;
        }
        // Avoid InetAddress resolving attacker-controlled hostnames from a
        // forwarded header; only hexadecimal IPv6 literals are accepted.
        if (!candidate.contains(":") || !candidate.matches("[0-9A-Fa-f:]+")) {
            return false;
        }
        try {
            InetAddress.getByName(candidate);
            return true;
        } catch (Exception ignored) {
            return false;
        }
    }
}
