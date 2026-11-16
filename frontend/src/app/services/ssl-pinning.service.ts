import { Injectable, signal } from '@angular/core';
import { Capacitor } from '@capacitor/core';
import { environment } from '../../environments/environment';

export interface SslPinConfig {
  domain: string;
  includeSubdomains: boolean;
  pins: string[];
  expiration: string;
}

@Injectable({
  providedIn: 'root'
})
export class SslPinningService {
  /**
   * Pinned public key fingerprints (SHA-256 SPKI hashes)
   * These correspond to the native network_security_config.xml pins
   * enforced at the Android OS network layer.
   */
  readonly pinnedDomains = signal<SslPinConfig[]>([
    {
      domain: 'shareship.onrender.com',
      includeSubdomains: true,
      expiration: '2028-12-31',
      pins: [
        '8emdl/UmneUm0I4Y/vHzOTQzb9eJwG4voRHtNmBPk=', // onrender.com.pem (User Provided)
        'hxqRlPTuQrgcxIRSDioywQ+52TqqLF8nLRGOqqTt50Y=', // Google Trust Services GTS Root R1
        'Vfd95BwDeSQo+NUYxVEEWYr8mx3Xph6Anq+ElAZ2Hnw=', // Google Trust Services GTS Root R2
        'kIdp6NNEd8wsugYyyIYFsi1ylMCED3hZbSR8ZFsa/A4=', // Cloudflare Inc ECC CA-3
        'C5+lpZ7tcVwmwQIMcRtPbsQtWLABXhQzejna0wHFr8M='  // Let's Encrypt ISRG Root X1
      ]
    },
    {
      domain: 'onrender.com',
      includeSubdomains: true,
      expiration: '2028-12-31',
      pins: [
        '8emdl/UmneUm0I4Y/vHzOTQzb9eJwG4voRHtNmBPk=', // onrender.com.pem (User Provided)
        'hxqRlPTuQrgcxIRSDioywQ+52TqqLF8nLRGOqqTt50Y=',
        'kIdp6NNEd8wsugYyyIYFsi1ylMCED3hZbSR8ZFsa/A4=',
        'C5+lpZ7tcVwmwQIMcRtPbsQtWLABXhQzejna0wHFr8M='
      ]
    }
  ]);

  readonly isNativePlatform = signal<boolean>(Capacitor.isNativePlatform());

  /**
   * Checks whether the given URL belongs to one of the pinned domains.
   */
  isPinnedDomain(urlStr: string): boolean {
    try {
      const url = new URL(urlStr, window.location.origin);
      const host = url.hostname.toLowerCase();

      return this.pinnedDomains().some(config => {
        const target = config.domain.toLowerCase();
        if (host === target) return true;
        if (config.includeSubdomains && host.endsWith('.' + target)) return true;
        return false;
      });
    } catch {
      return false;
    }
  }

  /**
   * Validates that requests directed to pinned domains enforce secure HTTPS protocol.
   * If an insecure HTTP request is made to a pinned domain, automatically upgrades or rejects.
   */
  validateAndSecureUrl(urlStr: string): { url: string; upgraded: boolean; isPinned: boolean } {
    try {
      const url = new URL(urlStr, window.location.origin);
      const isPinned = this.isPinnedDomain(urlStr);

      if (isPinned && url.protocol === 'http:') {
        // Enforce HTTPS protocol upgrade for pinned domains
        url.protocol = 'https:';
        return {
          url: url.toString(),
          upgraded: true,
          isPinned: true
        };
      }

      return {
        url: urlStr,
        upgraded: false,
        isPinned
      };
    } catch {
      return {
        url: urlStr,
        upgraded: false,
        isPinned: false
      };
    }
  }
}
