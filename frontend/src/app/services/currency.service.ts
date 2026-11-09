import { Injectable, signal, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class CurrencyService {
  private http = inject(HttpClient);

  readonly currencyCode = signal<string>(environment.currencyCode || 'INR');
  readonly currencySymbol = signal<string>(environment.currencySymbol || '₹');

  constructor() {
    this.loadConfig();
  }

  loadConfig() {
    this.http.get<any>(`${environment.apiUrl}/api/config`).subscribe({
      next: (res) => {
        if (res?.currency?.symbol) {
          this.currencySymbol.set(res.currency.symbol);
        }
        if (res?.currency?.code) {
          this.currencyCode.set(res.currency.code);
        }
      },
      error: () => {
        // Fall back gracefully to environment defaults (INR / ₹)
      }
    });
  }

  setCurrency(symbol: string, code?: string) {
    if (symbol) this.currencySymbol.set(symbol);
    if (code) this.currencyCode.set(code);
  }

  format(amount: number, options?: { showDecimals?: boolean }): string {
    const sym = this.currencySymbol();
    const num = Number(amount) || 0;
    const isINR = this.currencyCode() === 'INR';
    const locale = isINR ? 'en-IN' : 'en-US';

    if (options?.showDecimals === false) {
      return `${sym}${Math.round(num).toLocaleString(locale)}`;
    }
    return `${sym}${num.toLocaleString(locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }
}

