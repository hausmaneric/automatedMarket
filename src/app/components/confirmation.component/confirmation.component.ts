import { ChangeDetectorRef, Component, ElementRef, EventEmitter, OnInit, Output, Renderer2, ViewChild, } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormGroup, FormControl } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MainService } from '../../services/main.service';
import { LoadingComponent } from '../loading/loading.component';

@Component({
  selector: 'app-confirmation',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatIconModule, LoadingComponent],
  providers: [MainService],
  templateUrl: './confirmation.component.html',
  styleUrls: ['./confirmation.component.scss'],
})
export class ConfirmationComponent implements OnInit {
  @ViewChild('codeInput') codeInputEl!: ElementRef;
  @Output() visibleChange = new EventEmitter<number>();

  form = new FormGroup({
    code: new FormControl(''),
  });

  focused: Record<string, boolean> = {};
  dialogMessage = '';
  showDialog = false;
  isLoading = false;
  email = '';
  phone = '';
  _validate = 0;

  constructor(
    private renderer: Renderer2,
    private mainService: MainService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    if (this.form.get('code')!.value) this.focused['code'] = true;
    this._validate = this.mainService.getValidate();
    this.email     = this.mainService.getFormValue('email');
    this.phone     = this.mainService.getFormValue('phone');
  }

  onFocus(name: string) {
    this.focused[name] = true;
  }

  onBlur(name: string) {
    const val = this.form.get(name)?.value;
    if (!val) this.focused[name] = false;
  }

  onCodeInput(ev: Event) {
    const input = ev.target as HTMLInputElement;
    this.form.get('code')!.setValue(input.value);
    this.focused['code'] = !!input.value;
  }

  async validateCode() {
    // 🔹 Remove o foco e fecha o teclado no mobile
    this.blurInput();

    const code = this.form.get('code')!.value;
    this.mainService.setFormValue('codeAccess', code);
    this.mainService.setFormValue('type', 2);

    if (!code) {
      this.showDialogMessage('Por favor, insira o código de validação.');
      return;
    }

    this.isLoading = true;
    this.cdr.detectChanges();

    try {
      const response: any = await this.mainService.customerAccessValidity(this.mainService.getFormValues());

      this.isLoading = false;
      this.cdr.detectChanges();

      if (response.status) {
        this.updateVisible(5);
      } else {
        this.showDialogMessage(response.message || 'Código inválido.');
      }
    } catch (err) {
      console.error(err);
      this.isLoading = false;
      this.showDialogMessage('Erro ao validar o código.');
    }
  }

  /** 🔹 Remove foco do input e força fechamento do teclado */
  blurInput() {
    if (this.codeInputEl?.nativeElement) {
      this.codeInputEl.nativeElement.blur();
      // 🔸 pequeno delay para garantir fechamento total antes de mensagens
      setTimeout(() => {
        window.scrollTo(0, 0);
      }, 100);
    }
  }

  showDialogMessage(msg: string) {
    // 🔹 Garante que o teclado esteja fechado antes de exibir o diálogo
    this.blurInput();
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
