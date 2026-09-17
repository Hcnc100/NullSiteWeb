import { Component } from '@angular/core';
import { signal } from '@angular/core';
import { ComparatorService } from '../../services/comparator.service';

@Component({
  selector: 'app-comparator',
  imports: [],
  templateUrl: './comparator.component.html',
  styleUrl: './comparator.component.scss',
  standalone: true
})
export class ComparatorComponent {
  public readonly bancoFile = signal<File | undefined>(undefined);
  public readonly ventasFile = signal<File | undefined>(undefined);
  public readonly omitirPrimeraFila = signal(true);
  public readonly loading = signal(false);
  public readonly errorMessage = signal<string | undefined>(undefined);

  public constructor(
    private readonly compareService: ComparatorService
  ) { }

  public onBancoSelected(event: Event): void {
    const input = event.target as HTMLInputElement;

    if (input.files && input.files.length > 0) {
      this.bancoFile.set(input.files[0]);
    }
  }

  public onVentasSelected(event: Event): void {
    const input = event.target as HTMLInputElement;

    if (input.files && input.files.length > 0) {
      this.ventasFile.set(input.files[0]);
    }
  }

  public async comparar(): Promise<void> {
    this.loading.set(true);
    this.errorMessage.set(undefined);

    try {
      const response = await this.compareService.compareData(
        this.bancoFile()!,
        this.ventasFile()!,
        this.omitirPrimeraFila()
      );

      if (!response.ok) {
        throw new Error(await this.getErrorMessage(response));
      }

      const contentType = response.headers.get('content-type') ?? '';
      const isExcel =
        contentType.includes(
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        ) || contentType.includes('application/octet-stream');

      if (!isExcel) {
        throw new Error('El servidor no devolvió un archivo Excel válido.');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);

      try {
        const a = document.createElement('a');
        a.href = url;
        a.download = 'resultado.xlsx';
        a.click();
      } finally {
        window.URL.revokeObjectURL(url);
      }
    } catch (error) {
      this.errorMessage.set(
        error instanceof Error
          ? error.message
          : 'No fue posible generar el archivo de conciliación.'
      );
    } finally {
      this.loading.set(false);
    }
  }

  private async getErrorMessage(response: Response): Promise<string> {
    const contentType = response.headers.get('content-type') ?? '';

    if (contentType.includes('application/json')) {
      const body = await response.json() as { detail?: unknown };

      if (typeof body.detail === 'string' && body.detail.trim()) {
        return body.detail;
      }

      if (Array.isArray(body.detail)) {
        return body.detail
          .map(item => {
            if (typeof item === 'object' && item !== null && 'msg' in item) {
              return String(item.msg);
            }
            return String(item);
          })
          .join(' ');
      }

      return `El servidor respondió con el código ${response.status}.`;
    }

    const text = await response.text();
    return text || `El servidor respondió con el código ${response.status}.`;
  }
}
