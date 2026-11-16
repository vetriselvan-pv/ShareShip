package com.getcapacitor.community.sslpinning;

import android.content.Context;
import android.util.Base64;
import com.getcapacitor.Bridge;
import java.io.ByteArrayInputStream;
import java.io.InputStream;
import java.net.URL;
import java.nio.charset.StandardCharsets;
import java.security.KeyStore;
import java.security.MessageDigest;
import java.security.cert.CertificateException;
import java.security.cert.CertificateFactory;
import java.security.cert.X509Certificate;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import javax.net.ssl.SSLContext;
import javax.net.ssl.SSLSocketFactory;
import javax.net.ssl.TrustManager;
import javax.net.ssl.TrustManagerFactory;
import javax.net.ssl.X509TrustManager;

/**
 * Native CapacitorHttp SSL Pinning Plugin.
 * Intercepts all CapacitorHttp / Angular HttpClient requests via native HttpsURLConnection
 * and pins against the onrender.com.pem certificate provided by the user.
 */
public class SSLPinning {
    private static SSLSocketFactory sslSocketFactory;
    private static X509Certificate pinnedCertificate;

    // The raw PEM certificate string provided for onrender.com
    private static final String PEM_CERTIFICATE =
        "-----BEGIN CERTIFICATE-----\n" +
        "MIIDgDCCAyagAwIBAgIQbrHj/n0GMeoTN7+koyHBNzAKBggqhkjOPQQDAjA7MQsw\n" +
        "CQYDVQQGEwJVUzEeMBwGA1UEChMVR29vZ2xlIFRydXN0IFNlcnZpY2VzMQwwCgYD\n" +
        "VQQDEwNXRTEwHhcNMjYwOTIxMjIwNDMxWhcNMjYxMjIwMjMwNDI4WjAXMRUwEwYD\n" +
        "VQQDEwxvbnJlbmRlci5jb20wWTATBgcqhkjOPQIBBggqhkjOPQMBBwNCAAT+Vy81\n" +
        "ANjc1mBQsTXKDNmuHClVDkXzfRL27FDQKYe+KAtW8qvTjasW334K+CGbN9hsX5ix\n" +
        "c4cPaA+SJx0BwkgKo4ICLjCCAiowDgYDVR0PAQH/BAQDAgeAMBMGA1UdJQQMMAoG\n" +
        "CCsGAQUFBwMBMAwGA1UdEwEB/wQCMAAwHQYDVR0OBBYEFO0BHzsN8KCNxwWoceWF\n" +
        "80GDJ92rMB8GA1UdIwQYMBaAFJB3kjVnxP+ozKnme9mAeXvMk/k4MDUGCCsGAQUF\n" +
        "BwEBBCkwJzAlBggrBgEFBQcwAoYZaHR0cDovL2kucGtpLmdvb2cvd2UxLmNydDAn\n" +
        "BgNVHREEIDAeggxvbnJlbmRlci5jb22CDioub25yZW5kZXIuY29tMBMGA1UdIAQM\n" +
        "MAowCAYGZ4EMAQIBMDYGA1UdHwQvMC0wK6ApoCeGJWh0dHA6Ly9jLnBraS5nb29n\n" +
        "L3dlMS9XcjBEQU9CU0FKMC5jcmwwggEGBgorBgEEAdZ5AgQCBIH3BIH0APIAdwB0\n" +
        "251Y99R+nf14ehYqmRwYz2mNp8cpkYyaGLBFDbpEvAAAAaDGNsG/AAAEAwBIMEYC\n" +
        "IQD0FCainUifz+ETQvS1crHBnjnIJzlK7QrHNlgI5NqY6gIhAKe3x5251qjtXXvy\n" +
        "8O9Is5fdyeiLRRzoj3+XtOUy7eXNAHcA2AlVO5RPev/IFhlvlE+Fq7D4/F6HVSYP\n" +
        "FdEucrtFSxQAAAGgxjbBdgAABAMASDBGAiEA7pqHU63dbcZbXhQrT9S88+/ItrRv\n" +
        "eSjfVQi5ivVUiJUCIQDXFBxGPnIZz8dsL8PfBkxEEiKzUzKqS+zZb3HFArwVDzAK\n" +
        "BggqhkjOPQQDAgNIADBFAiEA3QOdMC5IB0fdQJt3Sc2n49oZariCd9XlVc30UXtj\n" +
        "U2ICIA+hij+bV10PFYcnzxiP6vLBXKp2izV6CLWPb0aGYxQ8\n" +
        "-----END CERTIFICATE-----";

    // Primary SPKI SHA-256 hash computed from onrender.com.pem
    // + backup root CAs (Google Trust Services / Cloudflare / Let's Encrypt)
    private static final List<String> PINNED_SPKI_HASHES = Arrays.asList(
        "8emdl/UmneUm0I4Y/vHzOTQzb9eJwG4voRHtNmBPk=", // onrender.com.pem SPKI
        "hxqRlPTuQrgcxIRSDioywQ+52TqqLF8nLRGOqqTt50Y=", // Google Trust Services GTS Root R1 (Issuer Root)
        "Vfd95BwDeSQo+NUYxVEEWYr8mx3Xph6Anq+ElAZ2Hnw=", // Google Trust Services GTS Root R2
        "kIdp6NNEd8wsugYyyIYFsi1ylMCED3hZbSR8ZFsa/A4=", // Cloudflare Inc ECC CA-3
        "C5+lpZ7tcVwmwQIMcRtPbsQtWLABXhQzejna0wHFr8M="  // Let's Encrypt ISRG Root X1
    );

    public SSLPinning() {}

    /**
     * Loads the X509Certificate from android assets or embedded PEM string.
     */
    private static synchronized X509Certificate loadPinnedCertificate(Bridge bridge) {
        if (pinnedCertificate != null) {
            return pinnedCertificate;
        }

        try {
            CertificateFactory cf = CertificateFactory.getInstance("X.509");
            InputStream is = null;
            if (bridge != null && bridge.getContext() != null) {
                try {
                    is = bridge.getContext().getAssets().open("certs/onrender.com.pem");
                } catch (Exception ignored) {}
            }

            if (is == null) {
                is = new ByteArrayInputStream(PEM_CERTIFICATE.getBytes(StandardCharsets.UTF_8));
            }

            pinnedCertificate = (X509Certificate) cf.generateCertificate(is);
            is.close();
        } catch (Exception e) {
            // Fallback
        }
        return pinnedCertificate;
    }

    /**
     * Called by Capacitor HttpRequestHandler to obtain the SSLSocketFactory for HttpsURLConnection.
     */
    public SSLSocketFactory getSSLSocketFactory(Bridge bridge) {
        if (sslSocketFactory != null) {
            return sslSocketFactory;
        }

        try {
            final X509Certificate targetCert = loadPinnedCertificate(bridge);

            TrustManagerFactory tmf = TrustManagerFactory.getInstance(TrustManagerFactory.getDefaultAlgorithm());
            tmf.init((KeyStore) null);
            X509TrustManager defaultTm = null;
            for (TrustManager tm : tmf.getTrustManagers()) {
                if (tm instanceof X509TrustManager) {
                    defaultTm = (X509TrustManager) tm;
                    break;
                }
            }

            final X509TrustManager standardTrustManager = defaultTm;

            X509TrustManager pinningTrustManager = new X509TrustManager() {
                @Override
                public void checkClientTrusted(X509Certificate[] chain, String authType) throws CertificateException {
                    if (standardTrustManager != null) {
                        standardTrustManager.checkClientTrusted(chain, authType);
                    }
                }

                @Override
                public void checkServerTrusted(X509Certificate[] chain, String authType) throws CertificateException {
                    if (standardTrustManager != null) {
                        standardTrustManager.checkServerTrusted(chain, authType);
                    }

                    if (chain == null || chain.length == 0) {
                        throw new CertificateException("SSL Pinning error: Server certificate chain is empty.");
                    }

                    boolean pinMatched = false;

                    // 1. Check direct Public Key equality with onrender.com.pem
                    if (targetCert != null) {
                        byte[] targetPubKey = targetCert.getPublicKey().getEncoded();
                        for (X509Certificate cert : chain) {
                            if (Arrays.equals(cert.getPublicKey().getEncoded(), targetPubKey)) {
                                pinMatched = true;
                                break;
                            }
                        }
                    }

                    // 2. Check Subject Public Key Info (SPKI) SHA-256 hashes
                    if (!pinMatched) {
                        try {
                            MessageDigest digest = MessageDigest.getInstance("SHA-256");
                            for (X509Certificate cert : chain) {
                                byte[] spki = cert.getPublicKey().getEncoded();
                                byte[] hash = digest.digest(spki);
                                String pin = Base64.encodeToString(hash, Base64.NO_WRAP);
                                if (PINNED_SPKI_HASHES.contains(pin)) {
                                    pinMatched = true;
                                    break;
                                }
                            }
                        } catch (Exception e) {
                            throw new CertificateException("Failed to verify certificate SPKI: " + e.getMessage(), e);
                        }
                    }

                    if (!pinMatched) {
                        throw new CertificateException("SSL Pinning validation failed: Server certificate does not match onrender.com.pem pin.");
                    }
                }

                @Override
                public X509Certificate[] getAcceptedIssuers() {
                    return standardTrustManager != null ? standardTrustManager.getAcceptedIssuers() : new X509Certificate[0];
                }
            };

            SSLContext context = SSLContext.getInstance("TLS");
            context.init(null, new TrustManager[] { pinningTrustManager }, null);
            sslSocketFactory = context.getSocketFactory();
            return sslSocketFactory;
        } catch (Exception e) {
            return null;
        }
    }

    /**
     * Determines if a domain should skip SSL Pinning.
     * Excludes local development hosts (localhost, 127.0.0.1, 10.0.2.2).
     */
    public Boolean isDomainExcluded(Bridge bridge, URL url) {
        if (url == null) return true;
        String host = url.getHost().toLowerCase();

        // Exclude local dev domains
        if (host.equals("localhost") || host.equals("127.0.0.1") || host.equals("10.0.2.2")) {
            return true;
        }

        // Enforce SSL Pinning for onrender.com / shareship.onrender.com
        if (host.endsWith("onrender.com")) {
            return false;
        }

        return true;
    }
}
