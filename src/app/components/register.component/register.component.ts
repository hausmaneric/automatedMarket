import { Component, ElementRef, HostListener, OnInit, Renderer2, ViewChild,AfterViewInit, Input, OnChanges, SimpleChanges, Output, EventEmitter,ChangeDetectorRef} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormGroup, FormControl } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MainService } from '../../services/main.service';
import { LoadingComponent } from '../loading/loading.component';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatIconModule, LoadingComponent],
  providers: [MainService],
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.scss']
})
export class RegisterComponent implements OnInit, AfterViewInit, OnChanges {
  @Input() nome: string = '';
  @Input() nascimento: string = '';

  @Output() visibleChange = new EventEmitter<number>();

  @ViewChild('calendar') calendarEl!: ElementRef;
  @ViewChild('dateInput') dateInputEl!: ElementRef;

  form = new FormGroup({
    name: new FormControl(''),
    email: new FormControl(''),
    phone: new FormControl(''),
    birthDate: new FormControl(''),
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
    name: 'Nome',
    email: 'E-mail',
    phone: 'Telefone',
    birthDate: 'Data de Nascimento',
    password: 'Senha',
    confirmPassword: 'Confirmação de Senha'
  };

  constructor(private cdr: ChangeDetectorRef,private hostEl: ElementRef,private renderer: Renderer2,private mainService: MainService) {}

  ngOnInit(): void {
    Object.keys(this.form.controls).forEach(k => {
      if (this.form.get(k)!.value) this.focused[k] = true;
    });
  }

  ngAfterViewInit(): void {}
  ngOnChanges(changes: SimpleChanges): void {
    if (changes['nome'] && this.nome) {
      this.form.get('name')!.setValue(this.nome);
      this.nameReadonly = true;
      this.focused['name'] = true;
    }
    if (changes['nascimento'] && this.nascimento) {
      this.form.get('birthDate')!.setValue(this.nascimento);
      this.dateDisplay = this.formatDisplayDate(this.nascimento);
      this.birthDateReadonly = true;
      this.focused['birthDate'] = true;
    }
  }

  onFocus(name: string) { this.focused[name] = true; }
  onBlur(name: string) {
    const val = this.form.get(name)?.value;
    if (!val) this.focused[name] = false;
  }

  onPhoneInput(ev: Event) {
    const input = ev.target as HTMLInputElement;
    let digits = (input.value || '').replace(/\D/g, '').slice(0, 11);
    let out = digits;

    if (digits.length > 6)
      out = digits.replace(/^(\d{2})(\d{5})(\d{0,4}).*/, '($1) $2-$3');
    else if (digits.length > 2)
      out = digits.replace(/^(\d{2})(\d{0,5}).*/, '($1) $2');
    else if (digits.length > 0)
      out = digits.replace(/^(\d{0,2}).*/, '($1');

    input.value = out;
    this.form.get('phone')!.setValue(out);
    this.focused['phone'] = !!out;
  }

  toggleSenha() { this.showSenha = !this.showSenha; }
  toggleConfirm() { this.showConfirm = !this.showConfirm; }

  formatDisplayDate(value: string | null): string {
    if (!value) return '';

    let day: string, month: string, year: string;

    if (value.includes('-')) {
      const parts = value.split('-').map(n => parseInt(n, 10));
      const d = new Date(parts[0], parts[1] - 1, parts[2]);
      day = String(d.getDate()).padStart(2, '0');
      month = String(d.getMonth() + 1).padStart(2, '0');
      year = d.getFullYear().toString();
    } else if (/^\d{8}$/.test(value)) {
      day = value.substring(0, 2);
      month = value.substring(2, 4);
      year = value.substring(4, 8);
    } else {
      return value;
    }

    return `${day}/${month}/${year}`;
  }

  parseDDMMYYYY(value: string): Date | null {
    const digits = (value || '').replace(/\D/g, '');
    if (digits.length !== 8) return null;
    const day = Number(digits.slice(0,2));
    const month = Number(digits.slice(2,4)) - 1;
    const year = Number(digits.slice(4,8));
    const d = new Date(year, month, day);
    if (d.getFullYear() !== year || d.getMonth() !== month || d.getDate() !== day) return null;
    return d;
  }

  onDateInput(ev: Event) {
    if (this.birthDateReadonly) return;
    const input = ev.target as HTMLInputElement;
    let digits = (input.value || '').replace(/\D/g, '').slice(0,8);
    let formatted = '';
    if (digits.length >= 5) formatted = `${digits.slice(0,2)}/${digits.slice(2,4)}/${digits.slice(4,8)}`;
    else if (digits.length >= 3) formatted = `${digits.slice(0,2)}/${digits.slice(2,4)}`;
    else formatted = digits;
    input.value = formatted;
    this.dateDisplay = formatted;
    const parsed = this.parseDDMMYYYY(formatted);
    if (parsed) this.form.get('birthDate')!.setValue(this.toISO(parsed));
    this.focused['birthDate'] = !!parsed;
  }

  onDateBlur() {
    if (this.birthDateReadonly) return;
    const d = this.parseDDMMYYYY(this.dateDisplay);
    if (d) {
      this.form.get('birthDate')!.setValue(this.toISO(d));
      this.dateDisplay = this.formatDisplayDate(this.toISO(d));
      this.focused['birthDate'] = true;
    } else if (!this.dateDisplay) this.focused['birthDate'] = false;
    this.closeCalendar();
  }

  openCalendar() {
    if (this.calendarOpen) { this.closeCalendar(); return; }
    this.calendarOpen = true;
    const val = this.form.get('birthDate')!.value;
    if (val) {
      const parts = val.split('-').map(n => parseInt(n,10));
      if (parts.length === 3) { this.calYear = parts[0]; this.calMonth = parts[1]-1; }
    }
    this.generateCalendar(this.calYear, this.calMonth);
    setTimeout(() => this.attachOutsideClick(), 0);
  }

  closeCalendar() { this.calendarOpen = false; this.detachOutsideClick(); }

  pickDate(d: Date) {
    const localDate = new Date(d.getFullYear(), d.getMonth(), d.getDate());
    this.form.get('birthDate')!.setValue(this.toISO(localDate));
    this.dateDisplay = this.formatDisplayDate(this.toISO(localDate));
    this.focused['birthDate'] = true;
    this.closeCalendar();
  }

  prevMonth() { this.calMonth === 0 ? (this.calMonth = 11, this.calYear--) : this.calMonth--; this.generateCalendar(this.calYear, this.calMonth); }
  nextMonth() { this.calMonth === 11 ? (this.calMonth = 0, this.calYear++) : this.calMonth++; this.generateCalendar(this.calYear, this.calMonth); }

  generateCalendar(year: number, month: number) {
    const first = new Date(year, month, 1);
    const startDay = first.getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const prevMonthDays = new Date(year, month, 0).getDate();
    const cells: Array<{ d: Date | null; currentMonth: boolean }> = [];

    for (let i = startDay - 1; i >= 0; i--)
      cells.push({ d: new Date(year, month - 1, prevMonthDays - i), currentMonth: false });

    for (let d = 1; d <= daysInMonth; d++)
      cells.push({ d: new Date(year, month, d), currentMonth: true });

    let nextDay = 1;
    while (cells.length % 7 !== 0)
      cells.push({ d: new Date(year, month + 1, nextDay++), currentMonth: false });

    this.weeks = [];
    for (let i = 0; i < cells.length; i += 7)
      this.weeks.push(cells.slice(i, i + 7));
  }

  isToday(d: Date | null) {
    if (!d) return false;
    const t = new Date();
    return d.getFullYear() === t.getFullYear() && d.getMonth() === t.getMonth() && d.getDate() === t.getDate();
  }

  selectedDateObj(): Date | null {
    const v = this.form.get('birthDate')!.value;
    if (!v) return null;
    const parts = v.split('-').map(n => parseInt(n,10));
    if (parts.length !== 3) return null;
    return new Date(parts[0], parts[1]-1, parts[2]);
  }

  attachOutsideClick() {
    this.outsideListener = this.renderer.listen('document', 'click', (ev: MouseEvent) => {
      const target = ev.target as Node;
      if (this.calendarOpen) {
        const cal = this.calendarEl?.nativeElement;
        const dateInput = this.dateInputEl?.nativeElement;
        if (cal && cal.contains(target)) return;
        if (dateInput && dateInput.contains(target)) return;
        this.closeCalendar();
      }
    });
  }

  detachOutsideClick() {
    if (this.outsideListener) { this.outsideListener(); this.outsideListener = undefined; }
  }

  onTouchStart(ev: TouchEvent) { this.touchStartX = ev.touches[0].clientX; }
  onTouchEnd(ev: TouchEvent) {
    this.touchEndX = ev.changedTouches[0].clientX;
    const dx = this.touchEndX - this.touchStartX;
    if (Math.abs(dx) > 40) dx < 0 ? this.nextMonth() : this.prevMonth();
  }

  @HostListener('document:keydown', ['$event'])
  handleKeydown(e: KeyboardEvent) {
    if (!this.calendarOpen) return;
    if (e.key === 'ArrowLeft') { e.preventDefault(); this.prevMonth(); }
    if (e.key === 'ArrowRight') { e.preventDefault(); this.nextMonth(); }
  }

  async validateForm() {
    this.cdr.detectChanges();
    const val = this.form.value;
    const errors: string[] = [];

    (Object.keys(val) as Array<keyof typeof val>).forEach(key => {
      if (!val[key]) errors.push(`Campo "${this.fieldNames[key]}" não preenchido`);
    });

    if (val.email && !this.isValidEmail(val.email))
      errors.push('E-mail inválido');

    const digits = (val.phone || '').replace(/\D/g, '');
    if (digits.length !== 11)
      errors.push('Telefone inválido — deve conter 11 dígitos (ex: 24988739500)');

    if (val.password && val.confirmPassword && val.password !== val.confirmPassword)
      errors.push('Senhas não coincidem');

    if (errors.length) this.showDialogMessage('Erros:\n' + errors.join('\n'));
    else {
      this.mainService.setFormValue('name', this.form.get('name')!.value);
      this.mainService.setFormValue('email', this.form.get('email')!.value);
      this.mainService.setFormValue('phone', this.form.get('phone')!.value);
      this.mainService.setFormValue('birthDate', this.form.get('birthDate')!.value);
      this.mainService.setFormValue('password', this.form.get('password')!.value);

      this.isLoading = true;

      const response: any = await this.mainService.customerAccessRegister(this.mainService.getFormValuesList());
      this.isLoading = false;
      this.cdr.detectChanges();
      if (response.status){
        this.mainService.setFormValue('code', response.data[0].code);
        this.updateVisible(4);
      }else{
        this.showDialogMessage(response.message);
        this.isLoading = false;
        this.cdr.detectChanges();
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
  closeDialog() {
    this.showDialog = false;
    this.cdr.detectChanges();
  }

  updateVisible(newValue: number) {
    this.visibleChange.emit(newValue);
  }
}
