import { Component } from '@angular/core';
import { signal } from '@angular/core';
import { ComparatorService } from '../../services/comparator.service';

@Component({
  selector: 'app-comparator',
  imports: [],
  templateUrl: './comparator.component.html',
  styleUrl: './comparator.component.scss'
})
export class ComparatorComponent {
  public readonly bancoFile = signal<File | undefined>(undefined);
  public readonly ventasFile = signal<File | undefined>(undefined);
  public readonly omitirPrimeraFila = signal(true);

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

    const response = await this.compareService.compareData(
      this.bancoFile()!,
      this.ventasFile()!,
      this.omitirPrimeraFila()
    );

    const blob = await response.blob();

    const url = window.URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = 'resultado.xlsx';
    a.click();

    window.URL.revokeObjectURL(url);
  }
}