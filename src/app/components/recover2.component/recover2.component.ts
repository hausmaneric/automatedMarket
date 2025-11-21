import { Component, ElementRef, HostListener, OnInit, Renderer2, ViewChild, AfterViewInit, Input, OnChanges, SimpleChanges, Output, EventEmitter, ChangeDetectorRef} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormGroup, FormControl } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MainService } from '../../services/main.service';
import { LoadingComponent } from '../loading/loading.component';

@Component({
  selector: 'app-recover2',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatIconModule, LoadingComponent],
  providers: [MainService],
  templateUrl: './recover2.component.html',
  styleUrl: './recover2.component.scss',
})
export class Recover2Component {
  @Input() nome: string = '';
  @Input() nascimento: string = '';
  @Output() visibleChange = new EventEmitter<number>();

  @ViewChild('calendar') calendarEl!: ElementRef;
  @ViewChild('dateInput') dateInputEl!: ElementRef;
  @ViewChild('phoneInput') phoneInputEl!: ElementRef<HTMLInputElement>;

  form = new FormGroup({
    password: new FormControl(''),
    confirmPassword: new FormControl('')
  });

  nameReadonly = false;
  birthDateReadonly = false;

  showSenha = false;
  showConfirm = false;
  focused: Record<string, boolean> = {};
  calendarOpen = false;
  calYear!: number;
  calMonth!: number;
  weeks: Array<Array<{ d: Date | null; currentMonth: boolean }>> = [];
  private touchStartX = 0;
  private touchEndX = 0;
  monthsPt = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];
  weekdaysPt = ['Dom','Seg','Ter','Qua','Qui','Sex','Sáb'];
  private outsideListener?: () => void;
  dateDisplay = '';
  dialogMessage = '';
  showDialog = false;
  isLoading = false;

  fieldNames: Record<string, string> = {
    password: 'Senha',
    confirmPassword: 'Confirmação de Senha'
  };

  constructor(
    private cdr: ChangeDetectorRef,
    private hostEl: ElementRef,
    private renderer: Renderer2,
    private mainService: MainService
  ) {}

  ngOnInit(): void {
    Object.keys(this.form.controls).forEach(k => {
      if (this.form.get(k)!.value) this.focused[k] = true;
    });

  }

  ngAfterViewInit(): void {}
  ngOnChanges(changes: SimpleChanges): void {

  }

  onFocus(name: string) { this.focused[name] = true; }
  onBlur(name: string) {
    const val = this.form.get(name)?.value;
    if (!val) this.focused[name] = false;
  }

  // --- END PHONE HANDLING ---

  toggleSenha() { this.showSenha = !this.showSenha; this.cdr.detectChanges(); }
  toggleConfirm() { this.showConfirm = !this.showConfirm; this.cdr.detectChanges(); }


  async validateForm() {
    // ---- remove focus and close keyboard/calendar before validation ----
    try {
      const active = document.activeElement as HTMLElement | null;
      if (active && typeof active.blur === 'function') active.blur();
    } catch (e) { /* ignore */ }


    // ensure UI focus flags are reset so labels don't stay in focused state
    Object.keys(this.focused).forEach(k => this.focused[k] = false);
    this.cdr.detectChanges();
    // --------------------------------------------------------------------

    const val = this.form.value;
    const errors: string[] = [];

    (Object.keys(val) as Array<keyof typeof val>).forEach(key => {
      if (!val[key]) errors.push(`Campo "${this.fieldNames[key]}" não preenchido`);
    });

    if (val.password && val.confirmPassword && val.password !== val.confirmPassword)
      errors.push('Senhas não coincidem');

    if (errors.length) this.showDialogMessage('Erros:\n' + errors.join('\n'));
    else {
      this.mainService.setFormValue('password', this.form.get('password')!.value);

      this.isLoading = true;

      const response: any = await this.mainService.customerAccessPassword(this.mainService.getFormValues());
      this.isLoading = false;
      this.cdr.detectChanges();this.cdr.detectChanges();

      if (response.status){
        this.updateVisible(7);
      } else {
        this.showDialogMessage(response.message);
      }

    }
  }

  isValidEmail(email: string): boolean {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  }

  toISO(d: Date) {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }

  showDialogMessage(msg: string) { this.dialogMessage = msg; this.showDialog = true; }
  closeDialog() { this.showDialog = false; this.cdr.detectChanges(); }

  updateVisible(newValue: number) { this.visibleChange.emit(newValue); }

}
