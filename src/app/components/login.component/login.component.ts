import { Component, ElementRef, ViewChild, ChangeDetectorRef, NgZone, EventEmitter, Output, } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormGroup, FormControl } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MainService } from '../../services/main.service';
import { ApiService } from '../../services/api.service';
import { LoadingComponent } from '../loading/loading.component';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatIconModule, LoadingComponent],
  providers: [MainService, ApiService],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss',
})
export class LoginComponent {
  @ViewChild('cpfInput') cpfInputEl!: ElementRef;
  @Output() visibleChange = new EventEmitter<number>();
  @Output() cpfValidated = new EventEmitter<{ nome: string; nascimento: string }>();

  showSenha = false;

  form = new FormGroup({
    cpf: new FormControl(''),
    password: new FormControl(''),
  });

  focused: Record<string, boolean> = {};
  dialogMessage = '';
  showDialog = false;
  isLoading = false;
  shouldRefocus = false; // 🔹 Nova flag de controle

  constructor(
    private mainService: MainService,
    private cdr: ChangeDetectorRef,
    private ngZone: NgZone
  ) {}

  ngOnInit(): void {
    if (this.form.get('cpf')!.value) this.focused['cpf'] = true;
    history.pushState(null, '', location.href);

    // 🔹 Captura o botão voltar (mobile + desktop)
    window.addEventListener('popstate', this.onBrowserBack);
  }

  onBrowserBack = () => {
    this.ngZone.run(() => {
      this.updateVisible(1); // 🔥 faz exatamente o mesmo que o botão back
    });
  };
  onFocus(name: string) {
    this.focused[name] = true;
  }

  onBlur(name: string) {
    const val = this.form.get(name)?.value;
    if (!val) this.focused[name] = false;
  }

  // Aplica máscara e impede caracteres não numéricos
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
    // 🔹 Remove foco e fecha teclado no mobile
    this.blurInput();

    const cpf = this.form.get('cpf')!.value;
    if (!cpf) {
      this.showDialogMessage('Por favor, insira o CPF.');
      this.shouldRefocus = true;
      return;
    }

    const psw = this.form.get('password')!.value;
    if (!psw) {
      this.showDialogMessage('Por favor, insira a senha.');
      this.shouldRefocus = true;
      return;
    }

    this.isLoading = true;
    this.cdr.detectChanges();

    try {
      this.mainService.setFormValue('cpf', cpf);
      this.mainService.setFormValue('password', psw);
      this.mainService.setFormValue('type', 1);

      const response: any = await this.mainService.customerAccessLogin(this.mainService.getFormValues());
      console.log(response)
      this.isLoading = false;
      this.cdr.detectChanges();

      if (!response.status) {
        this.showDialogMessage(response.message || 'Erro na resposta.');
        this.shouldRefocus = true; // 🔹 Só refoca após fechar o diálogo
        return;
      }

      const data = Array.isArray(response.data) ? response.data[0] : response.data;
      if (!data) {
        this.showDialogMessage('Nenhum dado retornado.');
        return;
      }

      if (data.situacao && data.situacao.codigo != 0) {
        this.showDialogMessage('Situação: ' + data.situacao.descricao);
        this.shouldRefocus = true;
        return;
      }

      this.mainService.setFormValue('name', data.nome || '');

      if (data.codigo) {
        this.mainService.setFormValue('code', data.codigo);
      }

      if (data.email1) {
        this.mainService.setFormValue('email', data.email1);
      }

      if (data.tel1ddd && data.tel1) {
        this.mainService.setFormValue('update', 1);
        this.mainService.setFormValue('phone', data.tel1ddd + data.tel1);
      }

      if (data.datanascimento) {
        this.mainService.setFormValue('birthDate', data.datanascimento);
      }

      this.cdr.detectChanges();

      this.cpfValidated.emit({
        nome: data.nome,
        nascimento: data.datanascimento || data.nascimento,
      });
      this.updateVisible(10);
      this.cdr.detectChanges();
    } catch (error) {
      console.error('Erro:', error);
      this.isLoading = false;
      this.showDialogMessage('Erro ao consultar CPF.');
    }
  }

  /** 🔹 Remove foco do input e fecha o teclado (mobile) */
  blurInput() {
    if (this.cpfInputEl?.nativeElement) {
      this.cpfInputEl.nativeElement.blur();
      setTimeout(() => {
        window.scrollTo(0, 0);
      }, 100);
    }
  }

  focusField(field: string) {
    if (field === 'cpf' && this.cpfInputEl) {
      setTimeout(() => {
        this.cpfInputEl.nativeElement.focus();
        this.cdr.detectChanges();
      }, 50);
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

    // 🔹 Só refoca o input DEPOIS que o usuário fecha o diálogo
    if (this.shouldRefocus) {
      this.shouldRefocus = false;
      setTimeout(() => {
        this.focusField('cpf');
      }, 200);
    }
  }

  updateVisible(newValue: number) {
    this.visibleChange.emit(newValue);
  }

  toggleSenha() { this.showSenha = !this.showSenha; this.cdr.detectChanges(); }
}
