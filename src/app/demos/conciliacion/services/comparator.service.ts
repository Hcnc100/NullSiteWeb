import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class ComparatorService {
  private readonly baseUrl =
    'https://conciliador-api-71259703343.us-central1.run.app';

  private readonly compareEndpoint = '/conciliar';

  public async compareData(
    bancoFile: File,
    ventasFile: File,
    omitirPrimeraFila = true
  ): Promise<Response> {

    const formData = new FormData();

    formData.append('banco', bancoFile);
    formData.append('ventas', ventasFile);
    formData.append(
      'omitir_primera_fila',
      String(omitirPrimeraFila)
    );

    return fetch(
      `${this.baseUrl}${this.compareEndpoint}`,
      {
        method: 'POST',
        body: formData
      }
    );
  }
}
