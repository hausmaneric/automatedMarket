import { Component, ElementRef, ViewChild, ChangeDetectorRef, NgZone, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormGroup, FormControl } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MainService } from '../../services/main.service';
import { ApiService } from '../../services/api.service';
import { LoadingComponent } from '../loading/loading.component';

@Component({
  selector: 'app-document',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatIconModule, LoadingComponent],
  providers: [MainService, ApiService],
  templateUrl: './document.component.html',
  styleUrls: ['./document.component.scss'],
})
export class DocumentComponent {
  @ViewChild('cpfInput') cpfInputEl!: ElementRef;
  @Output() visibleChange = new EventEmitter<number>();
  @Output() cpfValidated = new EventEmitter<{ nome: string; nascimento: string }>();

  form = new FormGroup({
    cpf: new FormControl(''),
  });

  focused: Record<string, boolean> = {};
  dialogMessage = '';
  showDialog = false;
  isLoading = false;

  constructor(private mainService: MainService, private cdr: ChangeDetectorRef, private ngZone: NgZone ) {}

  ngOnInit(): void {
    if (this.form.get('cpf')!.value) this.focused['cpf'] = true;
  }

  onFocus(name: string) {
    this.focused[name] = true;
  }

  onBlur(name: string) {
    const val = this.form.get(name)?.value;
    if (!val) this.focused[name] = false;
  }

  onCpfInput(ev: Event) {
    const input = ev.target as HTMLInputElement;
    let digits = (input.value || '').replace(/\D/g, '').slice(0, 11);
    let out = digits;

    if (digits.length > 9)
      out = digits.replace(/^(\d{3})(\d{3})(\d{3})(\d{0,2}).*/, '$1.$2.$3-$4');
    else if (digits.length > 6)
      out = digits.replace(/^(\d{3})(\d{3})(\d{0,3}).*/, '$1.$2.$3');
    else if (digits.length > 3)
      out = digits.replace(/^(\d{3})(\d{0,3}).*/, '$1.$2');

    input.value = out;
    this.form.get('cpf')!.setValue(out);
    this.focused['cpf'] = !!out;
  }

  async validateCpf() {
    const cpf = this.form.get('cpf')!.value;
    if (!cpf) {
      this.showDialogMessage('Por favor, insira o CPF.');
      this.focusField('cpf');
      return;
    }

    this.isLoading = true;
    this.cdr.detectChanges(); // atualiza a view

    try {
      const response: any = await this.mainService.getCpf(this.form.value);
      this.isLoading = false;
      this.cdr.detectChanges();

      if (!response.status) {
        this.showDialogMessage(response.message);
        this.focusField('cpf');
      } else if (response.data.situacao.codigo != 0) {
        this.showDialogMessage('Situação: ' + response.data.situacao.descricao);
        this.focusField('cpf');
      } else {
        this.mainService.setFormValue('cpf', this.form.get('cpf')!.value);
        // Emite o nome e nascimento
        this.cpfValidated.emit({
          nome: response.data.nome,
          nascimento: response.data.nascimento,
        });
        // Atualiza visible
        this.updateVisible(3);
      }
    } catch (error) {
      this.isLoading = false;
      this.showDialogMessage('Erro ao consultar CPF.');
    }
  }

  focusField(field: string) {
    this.focused[field] = true;
    if (field === 'cpf' && this.cpfInputEl) {
      setTimeout(() => {
        this.cpfInputEl.nativeElement.focus();
        this.cdr.detectChanges();
      }, 0);
    }
  }

  showDialogMessage(msg: string) {
    this.dialogMessage = msg;
    this.showDialog = true;
    this.isLoading = false;
    this.cdr.detectChanges();
  }

  closeDialog() {
    this.showDialog = false;
    this.cdr.detectChanges();
  }

  updateVisible(newValue: number) {
    this.visibleChange.emit(newValue);
  }
}
